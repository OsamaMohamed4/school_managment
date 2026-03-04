from rest_framework import serializers
from .models import CustomUser, StudentProfile, TeacherProfile


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    class_room_name = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'full_name', 'role', 'is_active', 'created_at', 'class_room_name'
        ]
        read_only_fields = ['id', 'created_at']

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_class_room_name(self, obj):
        if obj.role == 'student' and hasattr(obj, 'student_profile') and obj.student_profile.class_room:
            return str(obj.student_profile.class_room)
        return None


class CreateUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = CustomUser
        fields = ['email', 'username', 'first_name', 'last_name', 'role', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        # Auto-create profile based on role
        if user.role == 'student':
            StudentProfile.objects.create(user=user)
        elif user.role == 'teacher':
            TeacherProfile.objects.create(user=user)
        return user


class MeSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'role', 'is_active']

    def get_full_name(self, obj):
        return obj.get_full_name()