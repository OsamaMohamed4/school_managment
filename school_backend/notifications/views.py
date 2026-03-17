from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Notification
from .serializers import NotificationSerializer
from users.permissions import IsTeacher, IsAdmin
from users.models import CustomUser
from academics.models import ClassRoom


class SendNotificationView(APIView):
    """Teacher/Admin: send notification to class or individual student"""
    permission_classes = [IsTeacher]

    def post(self, request):
        title      = request.data.get("title","").strip()
        message    = request.data.get("message","").strip()
        notif_type = request.data.get("notif_type","info")
        class_id   = request.data.get("class_id")
        student_id = request.data.get("student_id")

        if not title or not message:
            return Response({"error":"title and message are required."}, status=400)

        recipients = []
        if class_id:
            classroom  = get_object_or_404(ClassRoom, pk=class_id)
            recipients = list(CustomUser.objects.filter(
                student_profile__class_room=classroom, is_active=True
            ))
        elif student_id:
            student = get_object_or_404(CustomUser, pk=student_id, role="student")
            recipients = [student]
        else:
            return Response({"error":"Provide class_id or student_id."}, status=400)

        notifs = [
            Notification(
                sender=request.user,
                recipient=r,
                title=title,
                message=message,
                notif_type=notif_type,
            ) for r in recipients
        ]
        Notification.objects.bulk_create(notifs)

        return Response({
            "message": f"Notification sent to {len(notifs)} student(s).",
            "count":   len(notifs),
        })


class MyNotificationsView(APIView):
    """Any user: list own notifications"""
    def get(self, request):
        notifs = Notification.objects.filter(recipient=request.user)[:50]
        unread = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({
            "unread":        unread,
            "notifications": NotificationSerializer(notifs, many=True).data,
        })


class MarkReadView(APIView):
    """Mark one or all notifications as read"""
    def post(self, request):
        notif_id = request.data.get("id")
        if notif_id:
            notif = get_object_or_404(Notification, pk=notif_id, recipient=request.user)
            notif.is_read = True
            notif.save()
        else:
            Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({"message":"Marked as read."})
