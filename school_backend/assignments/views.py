from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Assignment, Submission
from .serializers import AssignmentSerializer, SubmissionSerializer
from academics.models import ClassRoom


class AssignmentListCreateView(APIView):
    def get(self, request):
        role = request.user.role
        if role == "teacher":
            qs = Assignment.objects.filter(teacher=request.user)
        elif role == "student":
            sp = getattr(request.user, "student_profile", None)
            qs = Assignment.objects.filter(class_room=sp.class_room) if sp and sp.class_room else Assignment.objects.none()
        elif role == "admin":
            class_id = request.query_params.get("class_id")
            qs = Assignment.objects.filter(class_room_id=class_id) if class_id else Assignment.objects.all()
        else:
            qs = Assignment.objects.none()
        return Response(AssignmentSerializer(qs, many=True, context={"request":request}).data)

    def post(self, request):
        if request.user.role not in ("teacher","admin"):
            return Response({"error":"Permission denied."}, status=403)
        s = AssignmentSerializer(data=request.data, context={"request":request})
        if s.is_valid():
            s.save(teacher=request.user)
            return Response(s.data, status=201)
        return Response(s.errors, status=400)


class AssignmentDetailView(APIView):
    def get(self, request, pk):
        a = get_object_or_404(Assignment, pk=pk)
        return Response(AssignmentSerializer(a, context={"request":request}).data)

    def delete(self, request, pk):
        a = get_object_or_404(Assignment, pk=pk)
        if request.user != a.teacher and request.user.role != "admin":
            return Response({"error":"Permission denied."}, status=403)
        a.delete()
        return Response({"message":"Deleted."})


class SubmitAssignmentView(APIView):
    """Student submits an assignment"""
    def post(self, request, pk):
        if request.user.role != "student":
            return Response({"error":"Students only."}, status=403)
        assignment = get_object_or_404(Assignment, pk=pk)
        text = request.data.get("text","").strip()
        if not text:
            return Response({"error":"Submission text required."}, status=400)
        if Submission.objects.filter(assignment=assignment, student=request.user).exists():
            return Response({"error":"Already submitted."}, status=400)
        status = "late" if timezone.now() > assignment.due_date else "submitted"
        sub = Submission.objects.create(assignment=assignment, student=request.user, text=text, status=status)
        return Response(SubmissionSerializer(sub).data, status=201)


class GradeSubmissionView(APIView):
    """Teacher grades a submission"""
    def patch(self, request, sub_id):
        sub = get_object_or_404(Submission, pk=sub_id)
        if request.user.role not in ("teacher","admin"):
            return Response({"error":"Permission denied."}, status=403)
        score    = request.data.get("score")
        feedback = request.data.get("feedback","")
        if score is not None:
            sub.score    = score
            sub.feedback = feedback
            sub.status   = "graded"
            sub.save()
        return Response(SubmissionSerializer(sub).data)


class AssignmentSubmissionsView(APIView):
    """Teacher: see all submissions for an assignment"""
    def get(self, request, pk):
        assignment = get_object_or_404(Assignment, pk=pk)
        if request.user.role not in ("teacher","admin"):
            return Response({"error":"Permission denied."}, status=403)
        subs = assignment.submissions.select_related("student")
        return Response({
            "assignment": AssignmentSerializer(assignment, context={"request":request}).data,
            "submissions": SubmissionSerializer(subs, many=True).data,
        })


class MySubmissionsView(APIView):
    """Student: all their submissions"""
    def get(self, request):
        subs = Submission.objects.filter(student=request.user).select_related("assignment")
        return Response(SubmissionSerializer(subs, many=True).data)
