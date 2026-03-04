from rest_framework import serializers
from .models import Grade, ClassRoom


class ClassRoomSerializer(serializers.ModelSerializer):
    student_count = serializers.ReadOnlyField()
    teacher_name  = serializers.SerializerMethodField()
    grade_name    = serializers.SerializerMethodField()

    class Meta:
        model  = ClassRoom
        fields = ["id", "grade", "grade_name", "name", "subject",
                  "teacher", "teacher_name", "student_count", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_teacher_name(self, obj):
        return obj.teacher.get_full_name() if obj.teacher else None

    def get_grade_name(self, obj):
        return obj.grade.name


class GradeSerializer(serializers.ModelSerializer):
    classes       = ClassRoomSerializer(many=True, read_only=True)
    total_students = serializers.SerializerMethodField()

    class Meta:
        model  = Grade
        fields = ["id", "name", "classes", "total_students", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_total_students(self, obj):
        return sum(c.student_count for c in obj.classes.all())