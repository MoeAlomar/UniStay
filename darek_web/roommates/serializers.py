# roommates/serializers.py
from rest_framework import serializers
from .models import RoommatePost, RoommateRequest, RoommateGroup
from users.serializers import UserSerializer
from listings.serializers import ListingSerializer
from messaging.serializers import ConversationSerializer
from users.models import User


class RoommatePostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = RoommatePost
        fields = [
            'id', 'author', 'max_budget', 'preferred_type', 'notes', 'female_only',
            'university', 'district', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']

    def validate_max_budget(self, value):
        if value <= 0:
            raise serializers.ValidationError("Max budget must be greater than 0.")
        return value

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)

class RoommateRequestSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    post = RoommatePostSerializer(read_only=True)

    class Meta:
        model = RoommateRequest
        fields = [
            'id', 'sender', 'receiver', 'post', 'notes', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'sender', 'status', 'created_at']

    def validate(self, data):
        request = self.context['request']
        if data['receiver'] == request.user:
            raise serializers.ValidationError("Cannot send request to yourself.")
        if RoommateRequest.objects.filter(sender=request.user, receiver=data['receiver'], status='PENDING').exists():
            raise serializers.ValidationError("Pending request already exists.")
        if RoommateRequest.objects.filter(sender=request.user, receiver=data['receiver'], status='ACCEPTED').exists():
            raise serializers.ValidationError("An accepted request already exists between these users.")
        return data

    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)

class RoommateGroupSerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)
    leader = UserSerializer(read_only=True)
    listing = ListingSerializer(read_only=True)
    conversation = ConversationSerializer(read_only=True)

    class Meta:
        model = RoommateGroup
        fields = [
            'id', 'name', 'members', 'leader', 'listing', 'conversation', 'address',
            'university', 'max_members', 'cost_per_member', 'female_only', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'members', 'leader', 'cost_per_member', 'created_at', 'updated_at']

    def validate(self, data):
        if self.context['request'].user.role not in ['student', 'other']:
            raise serializers.ValidationError("Only students or others can create groups.")
        return data

    def create(self, validated_data):
        validated_data['leader'] = self.context['request'].user
        group = super().create(validated_data)
        group.members.add(self.context['request'].user)
        return group