# 🗂️ Team Task Manager

A full-stack collaborative task management web application built for teams. Create projects, assign tasks, track progress, and manage your team — all in one place.

![App Preview](https://img.shields.io/badge/Status-Live-brightgreen) ![Tech](https://img.shields.io/badge/Stack-React%20%2B%20Node.js%20%2B%20SQLite-blue) ![Deployment](https://img.shields.io/badge/Deployed%20on-Render-purple)

---

## 🌐 Live Demo

| Service | URL |
|---|---|
| 🖥️ Frontend | https://task-manager-frontend-fni2.onrender.com |
| ⚙️ Backend API | https://team-task-manager-42lf.onrender.com |

> **Note:** The app is hosted on Render's free tier. The backend may take **30–60 seconds** to wake up on the first request. Please be patient on first load.

---

## ✨ Features

### 👤 Authentication
- Secure signup and login with JWT tokens
- Persistent sessions via localStorage
- Protected routes — unauthenticated users are redirected to login

### 📁 Project Management
- Create projects with name and description
- Project creator automatically becomes **Admin**
- Admins can add members by email
- Admins can remove members from projects
- Members can view all projects they belong to

### ✅ Task Management
- Create tasks with title, description, due date, priority, and assignee
- Visual **Kanban board** with three columns: To Do, In Progress, Done
- Admins can create, edit, and delete tasks
- Members can update the status of tasks assigned to them
- Priority levels: Low, Medium, High — color coded

### 📊 Dashboard
- Total task count per project
- Tasks broken down by status
- Workload per team member with progress bars
- Overdue tasks highlighted in red

### 🔐 Role-Based Access Control
| Action | Admin | Member |
|---|---|---|
| Create tasks | ✅ | ❌ |
| Edit tasks | ✅ | ❌ |
| Delete tasks | ✅ | ❌ |
| Update task status | ✅ | ✅ (own tasks only) |
| Add members | ✅ | ❌ |
| Remove members | ✅ | ❌ |
| View project | ✅ | ✅ |
| View dashboard | ✅ | ✅ |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React + Vite | UI framework and build tool |
| React Router v6 | Client-side routing |
| Axios | HTTP requests with JWT interceptor |
| CSS3 | Custom styles with animations |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| SQLite3 | Lightweight SQL database |
| JWT + bcryptjs | Authentication and password hashing |
| CORS | Cross-origin request handling |

### Deployment
| Service | Platform |
|---|---|
| Frontend | Render Static Site |
| Backend | Render Web Service |
| Database | SQLite (file-based) |

---

## 📡 API Endpoints

### Auth
POST   /api/auth/signup     → Register new user
POST   /api/auth/login      → Login and get token
GET    /api/auth/me         → Get current user (JWT required)

### Projects
GET    /api/projects                        → Get all user projects
POST   /api/projects                        → Create project
GET    /api/projects/:id                    → Get project + members
POST   /api/projects/:id/members            → Add member (admin)
DELETE /api/projects/:id/members/:userId    → Remove member (admin)

### Tasks
GET    /api/tasks/project/:projectId    → Get project tasks
POST   /api/tasks                       → Create task (admin)
PATCH  /api/tasks/:id/status            → Update status
PUT    /api/tasks/:id                   → Full update (admin)
DELETE /api/tasks/:id                   → Delete task (admin)

### Dashboard
GET    /api/dashboard/:projectId    → Get project stats

---

## 🗄️ Database Schema

```sql
users (
  id, name, email, password, created_at
)

projects (
  id, name, description, created_by, created_at
)

project_members (
  id, project_id, user_id, role  -- role: 'admin' | 'member'
)

tasks (
  id, title, description, due_date, priority,
  status, project_id, assigned_to, created_by, created_at
)
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js v18+
- npm

### 1. Clone the repository
```bash
git clone https://github.com/siddhidokania/team-task-manager.git
cd team-task-manager
```

### 2. Setup Backend
```bash
cd backend
npm install
```

Create `backend/.env`:
PORT=5000
JWT_SECRET=yoursecretkey
FRONTEND_URL=http://localhost:5173

Start the backend:
```bash
node src/index.js
# Server running on http://localhost:5000
```

### 3. Setup Frontend
```bash
cd frontend
npm install
```

Create `frontend/.env`:
VITE_API_URL=http://localhost:5000/api

Start the frontend:
```bash
npm run dev
# App running on http://localhost:5173
```

---

## ☁️ Deployment Guide (Render)

### Backend — Web Service
| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm install && npm rebuild sqlite3` |
| Start Command | `node src/index.js` |

Environment variables:
PORT=5000
JWT_SECRET=your_secret_key
NODE_ENV=production
FRONTEND_URL=https://your-frontend.onrender.com

### Frontend — Static Site
| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

Environment variables:
VITE_API_URL=https://your-backend.onrender.com/api

Add a Rewrite Rule in Render dashboard:
/* → /index.html (Rewrite)

---

## 📁 Project Structure
team-task-manager/
├── backend/
│   ├── src/
│   │   ├── db/index.js          ← SQLite connection + helpers
│   │   ├── middleware/auth.js   ← JWT middleware
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── projects.js
│   │       ├── tasks.js
│   │       └── dashboard.js
│   ├── index.js                 ← Express entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/axios.js         ← Axios + interceptor
│   │   ├── context/
│   │   │   └── AuthContext.jsx  ← Auth state management
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Signup.jsx
│   │       ├── Projects.jsx
│   │       └── ProjectDetail.jsx
│   ├── App.jsx
│   ├── index.css
│   └── package.json
└── README.md

---

## 👩‍💻 Author

**Siddhi Dokania**
- GitHub: [@siddhidokania](https://github.com/siddhidokania)

---

## 📄 License

This project was built as a full-stack coding assignment demonstrating REST API design, JWT authentication, role-based access control, and full-stack deployment.