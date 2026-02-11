import React, { useEffect, useState } from "react";
import VoiceInput from "./components/VoiceInput";
import { getTasks, addTask, deleteTask, updateTask, markTaskNotified } from "./services/api";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Nav,
  Form,
  Toast,
  ToastContainer
} from "react-bootstrap";
import {
  FaTasks,
  FaChartBar,
  FaCalendarAlt,
  FaMicrophone
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import CalendarView from "./components/CalendarView";

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [activeTab, setActiveTab] = useState("tasks");
  const [repeatType, setRepeatType] = useState("");
  const [repeatInterval, setRepeatInterval] = useState(1);
  const todayString = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayString);



  // Toasts for in-app notifications
  const [toasts, setToasts] = useState([]); // {id, title, body, ts}

  useEffect(() => {
    fetchTasks();
    // request notification permission early (optional)
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const fetchTasks = async () => {
    try {
      const allTasks = await getTasks();
      setTasks(allTasks);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  const handleAdd = async () => {
    if (!title.trim()) return alert("Enter a title");

  // ✅ Keep the entered date as-is (no timezone conversion)
    const localDate = dueDate; // Directly use the date string from <input type="date" />

    await addTask({
      title,
      notes,
      due_date: localDate,
      due_time: dueTime,
      repeat_type: repeatType || null,
      repeat_interval: repeatType ? repeatInterval : null
    });

    setTitle("");
    setNotes("");
    setDueDate("");
    setDueTime("");
    setRepeatType("");
    setRepeatInterval(1);
    fetchTasks();
  };



  const onVoiceResult = (result) => {
    if (!result || !result.text) return;
    const text = result.text.toLowerCase();
    const parts = text.split(" dash ");
    if (parts.length > 0) setTitle(parts[0].trim());
    if (parts.length > 1) setNotes(parts[1].trim());
  };

  const todaysTasks = tasks.filter(
  (t) => t.due_date === selectedDate
  );
  const activeTasks = todaysTasks.filter((t) => t.done !== 1);
  const completedTasks = todaysTasks.filter((t) => t.done === 1);

  const total = todaysTasks.length;
  const completed = completedTasks.length;

  const overdue = todaysTasks.filter((t) => {
    if (!t.due_time) return false;

    const due = new Date(`${t.due_date}T${t.due_time}:00`);
    return t.done !== 1 && due < new Date();
  }).length;

  // ---------- Notification system ----------
  useEffect(() => {
    // check every minute
    const intervalMs = 60 * 1000;
    const timer = setInterval(checkNotifications, intervalMs);

    // run once immediately
    checkNotifications();

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]); // re-evaluate whenever tasks update

  async function checkNotifications() {
    // threshold: 1 hour before due (in ms)
    const beforeMs = 60 * 60 * 1000;

    const now = new Date();

    // ensure latest tasks (optional fetch each time — commented out for fewer requests)
    // await fetchTasks();

    for (const t of tasks) {
      try {
        if (!t.due_date || !t.due_time) continue; // skip if no datetime set
        if (t.done === 1) continue; // skip completed
        if (t.notified === 1) continue; // already notified

        // build local Date object from due_date & due_time (t.due_time expected "HH:MM")
        const dueIso = `${t.due_date}T${t.due_time ? t.due_time : "00:00"}:00`;
        const due = new Date(dueIso);

        // compute diff
        const diff = due.getTime() - now.getTime();

        // trigger if now is within 1 hour before due (diff <= 1h && diff > 0)
        // also optionally trigger if overdue (diff <= 0) — if you want that too, remove diff > 0 condition
        if (diff <= beforeMs && diff > 0) {
          // show browser notification + toast + sound
          triggerAlarmForTask(t);
          // mark notified in backend
          await markTaskNotified(t.id);
          // update local tasks state so it won't retrigger until next fetch
          setTasks(prev => prev.map(x => x.id === t.id ? { ...x, notified: 1 } : x));
        }
      } catch (e) {
        console.error("Notification check error for task", t.id, e);
      }
    }
  }

  function triggerAlarmForTask(task) {
    const titleText = `Reminder: ${task.title}`;
    const bodyText = task.notes ? task.notes : `${task.due_date} ${task.due_time || ""}`;

    // Browser notification
    try {
      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification(titleText, { body: bodyText, icon: "/logo.png" });
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then(perm => {
            if (perm === "granted") {
              new Notification(titleText, { body: bodyText, icon: "/logo.png" });
            }
          }).catch(()=>{});
        }
      }
    } catch (e) {
      console.warn("Browser notifications not available:", e);
    }

    // In-app toast
    const toastItem = { id: `t-${task.id}-${Date.now()}`, taskId: task.id, title: task.title, body: bodyText, ts: Date.now() };
    setToasts(prev => [toastItem, ...prev].slice(0, 6)); // keep up to 6 toasts

    // Play sound (user must have interacted with page for autoplay in many browsers)
    try {
      const audio = new Audio("/notification.mp3");
      audio.volume = 0.9;
      audio.play().catch(() => {
        // autoplay may be blocked until user interacts; ignore
      });
    } catch (e) {
      console.warn("Unable to play notification sound:", e);
    }
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // ---------- End Notification system ----------

  return (
    <div className="dashboard-bg">
      <Container className="py-5">
        {/* Toast container (top-right) */}
        <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1060 }}>
          {toasts.map((to) => (
            <Toast key={to.id} onClose={() => removeToast(to.id)} delay={10_000} autohide>
              <Toast.Header>
                <strong className="me-auto">{to.title}</strong>
                <small className="text-muted">now</small>
              </Toast.Header>
              <Toast.Body>{to.body}</Toast.Body>
            </Toast>
          ))}
        </ToastContainer>

        {/* Header Section */}
        <div className="text-center mb-5">
          <img
            src="/logo.png"
            alt="Smart To-Do Logo"
            style={{
              width: "90px",
              height: "90px",
              borderRadius: "20px",
              boxShadow: "0 0 20px rgba(100, 150, 255, 0.7)",
              marginBottom: "30px",
            }}
          />
          <h3 className="fw-bold text-gradient">Smart To-Do with Voice Input</h3>
          <p className="text-muted">
            AI-powered task management with smart prioritization & voice input.
          </p>
          <div className="text-warning small fw-semibold">⚡ Powered by AI & Voice</div>
        </div>

        {/* Stats Section */}
        <Row className="g-3 mb-4 text-center">
          <Col md={4}>
            <Card className="stat-card border-0 shadow-sm text-primary">
              <Card.Body>
                <h2>{total}</h2>
                <p>Total Tasks</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="stat-card border-0 shadow-sm text-success">
              <Card.Body>
                <h2>{completed}</h2>
                <p>Completed</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="stat-card border-0 shadow-sm text-danger">
              <Card.Body>
                <h2>{overdue}</h2>
                <p>Overdue</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Navigation Tabs */}
        <div className="d-flex justify-content-center mb-4">
          <Nav variant="pills" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            <Nav.Item>
              <Nav.Link eventKey="tasks" className="mx-2">
                <FaTasks className="me-1" /> Tasks
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="calendar" className="mx-2">
                <FaCalendarAlt className="me-1" /> Calendar
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </div>

        {/* Conditional View */}
        {activeTab === "tasks" ? (
          <Card className="shadow-sm rounded-4">
            <Card.Header className="bg-light fw-semibold">
              <FaMicrophone className="text-primary me-2" />
              Task Management
            </Card.Header>

            <Card.Body>

              {/* ---- ADD TASK INPUT SECTION ---- */}
              <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
                <Form.Control
                  placeholder="Task Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex-grow-1"
                />
                <Form.Control
                  placeholder="Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="flex-grow-1"
                />
                <Form.Control
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
                <Form.Control
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                />
                <Form.Select
                  value={repeatType}
                  onChange={(e) => setRepeatType(e.target.value)}
                  style={{ maxWidth: "160px" }}
                >
                  <option value="">No Repeat</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </Form.Select>

                {/* 🔢 Repeat Interval */}
                {repeatType && (
                  <Form.Control
                    type="number"
                    min="1"
                    value={repeatInterval}
                    onChange={(e) => setRepeatInterval(parseInt(e.target.value))}
                    style={{ maxWidth: "80px" }}
                    placeholder="Interval"
                  />
                )}
                <Button onClick={handleAdd} variant="dark">
                  + Add Task
                </Button>
                <VoiceInput onResult={onVoiceResult} />
              </div>

              {/* ---- TODAY HEADER + DATE PICKER ---- */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0">
                  {selectedDate === todayString
                    ? "Today's Tasks"
                    : `Tasks for ${selectedDate}`}
                </h5>

                <Form.Control
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ maxWidth: "180px" }}
                />
              </div>

              {/* ---- EMPTY STATE ---- */}
              {todaysTasks.length === 0 ? (
                <div className="text-center text-muted py-4">
                  No tasks for this day.
                </div>
              ) : (
                <>
                  {/* -------- ACTIVE TASKS -------- */}
                  {activeTasks.length > 0 && (
                    <>
                      <h6 className="fw-semibold mb-3">Active Tasks</h6>
                      <ul className="list-group mb-4">
                        {activeTasks.map((t) => (
                          <li
                            key={t.id}
                            className="list-group-item d-flex justify-content-between align-items-center"
                          >
                            <div>
                              <strong>{t.title}</strong>
                              <div className="text-muted small">{t.notes}</div>
                              {t.due_time && (
                                <div className="small text-secondary mt-1">
                                  ⏰ {t.due_time}
                                </div>
                              )}
                            </div>

                            <div>
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => updateTask(t.id, true).then(fetchTasks)}
                                className="me-2"
                              >
                                Done
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => deleteTask(t.id).then(fetchTasks)}
                              >
                                Delete
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {/* -------- COMPLETED TASKS -------- */}
                  {completedTasks.length > 0 && (
                    <>
                      <h6 className="fw-semibold text-muted mb-3">
                        Completed Tasks
                      </h6>

                      <ul className="list-group">
                        {completedTasks.map((t) => (
                          <li
                            key={t.id}
                            className="list-group-item d-flex justify-content-between align-items-center"
                            style={{
                              backgroundColor: "#f4f4f4",
                              color: "#8c8c8c"
                            }}
                          >
                            <div>
                              <span style={{ textDecoration: "line-through" }}>
                                {t.title}
                              </span>

                              {t.repeat_type && (
                                <span
                                  style={{
                                    fontSize: "0.7rem",
                                    background: "#e3e6ff",
                                    padding: "2px 8px",
                                    borderRadius: "10px",
                                    marginLeft: "8px"
                                  }}
                                >
                                  🔁 {t.repeat_type}
                                </span>
                              )}

                              <div className="small">{t.notes}</div>
                            </div>

                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => deleteTask(t.id).then(fetchTasks)}
                            >
                              Delete
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        ) : (
          <CalendarView />
        )}

      </Container>
    </div>
  );
}

export default App;
