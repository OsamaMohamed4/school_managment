from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from academics.models import ClassRoom
from users.permissions import IsAdmin, IsTeacher, IsAdminOrTeacher
from .models import TimetableSlot
from .serializers import TimetableSlotSerializer


class TimetableView(APIView):
    """GET /api/timetable/<class_id>/  — anyone authenticated
       POST same URL                   — admin or teacher"""

    def get(self, request, class_id):
        classroom = get_object_or_404(ClassRoom, pk=class_id)
        slots     = TimetableSlot.objects.filter(class_room=classroom)
        # Group by day
        days = ["mon","tue","wed","thu","fri","sat"]
        grouped = {}
        for d in days:
            day_slots = slots.filter(day=d)
            if day_slots.exists():
                grouped[d] = TimetableSlotSerializer(day_slots, many=True).data
        return Response({"class_room": classroom.name, "timetable": grouped})

    def post(self, request, class_id):
        if not (request.user.role in ("admin","teacher")):
            return Response({"error":"Permission denied."}, status=403)
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
        if not (request.user.role in ("admin","teacher")):
            return Response({"error":"Permission denied."}, status=403)
        slot = get_object_or_404(TimetableSlot, pk=slot_id)
        slot.delete()
        return Response({"message":"Deleted."})


class MyTimetableView(APIView):
    """Student: timetable of their class"""
    def get(self, request):
        sp = getattr(request.user, "student_profile", None)
        if not sp or not sp.class_room:
            return Response({"error":"Not assigned to a class."}, status=404)
        slots = TimetableSlot.objects.filter(class_room=sp.class_room)
        days  = ["mon","tue","wed","thu","fri","sat"]
        grouped = {}
        for d in days:
            day_slots = slots.filter(day=d)
            if day_slots.exists():
                grouped[d] = TimetableSlotSerializer(day_slots, many=True).data
        return Response({"class_room": sp.class_room.name, "timetable": grouped})
