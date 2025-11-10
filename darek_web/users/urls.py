# users/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    UserProfileView,
    VerifyEmailView,
    MyTokenObtainPairView,
    PublicUserView,
    UserByUsernameView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('me/', UserProfileView.as_view(), name='me'),
    path('<int:pk>/', PublicUserView.as_view(), name='user_detail'),
    path('by-username/<str:username>/', UserByUsernameView.as_view(), name='user_by_username'),
    # Point 'login/' to your new custom view
    path('login/', MyTokenObtainPairView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('verify/<uidb64>/<token>/', VerifyEmailView.as_view(), name='verify_email'),
]
