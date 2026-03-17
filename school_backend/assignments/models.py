from django.db import models
from django.conf import settings
from academics.models import ClassRoom


class Assignment(models.Model):
    title       = models.CharField(max_length=200)
    description = models.TextField()
    class_room  = models.ForeignKey(ClassRoom, on_delete=models.CASCADE, related_name="assignments")
    teacher     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                    related_name="created_assignments", limit_choices_to={"role":"teacher"})
    due_date    = models.DateTimeField()
    max_score   = models.PositiveSmallIntegerField(default=100)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} — {self.class_room}"


class Submission(models.Model):
    STATUS_CHOICES = [("submitted","Submitted"),("graded","Graded"),("late","Late")]
    assignment  = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name="submissions")
    student     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                    related_name="submissions", limit_choices_to={"role":"student"})
    text        = models.TextField(blank=True)
    score       = models.PositiveSmallIntegerField(null=True, blank=True)
    feedback    = models.TextField(blank=True)
    status      = models.CharField(max_length=10, choices=STATUS_CHOICES, default="submitted")
    submitted_at= models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["assignment","student"]
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.student} → {self.assignment.title}"
