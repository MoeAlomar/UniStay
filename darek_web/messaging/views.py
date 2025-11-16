# messaging/views.py
import json
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import ChatGrant
from twilio.rest import Client
from django.conf import settings
from users.models import User
from .models import Conversation, Message


def twilio_identity_for_user(user: User) -> str:
  """
  Build a Twilio identity that is unique per *real* user, not just DB id.
  You can adjust this scheme as you like, but it must be consistent
  everywhere you talk to Twilio (token, participants, author).
  """
  # Example: user_<id>_<unix_timestamp_of_date_joined>
  ts = int(user.date_joined.timestamp()) if hasattr(user, "date_joined") else 0
  return f"user_{user.id}_{ts}"


class TwilioAccessTokenView(APIView):
  permission_classes = [IsAuthenticated]

  def get(self, request):
    user = request.user
    identity = twilio_identity_for_user(user)

    if not all([
      settings.TWILIO_ACCOUNT_SID,
      settings.TWILIO_API_KEY_SID,
      settings.TWILIO_API_SECRET,
      settings.TWILIO_CONVERSATIONS_SERVICE_SID,
    ]):
      return Response(
        {"error": "Twilio is not configured. Set TWILIO_* env vars."},
        status=status.HTTP_503_SERVICE_UNAVAILABLE,
      )

    token = AccessToken(
      settings.TWILIO_ACCOUNT_SID,
      settings.TWILIO_API_KEY_SID,
      settings.TWILIO_API_SECRET,
      identity=identity,
      ttl=3600,
    )

    chat_grant = ChatGrant(service_sid=settings.TWILIO_CONVERSATIONS_SERVICE_SID)
    token.add_grant(chat_grant)

    jwt = token.to_jwt()
    if isinstance(jwt, bytes):
      jwt = jwt.decode("utf-8")
    return Response({"token": jwt}, status=status.HTTP_200_OK)


class CreateConversationView(APIView):
  permission_classes = [IsAuthenticated]

  def post(self, request):
    user = request.user
    other_user_id = request.data.get("other_user_id")
    other_username = request.data.get("other_username")

    try:
      if other_username:
        other_user = get_object_or_404(User, username=other_username)
      elif other_user_id:
        other_user = get_object_or_404(User, id=other_user_id)
      else:
        return Response(
          {"error": "Provide other_username or other_user_id"},
          status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception:
      return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    if other_user.id == user.id:
      return Response(
        {"error": "Cannot create a conversation with yourself"},
        status=status.HTTP_400_BAD_REQUEST,
      )

    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    identity1 = twilio_identity_for_user(user)
    identity2 = twilio_identity_for_user(other_user)

    existing_convo = (
      Conversation.objects.filter(participants=user)
      .filter(participants=other_user)
      .first()
    )
    if existing_convo and existing_convo.twilio_sid:
      return Response(
        {"conversation_sid": existing_convo.twilio_sid},
        status=status.HTTP_200_OK,
      )

    try:
      conversation = client.conversations.services(
        settings.TWILIO_CONVERSATIONS_SERVICE_SID
      ).conversations.create(
        friendly_name=f"Chat between {user.username} and {other_user.username}"
      )

      svc = client.conversations.services(settings.TWILIO_CONVERSATIONS_SERVICE_SID)
      svc.conversations(conversation.sid).participants.create(identity=identity1)
      svc.conversations(conversation.sid).participants.create(identity=identity2)

      attrs = {
        "usernames": {
          identity1: user.get_full_name() or user.username,
          identity2: other_user.get_full_name() or other_user.username,
        }
      }
      svc.conversations(conversation.sid).update(attributes=json.dumps(attrs))

      db_convo = Conversation.objects.create(
        twilio_sid=conversation.sid,
        listing=request.data.get("listing"),
      )
      db_convo.participants.add(user, other_user)

      return Response(
        {"conversation_sid": conversation.sid},
        status=status.HTTP_201_CREATED,
      )
    except Exception as e:
      return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SendMessageView(APIView):
  permission_classes = [IsAuthenticated]

  def post(self, request):
    convo_sid = request.data.get("conversation_sid")
    body = request.data.get("body")
    if not convo_sid or not body:
      return Response(
        {"error": "conversation_sid and body are required"},
        status=status.HTTP_400_BAD_REQUEST,
      )

    try:
      convo = Conversation.objects.get(twilio_sid=convo_sid)
      if not convo.participants.filter(id=request.user.id).exists():
        return Response(
          {"error": "You are not a participant in this conversation"},
          status=status.HTTP_403_FORBIDDEN,
        )

      client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
      author_identity = twilio_identity_for_user(request.user)
      message = client.conversations.services(
        settings.TWILIO_CONVERSATIONS_SERVICE_SID
      ).conversations(convo_sid).messages.create(
        author=author_identity,
        body=body,
      )

      db_message = Message.objects.create(
        conversation=convo,
        sender=request.user,
        content=body,
        twilio_sid=message.sid,
      )

      return Response({"sid": message.sid}, status=status.HTTP_201_CREATED)
    except Conversation.DoesNotExist:
      return Response(
        {"error": "Conversation not found"},
        status=status.HTTP_404_NOT_FOUND,
      )
    except Exception as e:
      return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MarkMessageReadView(APIView):
  permission_classes = [IsAuthenticated]

  def post(self, request):
    message_sid = request.data.get("message_sid")
    if not message_sid:
      return Response(
        {"error": "message_sid is required"},
        status=status.HTTP_400_BAD_REQUEST,
      )

    try:
      db_message = Message.objects.get(twilio_sid=message_sid)
      if db_message.sender == request.user:
        return Response(
          {"error": "Senders cannot mark their own messages as read"},
          status=status.HTTP_403_FORBIDDEN,
        )
      if not db_message.conversation.participants.filter(
        id=request.user.id
      ).exists():
        return Response(
          {"error": "You are not a participant in this conversation"},
          status=status.HTTP_403_FORBIDDEN,
        )

      db_message.is_read = True
      db_message.save()
      return Response(
        {"success": "Message marked as read"},
        status=status.HTTP_200_OK,
      )
    except Message.DoesNotExist:
      return Response(
        {"error": "Message not found"},
        status=status.HTTP_404_NOT_FOUND,
      )
    except Exception as e:
      return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
