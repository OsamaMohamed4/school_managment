from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model  = Notification
        fields = ["id","sender","sender_name","recipient","title",
                  "message","notif_type","is_read","created_at"]
        read_only_fields = ["id","sender","created_at","is_read"]

    def get_sender_name(self, obj):
        return obj.sender.get_full_name() if obj.sender else "System"
