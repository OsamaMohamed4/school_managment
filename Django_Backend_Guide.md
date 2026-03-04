# 🐍 Django Backend — Phase 1 Guide
## School Management & E-Learning Platform

---

## 📁 Project Structure

```
school_backend/
├── manage.py
├── requirements.txt
├── school_backend/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── users/              ← Authentication & Role Management
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   └── urls.py
├── academics/          ← Grades & Classes
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   └── urls.py
├── attendance/         ← Attendance Management (Phase 3)
└── quizzes/            ← Quiz Module (Phase 4)
```

---

## ⚙️ requirements.txt

```
Django==5.0
djangorestframework==3.15
djangorestframework-simplejwt==5.3
django-cors-headers==4.3
Pillow==10.2
python-decouple==3.8
```

---

## 🗃️ Models — users/models.py

```python
from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"


class StudentProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='student_profile')
    class_room = models.ForeignKey('academics.ClassRoom', on_delete=models.SET_NULL, null=True, blank=True)
    enrollment_date = models.DateField(auto_now_add=True)


class TeacherProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='teacher_profile')
    subject = models.CharField(max_length=100)
```

---

## 🗃️ Models — academics/models.py

```python
from django.db import models

class Grade(models.Model):
    name = models.CharField(max_length=50)  # e.g. "Grade 1"
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class ClassRoom(models.Model):
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE, related_name='classes')
    name = models.CharField(max_length=10)     # e.g. "1-A"
    teacher = models.ForeignKey(
        'users.CustomUser', on_delete=models.SET_NULL, null=True, blank=True,
        limit_choices_to={'role': 'teacher'}
    )
    subject = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.grade.name} — {self.name}"

    @property
    def student_count(self):
        return self.studentprofile_set.count()
```

---

## 🔐 settings.py — Key Config

```python
# AUTH
AUTH_USER_MODEL = 'users.CustomUser'

INSTALLED_APPS = [
    ...
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'users',
    'academics',
    'attendance',   # Phase 3
    'quizzes',      # Phase 4
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    ...
]

# CORS — Allow React frontend
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://your-school-domain.com",
]

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# JWT Settings
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}
```

---

## 🔒 Permissions — users/permissions.py

```python
from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsTeacher(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'teacher'

class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'student'

class IsAdminOrTeacher(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'teacher']
```

---

## 🌐 API Endpoints — Phase 1

### Auth
| Method | URL | Description | Access |
|--------|-----|-------------|--------|
| POST | `/api/auth/login/` | Login → returns JWT token | Public |
| POST | `/api/auth/refresh/` | Refresh token | Authenticated |
| GET | `/api/auth/me/` | Current user info + role | Authenticated |

### Users (Admin only)
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/users/` | List all users |
| POST | `/api/users/` | Create new user |
| GET | `/api/users/{id}/` | Get user detail |
| PATCH | `/api/users/{id}/toggle-status/` | Activate/Deactivate |

### Academics
| Method | URL | Description | Access |
|--------|-----|-------------|--------|
| GET/POST | `/api/grades/` | List/Create grades | Admin |
| GET/POST | `/api/classes/` | List/Create classes | Admin |
| GET | `/api/classes/my/` | Teacher's own classes | Teacher |
| GET | `/api/classes/mine/` | Student's class info | Student |

---

## 🔑 users/views.py — Login View

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

class LoginView(APIView):
    permission_classes = []  # Public

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        user = authenticate(request, username=email, password=password)

        if not user:
            return Response({'error': 'Invalid credentials'}, status=400)

        if not user.is_active:
            return Response({'error': 'Account is deactivated'}, status=403)

        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'name': user.get_full_name(),
                'email': user.email,
                'role': user.role,
            }
        })
```

---

## 🔗 React ↔ Django Connection

```javascript
// In React — api.js
const API_BASE = "http://localhost:8000/api";

export const login = async (email, password) => {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.access) {
    localStorage.setItem("token", data.access);
    localStorage.setItem("role", data.user.role);
  }
  return data;
};

// Redirect by role after login
const redirectByRole = (role) => {
  const routes = {
    admin: "/admin/dashboard",
    teacher: "/teacher/dashboard",
    student: "/student/dashboard",
  };
  window.location.href = routes[role];
};
```

---

## 🚀 Quick Start

```bash
# 1. Create virtual env
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Setup database
python manage.py makemigrations
python manage.py migrate

# 4. Create superuser (Admin)
python manage.py createsuperuser

# 5. Run server
python manage.py runserver
```

---

## ✅ Phase 1 Checklist

- [ ] Setup Django project & install packages
- [ ] Create `CustomUser` model with `role` field
- [ ] Setup JWT authentication
- [ ] Build Login API endpoint
- [ ] Build User Management APIs (Admin only)
- [ ] Build Grade & Class APIs
- [ ] Connect React frontend to Django backend
- [ ] Test role-based redirects

---

*Next Phase → Attendance Management (Phase 3)*
