from django.db import models
from django.conf import settings
from academics.models import ClassRoom


class Video(models.Model):
    title       = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    file        = models.FileField(
        upload_to="videos/%Y/%m/",
        help_text="Video file — max 100MB (.mp4, .mov, .avi, .mkv, .webm)"
    )
    class_room  = models.ForeignKey(
        ClassRoom, on_delete=models.CASCADE,
        related_name="videos"
    )
    teacher     = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="uploaded_videos",
        limit_choices_to={"role": "teacher"}
    )
    subject     = models.CharField(max_length=100, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} — {self.class_room}"

    @property
    def file_size_mb(self):
        try:
            return round(self.file.size / 1024 / 1024, 1)
        except Exception:
            return 0
