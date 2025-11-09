from rest_framework import serializers
from .models import Review
from users.models import User
from users.serializers import UserSerializer
from listings.models import Listing
from listings.serializers import ListingSerializer

class ReviewSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    # Make target_user writable by PK, and expose nested detail separately
    target_user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
        allow_null=True
    )
    target_user_detail = UserSerializer(source='target_user', read_only=True)
    target_listing = serializers.PrimaryKeyRelatedField(
        queryset=Listing.objects.all(),
        required=False,
        allow_null=True
    )
    target_listing_detail = ListingSerializer(source='target_listing', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'author', 'target_user', 'target_user_detail', 'target_listing', 'target_listing_detail', 'target_type',
            'rating', 'comment', 'created_at'
        ]
        read_only_fields = ['id', 'author', 'created_at', 'target_user_detail', 'target_listing_detail']

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate(self, data):
        request = self.context['request']
        # For updates (PATCH), derive target_type and targets from instance when not provided
        instance = getattr(self, 'instance', None)
        target_type = (
            data.get('target_type')
            or self.context.get('target_type')
            or (instance.target_type if instance else None)
        )
        if not target_type:
            raise serializers.ValidationError({"target_type": "This field is required."})

        target_user = data.get('target_user') or (instance.target_user if instance else None)
        target_listing = data.get('target_listing') or (instance.target_listing if instance else None)

        # Handle LISTING reviews
        if target_type == Review.TargetType.LISTING:
            listing_id = self.context.get('listing_id')
            if listing_id and not target_listing:
                try:
                    target_listing = Listing.objects.get(pk=listing_id)
                    data['target_listing'] = target_listing
                except Listing.DoesNotExist:
                    raise serializers.ValidationError({"target_listing": "Listing does not exist."})
                except ValueError:
                    raise serializers.ValidationError({"target_listing": "Invalid listing ID format."})

            if not target_listing:
                raise serializers.ValidationError({"target_listing": "Required for LISTING reviews."})
            if target_user:
                raise serializers.ValidationError({"target_user": "Must be null for LISTING reviews."})
            # Prevent owners from reviewing their own listings
            try:
                owner = getattr(target_listing, 'owner', None)
                if owner and owner == request.user:
                    raise serializers.ValidationError({"non_field_errors": ["You cannot review your own listing."]})
            except Exception:
                pass
            # Check for duplicate listing review
            dup_qs = Review.objects.filter(author=request.user, target_listing=target_listing)
            if self.instance:
                dup_qs = dup_qs.exclude(pk=self.instance.pk)
            if dup_qs.exists():
                raise serializers.ValidationError({"non_field_errors": ["You have already reviewed this listing."]})
        elif target_type == Review.TargetType.USER:
            # Allow target_user to come from context when using /reviews/users/<user_id>/ endpoint
            if not target_user:
                user_id = self.context.get('user_id')
                if user_id:
                    try:
                        target_user = User.objects.get(pk=user_id)
                        data['target_user'] = target_user
                    except User.DoesNotExist:
                        raise serializers.ValidationError({"target_user": "User does not exist."})
                    except ValueError:
                        raise serializers.ValidationError({"target_user": "Invalid user ID format."})
            if not target_user:
                raise serializers.ValidationError({"target_user": "Required for USER reviews."})
            if target_listing:
                raise serializers.ValidationError({"target_listing": "Must be null for USER reviews."})
            # Prevent reviewing yourself
            if target_user == request.user:
                raise serializers.ValidationError({"non_field_errors": ["You cannot review yourself."]})
            # Check for duplicate user review
            dup_qs = Review.objects.filter(author=request.user, target_user=target_user)
            if self.instance:
                dup_qs = dup_qs.exclude(pk=self.instance.pk)
            if dup_qs.exists():
                raise serializers.ValidationError({"non_field_errors": ["You have already reviewed this user."]})
        else:
            raise serializers.ValidationError({"target_type": "Invalid target type."})

        return data

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)
