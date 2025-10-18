# listings/serializers.py
from rest_framework import serializers
from .models import Listing
from django.contrib.auth import get_user_model
from users.serializers import UserSerializer

User = get_user_model()

class ListingSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='landlord'),
        help_text="Must be a user with the Landlord role."
    )
    owner_details = UserSerializer(source='owner', read_only=True)

    class Meta:
        model = Listing
        fields = [
            'id', 'owner', 'owner_details', 'owner_national_id', 'title', 'description',
            'price', 'type', 'female_only', 'roommates_allowed', 'student_discount',
            'status', 'address', 'latitude', 'longitude', 'location_link',
            'created_at', 'modified_at'
        ]
        read_only_fields = ['id', 'owner_details', 'created_at', 'modified_at']

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than 0.")
        return value

    def validate_owner_national_id(self, value):
        if not value:
            raise serializers.ValidationError("Owner national ID is required.")
        if not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError("Owner national ID must be exactly 10 digits.")
        return value

    def validate_title(self, value):
        if not value:
            raise serializers.ValidationError("Title is required.")
        return value

    def validate(self, data):
        owner = data.get('owner')
        if owner and owner.role != 'landlord':
            raise serializers.ValidationError({"owner": "Owner must have the Landlord role."})
        return data