from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from users.models import CustomUser


class ConversationListView(APIView):
    def get(self, request):
        convs = request.user.conversations.prefetch_related("participants","messages").all()
        return Response(ConversationSerializer(convs, many=True, context={"request":request}).data)

    def post(self, request):
        """Start or get existing conversation with another user"""
        other_id = request.data.get("user_id")
        other    = get_object_or_404(CustomUser, pk=other_id)
        # Check if conversation already exists
        existing = request.user.conversations.filter(participants=other).first()
        if existing:
            return Response(ConversationSerializer(existing, context={"request":request}).data)
        conv = Conversation.objects.create()
        conv.participants.add(request.user, other)
        return Response(ConversationSerializer(conv, context={"request":request}).data, status=201)


class ConversationDetailView(APIView):
    def get(self, request, conv_id):
        conv = get_object_or_404(Conversation, pk=conv_id, participants=request.user)
        # Mark messages as read
        conv.messages.exclude(sender=request.user).update(is_read=True)
        msgs = conv.messages.select_related("sender")
        return Response({
            "conversation": ConversationSerializer(conv, context={"request":request}).data,
            "messages": MessageSerializer(msgs, many=True, context={"request":request}).data,
        })

    def post(self, request, conv_id):
        """Send a message"""
        conv = get_object_or_404(Conversation, pk=conv_id, participants=request.user)
        text = request.data.get("text","").strip()
        if not text:
            return Response({"error":"Message text required."}, status=400)
        msg = Message.objects.create(conversation=conv, sender=request.user, text=text)
        conv.save()  # update updated_at
        return Response(MessageSerializer(msg, context={"request":request}).data, status=201)


class ContactsView(APIView):
    """List users the current user can message"""
    def get(self, request):
        role = request.user.role
        if role == "teacher":
            # Teacher can message their students
            from academics.models import ClassRoom
            classes = ClassRoom.objects.filter(teacher=request.user)
            from users.models import CustomUser
            students = CustomUser.objects.filter(student_profile__class_room__in=classes, is_active=True)
            result = [{"id":s.id,"full_name":s.get_full_name(),"role":s.role} for s in students]
        elif role == "student":
            # Student can message their teacher
            sp = getattr(request.user, "student_profile", None)
            result = []
            if sp and sp.class_room and sp.class_room.teacher:
                t = sp.class_room.teacher
                result = [{"id":t.id,"full_name":t.get_full_name(),"role":t.role}]
        elif role == "admin":
            users = CustomUser.objects.exclude(id=request.user.id).filter(is_active=True)
            result = [{"id":u.id,"full_name":u.get_full_name(),"role":u.role} for u in users]
        elif role == "parent":
            # Parent can message the teachers of their linked children
            from users.models import ParentProfile
            result = []
            seen_ids = set()
            try:
                profile = ParentProfile.objects.get(user=request.user)
                for child in profile.children.filter(is_active=True):
                    sp = getattr(child, "student_profile", None)
                    if sp and sp.class_room and sp.class_room.teacher:
                        t = sp.class_room.teacher
                        if t.id not in seen_ids:
                            seen_ids.add(t.id)
                            result.append({
                                "id":        t.id,
                                "full_name": t.get_full_name(),
                                "role":      t.role,
                                "note":      f"Teacher of {child.get_full_name()}",
                            })
            except ParentProfile.DoesNotExist:
                pass
        else:
            result = []
        return Response(result)


class UnreadCountView(APIView):
    def get(self, request):
        count = Message.objects.filter(
            conversation__participants=request.user,
            is_read=False
        ).exclude(sender=request.user).count()
        return Response({"unread": count})