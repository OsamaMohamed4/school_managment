from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import WeeklyPlan, DailyPlanEntry
from .serializers import WeeklyPlanSerializer, WeeklyPlanListSerializer, DailyPlanEntrySerializer
from academics.models import ClassRoom
from users.models import StudentProfile


class WeeklyPlanListCreateView(APIView):
    """
    GET  — advisor sees their plans / student sees their class plan / admin sees all
    POST — advisor creates a new weekly plan
    """
    def get(self, request):
        role = request.user.role
        if role == "teacher":
            # Show plans for classes where this teacher is advisor
            plans = WeeklyPlan.objects.filter(
                advisor=request.user
            ).select_related("class_room__grade").order_by("-week_start")
        elif role == "student":
            sp = getattr(request.user, "student_profile", None)
            if not sp or not sp.class_room:
                return Response({"plans": []})
            plans = WeeklyPlan.objects.filter(
                class_room=sp.class_room
            ).select_related("class_room__grade").order_by("-week_start")
        elif role == "parent":
            # Parent sees plans for all linked children classes
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
            # Admin sees all
            plans = WeeklyPlan.objects.select_related(
                "class_room__grade"
            ).order_by("-week_start")

        return Response({"plans": WeeklyPlanListSerializer(plans, many=True).data})

    def post(self, request):
        if request.user.role != "teacher":
            return Response({"error": "Teachers only."}, status=403)

        class_id = request.data.get("class_room")
        if not class_id:
            return Response({"error": "class_room is required."}, status=400)

        classroom = get_object_or_404(ClassRoom, pk=class_id)

        # Only advisor of this class can create
        if classroom.advisor_id != request.user.id:
            return Response(
                {"error": "You are not the advisor (رائد الفصل) of this class."},
                status=403
            )

        week_start = request.data.get("week_start")
        week_end   = request.data.get("week_end")
        notes      = request.data.get("notes", "")

        if not week_start or not week_end:
            return Response({"error": "week_start and week_end are required."}, status=400)

        if WeeklyPlan.objects.filter(class_room=classroom, week_start=week_start).exists():
            return Response(
                {"error": "A plan for this week already exists. Edit it instead."},
                status=400
            )

        plan = WeeklyPlan.objects.create(
            class_room=classroom,
            advisor=request.user,
            week_start=week_start,
            week_end=week_end,
            notes=notes,
        )
        return Response(WeeklyPlanSerializer(plan).data, status=201)


class WeeklyPlanDetailView(APIView):
    """GET / DELETE a specific weekly plan"""

    def get(self, request, plan_id):
        plan = get_object_or_404(
            WeeklyPlan.objects.select_related("class_room__grade").prefetch_related("entries"),
            pk=plan_id
        )
        return Response(WeeklyPlanSerializer(plan).data)

    def patch(self, request, plan_id):
        plan = get_object_or_404(WeeklyPlan, pk=plan_id)
        if plan.advisor_id != request.user.id and request.user.role != "admin":
            return Response({"error": "Permission denied."}, status=403)
        plan.notes = request.data.get("notes", plan.notes)
        plan.save()
        return Response(WeeklyPlanSerializer(plan).data)

    def delete(self, request, plan_id):
        plan = get_object_or_404(WeeklyPlan, pk=plan_id)
        if plan.advisor_id != request.user.id and request.user.role != "admin":
            return Response({"error": "Permission denied."}, status=403)
        plan.delete()
        return Response({"message": "Deleted."})


class DailyPlanEntryView(APIView):
    """
    POST   — add entry to a plan
    DELETE — remove entry from plan
    """

    def post(self, request, plan_id):
        plan = get_object_or_404(WeeklyPlan, pk=plan_id)
        if plan.advisor_id != request.user.id:
            return Response({"error": "Permission denied."}, status=403)

        serializer = DailyPlanEntrySerializer(data=request.data)
        if serializer.is_valid():
            # Auto-set order
            last = plan.entries.filter(day=request.data.get("day")).count()
            serializer.save(plan=plan, order=last)
            # Return full plan
            plan.refresh_from_db()
            return Response(WeeklyPlanSerializer(plan).data, status=201)
        return Response(serializer.errors, status=400)

    def delete(self, request, plan_id):
        plan     = get_object_or_404(WeeklyPlan, pk=plan_id)
        entry_id = request.data.get("entry_id")
        if plan.advisor_id != request.user.id:
            return Response({"error": "Permission denied."}, status=403)
        entry = get_object_or_404(DailyPlanEntry, pk=entry_id, plan=plan)
        entry.delete()
        plan.refresh_from_db()
        return Response(WeeklyPlanSerializer(plan).data)


class MyClassPlanView(APIView):
    """Student: get latest weekly plan for their class"""
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
    """Teacher: check which classes they are advisor for"""
    def get(self, request):
        if request.user.role != "teacher":
            return Response({"advising_classes": []})
        classes = ClassRoom.objects.filter(
            advisor=request.user
        ).select_related("grade")
        return Response({
            "advising_classes": [
                {"id": c.id, "name": c.name, "grade": c.grade.name}
                for c in classes
            ]
        })
