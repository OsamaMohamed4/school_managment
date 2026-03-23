from rest_framework import serializers
from .models import Assignment, Submission
from django.utils import timezone


class SubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    file_name    = serializers.SerializerMethodField()
    file_url     = serializers.SerializerMethodField()

    class Meta:
        model  = Submission
        fields = ["id","assignment","student","student_name","text",
                  "file","file_name","file_url",
                  "score","feedback","status","submitted_at"]
        read_only_fields = ["id","student","submitted_at"]
    def get_student_name(self, obj):
        return obj.student.get_full_name()

    def get_file_name(self, obj):
        if obj.file:
            return obj.file.name.split("/")[-1]
        return None

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class AssignmentSerializer(serializers.ModelSerializer):
    teacher_name     = serializers.SerializerMethodField()
    class_room_name  = serializers.SerializerMethodField()
    submission_count = serializers.SerializerMethodField()
    is_past_due      = serializers.SerializerMethodField()
    my_submission    = serializers.SerializerMethodField()

    class Meta:
        model  = Assignment
        fields = ["id","title","description","class_room","class_room_name",
                  "teacher","teacher_name","due_date","max_score","created_at",
                  "submission_count","is_past_due","my_submission"]
        read_only_fields = ["id","teacher","created_at"]

    def get_teacher_name(self, obj):    return obj.teacher.get_full_name()
    def get_class_room_name(self, obj): return obj.class_room.name
    def get_submission_count(self, obj):return obj.submissions.count()
    def get_is_past_due(self, obj):     return timezone.now() > obj.due_date
    def get_my_submission(self, obj):
        req = self.context.get("request")
        if not req or req.user.role != "student": return None
        sub = obj.submissions.filter(student=req.user).first()
        return SubmissionSerializer(sub).data if sub else None
