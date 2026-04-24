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

class ClassSubjectTeacher(models.Model):
    """
    Many-to-many between ClassRoom and Teachers.
    Each row = one teacher teaches one subject in one class.
    Example: Class 5A → Mr. Ahmed teaches Math
             Class 5A → Ms. Sara  teaches English
    """
    class_room = models.ForeignKey(
        ClassRoom, on_delete=models.CASCADE,
        related_name="subject_teachers"
    )
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="teaching_subjects",
        limit_choices_to={"role": "teacher"},
    )
    subject = models.CharField(max_length=100, help_text="Subject this teacher teaches in this class")

    class Meta:
        unique_together = ["class_room", "teacher", "subject"]
        ordering        = ["class_room", "subject"]

    def __str__(self):
        return f"{self.class_room} | {self.subject} → {self.teacher.get_full_name()}"


DAYS = [
    ("sun", "Sunday"),
    ("mon", "Monday"),
    ("tue", "Tuesday"),
    ("wed", "Wednesday"),
    ("thu", "Thursday"),
    ("fri", "Friday"),
    ("sat", "Saturday"),
]


class LessonPlan(models.Model):
    """
    Weekly lesson plan entry.
    Any teacher can add entries for classes they teach.
    """
    class_room = models.ForeignKey(
        ClassRoom, on_delete=models.CASCADE, related_name="lesson_plans"
    )
    teacher    = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="lesson_plans", limit_choices_to={"role": "teacher"}
    )
    week_start = models.DateField(help_text="First day of the week (Sunday)")
    day        = models.CharField(max_length=3, choices=DAYS)
    subject    = models.CharField(max_length=100)
    classwork  = models.TextField(blank=True)
    homework   = models.TextField(blank=True)
    order      = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["week_start", "day", "order"]

    def __str__(self):
        return f"{self.class_room} | {self.week_start} | {self.day} | {self.subject}"
