from rest_framework import serializers
from .models import TimetableSlot

class TimetableSlotSerializer(serializers.ModelSerializer):
    day_display = serializers.CharField(source="get_day_display", read_only=True)
    class Meta:
        model  = TimetableSlot
        fields = ["id","class_room","day","day_display","period",
                  "subject","teacher_name","start_time","end_time"]
