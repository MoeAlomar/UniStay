# users/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, UserViewSet

router = DefaultRouter()
router.register(r'', UserViewSet, basename='user')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('', include(router.urls)),
]