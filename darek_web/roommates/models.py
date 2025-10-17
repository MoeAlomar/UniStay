# roommates/models.py
import uuid
from django.db import models
from django.conf import settings

class RoommateGroup(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, db_index=True)
    address = models.TextField()
    university = models.CharField(max_length=255)
    number_of_members = models.IntegerField()
    cost_per_member = models.DecimalField(max_digits=10, decimal_places=2, help_text="Cost/each")

    def __str__(self):
        return self.name

class RoommatePost(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    max_budget = models.CharField(max_length=255)
    preferred_type = models.CharField(max_length=255, blank=True, null=True, help_text="apartment-studio")
    notes = models.TextField(blank=True, null=True)
    female_only = models.BooleanField(default=False)
    university = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Post by {self.author.username}"