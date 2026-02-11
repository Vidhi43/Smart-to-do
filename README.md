# 🚀 Smart To-Do App

Smart To-Do is an AI-powered task management web application built using **React (Frontend)** and **FastAPI (Backend)**.

It helps users manage daily work efficiently with smart reminders, recurring task automation, voice input, and a clean dashboard view.

This project was built to combine productivity, automation, and intelligent task handling in one system.

---

## 💡 Why This Project?

Most basic to-do apps only store tasks.

This app goes further:

- Automatically prioritizes urgent tasks
- Supports recurring tasks (like real productivity apps)
- Sends smart notifications
- Separates active and completed tasks
- Focuses on **Today’s productivity**
- Includes voice-based task creation

It is designed as a real-world full-stack application.

---

## ✨ Features

### 📝 Task Management
- Add tasks with title and notes
- Set due date and time
- Mark tasks as completed
- Delete tasks
- Clean separation of:
  - Active Tasks
  - Completed Tasks

---

### 🔁 Recurring Tasks
Supports automatic repetition:

- Hourly
- Daily
- Weekly
- Monthly
- Yearly

When a recurring task is marked complete, the system automatically generates the next occurrence.

---

### ⏰ Smart Notifications
- Browser notification 1 hour before due
- In-app toast alerts
- Alarm sound
- Prevents duplicate notifications

---

### 📅 Today-Focused Dashboard
- View only selected date’s tasks
- “Today’s Tasks” view by default
- Total tasks count
- Completed count
- Overdue count (real-time calculation)

---

### 🎤 Voice Input
- Add tasks using microphone
- Automatically splits title and notes
- Improves user productivity

---

## 🏗️ Tech Stack

### 🔹 Frontend
- React.js
- React Bootstrap
- Browser Notification API
- Calendar Component

### 🔹 Backend
- FastAPI
- SQLite
- Pydantic
- Uvicorn

---

## 📂 Project Structure

Smart-to-do/<br/>
│<br/>
├── backend/<br/>
│ ├── main.py<br/>
│ ├── requirements.txt<br/>
│<br/>
├── frontend/<br/>
│ ├── public/<br/>
│ ├── src/<br/>
│ ├── package.json<br/>
│<br/>
└── README.md<br/>


---

## ⚙️ How to Run Locally

### 1 Update Frontend API URL

Open this file:
```bash
frontend/src/services/api.js
```
Change API_BASE to
```bash
const API_BASE = "http://127.0.0.1:8000";
```

### 2 Start Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at:
http://127.0.0.1:8000

### 3 Start Frontend

```bash
cd frontend
npm install
npm start
```
Frontend runs at:
http://localhost:3000

## 🌍 Live Demo

Frontend: https://smart-to-do-v74l.vercel.app/  
Backend API: https://smart-to-do-1rj2.onrender.com/


