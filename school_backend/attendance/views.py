from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Count, Q

from .models import AttendanceRecord
from .serializers import AttendanceRecordSerializer, BulkAttendanceSerializer
from academics.models import ClassRoom
from users.models import CustomUser
from users.permissions import IsTeacher, IsStudent, IsAdminOrTeacher


class AttendanceViewSet(ModelViewSet):
    queryset           = AttendanceRecord.objects.select_related("student", "class_room", "teacher").all()
    serializer_class   = AttendanceRecordSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsAdminOrTeacher()]
        return [IsTeacher()]

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)


class BulkAttendanceView(APIView):
    permission_classes = [IsTeacher]

    @transaction.atomic
    def post(self, request):
        serializer = BulkAttendanceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"error": serializer.errors}, status=400)

        data       = serializer.validated_data
        class_room = get_object_or_404(ClassRoom, pk=data["class_room"])
        date       = data["date"]
        records    = data["records"]

        created = updated = 0
        errors  = []

        for rec in records:
            try:
                _, was_created = AttendanceRecord.objects.update_or_create(
                    student_id=rec["student_id"],
                    class_room=class_room,
                    date=date,
                    defaults={"status": rec["status"], "teacher": request.user},
                )
                if was_created:
                    created += 1
                else:
                    updated += 1
            except Exception as e:
                errors.append({"student_id": rec["student_id"], "error": str(e)})

        return Response({
            "message":    f"Saved: {created} new, {updated} updated.",
            "date":       str(date),
            "class_room": str(class_room),
            "errors":     errors,
        })


class MyAttendanceView(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        records = AttendanceRecord.objects.filter(
            student=request.user
        ).select_related("class_room").order_by("-date")
        total   = records.count()
        present = records.filter(status="present").count()
        rate    = round((present / total * 100), 1) if total > 0 else 0
        return Response({
            "total_days":      total,
            "present_days":    present,
            "absent_days":     total - present,
            "attendance_rate": rate,
            "records":         AttendanceRecordSerializer(records[:30], many=True).data,
        })


class ClassAttendanceView(APIView):
    permission_classes = [IsAdminOrTeacher]

    def get(self, request, class_id):
        date = request.query_params.get("date")
        qs   = AttendanceRecord.objects.filter(
            class_room_id=class_id
        ).select_related("student")
        if date:
            qs = qs.filter(date=date)
        return Response(AttendanceRecordSerializer(qs, many=True).data)


class AttendanceReportView(APIView):
    """Teacher/Admin: full attendance report for a class"""
    permission_classes = [IsAdminOrTeacher]

    def get(self, request, class_id):
        classroom = get_object_or_404(ClassRoom, pk=class_id)

        # All records for this class
        records = AttendanceRecord.objects.filter(class_room=classroom)

        # Per-student summary
        students = CustomUser.objects.filter(
            student_profile__class_room=classroom
        ).distinct()

        student_stats = []
        for student in students:
            stu_records = records.filter(student=student)
            total   = stu_records.count()
            present = stu_records.filter(status="present").count()
            absent  = total - present
            rate    = round((present / total * 100), 1) if total > 0 else 0
            student_stats.append({
                "student_id":      student.id,
                "student_name":    student.get_full_name(),
                "email":           student.email,
                "total_days":      total,
                "present_days":    present,
                "absent_days":     absent,
                "attendance_rate": rate,
            })

        # Dates summary
        from itertools import groupby
        dated = records.order_by("date").values("date", "status").annotate(count=Count("id"))

        return Response({
            "class_room":    str(classroom),
            "total_students": len(student_stats),
            "student_stats": student_stats,
            "dated_summary": list(dated),
        })
