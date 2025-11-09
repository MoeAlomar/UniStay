# users/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, UserProfileView, VerifyEmailView, MyTokenObtainPairView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('me/', UserProfileView.as_view(), name='me'),
    # Point 'login/' to your new custom view
    path('login/', MyTokenObtainPairView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('verify/<uidb64>/<token>/', VerifyEmailView.as_view(), name='verify_email'),
]
