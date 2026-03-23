from rest_framework import serializers
from .models import Video


class VideoSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    class_name   = serializers.SerializerMethodField()
    file_url     = serializers.SerializerMethodField()
    file_size_mb = serializers.ReadOnlyField()

    class Meta:
        model  = Video
        fields = ["id","title","description","file","file_url","file_size_mb",
                  "class_room","class_name","teacher","teacher_name",
                  "subject","created_at"]
        read_only_fields = ["id","teacher","created_at"]

    def get_teacher_name(self, obj): return obj.teacher.get_full_name()
    def get_class_name(self, obj):   return obj.class_room.name
    def get_file_url(self, obj):
        req = self.context.get("request")
        if obj.file:
            return req.build_absolute_uri(obj.file.url) if req else obj.file.url
        return None
