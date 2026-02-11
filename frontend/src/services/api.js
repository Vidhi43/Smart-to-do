const API_BASE = "http://127.0.0.1:8000";

// 🔹 GET all tasks
export const getTasks = async () => {
  try {
    const res = await fetch(`${API_BASE}/tasks`);
    if (!res.ok) throw new Error("Failed to fetch tasks");
    return await res.json();
  } catch (err) {
    console.error("Error fetching tasks:", err);
    return [];
  }
};

// 🔹 ADD new task
export const addTask = async (task) => {
  try {
    await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
  } catch (err) {
    console.error("Error adding task:", err);
  }
};

// 🔹 DELETE a task
export const deleteTask = async (id) => {
  try {
    await fetch(`${API_BASE}/tasks/${id}`, { method: "DELETE" });
  } catch (err) {
    console.error("Error deleting task:", err);
  }
};

// 🔹 UPDATE task status (mark as done)
export const updateTask = async (id, done) => {
  try {
    await fetch(`${API_BASE}/tasks/${id}?done=${done}`, { method: "PUT" });
  } catch (err) {
    console.error("Error updating task:", err);
  }
};

// 🔹 MARK task as notified (used by alarm system)
export const markTaskNotified = async (id) => {
  await fetch(`${API_BASE}/tasks/${id}/notified`, { method: "PUT" });
};
