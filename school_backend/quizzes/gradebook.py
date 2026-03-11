from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from users.permissions import IsAdmin
from users.models import CustomUser
from academics.models import ClassRoom, Grade
from .models import QuizAttempt
from attendance.models import AttendanceRecord


class GradeBookView(APIView):
    """Admin: full grade book — all students with quiz avg + attendance rate"""
    permission_classes = [IsAdmin]

    def get(self, request):
        class_id = request.query_params.get("class_id")
        grade_id = request.query_params.get("grade_id")

        students_qs = CustomUser.objects.filter(role="student", is_active=True)

        if class_id:
            students_qs = students_qs.filter(student_profile__class_room_id=class_id)
        elif grade_id:
            students_qs = students_qs.filter(student_profile__class_room__grade_id=grade_id)

        result = []
        for student in students_qs.select_related("student_profile__class_room__grade"):
            sp = getattr(student,"student_profile",None)

            # Attendance
            att = AttendanceRecord.objects.filter(student=student)
            total   = att.count()
            present = att.filter(status="present").count()
            att_rate = round((present/total*100),1) if total else 0

            # Quizzes
            attempts = QuizAttempt.objects.filter(student=student)
            avg_quiz = 0
            if attempts.exists():
                avg_quiz = round(sum(a.percentage for a in attempts)/attempts.count(),1)

            result.append({
                "student_id":      student.id,
                "student_name":    student.get_full_name(),
                "email":           student.email,
                "class_room":      sp.class_room.name if sp and sp.class_room else None,
                "grade":           sp.class_room.grade.name if sp and sp.class_room else None,
                "attendance_rate": att_rate,
                "quiz_avg":        avg_quiz,
                "quizzes_taken":   attempts.count(),
                "present_days":    present,
                "total_days":      total,
            })

        # Sort by grade then class then name
        result.sort(key=lambda x: (x["grade"] or "","", x["student_name"]))

        return Response({
            "count":   len(result),
            "students": result,
        })
