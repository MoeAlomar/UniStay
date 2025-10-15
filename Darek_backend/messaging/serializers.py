# messaging/serializers.py
from rest_framework import serializers
from .models import Message

class MessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.ReadOnlyField(source='sender.email')
    recipient_email = serializers.ReadOnlyField(source='recipient.email')

    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ('sender',)