from django.contrib import admin
from .models import Grade, ClassRoom


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ["name", "created_at"]


@admin.register(ClassRoom)
class ClassRoomAdmin(admin.ModelAdmin):
    list_display = ["name", "grade", "teacher", "subject", "student_count"]
    list_filter  = ["grade"]