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


class GradesTests(TestCase):
    def setUp(self):
        self.client  = APIClient()
        self.admin   = make_user("admin@test.com",   "admin")
        self.teacher = make_user("teacher@test.com", "teacher")

    def test_admin_create_grade(self):
        login(self.client, "admin@test.com")
        res = self.client.post("/api/grades/", {"name": "Grade 1"}, format="json")
        self.assertEqual(res.status_code, 201)

    def test_admin_list_grades(self):
        login(self.client, "admin@test.com")
        self.client.post("/api/grades/", {"name": "Grade 1"}, format="json")
        res = self.client.get("/api/grades/")
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.data), 1)

    def test_teacher_cannot_create_grade(self):
        login(self.client, "teacher@test.com")
        res = self.client.post("/api/grades/", {"name": "Grade X"}, format="json")
        self.assertIn(res.status_code, [403, 401])

    def test_admin_delete_grade(self):
        login(self.client, "admin@test.com")
        r   = self.client.post("/api/grades/", {"name": "ToDelete"}, format="json")
        res = self.client.delete(f"/api/grades/{r.data['id']}/")
        self.assertIn(res.status_code, [200, 204])


class ClassesTests(TestCase):
    def setUp(self):
        self.client  = APIClient()
        self.admin   = make_user("admin@test.com",   "admin")
        self.teacher = make_user("teacher@test.com", "teacher")
        login(self.client, "admin@test.com")
        gr = self.client.post("/api/grades/", {"name": "Grade 1"}, format="json")
        self.grade_id = gr.data["id"]

    def _create_class(self, name="Class A"):
        login(self.client, "admin@test.com")
        return self.client.post("/api/classes/", {"name": name, "grade": self.grade_id}, format="json")

    def test_create_class(self):
        res = self._create_class()
        self.assertEqual(res.status_code, 201)

    def test_list_classes(self):
        self._create_class()
        res = self.client.get("/api/classes/")
        self.assertEqual(res.status_code, 200)

    def test_assign_teacher_to_class(self):
        cls = self._create_class()
        res = self.client.post(
            f"/api/classes/{cls.data['id']}/assign-teacher/",
            {"teacher_id": self.teacher.id}, format="json"
        )
        self.assertEqual(res.status_code, 200)

    def test_delete_class(self):
        cls = self._create_class("ToDelete")
        res = self.client.delete(f"/api/classes/{cls.data['id']}/")
        self.assertIn(res.status_code, [200, 204])
