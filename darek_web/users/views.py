# users/views.py (Improved)
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status, parsers
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import RegisterSerializer, UserSerializer, MyTokenObtainPairSerializer
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth.tokens import default_token_generator
from django.shortcuts import get_object_or_404

User = get_user_model()

# IMPROVED: Uses the custom serializer for login, which now includes role in token claims.
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# Your other views are fine; minor improvement: Added success status to VerifyEmailView responses.
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_object(self):
        return self.request.user

class VerifyEmailView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = get_object_or_404(User, pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"detail": "Invalid verification link."}, status=status.HTTP_400_BAD_REQUEST)

        if default_token_generator.check_token(user, token):
            user.is_email_verified = True
            user.save()
            return Response({"detail": "Email verified successfully."}, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)
