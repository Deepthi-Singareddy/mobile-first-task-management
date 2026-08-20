# 📋 TaskFlow — Full-Stack Task Management Application

A **mobile-first, full-stack task management application** built with the **MERN Stack** (MongoDB, Express.js, React, Node.js). Features JWT authentication, Cloudinary file uploads, Nodemailer email notifications, and OpenWeatherMap weather integration.

---

## ✨ Features

### 🔐 Authentication & Security
- User registration and login with JWT tokens
- Password hashing with bcryptjs
- Protected API routes and frontend routes
- User data isolation (each user can only access their own tasks)

### 📝 Task Management (Full CRUD)
- Create, read, update, and delete tasks
- Task fields: title, description, status, priority, due date, location, file attachment
- Status options: `PENDING`, `IN_PROGRESS`, `DONE`
- Priority options: `LOW`, `MEDIUM`, `HIGH`
- Overdue task highlighting

### 🔍 Search, Filter & Pagination
- Full-text search across task titles and descriptions
- Filter by status, priority, and due date range
- Server-side pagination (10 tasks per page)
- Sort by creation date

### 📁 File Uploads (Cloudinary)
- Attach files/images to tasks via drag & drop or file picker
- Supports: JPEG, PNG, GIF, WebP, PDF, DOC, DOCX, TXT
- Max file size: 10MB
- Files stored on Cloudinary with secure URLs
- View/download attachments from task cards

