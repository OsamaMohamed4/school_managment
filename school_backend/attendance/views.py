from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction

from .models import AttendanceRecord
from .serializers import AttendanceRecordSerializer, BulkAttendanceSerializer
from academics.models import ClassRoom
from users.permissions import IsTeacher, IsStudent, IsAdminOrTeacher


class AttendanceViewSet(ModelViewSet):
    queryset = AttendanceRecord.objects.select_related("student", "class_room", "teacher").all()
    serializer_class = AttendanceRecordSerializer

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
        serializer.is_valid(raise_exception=True)

        class_room = get_object_or_404(ClassRoom, pk=serializer.validated_data["class_room"])
        date    = serializer.validated_data["date"]
        records = serializer.validated_data["records"]

        created = updated = 0
        for rec in records:
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

        return Response({"message": f"Saved: {created} new, {updated} updated.", "date": str(date)})


class MyAttendanceView(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        records = AttendanceRecord.objects.filter(student=request.user).select_related("class_room")
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
        qs   = AttendanceRecord.objects.filter(class_room_id=class_id).select_related("student")
        if date:
            qs = qs.filter(date=date)
        return Response(AttendanceRecordSerializer(qs, many=True).data)