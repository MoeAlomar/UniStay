# listings/models.py
import uuid
from django.db import models
from django.conf import settings

class Listing(models.Model):
    class Status(models.TextChoices):
        RESERVED = 'RESERVED', 'Reserved'
        AVAILABLE = 'AVAILABLE', 'Available'

    class RoomType(models.TextChoices):
        APARTMENT = 'APARTMENT', 'Apartment'
        STUDIO = 'STUDIO', 'Studio'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Monthly Price")
    type = models.CharField(max_length=10, choices=RoomType.choices)
    female_only = models.BooleanField(default=False)
    roommates_allowed = models.BooleanField(default=False)
    student_discount = models.BooleanField(default=False)
    status = models.CharField(max_length=10, choices=Status.choices)
    address = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    location_link = models.URLField(max_length=2048)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title