# listings/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ListingViewSet, ListingImageViewSet

router = DefaultRouter()
# Register images FIRST to avoid '/listings/images/' being captured by '/listings/<pk>/'
router.register(r'images', ListingImageViewSet, basename='listing-image')
router.register(r'', ListingViewSet, basename='listing')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', ListingViewSet.as_view({'get': 'dashboard'}), name='dashboard'),
]
