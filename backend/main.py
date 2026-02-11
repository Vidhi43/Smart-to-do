from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta, timezone

app = FastAPI(title="Smart To-Do API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- DATABASE SETUP --------------------

def init_db():
    conn = sqlite3.connect("tasks.db")
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            notes TEXT,
            due_date TEXT,
            due_time TEXT,
            priority TEXT,
            created_at TEXT,
            done INTEGER DEFAULT 0,
            notified INTEGER DEFAULT 0,
            repeat_type TEXT,
            repeat_interval INTEGER
        )
    """)

    # Ensure missing columns exist (for older DB versions)
    cols = [col[1] for col in c.execute("PRAGMA table_info(tasks)").fetchall()]

    if "notified" not in cols:
        c.execute("ALTER TABLE tasks ADD COLUMN notified INTEGER DEFAULT 0")

    if "repeat_type" not in cols:
        c.execute("ALTER TABLE tasks ADD COLUMN repeat_type TEXT")

    if "repeat_interval" not in cols:
        c.execute("ALTER TABLE tasks ADD COLUMN repeat_interval INTEGER")

    conn.commit()
    conn.close()

init_db()

# -------------------- SCHEMAS --------------------

class Task(BaseModel):
    id: Optional[int]
    title: str
    notes: Optional[str] = None
    due_date: Optional[str] = None
    due_time: Optional[str] = None
    priority: Optional[str] = "Routine"
    done: Optional[int] = 0
    notified: Optional[int] = 0
    repeat_type: Optional[str] = None
    repeat_interval: Optional[int] = None

class TaskCreate(BaseModel):
    title: str
    notes: Optional[str] = None
    due_date: Optional[str] = None
    due_time: Optional[str] = None
    repeat_type: Optional[str] = None
    repeat_interval: Optional[int] = None

# -------------------- PRIORITY ENGINE --------------------

def auto_priority(title, notes=""):
    urgent_keywords = ["urgent", "asap", "immediately", "today", "deadline"]
    text = (title + " " + (notes or "")).lower()
    return "Urgent" if any(k in text for k in urgent_keywords) else "Routine"

# -------------------- CREATE TASK --------------------

@app.post("/tasks", response_model=Task)
def add_task(task: TaskCreate):
    priority = auto_priority(task.title, task.notes)

    IST = timezone(timedelta(hours=5, minutes=30))
    created = datetime.now(IST).isoformat()

    conn = sqlite3.connect("tasks.db")
    c = conn.cursor()

    c.execute("""
        INSERT INTO tasks 
        (title, notes, due_date, due_time, priority, created_at, done, notified, repeat_type, repeat_interval)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        task.title,
        task.notes,
        task.due_date,
        task.due_time,
        priority,
        created,
        0,
        0,
        task.repeat_type,
        task.repeat_interval
    ))

    task_id = c.lastrowid
    conn.commit()
    conn.close()

    return {
        "id": task_id,
        "title": task.title,
        "notes": task.notes,
        "due_date": task.due_date,
        "due_time": task.due_time,
        "priority": priority,
        "done": 0,
        "notified": 0,
        "repeat_type": task.repeat_type,
        "repeat_interval": task.repeat_interval
    }

# -------------------- GET TASKS --------------------

@app.get("/tasks", response_model=List[Task])
def get_tasks():
    conn = sqlite3.connect("tasks.db")
    c = conn.cursor()

    rows = c.execute("""
        SELECT id, title, notes, due_date, due_time,
               priority, created_at, done, notified,
               repeat_type, repeat_interval
        FROM tasks
        ORDER BY due_date ASC
    """).fetchall()

    conn.close()

    return [
        Task(
            id=r[0],
            title=r[1],
            notes=r[2],
            due_date=r[3],
            due_time=r[4],
            priority=r[5],
            done=r[7],
            notified=r[8],
            repeat_type=r[9],
            repeat_interval=r[10]
        )
        for r in rows
    ]

# -------------------- RECURRENCE CALCULATION --------------------

def calculate_next_due(due_date, due_time, repeat_type, repeat_interval):
    if not due_date or not repeat_type:
        return None, None

    base_time = due_time if due_time else "00:00"
    due = datetime.fromisoformat(f"{due_date}T{base_time}")

    if repeat_type == "hourly":
        next_due = due + timedelta(hours=repeat_interval)

    elif repeat_type == "daily":
        next_due = due + timedelta(days=repeat_interval)

    elif repeat_type == "weekly":
        next_due = due + timedelta(weeks=repeat_interval)

    elif repeat_type == "monthly":
        month = due.month + repeat_interval
        year = due.year + (month - 1) // 12
        month = ((month - 1) % 12) + 1
        next_due = due.replace(year=year, month=month)

    elif repeat_type == "yearly":
        next_due = due.replace(year=due.year + repeat_interval)

    else:
        return None, None

    return next_due.date().isoformat(), next_due.time().strftime("%H:%M")

# -------------------- UPDATE TASK --------------------

@app.put("/tasks/{task_id}")
def update_task(task_id: int, done: bool):
    conn = sqlite3.connect("tasks.db")
    c = conn.cursor()

    task = c.execute("""
        SELECT title, notes, due_date, due_time, repeat_type, repeat_interval
        FROM tasks WHERE id=?
    """, (task_id,)).fetchone()

    if not task:
        conn.close()
        return {"error": "Task not found"}

    title, notes, due_date, due_time, repeat_type, repeat_interval = task

    if done and repeat_type:
        # Mark current task completed
        c.execute("UPDATE tasks SET done=1 WHERE id=?", (task_id,))

        # Calculate next due
        new_date, new_time = calculate_next_due(
            due_date, due_time, repeat_type, repeat_interval
        )

        # Insert next recurring task
        c.execute("""
            INSERT INTO tasks (
                title, notes, due_date, due_time,
                priority, created_at, done, notified,
                repeat_type, repeat_interval
            )
            VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
        """, (
            title,
            notes,
            new_date,
            new_time,
            auto_priority(title, notes),
            datetime.utcnow().isoformat(),
            repeat_type,
            repeat_interval
        ))

    else:
        c.execute(
            "UPDATE tasks SET done=? WHERE id=?",
            (1 if done else 0, task_id)
        )

    conn.commit()
    conn.close()

    return {"message": "Task updated"}

# -------------------- MARK NOTIFIED --------------------

@app.put("/tasks/{task_id}/notified")
def mark_task_notified(task_id: int):
    conn = sqlite3.connect("tasks.db")
    c = conn.cursor()
    c.execute("UPDATE tasks SET notified=1 WHERE id=?", (task_id,))
    conn.commit()
    conn.close()

    return {"message": "Task marked as notified"}

# -------------------- DELETE TASK --------------------

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    conn = sqlite3.connect("tasks.db")
    c = conn.cursor()
    c.execute("DELETE FROM tasks WHERE id=?", (task_id,))
    conn.commit()
    conn.close()
    return {"message": "Task deleted"}
