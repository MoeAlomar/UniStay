from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.db import IntegrityError
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

    def get_serializer_context(self):
        context = super().get_serializer_context()
        if self.action == 'reviews_for_listing':
            context['listing_id'] = self.kwargs.get('listing_id')
            context['target_type'] = Review.TargetType.LISTING
        elif self.action == 'reviews_for_user':
            context['user_id'] = self.kwargs.get('user_id')
            context['target_type'] = Review.TargetType.USER
        return context

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if self.action == 'my_reviews':
            return queryset.filter(author=user)
        elif self.action == 'reviews_for_user':
            user_id = self.kwargs.get('user_id')
            return queryset.filter(target_type=Review.TargetType.USER, target_user_id=user_id)
        elif self.action == 'reviews_for_listing':
            listing_id = self.kwargs.get('listing_id')
            return queryset.filter(target_type=Review.TargetType.LISTING, target_listing_id=listing_id)
        target_type = self.request.query_params.get('target_type')
        target_id = self.request.query_params.get('target_id')
        if target_type and target_id:
            if target_type == Review.TargetType.USER:
                queryset = queryset.filter(target_type=target_type, target_user_id=target_id)
            elif target_type == Review.TargetType.LISTING:
                queryset = queryset.filter(target_type=target_type, target_listing_id=target_id)
        return queryset

    def perform_create(self, serializer):
        try:
            serializer.save(author=self.request.user)
        except IntegrityError as e:
            # Handle any IntegrityError with a generic message
            raise ValidationError({"non_field_errors": ["A review for this target already exists."]})

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
        return self.list(request)

    @action(detail=False, methods=['get', 'post'], url_path='users/(?P<user_id>[^/.]+)')
    def reviews_for_user(self, request, user_id=None):
        try:
            User.objects.get(pk=user_id)
        except User.DoesNotExist:
            raise PermissionDenied("User not found.")
        if request.method == 'POST':
            mutable_data = request.data.copy()
            mutable_data['target_type'] = Review.TargetType.USER
            mutable_data['target_user'] = user_id
            serializer = self.get_serializer(data=mutable_data, context=self.get_serializer_context())
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=201, headers=headers)
        return self.list(request)

    @action(detail=False, methods=['get', 'post'], url_path='listings/(?P<listing_id>[^/.]+)')
    def reviews_for_listing(self, request, listing_id=None):
        try:
            Listing.objects.get(pk=listing_id)
        except Listing.DoesNotExist:
            raise PermissionDenied("Listing not found.")
        if request.method == 'POST':
            mutable_data = request.data.copy()
            mutable_data['target_type'] = Review.TargetType.LISTING
            serializer = self.get_serializer(data=mutable_data, context=self.get_serializer_context())
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=201, headers=headers)
        return self.list(request)