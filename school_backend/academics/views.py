from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import Grade, ClassRoom
from .serializers import GradeSerializer, ClassRoomSerializer
from users.models import CustomUser, StudentProfile, TeacherProfile
from users.permissions import IsAdmin, IsAdminOrReadOnly, IsTeacher


class GradeViewSet(ModelViewSet):
    queryset           = Grade.objects.all()
    serializer_class   = GradeSerializer
    permission_classes = [IsAdmin]


class ClassRoomViewSet(ModelViewSet):
    queryset           = ClassRoom.objects.select_related("grade", "teacher").all()
    serializer_class   = ClassRoomSerializer
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=False, methods=["get"], url_path="my",
            permission_classes=[IsTeacher])
    def my_classes(self, request):
        """Teacher: الـ classes اللي بيدرّسها"""
        classes = ClassRoom.objects.filter(
            teacher=request.user
        ).select_related("grade")
        return Response(ClassRoomSerializer(classes, many=True).data)

    @action(detail=False, methods=["get"], url_path="mine")
    def my_class(self, request):
        """Student: الـ class اللي فيها"""
        if request.user.role != "student":
            return Response({"error": "Only students can access this."}, status=403)
        profile = getattr(request.user, "student_profile", None)
        if not profile or not profile.class_room:
            return Response({"error": "Not assigned to any class yet."}, status=404)
        return Response(ClassRoomSerializer(profile.class_room).data)

    @action(detail=True, methods=["get"], url_path="students",
            permission_classes=[IsAdmin])
    def students(self, request, pk=None):
        """Admin: استعراض الطلاب في class معينة"""
        classroom = self.get_object()
        student_profiles = classroom.students.select_related("user").all()
        data = [{
            "id":         sp.user.id,
            "full_name":  sp.user.get_full_name(),
            "email":      sp.user.email,
            "is_active":  sp.user.is_active,
        } for sp in student_profiles]
        return Response({"class_room": str(classroom), "students": data, "count": len(data)})

    @action(detail=True, methods=["post"], url_path="assign-student",
            permission_classes=[IsAdmin])
    def assign_student(self, request, pk=None):
        """Admin: تعيين student لـ class"""
        classroom   = self.get_object()
        student_id  = request.data.get("student_id")
        if not student_id:
            return Response({"error": "student_id is required."}, status=400)
        student = get_object_or_404(CustomUser, pk=student_id, role="student")
        profile, _ = StudentProfile.objects.get_or_create(user=student)
        old_class   = profile.class_room
        profile.class_room = classroom
        profile.save()
        return Response({
            "message":   f"{student.get_full_name()} assigned to {classroom.name}",
            "old_class": str(old_class) if old_class else None,
            "new_class": str(classroom),
        })

    @action(detail=True, methods=["post"], url_path="remove-student",
            permission_classes=[IsAdmin])
    def remove_student(self, request, pk=None):
        """Admin: إزالة student من class"""
        student_id = request.data.get("student_id")
        student    = get_object_or_404(CustomUser, pk=student_id, role="student")
        profile    = get_object_or_404(StudentProfile, user=student)
        profile.class_room = None
        profile.save()
        return Response({"message": f"{student.get_full_name()} removed from class."})

    @action(detail=True, methods=["post"], url_path="assign-teacher",
            permission_classes=[IsAdmin])
    def assign_teacher(self, request, pk=None):
        """Admin: تعيين teacher لـ class"""
        classroom  = self.get_object()
        teacher_id = request.data.get("teacher_id")
        if not teacher_id:
            return Response({"error": "teacher_id is required."}, status=400)
        teacher = get_object_or_404(CustomUser, pk=teacher_id, role="teacher")
        classroom.teacher = teacher
        classroom.save()
        return Response({
            "message":      f"{teacher.get_full_name()} assigned to {classroom.name}",
            "class_room":   str(classroom),
            "teacher_name": teacher.get_full_name(),
        })


class TeachersListView(APIView):
    """Admin: قائمة كل الـ teachers"""
    permission_classes = [IsAdmin]

    def get(self, request):
        teachers = CustomUser.objects.filter(role="teacher", is_active=True)
        return Response([{
            "id":        t.id,
            "full_name": t.get_full_name(),
            "email":     t.email,
        } for t in teachers])


class UnassignedStudentsView(APIView):
    """Admin: الطلاب اللي مش متعيّنين لأي class"""
    permission_classes = [IsAdmin]

    def get(self, request):
        # الطلاب اللي عندهم profile بس class_room = None، أو مفيش profile
        assigned_ids = StudentProfile.objects.exclude(
            class_room=None
        ).values_list("user_id", flat=True)
        students = CustomUser.objects.filter(
            role="student", is_active=True
        ).exclude(id__in=assigned_ids)
        return Response([{
            "id":        s.id,
            "full_name": s.get_full_name(),
            "email":     s.email,
        } for s in students])
