from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ("admin",   "Admin"),
        ("teacher", "Teacher"),
        ("student", "Student"),
    ]
    email      = models.EmailField(unique=True)
    role       = models.CharField(max_length=10, choices=ROLE_CHOICES, default="student")
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD  = "email"
    REQUIRED_FIELDS = ["username", "first_name", "last_name"]

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

    @property
    def full_name(self):
        return self.get_full_name()


class StudentProfile(models.Model):
    user       = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="student_profile")
    class_room = models.ForeignKey("academics.ClassRoom", on_delete=models.SET_NULL, null=True, blank=True, related_name="students")
    enrollment_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"Student: {self.user.full_name}"


class TeacherProfile(models.Model):
    user    = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="teacher_profile")
    subject = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"Teacher: {self.user.full_name}"