from rest_framework.views import APIView
from rest_framework.response import Response
from users.permissions import IsAdmin
from users.models import CustomUser
from academics.models import ClassRoom, Grade
from attendance.models import AttendanceRecord
from quizzes.models import QuizAttempt, Quiz
from assignments.models import Assignment, Submission
from django.utils import timezone
from datetime import timedelta


class AnalyticsDashboardView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        now    = timezone.now()
        month_ago = now - timedelta(days=30)
        week_ago  = now - timedelta(days=7)

        # ── Users ──
        total_users    = CustomUser.objects.count()
        total_teachers = CustomUser.objects.filter(role="teacher").count()
        total_students = CustomUser.objects.filter(role="student").count()
        total_parents  = CustomUser.objects.filter(role="parent").count()
        new_users_week = CustomUser.objects.filter(date_joined__gte=week_ago).count()

        # ── Academics ──
        total_grades  = Grade.objects.count()
        total_classes = ClassRoom.objects.count()

        # ── Attendance ──
        att_total   = AttendanceRecord.objects.count()
        att_present = AttendanceRecord.objects.filter(status="present").count()
        att_rate    = round((att_present / att_total * 100), 1) if att_total else 0
        att_month   = AttendanceRecord.objects.filter(date__gte=month_ago.date())
        att_month_p = att_month.filter(status="present").count()
        att_month_rate = round((att_month_p / att_month.count() * 100), 1) if att_month.count() else 0

        # ── Quizzes ──
        total_quizzes  = Quiz.objects.count()
        total_attempts = QuizAttempt.objects.count()
        avg_quiz_score = 0
        if total_attempts:
            avg_quiz_score = round(
                sum(a.percentage for a in QuizAttempt.objects.all()) / total_attempts, 1
            )

        # ── Assignments ──
        total_assignments  = Assignment.objects.count()
        total_submissions  = Submission.objects.count()
        graded_submissions = Submission.objects.filter(status="graded").count()

        # ── Top performing classes ──
        class_stats = []
        for cls in ClassRoom.objects.prefetch_related("students")[:10]:
            students = CustomUser.objects.filter(student_profile__class_room=cls)
            if not students.exists():
                continue
            att   = AttendanceRecord.objects.filter(student__in=students)
            pres  = att.filter(status="present").count()
            rate  = round((pres / att.count() * 100), 1) if att.count() else 0
            attempts = QuizAttempt.objects.filter(student__in=students)
            q_avg = 0
            if attempts.exists():
                q_avg = round(sum(a.percentage for a in attempts) / attempts.count(), 1)
            class_stats.append({
                "class_name":      cls.name,
                "grade":           cls.grade.name,
                "student_count":   students.count(),
                "attendance_rate": rate,
                "quiz_avg":        q_avg,
            })

        # ── Monthly attendance trend (last 6 months) ──
        trend = []
        for i in range(5, -1, -1):
            d = now - timedelta(days=30 * i)
            m_start = d.replace(day=1).date()
            m_end   = (d.replace(day=28) + timedelta(days=4)).replace(day=1).date()
            records = AttendanceRecord.objects.filter(date__gte=m_start, date__lt=m_end)
            present = records.filter(status="present").count()
            total   = records.count()
            trend.append({
                "month": d.strftime("%b %Y"),
                "rate":  round((present / total * 100), 1) if total else 0,
                "total": total,
            })

        return Response({
            "users": {
                "total":    total_users,
                "teachers": total_teachers,
                "students": total_students,
                "parents":  total_parents,
                "new_this_week": new_users_week,
            },
            "academics": {
                "grades":  total_grades,
                "classes": total_classes,
            },
            "attendance": {
                "overall_rate":    att_rate,
                "monthly_rate":    att_month_rate,
                "total_records":   att_total,
            },
            "quizzes": {
                "total":      total_quizzes,
                "attempts":   total_attempts,
                "avg_score":  avg_quiz_score,
            },
            "assignments": {
                "total":   total_assignments,
                "submissions": total_submissions,
                "graded":  graded_submissions,
            },
            "top_classes":      class_stats[:5],
            "attendance_trend": trend,
        })
