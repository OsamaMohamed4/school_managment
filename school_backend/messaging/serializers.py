from rest_framework import serializers
from .models import Conversation, Message
from users.models import CustomUser


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    is_mine     = serializers.SerializerMethodField()

    class Meta:
        model  = Message
        fields = ["id","conversation","sender","sender_name","text","is_read","created_at","is_mine"]
        read_only_fields = ["id","sender","created_at","is_read"]

    def get_sender_name(self, obj): return obj.sender.get_full_name()
    def get_is_mine(self, obj):
        req = self.context.get("request")
        return req and obj.sender_id == req.user.id


class ConversationSerializer(serializers.ModelSerializer):
    participants     = serializers.SerializerMethodField()
    last_message     = serializers.SerializerMethodField()
    unread_count     = serializers.SerializerMethodField()
    other_user       = serializers.SerializerMethodField()

    class Meta:
        model  = Conversation
        fields = ["id","participants","other_user","last_message","unread_count","updated_at"]

    def get_participants(self, obj):
        return [{"id":p.id,"full_name":p.get_full_name(),"role":p.role} for p in obj.participants.all()]

    def get_other_user(self, obj):
        req = self.context.get("request")
        if not req: return None
        other = obj.participants.exclude(id=req.user.id).first()
        return {"id":other.id,"full_name":other.get_full_name(),"role":other.role} if other else None

    def get_last_message(self, obj):
        msg = obj.messages.last()
        return {"text":msg.text,"sender":msg.sender.get_full_name(),"created_at":str(msg.created_at)[:16]} if msg else None

    def get_unread_count(self, obj):
        req = self.context.get("request")
        return obj.messages.filter(is_read=False).exclude(sender=req.user).count() if req else 0
