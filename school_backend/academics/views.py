from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import Grade, ClassRoom, ClassSubjectTeacher
from .serializers import GradeSerializer, ClassRoomSerializer, SubjectTeacherSerializer
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
        """Teacher: كل الـ classes اللي بيدرّس فيها (سواء main teacher أو subject teacher)"""
        from django.db.models import Q
        # Classes where they are main teacher OR subject teacher
        class_ids_as_subject = ClassSubjectTeacher.objects.filter(
            teacher=request.user
        ).values_list("class_room_id", flat=True)

        classes = ClassRoom.objects.filter(
            Q(teacher=request.user) | Q(id__in=class_ids_as_subject)
        ).distinct().select_related("grade").prefetch_related("subject_teachers__teacher")

        # Add the subject this teacher teaches in each class
        result = []
        for cls in classes:
            data = ClassRoomSerializer(cls).data
            # Find which subjects this teacher teaches in this class
            my_subjects = ClassSubjectTeacher.objects.filter(
                class_room=cls, teacher=request.user
            ).values_list("subject", flat=True)
            data["my_subjects"] = list(my_subjects)
            result.append(data)
        return Response(result)

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


    @action(detail=True, methods=["post"], url_path="add-subject-teacher",
            permission_classes=[IsAdmin])
    def add_subject_teacher(self, request, pk=None):
        """Admin: إضافة مدرس لمادة معينة في الفصل"""
        classroom  = self.get_object()
        teacher_id = request.data.get("teacher_id")
        subject    = request.data.get("subject", "").strip()

        if not teacher_id or not subject:
            return Response({"error": "teacher_id and subject are required."}, status=400)

        teacher = get_object_or_404(CustomUser, pk=teacher_id, role="teacher")
        obj, created = ClassSubjectTeacher.objects.get_or_create(
            class_room=classroom,
            teacher=teacher,
            subject=subject,
        )
        if not created:
            return Response({"message": "Already assigned."})
        return Response({
            "message": f"{teacher.get_full_name()} assigned to teach {subject} in {classroom.name}",
            "id": obj.id,
        }, status=201)

    @action(detail=True, methods=["delete"], url_path="remove-subject-teacher",
            permission_classes=[IsAdmin])
    def remove_subject_teacher(self, request, pk=None):
        """Admin: إزالة مدرس من مادة في الفصل"""
        classroom       = self.get_object()
        subject_teacher_id = request.data.get("id")
        if not subject_teacher_id:
            return Response({"error": "id required."}, status=400)
        obj = get_object_or_404(ClassSubjectTeacher, pk=subject_teacher_id, class_room=classroom)
        obj.delete()
        return Response({"message": "Removed."})

    @action(detail=True, methods=["get"], url_path="subject-teachers",
            permission_classes=[IsAdmin])
    def get_subject_teachers(self, request, pk=None):
        """Admin: قائمة مدرسي المواد في الفصل"""
        classroom = self.get_object()
        sts = ClassSubjectTeacher.objects.filter(
            class_room=classroom
        ).select_related("teacher")
        return Response(SubjectTeacherSerializer(sts, many=True).data)

    @action(detail=True, methods=["post"], url_path="assign-advisor",
            permission_classes=[IsAdmin])
    def assign_advisor(self, request, pk=None):
        """Admin: تعيين Grade Advisor (رائد الفصل) لـ class"""
        classroom  = self.get_object()
        teacher_id = request.data.get("teacher_id")
        if teacher_id:
            advisor = get_object_or_404(CustomUser, pk=teacher_id, role="teacher")
            classroom.advisor = advisor
            classroom.save()
            return Response({
                "message":      f"{advisor.get_full_name()} assigned as advisor for {classroom.name}",
                "advisor_name": advisor.get_full_name(),
            })
        else:
            classroom.advisor = None
            classroom.save()
            return Response({"message": f"Advisor removed from {classroom.name}"})


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
