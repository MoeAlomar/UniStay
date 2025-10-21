from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReviewViewSet

router = DefaultRouter()
router.register(r'', ReviewViewSet, basename='review')

urlpatterns = [
    path('', include(router.urls)),
]

'''
URL Examples

All reviews: GET /reviews/
Filter by target: GET /reviews/?target_type=USER&target_id=2
My reviews (by me): GET /reviews/my/
Reviews of a user: GET /reviews/users/2/ (also POST to create)
Reviews of a listing: GET /reviews/listings/uuid-here/ (also POST to create)
Specific review: GET/PATCH/DELETE /reviews/<review_uuid>/
'''