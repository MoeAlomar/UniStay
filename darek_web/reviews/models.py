import uuid
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator

class Review(models.Model):
    class TargetType(models.TextChoices):
        USER = 'USER', 'User'
        LISTING = 'LISTING', 'Listing'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='authored_reviews')
    target_user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='received_reviews', on_delete=models.CASCADE, null=True, blank=True)
    target_listing = models.ForeignKey('listings.Listing', related_name='reviews', on_delete=models.CASCADE, null=True, blank=True)
    target_type = models.CharField(max_length=10, choices=TargetType.choices)
    rating = models.SmallIntegerField(
        help_text="from 1-5 (Higher is better)",
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review by {self.author.username} for {self.target_type} {self.id}"

    def clean(self):
        if self.target_type == self.TargetType.USER:
            if not self.target_user:
                raise ValidationError("Target user is required for USER reviews.")
            if self.target_listing:
                raise ValidationError("Target listing must be null for USER reviews.")
            if self.author == self.target_user:
                raise ValidationError("You cannot review yourself.")
        elif self.target_type == self.TargetType.LISTING:
            if not self.target_listing:
                raise ValidationError("Target listing is required for LISTING reviews.")
            if self.target_user:
                raise ValidationError("Target user must be null for LISTING reviews.")
        else:
            raise ValidationError("Invalid target type.")

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['author', 'target_user'],
                condition=models.Q(target_listing__isnull=True),
                name='unique_user_review'
            ),
            models.UniqueConstraint(
                fields=['author', 'target_listing'],
                condition=models.Q(target_user__isnull=True),
                name='unique_listing_review'
            ),
        ]