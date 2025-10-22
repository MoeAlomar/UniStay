# messaging/models.py
import uuid
from django.db import models
from django.conf import settings

class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='conversations')
    listing = models.ForeignKey('listings.Listing', on_delete=models.SET_NULL, null=True, blank=True)
    twilio_sid = models.CharField(max_length=34, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Conversation {self.id} with {', '.join([p.username for p in self.participants.all()])}"

class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages',
        null=True,
        blank=True
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages',
        null=True,
        blank=True
    )
    content = models.TextField(null=True, blank=True)
    is_read = models.BooleanField(default=False, null=True, blank=True)
    twilio_sid = models.CharField(max_length=34, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    def __str__(self):
        return f"Message from {self.sender.username if self.sender else 'Unknown'} in {self.conversation.id if self.conversation else 'No Conversation'}"
