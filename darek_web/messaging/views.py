# messaging/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import ChatGrant
from twilio.rest import Client
from django.conf import settings
from users.models import User  # Direct import as suggested
from .models import Conversation, Message  # Import Conversation model

class TwilioAccessTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        identity = str(user.id)  # Secure linking: Use user ID as identity

        # Create access token with ChatGrant for Conversations
        token = AccessToken(
            settings.TWILIO_ACCOUNT_SID,
            settings.TWILIO_API_KEY_SID,
            settings.TWILIO_API_SECRET,
            identity=identity,
            ttl=3600  # 1 hour; adjust as needed
        )

        # Add grant for your Conversations Service
        chat_grant = ChatGrant(service_sid=settings.TWILIO_CONVERSATIONS_SERVICE_SID)
        token.add_grant(chat_grant)

        return Response({'token': token.to_jwt()}, status=status.HTTP_200_OK)

class CreateConversationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        other_user_id = request.data.get('other_user_id')  # Frontend sends the target user's ID
        try:
            other_user = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        # Enforce permissions (customize as needed, e.g., only allow if related to a listing or roommate)
        # Example:
        # if user.role == 'student' and other_user.role != 'landlord':
        #     return Response({'error': 'You can only message landlords'}, status=status.HTTP_403_FORBIDDEN)

        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        identity1 = str(user.id)
        identity2 = str(other_user.id)

        # Check if a conversation already exists between these users (optional, to avoid duplicates)
        existing_convo = Conversation.objects.filter(participants=user).filter(participants=other_user).first()
        if existing_convo:
            return Response({'conversation_sid': existing_convo.twilio_sid}, status=status.HTTP_200_OK)

        # Create conversation in Twilio
        try:
            conversation = client.conversations.services(
                settings.TWILIO_CONVERSATIONS_SERVICE_SID
            ).conversations.create(
                friendly_name=f"Chat between {user.username} and {other_user.username}"
            )

            # Add participants
            client.conversations.services(
                settings.TWILIO_CONVERSATIONS_SERVICE_SID
            ).conversations(
                conversation.sid
            ).participants.create(identity=identity1)

            client.conversations.services(
                settings.TWILIO_CONVERSATIONS_SERVICE_SID
            ).conversations(
                conversation.sid
            ).participants.create(identity=identity2)

            # Optionally save to your DB for tracking
            db_convo = Conversation.objects.create(
                twilio_sid=conversation.sid,
                listing=request.data.get('listing')  # If linking to a listing
            )
            db_convo.participants.add(user, other_user)
            db_convo.save()

            return Response({'conversation_sid': conversation.sid}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Add to messaging/views.py (append this class)
class SendMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        convo_sid = request.data.get('conversation_sid')
        body = request.data.get('body')
        if not convo_sid or not body:
            return Response({'error': 'conversation_sid and body are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Check if user is a participant
            convo = Conversation.objects.get(twilio_sid=convo_sid)
            if not convo.participants.filter(id=request.user.id).exists():
                return Response({'error': 'You are not a participant in this conversation'}, status=status.HTTP_403_FORBIDDEN)

            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            message = client.conversations.services(settings.TWILIO_CONVERSATIONS_SERVICE_SID).conversations(convo_sid).messages.create(
                author=str(request.user.id),  # Use identity as author
                body=body
            )

            # Save to your DB for persistence/admin viewing
            db_message = Message.objects.create(
                conversation=convo,
                sender=request.user,
                content=body,
                twilio_sid=message.sid
            )

            return Response({'sid': message.sid}, status=status.HTTP_201_CREATED)
        except Conversation.DoesNotExist:
            return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Add to messaging/views.py (append this class)
class MarkMessageReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message_sid = request.data.get('message_sid')
        if not message_sid:
            return Response({'error': 'message_sid is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            db_message = Message.objects.get(twilio_sid=message_sid)
            if db_message.sender == request.user:
                return Response({'error': 'Senders cannot mark their own messages as read'}, status=status.HTTP_403_FORBIDDEN)
            if not db_message.conversation.participants.filter(id=request.user.id).exists():
                return Response({'error': 'You are not a participant in this conversation'}, status=status.HTTP_403_FORBIDDEN)

            db_message.is_read = True
            db_message.save()
            return Response({'success': 'Message marked as read'}, status=status.HTTP_200_OK)
        except Message.DoesNotExist:
            return Response({'error': 'Message not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)