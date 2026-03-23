from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Assignment, Submission
from .serializers import AssignmentSerializer, SubmissionSerializer
from academics.models import ClassRoom

MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_TYPES   = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg","image/png","image/gif","image/webp","text/plain",
]


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
    """Student submits — text and/or file (max 50MB)"""
    def post(self, request, pk):
        if request.user.role != "student":
            return Response({"error":"Students only."}, status=403)
        assignment = get_object_or_404(Assignment, pk=pk)
        if Submission.objects.filter(assignment=assignment, student=request.user).exists():
            return Response({"error":"Already submitted."}, status=400)

        text = request.data.get("text","").strip()
        file = request.FILES.get("file")

        if not text and not file:
            return Response({"error":"Submit text or attach a file."}, status=400)

        if file:
            if file.size > MAX_UPLOAD_SIZE:
                return Response({"error":f"File too large. Max 50MB (yours: {round(file.size/1024/1024,1)}MB)"}, status=400)
            ct = getattr(file,"content_type","")
            if ct and ct not in ALLOWED_TYPES:
                return Response({"error":"File type not allowed. Use PDF, Word, or image."}, status=400)

        sub_status = "late" if timezone.now() > assignment.due_date else "submitted"
        sub = Submission.objects.create(
            assignment=assignment, student=request.user,
            text=text, file=file, status=sub_status,
        )
        return Response(SubmissionSerializer(sub, context={"request":request}).data, status=201)


class GradeSubmissionView(APIView):
    def patch(self, request, sub_id):
        sub = get_object_or_404(Submission, pk=sub_id)
        if request.user.role not in ("teacher","admin"):
            return Response({"error":"Permission denied."}, status=403)
        score = request.data.get("score")
        if score is not None:
            sub.score    = score
            sub.feedback = request.data.get("feedback","")
            sub.status   = "graded"
            sub.save()
        return Response(SubmissionSerializer(sub, context={"request":request}).data)


class AssignmentSubmissionsView(APIView):
    def get(self, request, pk):
        assignment = get_object_or_404(Assignment, pk=pk)
        if request.user.role not in ("teacher","admin"):
            return Response({"error":"Permission denied."}, status=403)
        subs = assignment.submissions.select_related("student")
        return Response({
            "assignment":  AssignmentSerializer(assignment, context={"request":request}).data,
            "submissions": SubmissionSerializer(subs, many=True, context={"request":request}).data,
        })


class MySubmissionsView(APIView):
    def get(self, request):
        subs = Submission.objects.filter(student=request.user).select_related("assignment")
        return Response(SubmissionSerializer(subs, many=True, context={"request":request}).data)
