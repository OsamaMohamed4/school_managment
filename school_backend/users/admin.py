from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, StudentProfile, TeacherProfile


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display   = ["email", "full_name", "role", "is_active", "created_at"]
    list_filter    = ["role", "is_active"]
    search_fields  = ["email", "first_name", "last_name"]
    ordering       = ["-created_at"]
    fieldsets      = UserAdmin.fieldsets + (
        ("Role & Status", {"fields": ("role",)}),
    )


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "class_room", "enrollment_date"]


@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "subject"]
