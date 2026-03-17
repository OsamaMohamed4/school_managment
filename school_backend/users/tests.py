from django.test import TestCase
from rest_framework.test import APIClient
from .models import CustomUser


def make_user(email, password, role, first="T", last="U"):
    u = CustomUser(email=email, username=email, role=role, first_name=first, last_name=last)
    u.set_password(password)
    u.save()
    return u


def login(client, email, password="Pass@123"):
    res = client.post("/api/auth/login/", {"email": email, "password": password}, format="json")
    client.credentials(HTTP_AUTHORIZATION="Bearer " + res.data["access"])
    return res


class AuthTests(TestCase):
    def setUp(self):
        self.client  = APIClient()
        self.admin   = make_user("admin@test.com",   "Admin@123",   "admin",   "Admin",   "User")
        self.teacher = make_user("teacher@test.com", "Teacher@123", "teacher", "Teacher", "User")
        self.student = make_user("student@test.com", "Student@123", "student", "Student", "User")

    def test_login_admin_success(self):
        res = self.client.post("/api/auth/login/", {"email":"admin@test.com","password":"Admin@123"}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertIn("access", res.data)
        self.assertEqual(res.data["user"]["role"], "admin")

    def test_login_wrong_password(self):
        res = self.client.post("/api/auth/login/", {"email":"admin@test.com","password":"wrong"}, format="json")
        self.assertEqual(res.status_code, 401)

    def test_login_nonexistent_user(self):
        res = self.client.post("/api/auth/login/", {"email":"nobody@test.com","password":"pass"}, format="json")
        self.assertEqual(res.status_code, 401)

    def test_login_teacher_success(self):
        res = self.client.post("/api/auth/login/", {"email":"teacher@test.com","password":"Teacher@123"}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["user"]["role"], "teacher")

    def test_login_student_success(self):
        res = self.client.post("/api/auth/login/", {"email":"student@test.com","password":"Student@123"}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["user"]["role"], "student")

    def test_me_returns_user_info(self):
        login(self.client, "admin@test.com", "Admin@123")
        res = self.client.get("/api/auth/me/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["email"], "admin@test.com")

    def test_me_unauthenticated(self):
        res = self.client.get("/api/auth/me/")
        self.assertEqual(res.status_code, 401)

    def test_profile_get(self):
        login(self.client, "teacher@test.com", "Teacher@123")
        res = self.client.get("/api/auth/profile/")
        self.assertEqual(res.status_code, 200)

    def test_profile_update_name(self):
        login(self.client, "teacher@test.com", "Teacher@123")
        res = self.client.patch("/api/auth/profile/", {"first_name":"John","last_name":"Doe"}, format="json")
        self.assertEqual(res.status_code, 200)

    def test_change_password_success(self):
        login(self.client, "student@test.com", "Student@123")
        res = self.client.post("/api/auth/change-password/", {"old_password":"Student@123","new_password":"NewPass@456"}, format="json")
        self.assertEqual(res.status_code, 200)

    def test_change_password_wrong_old(self):
        login(self.client, "student@test.com", "Student@123")
        res = self.client.post("/api/auth/change-password/", {"old_password":"WRONG","new_password":"NewPass@456"}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_change_password_too_short(self):
        login(self.client, "student@test.com", "Student@123")
        res = self.client.post("/api/auth/change-password/", {"old_password":"Student@123","new_password":"123"}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_admin_can_list_users(self):
        login(self.client, "admin@test.com", "Admin@123")
        res = self.client.get("/api/auth/users/")
        self.assertEqual(res.status_code, 200)

    def test_teacher_cannot_list_users(self):
        login(self.client, "teacher@test.com", "Teacher@123")
        res = self.client.get("/api/auth/users/")
        self.assertIn(res.status_code, [403, 401])

    def test_admin_can_create_user(self):
        login(self.client, "admin@test.com", "Admin@123")
        res = self.client.post("/api/auth/users/", {
            "email":      "new@test.com",
            "username":   "new@test.com",
            "password":   "Pass@1234",
            "first_name": "New",
            "last_name":  "User",
            "role":       "teacher"
        }, format="json")
        self.assertEqual(res.status_code, 201)

    def test_admin_can_toggle_user_status(self):
        login(self.client, "admin@test.com", "Admin@123")
        res = self.client.patch(f"/api/auth/users/{self.student.id}/toggle-status/")
        self.assertEqual(res.status_code, 200)

    def test_admin_can_delete_user(self):
        login(self.client, "admin@test.com", "Admin@123")
        u   = make_user("todelete@test.com", "Pass@123", "student")
        res = self.client.delete(f"/api/auth/users/{u.id}/")
        self.assertIn(res.status_code, [200, 204])
