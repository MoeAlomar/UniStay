# roommates/models.py
import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError

class RoommatePost(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={'role__in': ['student', 'other']},
        related_name='roommate_posts'
    )
    max_budget = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Maximum monthly budget per person"
    )
    preferred_type = models.CharField(
        max_length=20,
        choices=[('APARTMENT', 'Apartment'), ('STUDIO', 'Studio'), ('OTHER', 'Other')],
        blank=True,
        null=True
    )
    notes = models.TextField(blank=True, null=True)
    female_only = models.BooleanField(default=False)
    university = models.CharField(max_length=255, blank=True, null=True)
    district = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)  # <-- only change
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)      # <-- only change

    def __str__(self):
        return f"Post by {self.author.username} (Budget: {self.max_budget})"

    def clean(self):
        if self.author.role not in ['student', 'other']:
            raise ValidationError("Only students or others can create roommate posts.")

    class Meta:
        ordering = ['-created_at']


class RoommateRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        REJECTED = 'REJECTED', 'Rejected'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_roommate_requests'
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_roommate_requests'
    )
    post = models.ForeignKey(RoommatePost, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)  # <-- only change

    def __str__(self):
        return f"Request from {self.sender.username} to {self.receiver.username} ({self.status})"

    def clean(self):
        if self.sender == self.receiver:
            raise ValidationError("Cannot send request to yourself.")
        if self.sender.role not in ['student', 'other'] or self.receiver.role not in ['student', 'other']:
            raise ValidationError("Only students or others can send/receive roommate requests.")

    class Meta:
        unique_together = ['sender', 'receiver']
        ordering = ['-created_at']


class RoommateGroup(models.Model):
    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Open for Joins'
        CLOSED = 'CLOSED', 'Closed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, db_index=True)
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='roommate_groups',
        limit_choices_to={'role__in': ['student', 'other']}
    )
    leader = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='led_roommate_groups'
    )
    listing = models.ForeignKey('listings.Listing', on_delete=models.SET_NULL, null=True, blank=True)
    conversation = models.OneToOneField('messaging.Conversation', on_delete=models.SET_NULL, null=True, blank=True)
    address = models.TextField(blank=True, null=True)
    university = models.CharField(max_length=255, blank=True, null=True)
    max_members = models.IntegerField(
        default=4,
        validators=[MinValueValidator(2), MaxValueValidator(10)],
        help_text="Maximum number of members allowed"
    )
    cost_per_member = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Calculated cost per member (e.g., listing price / members)"
    )
    female_only = models.BooleanField(default=False)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)  # <-- only change
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)      # <-- only change

    def __str__(self):
        return f"{self.name} ({self.members.count()} members)"

    def save(self, *args, **kwargs):
        if self.listing and self.members.count() > 0:
            self.cost_per_member = self.listing.price / self.members.count()
        super().save(*args, **kwargs)

    def clean(self):
        if self.members.count() > self.max_members:
            raise ValidationError(f"Group cannot exceed {self.max_members} members.")
        if self.female_only and any(m.gender != 'female' for m in self.members.all()):
            raise ValidationError("Female-only group cannot have non-female members.")

    class Meta:
        ordering = ['-created_at']
