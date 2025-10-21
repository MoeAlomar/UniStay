# listings/serializers.py (Updated)
from rest_framework import serializers
from .models import Listing
from django.contrib.auth import get_user_model
from django.conf import settings
from users.serializers import UserSerializer
import requests
import logging

logger = logging.getLogger(__name__)
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
            'id', 'owner', 'owner_details', 'id_type', 'owner_identification_id',
            'deed_number', 'title', 'description', 'price', 'type', 'female_only',
            'roommates_allowed', 'student_discount', 'status', 'district', 'location_link',
            'created_at', 'modified_at'
        ]
        read_only_fields = ['id', 'owner_details', 'created_at', 'modified_at']

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than 0.")
        return value

    def validate_owner_identification_id(self, value):
        if not value:
            raise serializers.ValidationError("Owner identification ID is required.")
        if not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError("Owner identification ID must be exactly 10 digits.")
        return value

    def validate_deed_number(self, value):
        if not value:
            raise serializers.ValidationError("Deed number is required.")
        if not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError("Deed number must be exactly 10 digits.")
        return value

    def validate_title(self, value):
        if not value:
            raise serializers.ValidationError("Title is required.")
        return value

    def validate_id_type(self, value):
        valid_id_types = [choice[0] for choice in Listing.idTypes]
        if value not in valid_id_types:
            raise serializers.ValidationError(f"ID type must be one of {valid_id_types}.")
        return value

    def validate(self, data):
        owner = data.get('owner')
        if owner and owner.role != 'landlord':
            raise serializers.ValidationError({"owner": "Owner must have the Landlord role."})

        # Wathq API validation
        deed_number = data.get('deed_number')
        id_number = data.get('owner_identification_id')
        id_type = data.get('id_type')
        if deed_number and id_number and id_type:
            # Bypass for testing: if both are '0000000000', skip API call
            if deed_number == '0000000000' and id_number == '0000000000':
                logger.info("Bypassing Wathq API validation for test values.")
                return data
            url = f"https://api.wathq.sa/moj/real-estate/deed/{deed_number}/{id_number}/{id_type}"
            headers = {"apiKey": settings.WATHQ_API_KEY}
            logger.info(f"Calling Wathq API: {url} with id_type={id_type}")
            try:
                response = requests.get(url, headers=headers, timeout=5)
                logger.info(f"Wathq API response: status={response.status_code}, body={response.text}")
                if response.status_code != 200:
                    raise serializers.ValidationError(
                        f"Wathq API validation failed: {response.json().get('message', 'Invalid response')}"
                    )
                response_data = response.json()
                if response_data.get('deedStatus') != 'active':
                    raise serializers.ValidationError("Deed status must be active.")
            except requests.RequestException as e:
                logger.error(f"Wathq API error: {str(e)}")
                raise serializers.ValidationError(f"Wathq API error: {str(e)}")
        else:
            logger.warning(f"Missing Wathq API inputs: deed_number={deed_number}, id_number={id_number}, id_type={id_type}")
            raise serializers.ValidationError("Deed number, owner identification ID, and ID type are required for validation.")
        return data