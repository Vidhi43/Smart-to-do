import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Card, ListGroup } from "react-bootstrap";
import { getTasks } from "../services/api";
import { format, parseISO, isBefore, isAfter, isSameDay } from "date-fns";

const CalendarView = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filteredTasks, setFilteredTasks] = useState([]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const allTasks = await getTasks();
    setTasks(allTasks);
    filterTasksForDate(new Date(), allTasks);
  };

  const filterTasksForDate = (date, taskList = tasks) => {
    const dateStr = date.toLocaleDateString("en-CA"); // YYYY-MM-DD
    const todayTasks = taskList.filter((t) => t.due_date === dateStr);
    setFilteredTasks(todayTasks);
    setSelectedDate(date);
  };

  const onDateClick = (date) => {
    filterTasksForDate(date);
  };

  const getTaskStatusColor = (task) => {
    const today = new Date();
    const dueDate = parseISO(`${task.due_date}T${task.due_time || "00:00"}`);
    if (task.done) return "text-secondary"; // gray for completed
    if (isBefore(dueDate, today)) return "text-danger"; // red for overdue
    return "text-success"; // green for upcoming
  };

  // ---- Calendar customization ----
  const tileContent = ({ date }) => {
    const dateStr = date.toLocaleDateString("en-CA");
    const dayTasks = tasks.filter((t) => t.due_date === dateStr);

    if (dayTasks.length > 0) {
      const hasOverdue = dayTasks.some(
        (t) => !t.done && isBefore(parseISO(`${t.due_date}T${t.due_time || "00:00"}`), new Date())
      );
      const hasCompleted = dayTasks.every((t) => t.done);
      const color = hasOverdue
        ? "#ff4d4f" // red
        : hasCompleted
        ? "#999" // gray
        : "#3cb371"; // green

      return (
        <div
          style={{
            marginTop: "4px",
            fontSize: "0.75rem",
            color,
            fontWeight: 600,
          }}
        >
          ● {dayTasks.length}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 text-center">
      <h4 className="fw-bold mb-3 text-gradient">
        <i className="bi bi-calendar2-check me-2 text-primary"></i>
        Task Calendar
      </h4>
      <div className="mb-2">
        <span className="text-danger fw-semibold me-3">● Overdue</span>
        <span className="text-success fw-semibold me-3">● Upcoming</span>
        <span className="text-secondary fw-semibold">● Completed</span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <Card
          className="p-3 shadow-sm border-0"
          style={{
            borderRadius: "1.5rem",
            background: "linear-gradient(145deg, #f3f4ff, #e9edff)",
            boxShadow: "0 8px 20px rgba(130, 130, 255, 0.25)",
            width: "fit-content",
          }}
        >
          <Calendar
            onClickDay={onDateClick}
            value={selectedDate}
            tileContent={tileContent}
            className="custom-calendar"
          />
        </Card>

        {/* ---- Daily Task List ---- */}
        <Card
          className="shadow-sm border-0"
          style={{
            borderRadius: "1rem",
            width: "90%",
            maxWidth: "600px",
          }}
        >
          <Card.Header
            className="fw-semibold"
            style={{
              background: "#f9f9ff",
              borderBottom: "1px solid #eee",
              color: "#3f51b5",
            }}
          >
            Tasks for {format(selectedDate, "dd MMM yyyy")}
          </Card.Header>
          <Card.Body>
            {filteredTasks.length > 0 ? (
              <ListGroup variant="flush">
                {filteredTasks.map((task) => (
                  <ListGroup.Item
                    key={task.id}
                    className={`d-flex justify-content-between align-items-center ${getTaskStatusColor(
                      task
                    )}`}
                    style={{
                      borderBottom: "1px solid #f0f0f0",
                      background: "white",
                      borderRadius: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <div className="text-start">
                      <strong className="text-dark">{task.title}</strong>
                      {task.notes && (
                        <div className="small text-muted">{task.notes}</div>
                      )}
                    </div>
                    <div className="small text-muted">
                      ⏰ {task.due_time || "N/A"}
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            ) : (
              <p className="text-muted mb-0">No tasks for this day.</p>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default CalendarView;
