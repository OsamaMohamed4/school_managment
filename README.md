# EduPortal — School Management Platform

A full-stack school management system built with Django REST Framework + React.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 5 + Django REST Framework + JWT |
| Frontend | React 18 + React Router |
| Database | SQLite (dev) |
| Auth | JWT (access + refresh tokens) |

---

## User Roles

- **Admin** — full control over users, classes, grades, analytics
- **Teacher** — attendance, quizzes, assignments, timetable, messaging
- **Student** — view own data, take quizzes, submit assignments
- **Parent** — view child's progress, message teacher

---

## Phases

### Phase 1 — Foundation & Authentication
- Custom user model (email-based login + role field)
- JWT login with auto-refresh
- Role-based routing (each role → its own dashboard)
- Landing page with 4 role cards

### Phase 2 — Academic Structure
- Grades and Classes management (Admin)
- Assign teachers and students to classes
- Admin, Teacher, Student dashboards

### Phase 3 — Attendance & Quizzes
- Daily attendance (Teacher marks present/absent/late)
- Attendance report per class
- Quiz builder with multiple-choice questions and timer (Teacher)
- Auto-graded quiz taking (Student)
- Quiz results with pass/fail breakdown

### Phase 4 — Parent Portal, Grade Book & Notifications
- Parent accounts linked to student children
- Parent dashboard (attendance rate + quiz results)
- Grade Book for Admin (all students with attendance % and quiz avg)
- Notifications — Teacher sends to class; Student sees bell with unread count

### Phase 5 — Timetable, Assignments, Messages & Analytics
- Weekly timetable per class (Teacher builds, Student views)
- Assignments with due date and max score (Teacher creates, Student submits)
- Assignment grading with feedback (Teacher)
- Direct messaging between Teacher and Students
- Admin can message any user
- Analytics dashboard with KPIs, attendance trend chart, top classes

### Phase 6 — Profile, Parent Portal+, PDF Export & UI Polish
- Profile page for all users (edit name + change password)
- Full parent portal (attendance calendar, quiz scores, assignments)
- Parent can message child's teacher
- PDF report card per student
- PDF attendance report per class
- Loading spinners across all dashboards

---

## Quick Start

**Backend**
```bash
cd "D:\School Management\school_backend"
python manage.py runserver
```

**Frontend**
```bash
cd "D:\School Management\eduportal"
npm start
```

- Backend → http://localhost:8000
- Frontend → http://localhost:3000

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@school.edu | Admin@123 |
| Teacher | teacher1@school.edu | Teacher@123 |
| Student | student1@school.edu | Student@123 |
| Parent | *(created by admin)* | Parent@123 |

---

## Project Structure

```
School Management/
├── school_backend/     ← Django backend
│   ├── users/          ← Auth, profiles, parent portal
│   ├── academics/      ← Grades & classes
│   ├── attendance/     ← Attendance records
│   ├── quizzes/        ← Quizzes & results
│   ├── notifications/  ← Notifications
│   ├── timetable/      ← Weekly timetable
│   ├── assignments/    ← Assignments & submissions
│   ├── messaging/      ← Direct messages
│   ├── analytics/      ← Admin analytics
│   └── reports/        ← PDF export
└── eduportal/          ← React frontend
    └── src/
        ├── pages/      ← Dashboard pages
        ├── components/ ← Shared components
        ├── context/    ← Auth context
        └── api.js      ← All API calls
```
