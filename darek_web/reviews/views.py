from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Review
from .serializers import ReviewSerializer
from users.models import User
from listings.models import Listing

class ReviewViewSet(ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['target_type', 'rating']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        # Public: All reviews visible, but filter based on action
        if self.action == 'my_reviews':
            return queryset.filter(author=user)
        elif self.action == 'reviews_for_user':
            user_id = self.kwargs.get('user_id')
            return queryset.filter(target_type=Review.TargetType.USER, target_user_id=user_id)
        elif self.action == 'reviews_for_listing':
            listing_id = self.kwargs.get('listing_id')
            return queryset.filter(target_type=Review.TargetType.LISTING, target_listing_id=listing_id)
        # General list: Filter by query params if provided
        target_type = self.request.query_params.get('target_type')
        target_id = self.request.query_params.get('target_id')
        if target_type and target_id:
            if target_type == Review.TargetType.USER:
                queryset = queryset.filter(target_type=target_type, target_user_id=target_id)
            elif target_type == Review.TargetType.LISTING:
                queryset = queryset.filter(target_type=target_type, target_listing_id=target_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        if self.request.user != self.get_object().author:
            raise PermissionDenied("You can only update your own reviews.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user != instance.author:
            raise PermissionDenied("You can only delete your own reviews.")
        instance.delete()

    @action(detail=False, methods=['get'], url_path='my')
    def my_reviews(self, request):
        """Get reviews written by the current user."""
        return self.list(request)

    @action(detail=False, methods=['get', 'post'], url_path='users/(?P<user_id>[^/.]+)')
    def reviews_for_user(self, request, user_id=None):
        """Get or create reviews for a specific user."""
        try:
            User.objects.get(pk=user_id)  # Validate user exists
        except User.DoesNotExist:
            raise PermissionDenied("User not found.")
        if request.method == 'POST':
            request.data['target_type'] = Review.TargetType.USER
            request.data['target_user'] = user_id
            return self.create(request)
        return self.list(request)

    @action(detail=False, methods=['get', 'post'], url_path='listings/(?P<listing_id>[^/.]+)')
    def reviews_for_listing(self, request, listing_id=None):
        """Get or create reviews for a specific listing."""
        try:
            Listing.objects.get(pk=listing_id)  # Validate listing exists
        except Listing.DoesNotExist:
            raise PermissionDenied("Listing not found.")
        if request.method == 'POST':
            request.data['target_type'] = Review.TargetType.LISTING
            request.data['target_listing'] = listing_id
            return self.create(request)
        return self.list(request)