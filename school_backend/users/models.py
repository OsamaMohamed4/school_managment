from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ("admin",   "Admin"),
        ("teacher", "Teacher"),
        ("student", "Student"),
        ("parent",  "Parent"),
    ]
    email    = models.EmailField(unique=True)
    role     = models.CharField(max_length=10, choices=ROLE_CHOICES, default="student")
    USERNAME_FIELD  = "email"
    REQUIRED_FIELDS = ["username", "first_name", "last_name"]

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"


class StudentProfile(models.Model):
    user       = models.OneToOneField(CustomUser, on_delete=models.CASCADE,
                   related_name="student_profile", limit_choices_to={"role":"student"})
    class_room = models.ForeignKey("academics.ClassRoom", on_delete=models.SET_NULL,
                   null=True, blank=True, related_name="students")

    def __str__(self):
        return f"Student: {self.user.get_full_name()}"


class TeacherProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE,
             related_name="teacher_profile", limit_choices_to={"role":"teacher"})
    bio  = models.TextField(blank=True)

    def __str__(self):
        return f"Teacher: {self.user.get_full_name()}"


class ParentProfile(models.Model):
    user     = models.OneToOneField(CustomUser, on_delete=models.CASCADE,
                 related_name="parent_profile", limit_choices_to={"role":"parent"})
    children = models.ManyToManyField(CustomUser, blank=True,
                 related_name="parents", limit_choices_to={"role":"student"})

    def __str__(self):
        return f"Parent: {self.user.get_full_name()}"
