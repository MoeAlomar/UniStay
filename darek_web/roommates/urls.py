# roommates/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoommatePostViewSet, RoommateRequestViewSet, RoommateGroupViewSet

router = DefaultRouter()
router.register(r'posts', RoommatePostViewSet, basename='roommatepost')
router.register(r'requests', RoommateRequestViewSet, basename='roommaterequest')
router.register(r'groups', RoommateGroupViewSet, basename='roommategroup')

urlpatterns = [
    path('', include(router.urls)),
]