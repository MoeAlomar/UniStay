from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import serializers, parsers, status
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Listing, ListingImage
from .serializers import ListingSerializer, ListingImageSerializer
from .districts_listings import districts as DISTRICT_CHOICES
from django.shortcuts import get_object_or_404
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

MAX_IMAGES_PER_LISTING = 10
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

class ListingViewSet(ModelViewSet):
    queryset = Listing.objects.all()
    serializer_class = ListingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'female_only', 'roommates_allowed', 'type', 'student_discount', 'district']
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

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

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        listing = serializer.save(owner=request.user)

        # Handle multipart images: limit to MAX_IMAGES_PER_LISTING
        files = request.FILES.getlist('images')
        if files:
            if len(files) > MAX_IMAGES_PER_LISTING:
                return Response(
                    {"detail": f"Maximum {MAX_IMAGES_PER_LISTING} images allowed per listing."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            for f in files:
                # Basic validation: image content-type and size
                if getattr(f, 'size', 0) > MAX_IMAGE_SIZE_BYTES:
                    return Response({"detail": "Each image must be 5MB or less."}, status=status.HTTP_400_BAD_REQUEST)
                content_type = getattr(f, 'content_type', '') or ''
                if not content_type.startswith('image/'):
                    return Response({"detail": "All files must be images."}, status=status.HTTP_400_BAD_REQUEST)
                ListingImage.objects.create(listing=listing, image=f)

        headers = self.get_success_headers(serializer.data)
        # Return fresh listing with nested images (urls)
        data = self.get_serializer(listing).data
        return Response(data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.get('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        listing = serializer.save()

        # Append any new images provided in update
        files = request.FILES.getlist('images')
        if files:
            existing_count = ListingImage.objects.filter(listing=listing).count()
            if existing_count + len(files) > MAX_IMAGES_PER_LISTING:
                remaining = MAX_IMAGES_PER_LISTING - existing_count
                return Response(
                    {"detail": f"This listing already has {existing_count} images. You can add {remaining} more."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            for f in files:
                if getattr(f, 'size', 0) > MAX_IMAGE_SIZE_BYTES:
                    return Response({"detail": "Each image must be 5MB or less."}, status=status.HTTP_400_BAD_REQUEST)
                content_type = getattr(f, 'content_type', '') or ''
                if not content_type.startswith('image/'):
                    return Response({"detail": "All files must be images."}, status=status.HTTP_400_BAD_REQUEST)
                ListingImage.objects.create(listing=listing, image=f)

        # Return fresh listing with nested images
        data = self.get_serializer(listing).data
        return Response(data, status=status.HTTP_200_OK)

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


class ListingImageViewSet(ModelViewSet):
    queryset = ListingImage.objects.select_related("listing").all()
    serializer_class = ListingImageSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["listing"]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ListingImage.objects.none()
        # Landlords can see their own listing images; students can see images for AVAILABLE/RESERVED listings
        if user.role == 'landlord':
            return ListingImage.objects.filter(listing__owner=user)
        return ListingImage.objects.filter(listing__status__in=[Listing.Status.AVAILABLE, Listing.Status.RESERVED])

    def create(self, request, *args, **kwargs):
        # Accept single-image create: expect 'listing' id and 'image' file
        listing_id = request.data.get('listing')
        if not listing_id:
            raise serializers.ValidationError({"listing": "Listing is required"})
        listing = get_object_or_404(Listing, pk=listing_id)
        if request.user != listing.owner:
            raise PermissionDenied("You can only add images to your own listings.")

        existing_count = ListingImage.objects.filter(listing=listing).count()
        if existing_count >= MAX_IMAGES_PER_LISTING:
            raise serializers.ValidationError({"images": f"A listing can have at most {MAX_IMAGES_PER_LISTING} images."})

        image_file = request.FILES.get('image')
        if not image_file:
            raise serializers.ValidationError({"image": "Provide an image file under 'image'"})
        if getattr(image_file, 'size', 0) > MAX_IMAGE_SIZE_BYTES:
            raise serializers.ValidationError({"image": "Each image must be 5MB or less."})
        content_type = getattr(image_file, 'content_type', '') or ''
        if not content_type.startswith('image/'):
            raise serializers.ValidationError({"image": "File must be an image."})

        ListingImage.objects.create(listing=listing, image=image_file)
        # Return full listing with all images
        listing_data = ListingSerializer(listing, context={'request': request}).data
        return Response(listing_data, status=status.HTTP_201_CREATED)

    def perform_destroy(self, instance):
        # Ensure only the listing owner can delete images
        if self.request.user != instance.listing.owner:
            raise PermissionDenied("You can only delete images from your own listings.")
        instance.delete()

    @action(detail=False, methods=['post'], url_path='bulk-upload')
    def bulk_upload(self, request):
        user = request.user
        if not user.is_authenticated:
            raise PermissionDenied("Authentication required.")

        listing_id = request.data.get('listing')
        if not listing_id:
            raise serializers.ValidationError({"listing": "Listing is required"})
        listing = get_object_or_404(Listing, pk=listing_id)

        if user != listing.owner:
            raise PermissionDenied("You can only upload images to your own listings.")

        files = request.FILES.getlist('images')
        if not files:
            raise serializers.ValidationError({"images": "Provide one or more image files under 'images'"})
        if len(files) > MAX_IMAGES_PER_LISTING:
            raise serializers.ValidationError({"images": f"Upload up to {MAX_IMAGES_PER_LISTING} images per request."})

        existing_count = ListingImage.objects.filter(listing=listing).count()
        if existing_count + len(files) > MAX_IMAGES_PER_LISTING:
            remaining = MAX_IMAGES_PER_LISTING - existing_count
            raise serializers.ValidationError(
                {"images": f"This listing already has {existing_count} images. You can add {remaining} more."}
            )

        uploaded = []
        for f in files:
            if getattr(f, 'size', 0) > MAX_IMAGE_SIZE_BYTES:
                raise serializers.ValidationError({"images": "Each image must be 5MB or less."})
            content_type = getattr(f, 'content_type', '') or ''
            if not content_type.startswith('image/'):
                raise serializers.ValidationError({"images": "All files must be images."})
            ListingImage.objects.create(listing=listing, image=f)
            # We collect but will return full listing
            # uploaded.append(ListingImageSerializer(img, context={'request': request}).data)

        # Return fresh listing with nested image urls
        listing_data = ListingSerializer(listing, context={'request': request}).data
        return Response(listing_data, status=201)
