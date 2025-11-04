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
from django.db.models import Count

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

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.author != request.user:
            return Response({'error': 'Only the author can delete this post.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

class RoommateRequestViewSet(viewsets.ModelViewSet):
    queryset = RoommateRequest.objects.all()
    serializer_class = RoommateRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Receiver should not see rejected requests; sender sees all (including rejected)
        receiver_qs = self.queryset.filter(receiver=self.request.user).exclude(status='REJECTED')
        sender_qs = self.queryset.filter(sender=self.request.user)
        return receiver_qs | sender_qs

    def create(self, request, *args, **kwargs):
        # Prevent sending requests if the user is already in a group
        if RoommateGroup.objects.filter(members=request.user).exists():
            return Response(
                {'error': 'You are already in a group and cannot send requests.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # If a post is targeted, block sending requests when the post author is already in a full (2-member) group
        post_id = request.data.get('post')
        if post_id:
            try:
                post = RoommatePost.objects.get(id=post_id)
                author_in_full_group = RoommateGroup.objects.filter(members=post.author).annotate(member_count=Count('members')).filter(member_count__gte=2).exists()
                if author_in_full_group:
                    return Response(
                        {'error': 'This post author is already in a full group. You cannot send a request to this post.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except RoommatePost.DoesNotExist:
                pass
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        req = self.get_object()
        if req.status != 'PENDING':
            return Response({'error': 'Request not pending'}, status=status.HTTP_400_BAD_REQUEST)
        if req.receiver != request.user:
            return Response({'error': 'Only receiver can accept'}, status=status.HTTP_403_FORBIDDEN)

        # Enforce single-group membership: neither sender nor receiver can already be in a group
        if RoommateGroup.objects.filter(members=req.sender).exists() or RoommateGroup.objects.filter(members=req.receiver).exists():
            return Response(
                {'error': 'Either sender or receiver is already in a group.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        req.status = 'ACCEPTED'
        req.save()

        # Create or update group
        group, created = RoommateGroup.objects.get_or_create(
            leader=req.receiver,
            defaults={'name': f"Group of {req.receiver.username} and {req.sender.username}"}
        )
        # Enforce 2-member groups; do not allow adding beyond 2
        if group.members.count() >= 2:
            return Response({'error': 'Group is already full.'}, status=status.HTTP_400_BAD_REQUEST)
        group.members.add(req.sender, req.receiver)
        if req.post:
            group.university = req.post.university
            group.female_only = req.post.female_only
        # Ensure max_members reflects the two-member rule
        if group.max_members != 2:
            group.max_members = 2

        # Create group conversation if none, with Twilio fallback
        if not group.conversation:
            convo = None
            try:
                if not all([
                    settings.TWILIO_ACCOUNT_SID,
                    settings.TWILIO_AUTH_TOKEN,
                    settings.TWILIO_CONVERSATIONS_SERVICE_SID,
                ]):
                    raise RuntimeError("Twilio not configured")
                client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                twilio_convo = client.conversations.services(settings.TWILIO_CONVERSATIONS_SERVICE_SID).conversations.create(
                    friendly_name=group.name
                )
                for member in group.members.all():
                    client.conversations.services(settings.TWILIO_CONVERSATIONS_SERVICE_SID).conversations(twilio_convo.sid).participants.create(
                        identity=str(member.id)
                    )
                convo = Conversation.objects.create(twilio_sid=twilio_convo.sid)
            except Exception:
                convo = Conversation.objects.create(twilio_sid=None)
            convo.participants.add(*group.members.all())
            group.conversation = convo
            group.save()

        # If group now has two members, delete the associated post (if any) to avoid further requests
        if group.members.count() >= 2 and req.post:
            try:
                req.post.delete()
            except Exception:
                pass

        # Delete the original request after successful acceptance to prevent stale entries
        try:
            req.delete()
        except Exception:
            pass

        return Response({'success': 'Request accepted, added to group'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        req = self.get_object()
        if req.status != 'PENDING':
            return Response({'error': 'Request not pending'}, status=status.HTTP_400_BAD_REQUEST)
        if req.receiver != request.user:
            return Response({'error': 'Only receiver can reject'}, status=status.HTTP_403_FORBIDDEN)

        # Delete the request on rejection
        try:
            req.delete()
        except Exception:
            pass
        return Response({'success': 'Request rejected and deleted'}, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        # Only the sender can delete their own request
        req = self.get_object()
        if req.sender != request.user:
            return Response({'error': 'Only the sender can delete this request.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

class RoommateGroupViewSet(viewsets.ModelViewSet):
    queryset = RoommateGroup.objects.all()
    serializer_class = RoommateGroupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(members=self.request.user)

    def perform_create(self, serializer):
        serializer.save(leader=self.request.user)

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        group = self.get_object()
        members_before = list(group.members.all())
        # User must be a member to leave
        if not group.members.filter(id=request.user.id).exists():
            return Response({'error': 'You are not a member of this group.'}, status=status.HTTP_403_FORBIDDEN)

        group.members.remove(request.user)

        # If no members remain, delete the group
        if group.members.count() == 0:
            # Cascade delete any requests between previous group members
            try:
                RoommateRequest.objects.filter(sender__in=members_before, receiver__in=members_before).delete()
            except Exception:
                pass
            group.delete()
            return Response({'success': 'You left the group. Group deleted.'}, status=status.HTTP_200_OK)

        # If leader left, keep remaining member as leader
        if group.leader == request.user:
            remaining = group.members.first()
            group.leader = remaining
            group.save(update_fields=['leader'])

        return Response({'success': 'You left the group.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def kick(self, request, pk=None):
        group = self.get_object()
        # Only leader can kick
        if group.leader != request.user:
            return Response({'error': 'Only the group leader can kick members.'}, status=status.HTTP_403_FORBIDDEN)

        member_id = request.data.get('member_id')
        if not member_id:
            return Response({'error': 'member_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            member_id_int = int(member_id)
        except (TypeError, ValueError):
            return Response({'error': 'Invalid member_id.'}, status=status.HTTP_400_BAD_REQUEST)

        if not group.members.filter(id=member_id_int).exists():
            return Response({'error': 'User is not a member of this group.'}, status=status.HTTP_404_NOT_FOUND)

        # Prevent leader from kicking themselves via this endpoint
        if group.leader_id == member_id_int:
            return Response({'error': 'Leader cannot kick themselves. Use leave instead.'}, status=status.HTTP_400_BAD_REQUEST)

        group.members.remove(member_id_int)

        return Response({'success': 'Member kicked from the group.'}, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        group = self.get_object()
        members_before = list(group.members.all())
        response = super().destroy(request, *args, **kwargs)
        # Cascade delete any requests between former members when the group is deleted
        try:
            RoommateRequest.objects.filter(sender__in=members_before, receiver__in=members_before).delete()
        except Exception:
            pass
        return response
