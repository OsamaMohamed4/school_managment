from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    file_url    = serializers.SerializerMethodField()

    class Meta:
        model  = Notification
        fields = ["id","sender","sender_name","recipient","title",
                  "message","file","file_url","notif_type","is_read","created_at"]
        read_only_fields = ["id","sender","created_at","is_read"]

    def get_sender_name(self, obj):
        return obj.sender.get_full_name() if obj.sender else "System"

    def get_file_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get("request")
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url
