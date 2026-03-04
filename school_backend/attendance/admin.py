from django.contrib import admin
from .models import AttendanceRecord


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display  = ["student", "class_room", "date", "status", "teacher"]
    list_filter   = ["status", "date", "class_room"]
    search_fields = ["student__first_name", "student__last_name"]
    date_hierarchy = "date"