### 📧 Email Notifications (Nodemailer)
- Confirmation email sent when a task is created
- Notification email sent when a task is marked as "Done"
- Beautiful HTML email templates
- Non-blocking (doesn't slow down API responses)

### 🌤️ Weather Integration (OpenWeatherMap)
- Each task can have a location (city) field
- Live weather data displayed on task cards
- Shows temperature, conditions, humidity, wind speed
- Graceful handling of invalid locations or API failures

### 📱 Mobile-First Responsive Design
- Designed for mobile screens first, then tablet and desktop
- Bottom-sheet modal on mobile, centered dialog on desktop
- Touch-friendly buttons and interactive elements
- Responsive navigation with hamburger menu
- No horizontal overflow

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Database** | MongoDB + Mongoose |
| **Backend** | Node.js + Express.js |
| **Authentication** | JWT + bcryptjs |
| **File Upload** | Multer + Cloudinary |
| **Email** | Nodemailer (Gmail SMTP) |
| **Weather** | OpenWeatherMap API |
| **Frontend** | React.js (Vite) + React Router v6 |
| **Styling** | Tailwind CSS + Custom CSS |
| **Icons** | Lucide React |
| **State** | React Context + TanStack Query |
| **HTTP Client** | Axios |

---

## 📁 Project Structure

```
task-management-mern/
├── backend/                    # Express.js Application
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── cloudinary.js       # Cloudinary + Multer config
│   ├── controllers/
│   │   ├── authController.js   # Register & Login logic
│   │   └── taskController.js   # Task CRUD + filtering
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT guard
│   │   ├── uploadMiddleware.js # File upload handling
│   │   └── errorMiddleware.js  # Centralized error handler
│   ├── models/
│   │   ├── User.js             # User schema
│   │   └── Task.js             # Task schema with User ref
│   ├── routes/
│   │   ├── authRoutes.js       # /api/auth routes
│   │   └── taskRoutes.js       # /api/tasks routes
│   ├── utils/
│   │   ├── emailService.js     # Nodemailer dispatcher
│   │   └── weatherService.js   # OpenWeatherMap wrapper
│   ├── .env.example
│   ├── package.json
│   └── server.js               # Entry point
│
├── frontend/                   # React.js Application (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── TaskCard.jsx
│   │   │   ├── TaskFormModal.jsx
│   │   │   ├── WeatherBadge.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── DashboardPage.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18.x or v20.x LTS
- **npm** or **pnpm**
- **MongoDB Atlas** account (or local MongoDB instance)
- **Cloudinary** account (free tier)
- **OpenWeatherMap** API key (free tier)
- **Gmail** account with App Password (for email notifications)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/task-management-mern.git
cd task-management-mern
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Fill in your environment variables:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/taskmanager
JWT_SECRET=your_strong_jwt_secret_key
PORT=5000
FRONTEND_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

OPENWEATHER_API_KEY=your_openweather_api_key

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

Start the backend:

```bash
npm run dev
```

The server will start on `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file from the template:

```bash
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

The app will open at `http://localhost:5173`.

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|------------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT token signing |
| `PORT` | Server port (default: 5000) |
| `FRONTEND_URL` | Frontend URL for CORS |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `OPENWEATHER_API_KEY` | OpenWeatherMap API key |
| `EMAIL_HOST` | SMTP host (default: smtp.gmail.com) |
| `EMAIL_PORT` | SMTP port (default: 587) |
| `EMAIL_USER` | Email address for sending notifications |
| `EMAIL_PASS` | Email app password |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|------------|
| `VITE_API_URL` | Backend API base URL |

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user profile | Private |

### Tasks

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/tasks` | Get user's tasks (filtered/paginated) | Private |
| POST | `/api/tasks` | Create new task (with optional file) | Private |
| GET | `/api/tasks/:id` | Get single task with weather data | Private |
| PUT | `/api/tasks/:id` | Update task (with optional file) | Private |
| DELETE | `/api/tasks/:id` | Delete task | Private |
| GET | `/api/tasks/weather/:city` | Get weather for a city | Private |

### Query Parameters for GET `/api/tasks`

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10) |
| `status` | string | Filter by status |
| `priority` | string | Filter by priority |
| `search` | string | Search in title/description |
| `startDate` | date | Filter by due date (from) |
| `endDate` | date | Filter by due date (to) |

---

## 🧪 Testing

1. **Register** a new user account
2. **Login** with the created credentials
3. **Create** a task with title, description, priority, due date, location, and file attachment
4. **Verify** the task appears in the dashboard
5. **Check** weather badge loads for the task's location
6. **Edit** the task and change its status
7. **Mark** a task as "Done" — verify completion email is sent
8. **Filter** tasks by status, priority, and date range
9. **Search** tasks by title/description
10. **Delete** a task and verify it's removed
11. **Logout** and verify protected routes redirect to login
12. **Test** responsive layout on mobile, tablet, and desktop viewports

---

## 🚢 Deployment

### Backend (Render / Railway)

1. Push the code to GitHub
2. Create a new Web Service on [Render](https://render.com) or [Railway](https://railway.app)
3. Set the root directory to `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add all environment variables from `backend/.env`

### Frontend (Vercel / Netlify)

1. Create a new project on [Vercel](https://vercel.com) or [Netlify](https://netlify.com)
2. Set the root directory to `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Set `VITE_API_URL` to your deployed backend URL

### MongoDB (Atlas)

1. Create a cluster on [MongoDB Atlas](https://mongodb.com/atlas)
2. Set up database user and network access
3. Copy the connection string to `MONGO_URI`

---

## 📝 Architecture Notes

- **User Isolation**: All task queries include `user: req.user._id` to ensure users only access their own data
- **Non-blocking Emails**: Email sending is fire-and-forget to avoid slowing down API responses
- **Weather Caching**: Weather data is fetched on-demand when task cards are expanded
- **File Upload Flow**: Files → Multer memory buffer → Cloudinary upload → URL stored in MongoDB
- **JWT Flow**: Token stored in localStorage → Axios interceptor attaches to all requests → Backend middleware verifies

---

## ⚖️ Trade-offs & Future Improvements

### Architecture Trade-offs Made
1. **MERN Architecture Choice**: Selected Express.js + React (Vite) following the comprehensive reference guide. This provides fine-grained control over multipart uploads (Multer memory buffers directly into Cloudinary) and non-blocking background email dispatch without serverless timeout limits.
2. **Non-blocking Email Dispatch**: Emails are triggered asynchronously in the background rather than blocking the HTTP response lifecycle. If SMTP encounters latency, the user experience remains instant and snappy.
3. **On-Demand Weather Resolution**: Weather data is fetched with fail-safe error handling for city names so that invalid locations or OpenWeatherMap API rate limits do not disrupt primary task operations.
4. **Direct Cloud Storage**: Files are streamed directly to Cloudinary using in-memory buffers instead of storing files on local disk, ensuring zero disk dependency for deployment on containerized environments (e.g., Render, Railway, Fly.io).

### What I'd Improve With More Time
- **Background Worker & Job Queues**: Integrate Redis + BullMQ for reliable, retried email notifications and scheduled cron jobs for upcoming task due-date reminders.
- **Kanban Board View**: Add an interactive drag-and-drop Kanban view alongside the list view (using `@dnd-kit` or `react-beautiful-dnd`).
- **PWA & Offline Support**: Implement Service Workers, IndexedDB caching, and Web Push notifications for a native mobile app experience.
- **Multi-user Collaboration & Subtasks**: Enable task sharing, team workspaces, activity audit logs, and checklists/sub-tasks.
- **Automated E2E Testing**: Add end-to-end test suites using Playwright and Vitest for complete test coverage across mobile and desktop viewport sizes.

---

## 📄 License

This project was created as part of the Mobile First Applications Trainee Assessment.
