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


class MessagingTests(TestCase):
    def setUp(self):
        self.client  = APIClient()
        self.teacher = make_user("teacher@test.com", "teacher")
        self.student = make_user("student@test.com", "student")

    def test_start_conversation(self):
        login(self.client, "teacher@test.com")
        res = self.client.post("/api/messages/", {"user_id": self.student.id}, format="json")
        self.assertIn(res.status_code, [200, 201])

    def test_list_conversations(self):
        login(self.client, "teacher@test.com")
        self.client.post("/api/messages/", {"user_id": self.student.id}, format="json")
        res = self.client.get("/api/messages/")
        self.assertEqual(res.status_code, 200)

    def test_send_message(self):
        login(self.client, "teacher@test.com")
        conv = self.client.post("/api/messages/", {"user_id": self.student.id}, format="json")
        res  = self.client.post(f"/api/messages/{conv.data['id']}/", {"text": "Hello!"}, format="json")
        self.assertIn(res.status_code, [200, 201])

    def test_unread_count(self):
        login(self.client, "student@test.com")
        res = self.client.get("/api/messages/unread-count/")
        self.assertEqual(res.status_code, 200)
        self.assertTrue("count" in res.data or "unread" in res.data)

    def test_unauthenticated_blocked(self):
        res = self.client.get("/api/messages/")
        self.assertEqual(res.status_code, 401)
