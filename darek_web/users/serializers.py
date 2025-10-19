from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.utils import timezone
import re

User = get_user_model()


# NEW SERIALIZER: This customizes the JWT login process.
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # The default validate method handles user authentication
        data = super().validate(attrs)

        # Manually update the last_login field for the user
        self.user.last_login = timezone.now()
        self.user.save(update_fields=['last_login'])

        # Add user data and a redirect URL to the login response
        user_serializer = UserSerializer(self.user)
        data['user'] = user_serializer.data
        data['redirect_url'] = '/listings/dashboard/' if self.user.role == 'landlord' else '/home/'

        return data


# Your existing RegisterSerializer (no changes needed)
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


# UPDATED SERIALIZER: Now includes the local time field.
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
            "last_login",  # The original UTC time from the database
        )
        read_only_fields = ("id", "email", "role","gender", "is_email_verified",)

