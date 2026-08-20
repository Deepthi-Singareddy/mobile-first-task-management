# Full-Stack Task Management Application — Implementation Plan

## Background

Build a **Mobile-First Full-Stack Task Management Application** using the **MERN Stack** (MongoDB, Express.js, React, Node.js) with JWT authentication, file uploads (Cloudinary), automated email notifications (Nodemailer), and live weather integration (OpenWeatherMap).

> [!NOTE]
> The assignment PDF specifies NestJS for backend and Next.js for frontend, but the reference material (the detailed guide) specifies **Express.js + React (Vite)** as the MERN stack. The reference material provides complete code examples, schemas, and step-by-step instructions using Express.js and React/Vite. I will follow the **reference material's MERN stack** since it is the comprehensive implementation guide.

---

## Proposed Changes

### Backend — Express.js API (`backend/`)

#### [NEW] `backend/package.json`
Initialize with dependencies: express, mongoose, dotenv, cors, jsonwebtoken, bcryptjs, multer, cloudinary, nodemailer, axios, express-validator

#### [NEW] `backend/server.js`
Application entry point: Express app setup, CORS, JSON parsing, route mounting, MongoDB connection, centralized error handler

#### [NEW] `backend/config/db.js`
Mongoose connection to MongoDB Atlas using `MONGO_URI` env variable

#### [NEW] `backend/config/cloudinary.js`
Cloudinary SDK configuration + Multer memory storage for file uploads

#### [NEW] `backend/models/User.js`
User schema: name, email (unique, lowercase), password (hashed with bcryptjs pre-save hook), timestamps. Includes `matchPassword` instance method.

#### [NEW] `backend/models/Task.js`
Task schema: user (ObjectId ref to User), title, description, status (PENDING/IN_PROGRESS/DONE), priority (LOW/MEDIUM/HIGH), dueDate, location, fileUrl, timestamps.

#### [NEW] `backend/controllers/authController.js`
- `POST /api/auth/register` — Register user, hash password, return JWT
- `POST /api/auth/login` — Validate credentials, return JWT

#### [NEW] `backend/controllers/taskController.js`
- `GET /api/tasks` — Get user's tasks with filtering (status, priority, search, date range) & pagination
- `POST /api/tasks` — Create task with optional file upload + email notification + weather fetch
- `GET /api/tasks/:id` — Get single task (with weather data)
- `PUT /api/tasks/:id` — Update task (sends email when marked DONE)
- `DELETE /api/tasks/:id` — Delete task

#### [NEW] `backend/middleware/authMiddleware.js`
JWT verification guard: reads `Authorization: Bearer <token>`, decodes, attaches `req.user`

#### [NEW] `backend/middleware/uploadMiddleware.js`
Multer middleware for multipart file upload handling

#### [NEW] `backend/middleware/errorMiddleware.js`
Centralized error handling middleware

#### [NEW] `backend/routes/authRoutes.js`
`/api/auth/register` and `/api/auth/login` routes

#### [NEW] `backend/routes/taskRoutes.js`
`/api/tasks` CRUD routes, all protected by auth middleware

#### [NEW] `backend/utils/emailService.js`
Nodemailer transporter: sends confirmation email on task creation & notification on task completion

#### [NEW] `backend/utils/weatherService.js`
OpenWeatherMap API wrapper: fetches current weather by city name, returns temp/description/icon

#### [NEW] `backend/.env.example`
Template with all required environment variable names

---

### Frontend — React + Vite (`frontend/`)

#### [NEW] `frontend/` (Vite project)
Initialize with `npm create vite@latest` using React template. Install: axios, react-router-dom, lucide-react, @tanstack/react-query, tailwindcss, postcss, autoprefixer

#### [NEW] `frontend/src/services/api.js`
Axios instance with base URL from env. Request interceptor auto-attaches JWT Bearer token from localStorage.

