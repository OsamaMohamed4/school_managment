from django.db import models
from django.conf import settings
from academics.models import ClassRoom

DAYS = [
    ("sun", "Sunday / الأحد"),
    ("mon", "Monday / الاثنين"),
    ("tue", "Tuesday / الثلاثاء"),
    ("wed", "Wednesday / الأربعاء"),
    ("thu", "Thursday / الخميس"),
    ("fri", "Friday / الجمعة"),
    ("sat", "Saturday / السبت"),
]


class WeeklyPlan(models.Model):
    """One weekly plan per class per week"""
    class_room  = models.ForeignKey(ClassRoom, on_delete=models.CASCADE,
                    related_name="weekly_plans")
    advisor     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                    related_name="created_plans", limit_choices_to={"role": "teacher"})
    week_start  = models.DateField(help_text="Date of the first day of the week (Sunday)")
    week_end    = models.DateField(help_text="Date of the last day of the week (Thursday)")
    notes       = models.TextField(blank=True, help_text="General notes for the week")
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["class_room", "week_start"]
        ordering        = ["-week_start"]

    def __str__(self):
        return f"{self.class_room} — Week of {self.week_start}"


class DailyPlanEntry(models.Model):
    """One row in the weekly plan table: day + subject + classwork + homework"""
    plan      = models.ForeignKey(WeeklyPlan, on_delete=models.CASCADE,
                  related_name="entries")
    day       = models.CharField(max_length=3, choices=DAYS)
    subject   = models.CharField(max_length=100)
    classwork = models.TextField(blank=True)
    homework  = models.TextField(blank=True)
    order     = models.PositiveSmallIntegerField(default=0,
                  help_text="Display order within the day")

    class Meta:
        ordering = ["day", "order"]

    def __str__(self):
        return f"{self.get_day_display()} — {self.subject}"
