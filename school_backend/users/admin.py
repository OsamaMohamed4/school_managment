from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, StudentProfile, TeacherProfile, ParentProfile

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display  = ["email","first_name","last_name","role","is_active"]
    list_filter   = ["role","is_active"]
    search_fields = ["email","first_name","last_name"]
    ordering      = ["-date_joined"]
    fieldsets     = UserAdmin.fieldsets + (("Role", {"fields": ("role",)}),)

admin.register(StudentProfile)(admin.ModelAdmin)
admin.register(TeacherProfile)(admin.ModelAdmin)
admin.register(ParentProfile)(admin.ModelAdmin)
