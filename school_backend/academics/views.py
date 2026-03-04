from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Grade, ClassRoom
from .serializers import GradeSerializer, ClassRoomSerializer
from users.permissions import IsAdmin, IsAdminOrReadOnly, IsTeacher


class GradeViewSet(ModelViewSet):
    queryset         = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [IsAdmin]


class ClassRoomViewSet(ModelViewSet):
    queryset = ClassRoom.objects.select_related("grade", "teacher").all()
    serializer_class = ClassRoomSerializer
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=False, methods=["get"], url_path="my", permission_classes=[IsTeacher])
    def my_classes(self, request):
        classes = ClassRoom.objects.filter(teacher=request.user).select_related("grade")
        return Response(ClassRoomSerializer(classes, many=True).data)

    @action(detail=False, methods=["get"], url_path="mine")
    def my_class(self, request):
        if request.user.role != "student":
            return Response({"error": "Only students can access this."}, status=403)
        profile = getattr(request.user, "student_profile", None)
        if not profile or not profile.class_room:
            return Response({"error": "Not assigned to any class yet."}, status=404)
        return Response(ClassRoomSerializer(profile.class_room).data)