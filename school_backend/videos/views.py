from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Video
from .serializers import VideoSerializer
from academics.models import ClassRoom, ClassSubjectTeacher
from django.db.models import Q

MAX_VIDEO_SIZE   = 100 * 1024 * 1024  # 100MB
ALLOWED_VIDEO    = ["video/mp4","video/quicktime","video/x-msvideo",
                    "video/x-matroska","video/webm","video/mpeg"]


class VideoListCreateView(APIView):
    def get(self, request):
        role = request.user.role
        if role == "teacher":
            # Teacher sees videos they uploaded
            qs = Video.objects.filter(teacher=request.user).select_related("class_room","teacher")
        elif role == "student":
            sp = getattr(request.user, "student_profile", None)
            if not sp or not sp.class_room:
                return Response({"videos": []})
            qs = Video.objects.filter(class_room=sp.class_room).select_related("class_room","teacher")
        elif role == "parent":
            from users.models import ParentProfile, StudentProfile
            try:
                profile   = ParentProfile.objects.get(user=request.user)
                children  = profile.children.all()
                class_ids = StudentProfile.objects.filter(
                    user__in=children
                ).values_list("class_room_id", flat=True)
                qs = Video.objects.filter(class_room_id__in=class_ids).select_related("class_room","teacher")
            except Exception:
                return Response({"videos": []})
        else:
            qs = Video.objects.select_related("class_room","teacher").all()
        return Response({"videos": VideoSerializer(qs, many=True, context={"request":request}).data})

    def post(self, request):
        if request.user.role != "teacher":
            return Response({"error": "Teachers only."}, status=403)

        file = request.FILES.get("file")
        if not file:
            return Response({"error": "Video file required."}, status=400)
        if file.size > MAX_VIDEO_SIZE:
            return Response(
                {"error": f"File too large. Max 100MB. Your file: {round(file.size/1024/1024,1)}MB"},
                status=400
            )
        ct = getattr(file, "content_type", "")
        if ct and ct not in ALLOWED_VIDEO:
            return Response(
                {"error": "Invalid file type. Use MP4, MOV, AVI, MKV, or WebM."},
                status=400
            )

        class_id = request.data.get("class_room")
        if not class_id:
            return Response({"error": "class_room is required."}, status=400)

        classroom = get_object_or_404(ClassRoom, pk=class_id)

        # Verify teacher teaches in this class
        teaches_here = (
            classroom.teacher_id == request.user.id or
            ClassSubjectTeacher.objects.filter(class_room=classroom, teacher=request.user).exists()
        )
        if not teaches_here:
            return Response({"error": "You don't teach in this class."}, status=403)

        video = Video.objects.create(
            title       = request.data.get("title","Untitled Video"),
            description = request.data.get("description",""),
            subject     = request.data.get("subject",""),
            file        = file,
            class_room  = classroom,
            teacher     = request.user,
        )
        return Response(
            VideoSerializer(video, context={"request": request}).data,
            status=201
        )


class VideoDetailView(APIView):
    def delete(self, request, pk):
        video = get_object_or_404(Video, pk=pk)
        if video.teacher != request.user and request.user.role != "admin":
            return Response({"error": "Permission denied."}, status=403)
        video.file.delete(save=False)
        video.delete()
        return Response({"message": "Deleted."})