#### [NEW] `frontend/src/context/AuthContext.jsx`
React Context for auth state: user, token, login, register, logout functions. Wraps entire app.

#### [NEW] `frontend/src/components/ProtectedRoute.jsx`
Route wrapper that redirects unauthenticated users to `/login`

#### [NEW] `frontend/src/components/Navbar.jsx`
Mobile-first responsive navigation bar with user info, logout button, hamburger menu

#### [NEW] `frontend/src/components/TaskCard.jsx`
Task card displaying: title, description, due date, status pill, priority tag, weather badge, attachment link, edit/delete actions

#### [NEW] `frontend/src/components/TaskFormModal.jsx`
Modal form for creating/editing tasks: title, description, status, priority, due date, location, file upload (FormData multipart)

#### [NEW] `frontend/src/components/WeatherBadge.jsx`
Displays live weather info (temp, description, icon) for a task's location

#### [NEW] `frontend/src/pages/LoginPage.jsx`
Login form with validation, error handling, redirect on success

#### [NEW] `frontend/src/pages/RegisterPage.jsx`
Registration form with validation, error handling, redirect on success

#### [NEW] `frontend/src/pages/DashboardPage.jsx`
Main task dashboard: search bar, filter dropdowns (status, priority), date range filter, task list with pagination, create task button, loading/error/empty states

#### [NEW] `frontend/src/App.jsx`
BrowserRouter + Routes setup with protected and public routes

#### [NEW] `frontend/src/index.css`
Tailwind CSS directives + custom responsive styles

#### [NEW] `frontend/.env.example`
Template with `VITE_API_URL`

---

### Root Files

#### [NEW] `README.md`
Professional README with: project overview, features, tech stack, structure, setup instructions, env variables, run instructions, API docs, deployment guide

#### [NEW] `.gitignore`
Standard gitignore for Node.js/React projects

---

## Architecture Notes

```
┌─────────────────────────────────────────────┐
│              React Frontend (Vite)          │
│  ┌─────────┐ ┌──────────┐ ┌─────────────┐  │
│  │ Login   │ │ Register │ │ Dashboard   │  │
│  │ Page    │ │ Page     │ │ (Tasks)     │  │
│  └────┬────┘ └────┬─────┘ └──────┬──────┘  │
│       │           │              │          │
│  ┌────▼───────────▼──────────────▼──────┐   │
│  │ AuthContext + Axios Interceptors     │   │
│  └──────────────────┬───────────────────┘   │
└─────────────────────┼───────────────────────┘
                      │ HTTP (JWT Bearer)
┌─────────────────────┼───────────────────────┐
│     Express.js Backend (Node.js)            │
│  ┌──────────────────▼───────────────────┐   │
│  │ Routes → Middleware → Controllers    │   │
│  └──────────────────┬───────────────────┘   │
│        ┌────────────┼────────────┐          │
│   ┌────▼────┐  ┌────▼────┐  ┌───▼─────┐    │
│   │MongoDB  │  │Cloudinary│  │Weather  │    │
│   │(Mongoose)│ │(Uploads) │  │(OpenWM) │    │
│   └─────────┘  └─────────┘  └─────────┘    │
│        └── Nodemailer (Email) ──┘           │
└─────────────────────────────────────────────┘
```

## Verification Plan

### Automated Tests
- Backend: Test all API endpoints using the running server
- Frontend: Build check to ensure no compilation errors

### Manual Verification
- Register a new user → Login → Create task with file + location → View weather badge → Mark as DONE → Verify email triggers → Edit/Delete tasks → Filter/Search/Paginate → Logout → Verify protected routes redirect
- Test responsive layouts at mobile (375px), tablet (768px), desktop (1024px+)

---

## Environment Variables Required

### Backend `.env`
```
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/taskmanager
JWT_SECRET=your_jwt_secret_key
PORT=5000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
OPENWEATHER_API_KEY=your_openweather_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:5000/api
```
