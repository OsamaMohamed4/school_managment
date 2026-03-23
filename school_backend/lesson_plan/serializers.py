from rest_framework import serializers
from .models import WeeklyPlan, DailyPlanEntry


class DailyPlanEntrySerializer(serializers.ModelSerializer):
    day_label = serializers.CharField(source="get_day_display", read_only=True)

    class Meta:
        model  = DailyPlanEntry
        fields = ["id", "day", "day_label", "subject", "classwork", "homework", "order"]


class WeeklyPlanSerializer(serializers.ModelSerializer):
    entries       = DailyPlanEntrySerializer(many=True, read_only=True)
    advisor_name  = serializers.SerializerMethodField()
    class_name    = serializers.SerializerMethodField()
    grade_name    = serializers.SerializerMethodField()

    class Meta:
        model  = WeeklyPlan
        fields = ["id", "class_room", "class_name", "grade_name",
                  "advisor", "advisor_name",
                  "week_start", "week_end", "notes",
                  "entries", "created_at", "updated_at"]
        read_only_fields = ["id", "advisor", "created_at", "updated_at"]

    def get_advisor_name(self, obj): return obj.advisor.get_full_name()
    def get_class_name(self, obj):   return obj.class_room.name
    def get_grade_name(self, obj):   return obj.class_room.grade.name


class WeeklyPlanListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list view (no entries)"""
    advisor_name = serializers.SerializerMethodField()
    class_name   = serializers.SerializerMethodField()
    grade_name   = serializers.SerializerMethodField()
    entry_count  = serializers.SerializerMethodField()

    class Meta:
        model  = WeeklyPlan
        fields = ["id", "class_room", "class_name", "grade_name",
                  "advisor_name", "week_start", "week_end",
                  "notes", "entry_count", "created_at"]

    def get_advisor_name(self, obj): return obj.advisor.get_full_name()
    def get_class_name(self, obj):   return obj.class_room.name
    def get_grade_name(self, obj):   return obj.class_room.grade.name
    def get_entry_count(self, obj):  return obj.entries.count()
