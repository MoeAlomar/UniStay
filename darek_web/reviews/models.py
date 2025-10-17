# reviews/models.py
import uuid
from django.db import models
from django.conf import settings

class Review(models.Model):
    class TargetType(models.TextChoices):
        USER = 'USER', 'User'
        LISTING = 'LISTING', 'Listing'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    target_user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='reviews', on_delete=models.CASCADE, null=True, blank=True)
    target_listing = models.ForeignKey('listings.Listing', on_delete=models.CASCADE, null=True, blank=True)
    target_type = models.CharField(max_length=10, choices=TargetType.choices)
    rating = models.SmallIntegerField(help_text="from 1-5 (Higher is better)")
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review by {self.author.username}"