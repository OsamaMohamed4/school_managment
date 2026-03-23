from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from academics.models import ClassRoom
from users.permissions import IsAdmin, IsTeacher, IsAdminOrTeacher
from .models import TimetableSlot
from .serializers import TimetableSlotSerializer

DAYS = ["sun","mon","tue","wed","thu","fri","sat"]


def group_slots_by_day(slots):
    grouped = {}
    for d in DAYS:
        day_slots = slots.filter(day=d)
        if day_slots.exists():
            grouped[d] = TimetableSlotSerializer(day_slots, many=True).data
    return grouped


class TimetableView(APIView):
    """GET  /api/timetable/<class_id>/ — anyone authenticated
       POST /api/timetable/<class_id>/ — admin only"""

    def get(self, request, class_id):
        classroom = get_object_or_404(ClassRoom, pk=class_id)
        slots     = TimetableSlot.objects.filter(class_room=classroom)
        return Response({
            "class_room": classroom.name,
            "timetable":  group_slots_by_day(slots),
        })

    def post(self, request, class_id):
        if request.user.role != "admin":
            return Response({"error": "Only admins can edit the timetable."}, status=403)
        classroom = get_object_or_404(ClassRoom, pk=class_id)
        data = request.data.copy()
        data["class_room"] = classroom.id
        serializer = TimetableSlotSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class TimetableSlotDeleteView(APIView):
    def delete(self, request, slot_id):
        if request.user.role != "admin":
            return Response({"error": "Only admins can edit the timetable."}, status=403)
        slot = get_object_or_404(TimetableSlot, pk=slot_id)
        slot.delete()
        return Response({"message": "Deleted."})


class MyTimetableView(APIView):
    """Student: timetable of their class"""
    def get(self, request):
        sp = getattr(request.user, "student_profile", None)
        if not sp or not sp.class_room:
            return Response({"error": "Not assigned to a class."}, status=404)
        slots = TimetableSlot.objects.filter(class_room=sp.class_room)
        return Response({
            "class_room": sp.class_room.name,
            "timetable":  group_slots_by_day(slots),
        })


class MyTeacherTimetableView(APIView):
    """Teacher: timetable for all their classes"""
    def get(self, request):
        if request.user.role != "teacher":
            return Response({"error": "Teachers only."}, status=403)

        from django.db.models import Q
        from academics.models import ClassSubjectTeacher
        subject_class_ids = ClassSubjectTeacher.objects.filter(
            teacher=request.user
        ).values_list("class_room_id", flat=True)

        classes = ClassRoom.objects.filter(
            Q(teacher=request.user) | Q(id__in=subject_class_ids)
        ).distinct()

        result = []
        for cls in classes:
            slots = TimetableSlot.objects.filter(class_room=cls)
            result.append({
                "class_id":   cls.id,
                "class_name": cls.name,
                "grade":      cls.grade.name,
                "timetable":  group_slots_by_day(slots),
            })
        return Response({"classes": result})


class ClassTeachersView(APIView):
    """Admin: get teachers assigned to a specific class (for timetable slot creation)"""
    def get(self, request, class_id):
        if request.user.role != "admin":
            return Response({"error": "Admins only."}, status=403)
        from academics.models import ClassSubjectTeacher
        classroom = get_object_or_404(ClassRoom, pk=class_id)
        subject_teachers = ClassSubjectTeacher.objects.filter(
            class_room=classroom
        ).select_related("teacher")
        result = [
            {
                "id":          st.teacher.id,
                "full_name":   st.teacher.get_full_name(),
                "subject":     st.subject,
            }
            for st in subject_teachers
        ]
        # Also include main class teacher if set
        if classroom.teacher and not any(r["id"]==classroom.teacher.id for r in result):
            result.insert(0, {
                "id":        classroom.teacher.id,
                "full_name": classroom.teacher.get_full_name(),
                "subject":   "Main Teacher",
            })
        return Response({"teachers": result})
