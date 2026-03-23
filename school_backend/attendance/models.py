from django.db import models
from django.conf import settings


class AttendanceRecord(models.Model):
    STATUS_CHOICES = [("present", "Present"), ("absent", "Absent")]

    student    = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="attendance_records", limit_choices_to={"role": "student"})
    class_room = models.ForeignKey("academics.ClassRoom", on_delete=models.CASCADE, related_name="attendance_records")
    teacher    = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="marked_attendance", limit_choices_to={"role": "teacher"})
    date       = models.DateField()
    status     = models.CharField(max_length=10, choices=STATUS_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["student", "class_room", "date"]
        ordering        = ["-date"]
        indexes = [
            models.Index(fields=["date"],              name="att_date_idx"),
            models.Index(fields=["status"],            name="att_status_idx"),
            models.Index(fields=["student", "date"],  name="att_student_date_idx"),
        ]

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.date} - {self.status}"