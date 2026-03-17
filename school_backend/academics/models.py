from django.db import models
from django.conf import settings


class Grade(models.Model):
    name       = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class ClassRoom(models.Model):
    grade   = models.ForeignKey(Grade, on_delete=models.CASCADE, related_name="classes")
    name    = models.CharField(max_length=10)
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="teaching_classes",
        limit_choices_to={"role": "teacher"},
    )
    subject    = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering       = ["grade__name", "name"]
        unique_together = ["grade", "name"]

    def __str__(self):
        return f"{self.name}"

    @property
    def student_count(self):
        return self.students.count()