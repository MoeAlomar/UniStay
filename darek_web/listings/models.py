import uuid

from django.core.validators import RegexValidator
from django.db import models
from django.conf import settings
from .districts_listings import districts, districts_AR
districts = sorted(districts, key=lambda x: x[1])


class Listing(models.Model):
    class Status(models.TextChoices):
        RESERVED = 'RESERVED', 'Reserved'
        AVAILABLE = 'AVAILABLE', 'Available'
        DRAFT = 'DRAFT', 'Draft'

    class PropertyType(models.TextChoices):
        APARTMENT = 'APARTMENT', 'Apartment'
        STUDIO = 'STUDIO', 'Studio'
        OTHER = 'OTHER', 'Other'
    idTypes= [
        ('National_ID', 'National ID'),
        ('Resident_ID', 'Resident ID'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'landlord'},
    )
    id_type = models.CharField(max_length=25, choices=idTypes, null=False, blank=False)
    owner_identification_id = models.CharField(max_length=10, null=False, blank=False,
    validators= [
        RegexValidator(
            regex=r'^\d{10}$',
            message="ID number must be 10 digits only!",
            code='invalid_ID_number'
        )
    ]
    )
    deed_number = models.CharField(
        max_length=10,
        null=False,
        blank=False,
        validators=[
        RegexValidator(
            regex=r'^\d{10}$',
            message="Deed number must be 10 digits only!",
            code='invalid_deed_number'
           )
        ]
     )
    title = models.CharField(max_length=255, null=False, blank=False)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Monthly Price",
    )
    type = models.CharField(max_length=10, choices=PropertyType.choices)
    female_only = models.BooleanField(default=False)
    roommates_allowed = models.BooleanField(default=False)
    student_discount = models.BooleanField(default=False)
    status = models.CharField(max_length=10, choices=Status.choices)
    district = models.CharField(
        max_length=100,
        choices=districts,
        help_text="Select the district/neighborhood"
    )

    # Optional property details
    bedrooms = models.PositiveIntegerField(null=True, blank=True)
    bathrooms = models.PositiveIntegerField(null=True, blank=True)
    area = models.PositiveIntegerField(null=True, blank=True, help_text="Area in square meters")

    location_link = models.URLField(max_length=2048)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        permissions = [
            ("can_create_listing", "Can create a listing"),
            ("can_view_listing_creation", "Can view listing creation"),
        ]
