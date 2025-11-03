# users/serializers.py (Improved)
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.utils import timezone
import re

User = get_user_model()

# IMPROVED: Custom Token Serializer - Adds role to claims (for client-side use without extra requests),
# updates last_login, includes user data and redirect_url in response.
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims to the token itself
        token['role'] = user.role
        return token

    def validate(self, attrs):
        # Normalize email to lowercase before authentication (email is the USERNAME_FIELD)
        username_field = getattr(self, 'username_field', 'email')
        if attrs.get(username_field):
            attrs[username_field] = attrs[username_field].lower()
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

# Your existing RegisterSerializer (minor improvement: added id to read_only_fields explicitly)
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
        # Always normalize to lowercase
        value_lower = (value or "").lower()
        role = self.initial_data.get("role")
        if role == "student" and not re.match(r".+\.edu\.sa$", value_lower):
            raise serializers.ValidationError(
                "Student emails must end with '.edu.sa'"
            )
        # Case-insensitive duplicate check
        if User.objects.filter(email__iexact=value_lower).exists():
            raise serializers.ValidationError("user with this email address already exists")
        return value_lower

    def validate_phone(self, value):
        # Allow null/blank; otherwise enforce 05XXXXXXXX format
        if value in (None, ""):
            return None
        if not re.fullmatch(r"05\d{8}", str(value)):
            raise serializers.ValidationError("Phone must start with 05 and be 10 digits")
        return value

    def create(self, validated_data):
        # Ensure email is stored lowercase
        if validated_data.get("email"):
            validated_data["email"] = validated_data["email"].lower()
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

# IMPROVED: UserSerializer - Added a computed field for local_time (assuming Asia/Riyadh from settings),
# but kept last_login as UTC for consistency. Use if frontend needs local display.
class UserSerializer(serializers.ModelSerializer):
    local_last_login = serializers.SerializerMethodField()  # Optional: Computed local time

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
            "local_last_login",  # Computed local time (e.g., Asia/Riyadh)
        )
        read_only_fields = ("id", "email", "role", "is_email_verified", "last_login", "local_last_login")

    def get_local_last_login(self, obj):
        if obj.last_login:
            # Convert to local timezone (from settings.TIME_ZONE = 'Asia/Riyadh')
            return obj.last_login.astimezone(timezone.get_current_timezone())
        return None
