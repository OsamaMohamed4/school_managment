from rest_framework import serializers
from .models import Grade, ClassRoom, ClassSubjectTeacher, LessonPlan, DAYS


class SubjectTeacherSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    class Meta:
        model  = ClassSubjectTeacher
        fields = ["id", "teacher", "teacher_name", "subject"]
    def get_teacher_name(self, obj): return obj.teacher.get_full_name()


class ClassRoomSerializer(serializers.ModelSerializer):
    student_count    = serializers.ReadOnlyField()
    teacher_name     = serializers.SerializerMethodField()
    grade_name       = serializers.SerializerMethodField()
    students_list    = serializers.SerializerMethodField()
    subject_teachers = SubjectTeacherSerializer(many=True, read_only=True)

    class Meta:
        model  = ClassRoom
        fields = ["id", "grade", "grade_name", "name", "subject",
                  "teacher", "teacher_name",
                  "student_count", "students_list",
                  "subject_teachers", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_teacher_name(self, obj):  return obj.teacher.get_full_name() if obj.teacher else None
    def get_grade_name(self, obj):    return obj.grade.name
    def get_students_list(self, obj):
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


class LessonPlanSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    day_display  = serializers.SerializerMethodField()
    class_name   = serializers.SerializerMethodField()

    class Meta:
        model  = LessonPlan
        fields = [
            "id", "class_room", "class_name",
            "teacher", "teacher_name",
            "week_start", "day", "day_display",
            "subject", "classwork", "homework", "order",
        ]
        read_only_fields = ["id", "teacher", "teacher_name", "class_name", "day_display"]

    def get_teacher_name(self, obj):
        return obj.teacher.get_full_name()

    def get_day_display(self, obj):
        return dict(DAYS).get(obj.day, obj.day)

    def get_class_name(self, obj):
        return f"{obj.class_room.grade.name} - {obj.class_room.name}"
