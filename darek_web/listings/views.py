from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import serializers
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Listing
from .serializers import ListingSerializer
from .districts_listings import districts as DISTRICT_CHOICES

class ListingViewSet(ModelViewSet):
    queryset = Listing.objects.all()
    serializer_class = ListingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'female_only', 'roommates_allowed', 'type', 'student_discount', 'district']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Listing.objects.none()
        if user.role == 'landlord':
            return Listing.objects.filter(owner=user)
        return Listing.objects.filter(status__in=['AVAILABLE', 'RESERVED'])

    def get_permissions(self):
        user = self.request.user
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'change_status']:
            if not user.is_authenticated or user.role != 'landlord':
                raise PermissionDenied("Only landlords can perform this action.")
        elif self.action == 'dashboard':
            if not user.is_authenticated or user.role != 'landlord':
                raise PermissionDenied("Only landlords can access the dashboard.")
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        if self.request.user != self.get_object().owner:
            raise PermissionDenied("You can only update your own listings.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user != instance.owner:
            raise PermissionDenied("You can only delete your own listings.")
        instance.delete()

    @action(detail=False, methods=['get'], url_path='dashboard')
    def dashboard(self, request):
        user = request.user
        if not user.is_authenticated or user.role != 'landlord':
            raise PermissionDenied("Only landlords can access the dashboard.")
        listings = Listing.objects.filter(owner=user)
        serializer = self.get_serializer(listings, many=True)
        total_listings = listings.count()
        reserved = listings.filter(status=Listing.Status.RESERVED).count()
        available = listings.filter(status=Listing.Status.AVAILABLE).count()
        draft = listings.filter(status=Listing.Status.DRAFT).count()
        return Response({
            'role': 'landlord',
            'total_listings': total_listings,
            'reserved': reserved,
            'available': available,
            'draft': draft,
            'listings': serializer.data,
            'message': 'Manage your listings'
        })

    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        user = request.user
        if not user.is_authenticated:
            raise PermissionDenied("Authentication required.")
        query = request.query_params.get('q', '')
        if user.role == 'landlord':
            queryset = Listing.objects.filter(owner=user)
        else:
            queryset = Listing.objects.filter(status__in=['AVAILABLE', 'RESERVED'])
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query) |
                Q(description__icontains=query) |
                Q(district__icontains=query)
            )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='change-status')
    def change_status(self, request, pk=None):
        user = request.user
        if not user.is_authenticated or user.role != 'landlord':
            raise PermissionDenied("Only landlords can change listing status.")
        listing = self.get_object()
        new_status = request.data.get('status')
        valid_statuses = [choice[0] for choice in Listing.Status.choices]
        if new_status not in valid_statuses:
            raise serializers.ValidationError(f"Status must be one of {valid_statuses}.")
        # Enforce verification/draft rules:
        # - If ID & deed are zeros (unverified), only DRAFT is allowed
        # - If verified (non-zeros), only AVAILABLE or RESERVED are allowed
        is_unverified = (
            listing.owner_identification_id == '0000000000' or listing.deed_number == '0000000000'
        )
        if is_unverified and new_status != Listing.Status.DRAFT:
            raise serializers.ValidationError(
                "Unverified listings must remain DRAFT until a valid deed and ID are provided."
            )
        if not is_unverified and new_status not in (Listing.Status.AVAILABLE, Listing.Status.RESERVED):
            raise serializers.ValidationError(
                "Verified listings can only be set to AVAILABLE or RESERVED."
            )

        listing.status = new_status
        listing.save()
        serializer = self.get_serializer(listing)
        return Response(serializer.data)

    def get_filterset_class(self):
        from django_filters import rest_framework as filters

        class ListingFilter(filters.FilterSet):
            max_price = filters.NumberFilter(field_name='price', lookup_expr='lte')
            district = filters.CharFilter(field_name='district', lookup_expr='exact')

            class Meta:
                model = Listing
                fields = ['status', 'female_only', 'roommates_allowed', 'type', 'student_discount', 'max_price', 'district']

        return ListingFilter

    @action(detail=False, methods=['get'], url_path='districts')
    def districts(self, request):
        # Return the sorted display labels for districts (legacy for simple UIs)
        labels = sorted([label for value, label in DISTRICT_CHOICES], key=lambda s: s.lower())
        return Response(labels)

    @action(detail=False, methods=['get'], url_path='district-options')
    def district_options(self, request):
        """Return district choices as value/label pairs for forms."""
        options = [{"value": value, "label": label} for value, label in DISTRICT_CHOICES]
        options = sorted(options, key=lambda o: o["label"].lower())
        return Response(options)
