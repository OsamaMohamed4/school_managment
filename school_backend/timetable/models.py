from django.db import models
from academics.models import ClassRoom

DAYS = [("mon","Monday"),("tue","Tuesday"),("wed","Wednesday"),
        ("thu","Thursday"),("fri","Friday"),("sat","Saturday")]

class TimetableSlot(models.Model):
    class_room  = models.ForeignKey(ClassRoom, on_delete=models.CASCADE, related_name="timetable_slots")
    day         = models.CharField(max_length=3, choices=DAYS)
    period      = models.PositiveSmallIntegerField()          # 1-8
    subject     = models.CharField(max_length=100)
    teacher_name= models.CharField(max_length=100, blank=True)
    start_time  = models.TimeField()
    end_time    = models.TimeField()

    class Meta:
        ordering = ["day","period"]
        unique_together = ["class_room","day","period"]

    def __str__(self):
        return f"{self.class_room} | {self.day} P{self.period} — {self.subject}"
