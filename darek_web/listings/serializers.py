# listings/serializers.py (Updated)
from rest_framework import serializers
from .models import Listing, ListingImage
from django.contrib.auth import get_user_model
from django.conf import settings
from users.serializers import UserSerializer
import requests
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class ListingSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(
        read_only=True,
        help_text="Must be a user with the Landlord role."
    )
    owner_details = UserSerializer(source='owner', read_only=True)
    images = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Listing
        fields = [
            'id', 'owner', 'owner_details', 'id_type', 'owner_identification_id',
            'deed_number', 'title', 'description', 'price', 'type', 'female_only',
            'roommates_allowed', 'student_discount', 'status', 'district',
            'bedrooms', 'bathrooms', 'area', 'location_link', 'images',
            'created_at', 'modified_at'
        ]
        read_only_fields = ['id', 'owner', 'owner_details', 'created_at', 'modified_at']

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
        # Owner is set during view perform_create; permissions are enforced in the view.

        # Determine desired status considering partial updates
        current_instance = getattr(self, 'instance', None)
        requested_status = data.get('status') or (current_instance.status if current_instance else None)

        # Pull Wathq fields from payload or fall back to instance for validation
        deed_number = data.get('deed_number') or (current_instance.deed_number if current_instance else None)
        id_number = data.get('owner_identification_id') or (current_instance.owner_identification_id if current_instance else None)
        id_type = data.get('id_type') or (current_instance.id_type if current_instance else None)

        # If Draft: force zero placeholders and skip Wathq
        if requested_status == Listing.Status.DRAFT or (requested_status is None and current_instance and current_instance.status == Listing.Status.DRAFT):
            # Always enforce zeros for drafts
            data['owner_identification_id'] = '0000000000'
            data['deed_number'] = '0000000000'
            # Ensure id_type is set to a valid value (default to National_ID if missing)
            valid_id_types = [choice[0] for choice in Listing.idTypes]
            if not id_type:
                data['id_type'] = 'National_ID'
            elif id_type not in valid_id_types:
                raise serializers.ValidationError(f"ID type must be one of {valid_id_types}.")
            return data

        # For ACTIVE (AVAILABLE/RESERVED) statuses, require proper Wathq validation
        if requested_status in (Listing.Status.AVAILABLE, Listing.Status.RESERVED):
            if not deed_number or not id_number or not id_type:
                raise serializers.ValidationError("Deed number, owner identification ID, and ID type are required for active listings.")
            if deed_number == '0000000000' or id_number == '0000000000':
                raise serializers.ValidationError("Cannot set status to available or reserved with placeholder values. Provide valid numbers.")

            # Wathq API validation
            url = f"https://api.wathq.sa/moj/real-estate/deed/{deed_number}/{id_number}/{id_type}"
            headers = {"apiKey": settings.WATHQ_API_KEY}
            logger.info(f"Calling Wathq API: {url} with id_type={id_type}")
            try:
                response = requests.get(url, headers=headers, timeout=5)
                logger.info(f"Wathq API response: status={response.status_code}, body={response.text}")
                if response.status_code != 200:
                    # Try to parse a helpful message
                    message = "Invalid response"
                    try:
                        resp_json = response.json()
                        message = resp_json.get('message') or resp_json.get('Message') or message
                    except ValueError:
                        pass
                    lower_msg = message.lower() if isinstance(message, str) else ""
                    if response.status_code == 429 or "quota" in lower_msg:
                        raise serializers.ValidationError("Wathq quota limit exceeded. Please try again later.")
                    if response.status_code in (400, 404) or any(k in lower_msg for k in ["not found", "invalid", "bad request", "no deed"]):
                        raise serializers.ValidationError("Invalid deed number or ID. Please check your entries.")
                    raise serializers.ValidationError(f"Wathq API validation failed: {message}")
                response_data = response.json()
                if response_data.get('deedStatus') != 'active':
                    raise serializers.ValidationError("Deed status must be active.")
            except requests.RequestException as e:
                logger.error(f"Wathq API error: {str(e)}")
                raise serializers.ValidationError("Wathq service is unavailable. Please try again later.")
            return data

        # If status not provided, but not a draft listing, fall back to requiring the fields
        if not deed_number or not id_number or not id_type:
            logger.warning(f"Missing Wathq inputs: deed_number={deed_number}, id_number={id_number}, id_type={id_type}")
            raise serializers.ValidationError("Deed number, owner identification ID, and ID type are required for validation.")

        # If zeros were provided but status wasn't explicitly DRAFT, reject
        if deed_number == '0000000000' or id_number == '0000000000':
            raise serializers.ValidationError("Placeholder IDs are only allowed for Draft listings.")

        # For non-draft updates with valid numbers, validate via Wathq
        url = f"https://api.wathq.sa/moj/real-estate/deed/{deed_number}/{id_number}/{id_type}"
        headers = {"apiKey": settings.WATHQ_API_KEY}
        logger.info(f"Calling Wathq API: {url} with id_type={id_type}")
        try:
            response = requests.get(url, headers=headers, timeout=5)
            logger.info(f"Wathq API response: status={response.status_code}, body={response.text}")
            if response.status_code != 200:
                message = "Invalid response"
                try:
                    resp_json = response.json()
                    message = resp_json.get('message') or resp_json.get('Message') or message
                except ValueError:
                    pass
                lower_msg = message.lower() if isinstance(message, str) else ""
                if response.status_code == 429 or "quota" in lower_msg:
                    raise serializers.ValidationError("Wathq quota limit exceeded. Please try again later.")
                if response.status_code in (400, 404) or any(k in lower_msg for k in ["not found", "invalid", "bad request", "no deed"]):
                    raise serializers.ValidationError("Invalid deed number or ID. Please check your entries.")
                raise serializers.ValidationError(f"Wathq API validation failed: {message}")
            response_data = response.json()
            if response_data.get('deedStatus') != 'active':
                raise serializers.ValidationError("Deed status must be active.")
        except requests.RequestException as e:
            logger.error(f"Wathq API error: {str(e)}")
            raise serializers.ValidationError("Wathq service is unavailable. Please try again later.")
        return data

    def get_images(self, obj):
        # Nested serializer representation limited to 10 images
        try:
            qs = obj.images.all()[:10]
        except Exception:
            qs = []
        return ListingImageSerializer(qs, many=True, context=self.context).data


class ListingImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ListingImage
        fields = ["id", "url", "is_primary"]
        read_only_fields = ["id", "url"]

    def get_url(self, obj):
        try:
            return obj.image.url if obj.image else None
        except Exception:
            return None
