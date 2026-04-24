from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import Grade, ClassRoom, ClassSubjectTeacher, LessonPlan
from .serializers import GradeSerializer, ClassRoomSerializer, SubjectTeacherSerializer, LessonPlanSerializer
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
        
        if request.user.role != "student":
            return Response({"error": "Only students can access this."}, status=403)
        profile = getattr(request.user, "student_profile", None)
        if not profile or not profile.class_room:
            return Response({"error": "Not assigned to any class yet."}, status=404)
        return Response(ClassRoomSerializer(profile.class_room).data)

    @action(detail=True, methods=["get"], url_path="students",
            permission_classes=[IsAdmin])
    def students(self, request, pk=None):
        
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
        classroom  = self.get_object()
        teacher_id = request.data.get("teacher_id")
        if not teacher_id:
            return Response({"error": "teacher_id is required."}, status=400)
        teacher = get_object_or_404(CustomUser, pk=teacher_id, role="teacher")
        
        
        if classroom.teacher and classroom.teacher_id != teacher.id:
            from timetable.models import TimetableSlot
            TimetableSlot.objects.filter(
                class_room=classroom,
                teacher_name=classroom.teacher.get_full_name()
            ).delete()
        
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
        classroom = self.get_object()
        subject_teacher_id = request.data.get("id")
        if not subject_teacher_id:
            return Response({"error": "id required."}, status=400)
        obj = get_object_or_404(ClassSubjectTeacher, pk=subject_teacher_id, class_room=classroom)
        
        
        from timetable.models import TimetableSlot
        TimetableSlot.objects.filter(
            class_room=classroom,
            teacher_name=obj.teacher.get_full_name()
        ).delete()
        
        obj.delete()
        return Response({"message": "Removed."})

    @action(detail=True, methods=["get"], url_path="subject-teachers",
            permission_classes=[IsAdmin])
    def get_subject_teachers(self, request, pk=None):
        
        classroom = self.get_object()
        sts = ClassSubjectTeacher.objects.filter(
            class_room=classroom
        ).select_related("teacher")
        return Response(SubjectTeacherSerializer(sts, many=True).data)



class TeachersListView(APIView):
    
    permission_classes = [IsAdmin]

    def get(self, request):
        teachers = CustomUser.objects.filter(role="teacher", is_active=True)
        return Response([{
            "id":        t.id,
            "full_name": t.get_full_name(),
            "email":     t.email,
        } for t in teachers])


class UnassignedStudentsView(APIView):
    
    permission_classes = [IsAdmin]

    def get(self, request):
        
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


DAYS_ORDER = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]


class LessonPlanView(APIView):
    """
    GET  /api/lesson-plans/?class_id=X&week=YYYY-MM-DD
    POST /api/lesson-plans/   (any teacher who teaches in this class)
    """

    def get(self, request):
        class_id   = request.query_params.get("class_id")
        week_start = request.query_params.get("week")

        qs = LessonPlan.objects.select_related("teacher", "class_room__grade")

        # Build the list of classes this teacher is allowed to see
        if request.user.role == "teacher":
            from django.db.models import Q
            subject_class_ids = ClassSubjectTeacher.objects.filter(
                teacher=request.user
            ).values_list("class_room_id", flat=True)

            allowed_class_ids = list(
                ClassRoom.objects.filter(
                    Q(teacher=request.user) | Q(id__in=subject_class_ids)
                ).distinct().values_list("id", flat=True)
            )

        if class_id:
            # If teacher, verify they teach in this class
            if request.user.role == "teacher":
                if int(class_id) not in allowed_class_ids:
                    return Response(
                        {"error": "You do not teach in this class."},
                        status=403
                    )
            qs = qs.filter(class_room_id=class_id)
        elif request.user.role == "teacher":
            qs = qs.filter(class_room_id__in=allowed_class_ids)

        elif request.user.role == "student":
            profile = getattr(request.user, "student_profile", None)
            if profile and profile.class_room:
                qs = qs.filter(class_room=profile.class_room)
            else:
                return Response({"week_start": week_start, "days": [], "flat": []})
        elif request.user.role == "parent":
            from users.models import ParentProfile
            try:
                profile = ParentProfile.objects.get(user=request.user)
                class_ids = []
                for child in profile.children.all():
                    sp = getattr(child, "student_profile", None)
                    if sp and sp.class_room:
                        class_ids.append(sp.class_room.id)
                qs = qs.filter(class_room_id__in=class_ids)
            except Exception:
                return Response({"week_start": week_start, "days": [], "flat": []})
        elif request.user.role == "admin":
            pass # Admin can see all, filtered by class_id above if provided

        if week_start:
            qs = qs.filter(week_start=week_start)

        data = LessonPlanSerializer(qs, many=True).data

        # Group by day
        grouped = {}
        for item in data:
            d = item["day"]
            if d not in grouped:
                grouped[d] = {
                    "day": d,
                    "day_display": item["day_display"],
                    "entries": []
                }
            grouped[d]["entries"].append(item)

        days = [grouped[d] for d in DAYS_ORDER if d in grouped]
        return Response({"week_start": week_start, "days": days, "flat": data})

    def post(self, request):
        if request.user.role != "teacher":
            return Response({"error": "Only teachers can add lesson plans."}, status=403)

        class_id = request.data.get("class_room")
        if not class_id:
            return Response({"error": "class_room is required."}, status=400)

        classroom = get_object_or_404(ClassRoom, pk=class_id)

        # Check teacher teaches in this class (main teacher OR subject teacher)
        is_main_teacher    = classroom.teacher_id == request.user.id
        is_subject_teacher = ClassSubjectTeacher.objects.filter(
            class_room=classroom, teacher=request.user
        ).exists()

        if not is_main_teacher and not is_subject_teacher:
            return Response(
                {"error": "You do not teach in this class."},
                status=403
            )

        ser = LessonPlanSerializer(data=request.data)
        if ser.is_valid():
            ser.save(teacher=request.user)
            return Response(ser.data, status=201)
        return Response(ser.errors, status=400)


class LessonPlanDetailView(APIView):
    """
    PATCH/DELETE /api/lesson-plans/<pk>/
    Teacher can edit/delete only their own entries. Admin can edit all.
    """

    def _get(self, pk, user):
        obj = get_object_or_404(LessonPlan, pk=pk)
        if obj.teacher_id != user.id and user.role != "admin":
            return None
        return obj

    def patch(self, request, pk):
        obj = self._get(pk, request.user)
        if not obj:
            return Response({"error": "Not allowed."}, status=403)
        ser = LessonPlanSerializer(obj, data=request.data, partial=True)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=400)

    def delete(self, request, pk):
        obj = self._get(pk, request.user)
        if not obj:
            return Response({"error": "Not allowed."}, status=403)
        obj.delete()
        return Response(status=204)
