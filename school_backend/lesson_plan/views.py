from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import WeeklyPlan, DailyPlanEntry
from .serializers import WeeklyPlanSerializer, WeeklyPlanListSerializer, DailyPlanEntrySerializer
from academics.models import ClassRoom, ClassSubjectTeacher
from users.models import StudentProfile
from django.db.models import Q


def teacher_teaches_in_class(teacher, classroom):
    """Returns True if teacher is main teacher OR subject teacher in this class"""
    return (
        classroom.teacher_id == teacher.id or
        ClassSubjectTeacher.objects.filter(class_room=classroom, teacher=teacher).exists()
    )


class WeeklyPlanListCreateView(APIView):
    def get(self, request):
        role = request.user.role
        if role == "teacher":
            # Teacher sees only THEIR OWN plans (not other teachers')
            subject_class_ids = ClassSubjectTeacher.objects.filter(
                teacher=request.user
            ).values_list("class_room_id", flat=True)
            class_ids = list(ClassRoom.objects.filter(
                Q(teacher=request.user) | Q(id__in=subject_class_ids)
            ).values_list("id", flat=True))
            plans = WeeklyPlan.objects.filter(
                class_room_id__in=class_ids
            ).select_related("class_room__grade").order_by("-week_start")
        elif role == "student":
            sp = getattr(request.user, "student_profile", None)
            if not sp or not sp.class_room:
                return Response({"plans": []})
            plans = WeeklyPlan.objects.filter(
                class_room=sp.class_room
            ).select_related("class_room__grade").order_by("-week_start")
        elif role == "parent":
            from users.models import ParentProfile
            try:
                profile  = ParentProfile.objects.get(user=request.user)
                children = profile.children.all()
                class_ids = StudentProfile.objects.filter(
                    user__in=children
                ).values_list("class_room_id", flat=True)
                plans = WeeklyPlan.objects.filter(
                    class_room_id__in=class_ids
                ).select_related("class_room__grade").order_by("-week_start")
            except Exception:
                return Response({"plans": []})
        else:
            plans = WeeklyPlan.objects.select_related("class_room__grade").order_by("-week_start")

        return Response({"plans": WeeklyPlanListSerializer(plans, many=True).data})

    def post(self, request):
        if request.user.role != "teacher":
            return Response({"error": "Teachers only."}, status=403)

        class_id = request.data.get("class_room")
        if not class_id:
            return Response({"error": "class_room is required."}, status=400)

        classroom = get_object_or_404(ClassRoom, pk=class_id)

        # Any teacher who teaches in this class can create a plan
        if not teacher_teaches_in_class(request.user, classroom):
            return Response(
                {"error": "You don't teach in this class."},
                status=403
            )

        week_start = request.data.get("week_start")
        week_end   = request.data.get("week_end")
        notes      = request.data.get("notes", "")

        if not week_start or not week_end:
            return Response({"error": "week_start and week_end are required."}, status=400)

        if WeeklyPlan.objects.filter(class_room=classroom, week_start=week_start).exists():
            return Response(
                {"error": "A plan for this week already exists."},
                status=400
            )

        plan = WeeklyPlan.objects.create(
            class_room=classroom,
            created_by=request.user,
            week_start=week_start,
            week_end=week_end,
            notes=notes,
        )
        return Response(WeeklyPlanSerializer(plan).data, status=201)


class WeeklyPlanDetailView(APIView):
    def get(self, request, plan_id):
        plan = get_object_or_404(
            WeeklyPlan.objects.select_related("class_room__grade").prefetch_related("entries"),
            pk=plan_id
        )
        return Response(WeeklyPlanSerializer(plan).data)

    def patch(self, request, plan_id):
        plan = get_object_or_404(WeeklyPlan, pk=plan_id)
        # Any teacher of this class or admin can edit
        if request.user.role == "admin" or teacher_teaches_in_class(request.user, plan.class_room):
            plan.notes = request.data.get("notes", plan.notes)
            plan.save()
            return Response(WeeklyPlanSerializer(plan).data)
        return Response({"error": "Permission denied."}, status=403)

    def delete(self, request, plan_id):
        plan = get_object_or_404(WeeklyPlan, pk=plan_id)
        if request.user.role == "admin" or teacher_teaches_in_class(request.user, plan.class_room):
            plan.delete()
            return Response({"message": "Deleted."})
        return Response({"error": "Permission denied."}, status=403)


class DailyPlanEntryView(APIView):
    def post(self, request, plan_id):
        plan = get_object_or_404(WeeklyPlan, pk=plan_id)
        if not teacher_teaches_in_class(request.user, plan.class_room):
            return Response({"error": "Permission denied."}, status=403)
        serializer = DailyPlanEntrySerializer(data=request.data)
        if serializer.is_valid():
            last = plan.entries.filter(day=request.data.get("day")).count()
            serializer.save(plan=plan, order=last)
            plan.refresh_from_db()
            return Response(WeeklyPlanSerializer(plan).data, status=201)
        return Response(serializer.errors, status=400)

    def delete(self, request, plan_id):
        plan     = get_object_or_404(WeeklyPlan, pk=plan_id)
        entry_id = request.data.get("entry_id")
        if not teacher_teaches_in_class(request.user, plan.class_room):
            return Response({"error": "Permission denied."}, status=403)
        entry = get_object_or_404(DailyPlanEntry, pk=entry_id, plan=plan)
        entry.delete()
        plan.refresh_from_db()
        return Response(WeeklyPlanSerializer(plan).data)


class MyClassPlanView(APIView):
    def get(self, request):
        if request.user.role != "student":
            return Response({"error": "Students only."}, status=403)
        sp = getattr(request.user, "student_profile", None)
        if not sp or not sp.class_room:
            return Response({"error": "Not assigned to a class."}, status=404)
        plan = WeeklyPlan.objects.filter(
            class_room=sp.class_room
        ).prefetch_related("entries").order_by("-week_start").first()
        if not plan:
            return Response({"plan": None})
        return Response({"plan": WeeklyPlanSerializer(plan).data})


class IsAdvisorView(APIView):
    """Teacher: get all classes they teach in (for lesson plan creation)"""
    def get(self, request):
        if request.user.role != "teacher":
            return Response({"advising_classes": []})
        subject_class_ids = ClassSubjectTeacher.objects.filter(
            teacher=request.user
        ).values_list("class_room_id", flat=True)
        classes = ClassRoom.objects.filter(
            Q(teacher=request.user) | Q(id__in=subject_class_ids)
        ).distinct().select_related("grade")
        return Response({
            "advising_classes": [
                {"id": c.id, "name": c.name, "grade": c.grade.name}
                for c in classes
            ]
        })
