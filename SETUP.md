# 🚀 EduPortal Backend — Setup Guide

## 1. Install Dependencies
```bash
cd school_backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 2. Setup Database
```bash
python manage.py makemigrations users
python manage.py makemigrations academics
python manage.py makemigrations attendance
python manage.py makemigrations quizzes
python manage.py migrate
```

## 3. Seed Sample Data
```bash
python manage.py shell < seed_data.py
```
**Accounts created:**
| Role    | Email                  | Password     |
|---------|------------------------|--------------|
| Admin   | admin@school.edu       | Admin@123    |
| Teacher | teacher1@school.edu    | Teacher@123  |
| Student | student1@school.edu    | Student@123  |

## 4. Run Server
```bash
python manage.py runserver
```
API available at: `http://localhost:8000/api/`
Admin panel at:   `http://localhost:8000/admin/`

## 5. Connect React Frontend
Copy `api.js` to your React `src/` folder:
```bash
cp api.js ../your-react-app/src/api.js
```

In your Login component:
```javascript
import api from './api';

// Login button handler
const handleLogin = async () => {
  try {
    await api.auth.login(email, password);
    // Auto-redirects to correct dashboard by role!
  } catch (err) {
    setError(err.error || 'Login failed');
  }
};
```

## 6. API Endpoints Summary

### Auth
| Method | Endpoint              | Who   |
|--------|-----------------------|-------|
| POST   | /api/auth/login/      | All   |
| POST   | /api/auth/refresh/    | All   |
| GET    | /api/auth/me/         | All   |

### Users
| Method | Endpoint                           | Who   |
|--------|------------------------------------|-------|
| GET    | /api/auth/users/                   | Admin |
| POST   | /api/auth/users/                   | Admin |
| PATCH  | /api/auth/users/{id}/toggle-status/| Admin |

### Academics
| Method | Endpoint              | Who           |
|--------|-----------------------|---------------|
| GET    | /api/grades/          | Admin         |
| POST   | /api/grades/          | Admin         |
| GET    | /api/classes/         | Admin         |
| GET    | /api/classes/my/      | Teacher       |
| GET    | /api/classes/mine/    | Student       |

### Attendance
| Method | Endpoint                           | Who           |
|--------|------------------------------------|---------------|
| POST   | /api/attendance/bulk/              | Teacher       |
| GET    | /api/attendance/my/                | Student       |
| GET    | /api/attendance/class/{id}/?date=  | Admin/Teacher |

### Quizzes
| Method | Endpoint                           | Who     |
|--------|------------------------------------|---------|
| GET    | /api/quizzes/                      | Teacher |
| POST   | /api/quizzes/                      | Teacher |
| POST   | /api/quizzes/{id}/add-question/    | Teacher |
| GET    | /api/quizzes/{id}/results/         | Teacher |
| GET    | /api/quizzes/available/            | Student |
| GET    | /api/quizzes/{id}/take/            | Student |
| POST   | /api/quizzes/{id}/take/            | Student |
| GET    | /api/quizzes/my-results/           | Student |
