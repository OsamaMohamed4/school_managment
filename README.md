# EduPortal — School Management Platform

> **Phase 1 Complete** — Role-Based Authentication & Core Dashboards

---

## Overview

EduPortal is a full-stack school management platform built with **Django REST Framework** (backend) and **React** (frontend). Phase 1 establishes the foundation: three distinct user roles, JWT authentication, and dedicated dashboards for each role.

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Backend   | Django 5.0.3, Django REST Framework, SimpleJWT  |
| Frontend  | React 18, React Router v6                       |
| Database  | SQLite (development)                            |
| Auth      | JWT (Access + Refresh tokens)                   |
| Styling   | Inline CSS (no external UI library)             |

---

## Project Structure

```
School Management/
├── school_backend/          # Django project
│   ├── manage.py
│   ├── seed_data.py         # Creates test accounts
│   ├── requirements.txt
│   ├── school_backend/      # Django settings & URLs
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── users/               # Auth, roles, user management
│   │   ├── models.py        # CustomUser, StudentProfile, TeacherProfile
│   │   ├── views.py         # LoginView, MeView, UserViewSet
│   │   ├── serializers.py
│   │   ├── permissions.py   # IsAdmin, IsTeacher, IsStudent
│   │   └── urls.py
│   ├── academics/           # Grades & Classes
│   │   ├── models.py        # Grade, ClassRoom
│   │   ├── views.py
│   │   ├── serializers.py
│   │   └── urls.py
│   ├── attendance/          # Attendance records
│   │   ├── models.py        # AttendanceRecord
│   │   ├── views.py         # BulkAttendanceView
│   │   ├── serializers.py
│   │   └── urls.py
│   └── quizzes/             # Quiz system
│       ├── models.py        # Quiz, Question, Choice, QuizAttempt
│       ├── views.py
│       ├── serializers.py
│       └── urls.py
│
└── eduportal/               # React frontend
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── index.js
    │   ├── App.jsx          # Router & route protection
    │   ├── api.js           # All API calls (axios-free, fetch)
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── components/
    │   │   └── ProtectedRoute.jsx
    │   └── pages/
    │       ├── LandingPage.jsx
    │       ├── LoginPage.jsx
    │       ├── AdminDashboard.jsx
    │       ├── TeacherDashboard.jsx
    │       └── StudentDashboard.jsx
    ├── package.json
    └── .env
```

---

## Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- pip

---

### Backend Setup

```bash
# 1. Navigate to backend folder
cd school_backend

# 2. Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the fix script (writes all backend files)
python fix_project.py

# 5. Run migrations
python manage.py makemigrations users academics attendance quizzes
python manage.py migrate

# 6. Seed test data
Get-Content seed_data.py | python manage.py shell

# 7. Start the server
python manage.py runserver
```

Backend runs at: `http://localhost:8000`

---

### Frontend Setup

```bash
# 1. Navigate to frontend folder
cd eduportal

# 2. Run the fix script (writes all frontend files)
python fix_frontend.py

# 3. Install dependencies
npm install

# 4. Start React
npm start
```

Frontend runs at: `http://localhost:3000`

---

## Test Accounts

| Role    | Email                  | Password     |
|---------|------------------------|--------------|
| Admin   | admin@school.edu       | Admin@123    |
| Teacher | teacher1@school.edu    | Teacher@123  |
| Teacher | teacher2@school.edu    | Teacher@123  |
| Teacher | teacher3@school.edu    | Teacher@123  |
| Student | student1@school.edu    | Student@123  |
| Student | student2@school.edu    | Student@123  |
| Student | student3@school.edu    | Student@123  |
| Student | student4@school.edu    | Student@123  |

---
