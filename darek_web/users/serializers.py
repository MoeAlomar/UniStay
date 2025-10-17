from rest_framework import serializers
from django.contrib.auth import get_user_model
import re

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "password",
            "role",
            "gender",
            "phone",
            "is_email_verified",
        )
        read_only_fields = ("id", "is_email_verified",)

    def validate_email(self, value):
        role = self.initial_data.get("role")
        if role == "student" and not re.match(r".+\.edu\.sa$", value):
            raise serializers.ValidationError(
                "Student emails must end with '.edu.sa'"
            )
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "role",
            "gender",
            "phone",
            "is_email_verified",
        )
        read_only_fields = ("id", "email", "role", "is_email_verified",)  # Prevent changing email/role post-signup; adjust as needed