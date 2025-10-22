from rest_framework import serializers
from .models import Review
from users.serializers import UserSerializer
from listings.models import Listing
from listings.serializers import ListingSerializer

class ReviewSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    target_user = UserSerializer(read_only=True)
    target_listing = serializers.PrimaryKeyRelatedField(
        queryset=Listing.objects.all(),
        required=False,
        allow_null=True
    )
    target_listing_detail = ListingSerializer(source='target_listing', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'author', 'target_user', 'target_listing', 'target_listing_detail', 'target_type',
            'rating', 'comment', 'created_at'
        ]
        read_only_fields = ['id', 'author', 'created_at', 'target_listing_detail']

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate(self, data):
        request = self.context['request']
        target_type = data.get('target_type', self.context.get('target_type'))
        if not target_type:
            raise serializers.ValidationError({"target_type": "This field is required."})

        target_user = data.get('target_user')
        target_listing = data.get('target_listing')

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
            # Check for duplicate listing review
            if Review.objects.filter(author=request.user, target_listing=target_listing).exists():
                raise serializers.ValidationError({"non_field_errors": ["You have already reviewed this listing."]})
        elif target_type == Review.TargetType.USER:
            if not target_user:
                raise serializers.ValidationError({"target_user": "Required for USER reviews."})
            if target_listing:
                raise serializers.ValidationError({"target_listing": "Must be null for USER reviews."})
            # Check for duplicate user review
            if Review.objects.filter(author=request.user, target_user=target_user).exists():
                raise serializers.ValidationError({"non_field_errors": ["You have already reviewed this user."]})
        else:
            raise serializers.ValidationError({"target_type": "Invalid target type."})

        return data

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)