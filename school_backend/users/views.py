from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404

from .models import CustomUser, ParentProfile
from .serializers import UserSerializer, CreateUserSerializer, ParentChildSerializer
from .permissions import IsAdmin, IsParent
from quizzes.models import QuizAttempt
from attendance.models import AttendanceRecord


class LoginView(APIView):
    permission_classes = []  # public endpoint
    authentication_classes = []

    def post(self, request):
        email    = request.data.get("email", "").strip()
        password = request.data.get("password", "")

        if not email or not password:
            return Response({"error": "Email and password are required."}, status=400)

        # Try to find user by email directly (case-insensitive)
        try:
            user_obj = CustomUser.objects.get(email__iexact=email)
        except CustomUser.DoesNotExist:
            return Response({"error": "Invalid credentials."}, status=401)

        # Check password directly
        if not user_obj.check_password(password):
            return Response({"error": "Invalid credentials."}, status=401)

        if not user_obj.is_active:
            return Response({"error": "Account is inactive."}, status=403)

        refresh = RefreshToken.for_user(user_obj)
        return Response({
            "access":  str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id":         user_obj.id,
                "email":      user_obj.email,
                "first_name": user_obj.first_name,
                "last_name":  user_obj.last_name,
                "full_name":  user_obj.get_full_name(),
                "role":       user_obj.role,
            }
        })


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UserViewSet(ModelViewSet):
    permission_classes = [IsAdmin]
    queryset           = CustomUser.objects.all().order_by("-date_joined")
    serializer_class   = UserSerializer

    def get_serializer_class(self):
        if self.action == "create":
            return CreateUserSerializer
        return UserSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        role   = self.request.query_params.get("role")
        search = self.request.query_params.get("search")
        if role:   qs = qs.filter(role=role)
        if search: qs = qs.filter(first_name__icontains=search) | qs.filter(last_name__icontains=search) | qs.filter(email__icontains=search)
        return qs

    @action(detail=True, methods=["patch"], url_path="toggle-status")
    def toggle_status(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response({"id":user.id,"is_active":user.is_active,"message":f"User {'activated' if user.is_active else 'deactivated'}."})


# ── Parent Portal Views ───────────────────────────────────────

class ParentChildrenView(APIView):
    """Parent: list their children"""
    permission_classes = [IsParent]

    def get(self, request):
        profile, _ = ParentProfile.objects.get_or_create(user=request.user)
        children   = profile.children.all()
        return Response(ParentChildSerializer(children, many=True).data)


class ParentChildDetailView(APIView):
    """Parent: full report for one child"""
    permission_classes = [IsParent]

    def get(self, request, child_id):
        profile  = get_object_or_404(ParentProfile, user=request.user)
        child    = get_object_or_404(CustomUser, pk=child_id, role="student")
        if child not in profile.children.all():
            return Response({"error":"Not your child."}, status=403)

        # Attendance
        att_records = AttendanceRecord.objects.filter(student=child).order_by("-date")
        total   = att_records.count()
        present = att_records.filter(status="present").count()
        att_rate = round((present/total*100),1) if total else 0

        # Quizzes
        attempts = QuizAttempt.objects.filter(student=child).select_related("quiz")
        avg_score = 0
        if attempts.exists():
            avg_score = round(sum(a.percentage for a in attempts)/attempts.count(),1)

        # Class
        sp = getattr(child,"student_profile",None)
        class_info = None
        if sp and sp.class_room:
            class_info = {
                "id":   sp.class_room.id,
                "name": sp.class_room.name,
                "grade":sp.class_room.grade.name,
            }

        return Response({
            "child": ParentChildSerializer(child).data,
            "class_room": class_info,
            "attendance": {
                "rate":         att_rate,
                "total_days":   total,
                "present_days": present,
                "absent_days":  total - present,
                "records": [{"date":str(r.date),"status":r.status} for r in att_records[:20]],
            },
            "quizzes": {
                "avg_score":    avg_score,
                "total_taken":  attempts.count(),
                "attempts": [{
                    "quiz_title":   a.quiz.title,
                    "score":        a.score,
                    "total_points": a.total_points,
                    "percentage":   a.percentage,
                    "submitted_at": str(a.submitted_at)[:10],
                } for a in attempts],
            }
        })


class ParentLinkChildView(APIView):
    """Admin: link a student to a parent"""
    permission_classes = [IsAdmin]

    def post(self, request):
        parent_id = request.data.get("parent_id")
        child_id  = request.data.get("child_id")
        parent = get_object_or_404(CustomUser, pk=parent_id, role="parent")
        child  = get_object_or_404(CustomUser, pk=child_id,  role="student")
        profile, _ = ParentProfile.objects.get_or_create(user=parent)
        profile.children.add(child)
        return Response({"message": f"{child.get_full_name()} linked to {parent.get_full_name()}."})

    def delete(self, request):
        parent_id = request.data.get("parent_id")
        child_id  = request.data.get("child_id")
        parent = get_object_or_404(CustomUser, pk=parent_id, role="parent")
        child  = get_object_or_404(CustomUser, pk=child_id,  role="student")
        profile, _ = ParentProfile.objects.get_or_create(user=parent)
        profile.children.remove(child)
        return Response({"message": "Unlinked."})


class ProfileView(APIView):
    """GET/PATCH /api/auth/profile/ any authenticated user"""
    def get(self, request):
        u = request.user
        return Response({
            "id":         u.id,
            "email":      u.email,
            "first_name": u.first_name,
            "last_name":  u.last_name,
            "full_name":  u.get_full_name(),
            "role":       u.role,
            "date_joined":str(u.date_joined)[:10],
        })

    def patch(self, request):
        u = request.user
        u.first_name = request.data.get("first_name", u.first_name)
        u.last_name  = request.data.get("last_name",  u.last_name)
        u.save()
        return Response({"message": "Profile updated.", "full_name": u.get_full_name()})


class ChangePasswordView(APIView):
    def post(self, request):
        old = request.data.get("old_password","")
        new = request.data.get("new_password","")
        if not old or not new:
            return Response({"error":"Both fields required."}, status=400)
        if len(new) < 6:
            return Response({"error":"Password must be at least 6 characters."}, status=400)
        if not request.user.check_password(old):
            return Response({"error":"Current password is incorrect."}, status=400)
        request.user.set_password(new)
        request.user.save()
        return Response({"message":"Password changed successfully."})


class AdminParentChildrenView(APIView):
    """Admin: GET /api/auth/admin/parent/<parent_id>/children/"""
    permission_classes = [IsAdmin]

    def get(self, request, parent_id):
        parent     = get_object_or_404(CustomUser, pk=parent_id, role="parent")
        profile, _ = ParentProfile.objects.get_or_create(user=parent)
        children   = profile.children.all()
        result = []
        for c in children:
            sp  = getattr(c, "student_profile", None)
            cls = sp.class_room if sp else None
            result.append({
                "id":         c.id,
                "full_name":  c.get_full_name(),
                "email":      c.email,
                "is_active":  c.is_active,
                "class_name": cls.name if cls else None,
                "grade_name": cls.grade.name if cls else None,
            })
        return Response(result)
