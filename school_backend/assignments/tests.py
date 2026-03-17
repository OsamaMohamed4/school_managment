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


class AssignmentTests(TestCase):
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

    def _create_assignment(self):
        login(self.client, "teacher@test.com")
        return self.client.post("/api/assignments/", {
            "title": "Homework 1", "description": "Do it",
            "class_room": self.cls.id, "due_date": "2099-12-31", "max_score": 100
        }, format="json")

    def test_teacher_create_assignment(self):
        res = self._create_assignment()
        self.assertEqual(res.status_code, 201)

    def test_student_submit_assignment(self):
        asgn = self._create_assignment()
        login(self.client, "student@test.com")
        res  = self.client.post(f"/api/assignments/{asgn.data['id']}/submit/", {"text": "My answer"}, format="json")
        self.assertIn(res.status_code, [200, 201])

    def test_teacher_view_submissions(self):
        asgn = self._create_assignment()
        login(self.client, "student@test.com")
        self.client.post(f"/api/assignments/{asgn.data['id']}/submit/", {"text": "answer"}, format="json")
        login(self.client, "teacher@test.com")
        res = self.client.get(f"/api/assignments/{asgn.data['id']}/submissions/")
        self.assertEqual(res.status_code, 200)

    def test_student_view_own_submissions(self):
        asgn = self._create_assignment()
        login(self.client, "student@test.com")
        self.client.post(f"/api/assignments/{asgn.data['id']}/submit/", {"text": "answer"}, format="json")
        res = self.client.get("/api/assignments/my-submissions/")
        self.assertEqual(res.status_code, 200)
