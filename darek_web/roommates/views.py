# roommates/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from .models import RoommatePost, RoommateRequest, RoommateGroup
from .serializers import RoommatePostSerializer, RoommateRequestSerializer, RoommateGroupSerializer
from twilio.rest import Client
from django.conf import settings
from messaging.models import Conversation

class RoommatePostViewSet(viewsets.ModelViewSet):
    queryset = RoommatePost.objects.all()
    serializer_class = RoommatePostSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['female_only', 'university', 'district', 'preferred_type']

    def get_queryset(self):
        return self.queryset.filter(author__role__in=['student', 'other'])

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class RoommateRequestViewSet(viewsets.ModelViewSet):
    queryset = RoommateRequest.objects.all()
    serializer_class = RoommateRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(receiver=self.request.user) | self.queryset.filter(sender=self.request.user)

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        req = self.get_object()
        if req.status != 'PENDING':
            return Response({'error': 'Request not pending'}, status=status.HTTP_400_BAD_REQUEST)
        if req.receiver != request.user:
            return Response({'error': 'Only receiver can accept'}, status=status.HTTP_403_FORBIDDEN)

        req.status = 'ACCEPTED'
        req.save()

        # Create or update group
        group, created = RoommateGroup.objects.get_or_create(
            leader=req.receiver,
            defaults={'name': f"Group of {req.receiver.username} and {req.sender.username}"}
        )
        group.members.add(req.sender, req.receiver)
        if req.post:
            group.university = req.post.university
            group.female_only = req.post.female_only

        # Create group conversation if none
        if not group.conversation:
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            twilio_convo = client.conversations.services(settings.TWILIO_CONVERSATIONS_SERVICE_SID).conversations.create(
                friendly_name=group.name
            )
            for member in group.members.all():
                client.conversations.services(settings.TWILIO_CONVERSATIONS_SERVICE_SID).conversations(twilio_convo.sid).participants.create(
                    identity=str(member.id)
                )
            convo = Conversation.objects.create(twilio_sid=twilio_convo.sid)
            convo.participants.add(*group.members.all())
            group.conversation = convo
            group.save()

        return Response({'success': 'Request accepted, added to group'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        req = self.get_object()
        if req.status != 'PENDING':
            return Response({'error': 'Request not pending'}, status=status.HTTP_400_BAD_REQUEST)
        if req.receiver != request.user:
            return Response({'error': 'Only receiver can reject'}, status=status.HTTP_403_FORBIDDEN)

        req.status = 'REJECTED'
        req.save()
        return Response({'success': 'Request rejected'}, status=status.HTTP_200_OK)

class RoommateGroupViewSet(viewsets.ModelViewSet):
    queryset = RoommateGroup.objects.all()
    serializer_class = RoommateGroupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(members=self.request.user)

    def perform_create(self, serializer):
        serializer.save(leader=self.request.user)