from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import models

from .models import Notification
from .serializers import NotificationSerializer
from users.permissions import IsTeacher, IsAdmin, IsAdminOrTeacher
from users.models import CustomUser
from academics.models import ClassRoom, ClassSubjectTeacher


class SendNotificationView(APIView):
    """Teacher/Admin: send notification to class, grade, all school, or individual student"""
    permission_classes = [IsAdminOrTeacher]

    def post(self, request):
        title           = request.data.get("title","").strip()
        message         = request.data.get("message","").strip()
        notif_type      = request.data.get("notif_type","info")
        class_id        = request.data.get("class_id")
        grade_id        = request.data.get("grade_id")
        student_id      = request.data.get("student_id")
        send_all          = request.data.get("send_all", False)
        include_parents   = request.data.get("include_parents", False)
        include_teachers  = request.data.get("include_teachers", False)

        if not title or not message:
            return Response({"error":"title and message are required."}, status=400)

        recipients = []
        if send_all:
            if request.user.role != "admin":
                return Response({"error":"Only admins can send school-wide notifications."}, status=403)
            recipients = list(CustomUser.objects.filter(role="student", is_active=True))
        elif grade_id:
            if request.user.role != "admin":
                return Response({"error":"Only admins can send grade-wide notifications."}, status=403)
            from academics.models import Grade
            grade = get_object_or_404(Grade, pk=grade_id)
            recipients = list(CustomUser.objects.filter(
                student_profile__class_room__grade=grade, is_active=True
            ))
        elif class_id:
            classroom = get_object_or_404(ClassRoom, pk=class_id)
            if request.user.role == "teacher":
                is_main    = classroom.teacher_id == request.user.id
                is_subject = ClassSubjectTeacher.objects.filter(class_room=classroom, teacher=request.user).exists()
                if not (is_main or is_subject):
                    return Response({"error":"You do not teach this class."}, status=403)
            recipients = list(CustomUser.objects.filter(
                student_profile__class_room=classroom, is_active=True
            ))
        elif student_id:
            student    = get_object_or_404(CustomUser, pk=student_id, role="student")
            recipients = [student]
        else:
            return Response({"error":"Provide send_all, grade_id, class_id, or student_id."}, status=400)

        all_recipients = list(recipients)
        seen_ids = {u.id for u in all_recipients}

        if include_parents and request.user.role == "admin":
            from users.models import ParentProfile
            parent_users = list(CustomUser.objects.filter(
                parent_profile__children__in=recipients, is_active=True
            ).distinct())
            for p in parent_users:
                if p.id not in seen_ids:
                    all_recipients.append(p)
                    seen_ids.add(p.id)

        if include_teachers and request.user.role == "admin":
            if send_all:
                teacher_qs = CustomUser.objects.filter(role="teacher", is_active=True)
            elif grade_id:
                teacher_qs = CustomUser.objects.filter(
                    is_active=True
                ).filter(
                    models.Q(taught_classes__grade_id=grade_id) |
                    models.Q(subject_teaching__class_room__grade_id=grade_id)
                ).distinct()
            elif class_id:
                teacher_qs = CustomUser.objects.filter(
                    is_active=True
                ).filter(
                    models.Q(taught_classes__id=class_id) |
                    models.Q(subject_teaching__class_room_id=class_id)
                ).distinct()
            else:
                teacher_qs = CustomUser.objects.none()
            for t in teacher_qs:
                if t.id not in seen_ids:
                    all_recipients.append(t)
                    seen_ids.add(t.id)

        file = request.FILES.get("file")
        file_path = None
        if file:
            if file.size > 50 * 1024 * 1024:
                return Response({"error": "File too large. Max 50MB."}, status=400)
            from django.core.files.storage import default_storage
            import time
            filename  = f"notifications/{int(time.time())}_{file.name}"
            file_path = default_storage.save(filename, file)

        notifs = [
            Notification(
                sender=request.user,
                recipient=r,
                title=title,
                message=message,
                notif_type=notif_type,
                file=file_path
            ) for r in all_recipients
        ]
        Notification.objects.bulk_create(notifs)

        return Response({
            "message": f"Notification sent to {len(notifs)} recipient(s).",
            "count":   len(notifs),
        })


class MyNotificationsView(APIView):
    """Any user: list own notifications"""
    def get(self, request):
        notifs = Notification.objects.filter(recipient=request.user)[:50]
        unread = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({
            "unread":        unread,
            "notifications": NotificationSerializer(notifs, many=True, context={"request": request}).data,
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
