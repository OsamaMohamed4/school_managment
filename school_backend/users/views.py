from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404

from .models import CustomUser
from .serializers import UserSerializer, CreateUserSerializer, MeSerializer
from .permissions import IsAdmin


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email    = request.data.get("email", "").strip().lower()
        password = request.data.get("password", "")

        if not email or not password:
            return Response({"error": "Email and password are required."}, status=400)

        user = authenticate(request, username=email, password=password)

        if user is None:
            return Response({"error": "Invalid email or password."}, status=401)

        if not user.is_active:
            return Response({"error": "Your account has been deactivated."}, status=403)

        refresh = RefreshToken.for_user(user)
        return Response({
            "access":  str(refresh.access_token),
            "refresh": str(refresh),
            "user":    MeSerializer(user).data,
        })


class MeView(APIView):
    def get(self, request):
        return Response(MeSerializer(request.user).data)


class UserViewSet(ModelViewSet):
    queryset = CustomUser.objects.all().order_by("-created_at")
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.action == "create":
            return CreateUserSerializer
        return UserSerializer

    def get_queryset(self):
        qs     = super().get_queryset()
        role   = self.request.query_params.get("role")
        search = self.request.query_params.get("search")
        if role:
            qs = qs.filter(role=role)
        if search:
            qs = qs.filter(first_name__icontains=search) | qs.filter(last_name__icontains=search) | qs.filter(email__icontains=search)
        return qs

    @action(detail=True, methods=["patch"], url_path="toggle-status")
    def toggle_status(self, request, pk=None):
        user = get_object_or_404(CustomUser, pk=pk)
        if user == request.user:
            return Response({"error": "Cannot deactivate your own account."}, status=400)
        user.is_active = not user.is_active
        user.save()
        return Response({
            "id":        user.id,
            "is_active": user.is_active,
            "message":   f"User {'activated' if user.is_active else 'deactivated'} successfully.",
        })