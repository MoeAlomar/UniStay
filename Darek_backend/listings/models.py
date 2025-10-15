# listings/models.py
from django.db import models
from django.conf import settings


class Campus(models.Model):
    name = models.CharField(max_length=255)
    city = models.CharField(max_length=100)

    # Add other relevant fields like address, etc. if needed

    def __str__(self):
        return f"{self.name}, {self.city}"


class Listing(models.Model):
    class RoomType(models.TextChoices):
        ROOM = 'ROOM', 'Private Room'
        SHARED = 'SHARED', 'Shared Room'
        STUDIO = 'STUDIO', 'Studio'
        APARTMENT = 'APARTMENT', 'Entire Apartment'

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PENDING_REVIEW = 'PENDING_REVIEW', 'Pending Review'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='listings')
    campus = models.ForeignKey(Campus, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    monthly_price = models.DecimalField(max_digits=10, decimal_places=2)
    deposit_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    room_type = models.CharField(max_length=50, choices=RoomType.choices)
    female_only = models.BooleanField(default=False)
    roommates_allowed = models.BooleanField(default=True)
    student_discount = models.BooleanField(default=False)
    available_from = models.DateField()
    address = models.CharField(max_length=255)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.DRAFT)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class ListingImage(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='listings_images/')

    def __str__(self):
        return f"Image for {self.listing.title}"


class Review(models.Model):
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews_written')
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField()  # 1-5 stars
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('author', 'listing')  # A user can only review a listing once

    def __str__(self):
        return f"Review by {self.author.email} for {self.listing.title}"


class RoommatePost(models.Model):
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='roommate_posts')
    campus = models.ForeignKey(Campus, on_delete=models.SET_NULL, null=True, blank=True)
    budget_min = models.DecimalField(max_digits=10, decimal_places=2)
    budget_max = models.DecimalField(max_digits=10, decimal_places=2)
    preferred_room_type = models.CharField(max_length=50, choices=Listing.RoomType.choices)
    notes = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Roommate post by {self.author.email}"