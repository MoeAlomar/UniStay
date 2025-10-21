from rest_framework import serializers
from .models import Review
from users.serializers import UserSerializer
from listings.serializers import ListingSerializer  # Assuming basic ListingSerializer exists; adjust if needed

class ReviewSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    target_user = UserSerializer(read_only=True)
    target_listing = ListingSerializer(read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'author', 'target_user', 'target_listing', 'target_type',
            'rating', 'comment', 'created_at'
        ]
        read_only_fields = ['id', 'author', 'created_at']

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate(self, data):
        target_type = data.get('target_type')
        target_user = data.get('target_user')
        target_listing = data.get('target_listing')

        if target_type == Review.TargetType.USER:
            if not target_user:
                raise serializers.ValidationError({"target_user": "Required for USER reviews."})
            if target_listing:
                raise serializers.ValidationError({"target_listing": "Must be null for USER reviews."})
        elif target_type == Review.TargetType.LISTING:
            if not target_listing:
                raise serializers.ValidationError({"target_listing": "Required for LISTING reviews."})
            if target_user:
                raise serializers.ValidationError({"target_user": "Must be null for LISTING reviews."})
        return data

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)