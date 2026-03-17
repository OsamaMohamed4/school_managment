from django.test import TestCase
from rest_framework.test import APIClient

def make_user(email, role, password="Pass@123", first="T", last="U"):
    from users.models import CustomUser
    u = CustomUser(email=email, username=email, role=role, first_name=first, last_name=last)
    u.set_password(password)
    u.save()
    return u
def login(client, email, password="Pass@123"):
    res = client.post("/api/auth/login/", {"email": email, "password": password}, format="json")
    client.credentials(HTTP_AUTHORIZATION="Bearer " + res.data["access"])
    return res


class AnalyticsTests(TestCase):
    def setUp(self):
        self.client  = APIClient()
        self.admin   = make_user("admin@test.com",   "admin")
        self.teacher = make_user("teacher@test.com", "teacher")

    def test_admin_can_access_analytics(self):
        login(self.client, "admin@test.com")
        res = self.client.get("/api/analytics/")
        self.assertEqual(res.status_code, 200)

    def test_teacher_cannot_access_analytics(self):
        login(self.client, "teacher@test.com")
        res = self.client.get("/api/analytics/")
        self.assertIn(res.status_code, [403, 401])

    def test_analytics_returns_dict(self):
        login(self.client, "admin@test.com")
        res = self.client.get("/api/analytics/")
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.data, dict)
