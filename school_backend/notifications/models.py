from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPE_CHOICES = [
        ("info",    "Info"),
        ("warning", "Warning"),
        ("success", "Success"),
    ]
    sender     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                   related_name="sent_notifications", null=True, blank=True)
    recipient  = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                   related_name="notifications")
    title      = models.CharField(max_length=200)
    message    = models.TextField()
    notif_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default="info")
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "is_read"], name="notif_recipient_read_idx"),
            models.Index(fields=["recipient"],             name="notif_recipient_idx"),
        ]

    def __str__(self):
        return f"To {self.recipient.get_full_name()}: {self.title}"
