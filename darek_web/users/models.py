# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """Custom user model for UniStay."""
    phone_number = models.CharField(
        max_length=20, blank=True,
        help_text="Optional contact number used for account recovery and verification."
    )
    # Role flags – a user may be a student, a landlord, or a hotel partner.
    is_student = models.BooleanField(
        default=False,
        help_text="Designates whether this user is a student seeking accommodation."
    )
    is_landlord = models.BooleanField(
        default=False,
        help_text="Designates whether this user is a private landlord listing properties."
    )
    is_hotel_partner = models.BooleanField(
        default=False,
        help_text="Designates whether this user is a hotel or serviced apartment partner."
    )
    # Verification flags
    email_verified = models.BooleanField(
        default=False,
        help_text="Indicates whether the user's email address has been verified."
    )
    phone_verified = models.BooleanField(
        default=False,
        help_text="Indicates whether the user's phone number has been verified."
    )

    def __str__(self):
        return self.username or self.email
