# listings/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ListingViewSet

router = DefaultRouter()
router.register(r'', ListingViewSet, basename='listing')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', ListingViewSet.as_view({'get': 'dashboard'}), name='dashboard'),
]