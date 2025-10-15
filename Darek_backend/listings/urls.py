# listings/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CampusViewSet, ListingViewSet, ReviewViewSet, RoommatePostViewSet

router = DefaultRouter()
router.register(r'campuses', CampusViewSet)
router.register(r'listings', ListingViewSet)
router.register(r'reviews', ReviewViewSet)
router.register(r'roommate-posts', RoommatePostViewSet)

urlpatterns = [
    path('', include(router.urls)),
]