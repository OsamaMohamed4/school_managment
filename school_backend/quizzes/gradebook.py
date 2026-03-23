from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Avg, Count, Case, When, FloatField, F, ExpressionWrapper

from users.permissions import IsAdmin
from users.models import CustomUser
from academics.models import ClassRoom, Grade
from .models import QuizAttempt
from attendance.models import AttendanceRecord


class GradeBookView(APIView):
    """Admin: full grade book — optimized with bulk queries (no N+1)"""
    permission_classes = [IsAdmin]

    def get(self, request):
        class_id = request.query_params.get("class_id")
        grade_id = request.query_params.get("grade_id")

        students_qs = CustomUser.objects.filter(
            role="student", is_active=True
        ).select_related("student_profile__class_room__grade")

        if class_id:
            students_qs = students_qs.filter(student_profile__class_room_id=class_id)
        elif grade_id:
            students_qs = students_qs.filter(student_profile__class_room__grade_id=grade_id)

        student_ids = list(students_qs.values_list("id", flat=True))

        if not student_ids:
            return Response({"count": 0, "students": []})

        # ── Bulk attendance query (1 query for all students) ──
        att_data = AttendanceRecord.objects.filter(
            student_id__in=student_ids
        ).values("student_id").annotate(
            total=Count("id"),
            present=Count(Case(When(status="present", then=1)))
        )
        att_map = {r["student_id"]: r for r in att_data}

        # ── Bulk quiz query (1 query for all students) ──
        quiz_data = QuizAttempt.objects.filter(
            student_id__in=student_ids, total_points__gt=0
        ).values("student_id").annotate(
            taken=Count("id"),
            avg=Avg(ExpressionWrapper(
                F("score") * 100.0 / F("total_points"),
                output_field=FloatField()
            ))
        )
        quiz_map = {r["student_id"]: r for r in quiz_data}

        # ── Build result ──
        result = []
        for student in students_qs:
            sp  = getattr(student, "student_profile", None)
            att = att_map.get(student.id, {"total": 0, "present": 0})
            qz  = quiz_map.get(student.id, {"taken": 0, "avg": None})

            total   = att["total"]
            present = att["present"]
            att_rate = round((present / total * 100), 1) if total else 0
            avg_quiz = round(qz["avg"] or 0, 1)

            result.append({
                "student_id":      student.id,
                "student_name":    student.get_full_name(),
                "email":           student.email,
                "class_room":      sp.class_room.name if sp and sp.class_room else None,
                "grade":           sp.class_room.grade.name if sp and sp.class_room else None,
                "attendance_rate": att_rate,
                "quiz_avg":        avg_quiz,
                "quizzes_taken":   qz["taken"],
                "present_days":    present,
                "total_days":      total,
            })

        result.sort(key=lambda x: (x["grade"] or "", x["class_room"] or "", x["student_name"]))

        return Response({
            "count":    len(result),
            "students": result,
        })
