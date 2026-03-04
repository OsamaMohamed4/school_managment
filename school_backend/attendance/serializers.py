from rest_framework import serializers
from .models import AttendanceRecord


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name   = serializers.SerializerMethodField()
    class_room_name = serializers.SerializerMethodField()

    class Meta:
        model  = AttendanceRecord
        fields = ["id", "student", "student_name", "class_room", "class_room_name",
                  "date", "status", "teacher", "created_at"]
        read_only_fields = ["id", "teacher", "created_at"]

    def get_student_name(self, obj):
        return obj.student.get_full_name()

    def get_class_room_name(self, obj):
        return str(obj.class_room)


class BulkAttendanceSerializer(serializers.Serializer):
    class_room = serializers.IntegerField()
    date       = serializers.DateField()
    records    = serializers.ListField(child=serializers.DictField())