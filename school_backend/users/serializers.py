from rest_framework import serializers
from .models import CustomUser, ParentProfile


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model  = CustomUser
        fields = ["id","email","username","first_name","last_name",
                  "full_name","role","is_active","date_joined"]
        read_only_fields = ["id","date_joined"]

    def get_full_name(self, obj):
        return obj.get_full_name()


class CreateUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model  = CustomUser
        fields = ["email","username","first_name","last_name","role","password"]

    def create(self, validated_data):
        pw = validated_data.pop("password")
        user = CustomUser(**validated_data)
        user.set_password(pw)
        user.save()
        return user


class ParentChildSerializer(serializers.ModelSerializer):
    """Used by Parent Portal — child basic info"""
    full_name = serializers.SerializerMethodField()
    class Meta:
        model  = CustomUser
        fields = ["id","full_name","email"]
    def get_full_name(self, obj):
        return obj.get_full_name()
