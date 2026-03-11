from rest_framework import serializers
from .models import Grade, ClassRoom


class StudentInClassSerializer(serializers.Serializer):
    """بيرجع بيانات الطالب الأساسية جوا الـ class"""
    id         = serializers.IntegerField()
    full_name  = serializers.SerializerMethodField()
    first_name = serializers.CharField()
    last_name  = serializers.CharField()
    email      = serializers.EmailField()

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"


class ClassRoomSerializer(serializers.ModelSerializer):
    student_count  = serializers.ReadOnlyField()
    teacher_name   = serializers.SerializerMethodField()
    grade_name     = serializers.SerializerMethodField()
    students_list  = serializers.SerializerMethodField()

    class Meta:
        model  = ClassRoom
        fields = ["id", "grade", "grade_name", "name", "subject",
                  "teacher", "teacher_name", "student_count",
                  "students_list", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_teacher_name(self, obj):
        return obj.teacher.get_full_name() if obj.teacher else None

    def get_grade_name(self, obj):
        return obj.grade.name

    def get_students_list(self, obj):
        # جيب الـ students من الـ StudentProfile
        students = [sp.user for sp in obj.students.select_related("user").all()]
        return [{"id": s.id, "first_name": s.first_name, "last_name": s.last_name,
                 "email": s.email, "full_name": s.get_full_name()} for s in students]


class GradeSerializer(serializers.ModelSerializer):
    classes        = ClassRoomSerializer(many=True, read_only=True)
    total_students = serializers.SerializerMethodField()

    class Meta:
        model  = Grade
        fields = ["id", "name", "classes", "total_students", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_total_students(self, obj):
        return sum(c.student_count for c in obj.classes.all())
