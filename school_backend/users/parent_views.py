from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import CustomUser, ParentProfile
from attendance.models import AttendanceRecord
from quizzes.models import QuizAttempt
from notifications.models import Notification
try:
    from assignments.models import Assignment, Submission
    HAS_ASSIGNMENTS = True
except ImportError:
    HAS_ASSIGNMENTS = False
try:
    from messaging.models import Conversation
    HAS_MESSAGING = True
except ImportError:
    HAS_MESSAGING = False


class ParentChildrenView(APIView):
    def get(self, request):
        if request.user.role != "parent":
            return Response({"error": "Parents only."}, status=403)
        try:
            profile  = request.user.parent_profile
            children = profile.children.all()
        except Exception:
            return Response({"children": []})
        result = []
        for child in children:
            sp  = getattr(child, "student_profile", None)
            cls = sp.class_room if sp else None
            att = AttendanceRecord.objects.filter(student=child)
            pres= att.filter(status="present").count()
            att_rate = round(pres/att.count()*100,1) if att.count() else 0
            attempts = QuizAttempt.objects.filter(student=child)
            quiz_avg = 0
            if attempts.exists():
                quiz_avg = round(sum(a.percentage for a in attempts)/attempts.count(),1)
            result.append({
                "id":         child.id,
                "full_name":  child.get_full_name(),
                "email":      child.email,
                "class_name": cls.name if cls else None,
                "grade_name": cls.grade.name if cls else None,
                "teacher":    cls.teacher.get_full_name() if cls and cls.teacher else None,
                "teacher_id": cls.teacher.id if cls and cls.teacher else None,
                "attendance_rate": att_rate,
                "quiz_avg":   quiz_avg,
                "total_quizzes": attempts.count(),
            })
        return Response({"children": result})


class ParentChildDetailView(APIView):
    def get(self, request, child_id):
        if request.user.role != "parent":
            return Response({"error": "Parents only."}, status=403)
        child = get_object_or_404(CustomUser, pk=child_id, role="student")
        sp    = getattr(child, "student_profile", None)
        cls   = sp.class_room if sp else None

        # Attendance
        att_records = AttendanceRecord.objects.filter(student=child).order_by("-date")[:30]
        attendance  = [{"date":str(r.date),"status":r.status} for r in att_records]
        att_all     = AttendanceRecord.objects.filter(student=child)
        pres        = att_all.filter(status="present").count()
        att_rate    = round(pres/att_all.count()*100,1) if att_all.count() else 0

        # Quizzes
        attempts = QuizAttempt.objects.filter(student=child).select_related("quiz").order_by("-submitted_at")
        quizzes  = [{"quiz_title":a.quiz.title,"score":a.score,"total_points":a.total_points,"percentage":a.percentage,"date":str(a.submitted_at)[:10]} for a in attempts]
        quiz_avg = round(sum(a.percentage for a in attempts)/attempts.count(),1) if attempts.count() else 0

        # Assignments
        assignment_data = []
        if HAS_ASSIGNMENTS and cls:
            for asgn in Assignment.objects.filter(class_room=cls):
                sub = Submission.objects.filter(assignment=asgn, student=child).first()
                assignment_data.append({
                    "title":    asgn.title,
                    "due_date": str(asgn.due_date)[:10],
                    "status":   sub.status if sub else "pending",
                    "score":    sub.score if sub else None,
                    "max_score":asgn.max_score,
                })

        return Response({
            "child": {
                "id":         child.id,
                "full_name":  child.get_full_name(),
                "email":      child.email,
                "class_name": cls.name if cls else None,
                "grade_name": cls.grade.name if cls else None,
                "teacher":    cls.teacher.get_full_name() if cls and cls.teacher else None,
                "teacher_id": cls.teacher.id if cls and cls.teacher else None,
            },
            "attendance_rate": att_rate,
            "attendance":      attendance,
            "quiz_avg":        quiz_avg,
            "quizzes":         quizzes,
            "assignments":     assignment_data,
        })


class ParentLinkChildView(APIView):
    def post(self, request):
        if request.user.role not in ("admin",):
            return Response({"error": "Admins only."}, status=403)
        parent_id = request.data.get("parent_id")
        child_id  = request.data.get("child_id")
        parent = get_object_or_404(CustomUser, pk=parent_id, role="parent")
        child  = get_object_or_404(CustomUser, pk=child_id,  role="student")
        profile, _ = ParentProfile.objects.get_or_create(user=parent)
        profile.children.add(child)
        return Response({"message": f"{child.get_full_name()} linked to {parent.get_full_name()}"})

    def delete(self, request):
        if request.user.role not in ("admin",):
            return Response({"error": "Admins only."}, status=403)
        parent_id = request.data.get("parent_id")
        child_id  = request.data.get("child_id")
        parent = get_object_or_404(CustomUser, pk=parent_id, role="parent")
        child  = get_object_or_404(CustomUser, pk=child_id,  role="student")
        try:
            parent.parent_profile.children.remove(child)
        except Exception:
            pass
        return Response({"message": "Unlinked."})
