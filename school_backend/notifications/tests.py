from django.test import TestCase
from rest_framework.test import APIClient
from academics.models import Grade, ClassRoom

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


class NotificationTests(TestCase):
    def setUp(self):
        self.client  = APIClient()
        self.teacher = make_user("teacher@test.com", "teacher")
        self.student = make_user("student@test.com", "student")
        self.grade   = Grade.objects.create(name="Grade 1")
        self.cls     = ClassRoom.objects.create(name="Class A", grade=self.grade, teacher=self.teacher)
        try:
            from users.models import StudentProfile as SP
            SP.objects.get_or_create(user=self.student, defaults={"class_room": self.cls})
        except Exception:
            try:
                from academics.models import StudentProfile as SP
                SP.objects.get_or_create(user=self.student, defaults={"class_room": self.cls})
            except Exception:
                pass

    def test_teacher_send_notification(self):
        login(self.client, "teacher@test.com")
        # Send to individual student (avoids class membership requirement)
        res = self.client.post("/api/notifications/send/", {
            "title":      "Test Notification",
            "message":    "Hello student!",
            "student_id": self.student.id,
        }, format="json")
        self.assertIn(res.status_code, [200, 201])

    def test_student_list_notifications(self):
        login(self.client, "student@test.com")
        res = self.client.get("/api/notifications/")
        self.assertEqual(res.status_code, 200)

    def test_student_mark_read(self):
        login(self.client, "student@test.com")
        res = self.client.post("/api/notifications/mark-read/", {}, format="json")
        self.assertIn(res.status_code, [200, 201])
