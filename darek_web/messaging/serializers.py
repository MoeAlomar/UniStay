# messaging/serializers.py
from rest_framework import serializers
from .models import Conversation, Message
from users.serializers import UserSerializer

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'content', 'is_read', 'created_at', 'twilio_sid']
        read_only_fields = ['id', 'sender', 'created_at', 'twilio_sid']

class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'listing', 'last_message', 'created_at', 'updated_at', 'twilio_sid']
        read_only_fields = ['id', 'participants', 'created_at', 'updated_at', 'twilio_sid']

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        return MessageSerializer(last_msg).data if last_msg else None