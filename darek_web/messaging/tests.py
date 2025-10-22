# messaging/tests.py
from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status
from twilio.rest import Client
from unittest.mock import patch
from .views import TwilioAccessTokenView, CreateConversationView
from .models import Conversation
from django.conf import settings

User = get_user_model()

class MessagingTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='user1', email='user1@example.com', password='pass', role='student')
        self.user2 = User.objects.create_user(username='user2', email='user2@example.com', password='pass', role='landlord')
        self.factory = APIRequestFactory()

    def test_twilio_access_token(self):
        request = self.factory.get('/messaging/twilio-token/')
        force_authenticate(request, user=self.user1)
        view = TwilioAccessTokenView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    @patch('twilio.rest.Client')  # Mock Twilio to avoid real API calls
    def test_create_conversation(self, mock_client):
        # Setup mock Twilio responses
        mock_convo_instance = mock_client.return_value.conversations.services.return_value.conversations
        mock_convo_instance.create.return_value.sid = 'CHfake123'
        mock_participants = mock_convo_instance.return_value.participants
        mock_participants.create.return_value = None  # Just simulate success

        request = self.factory.post('/messaging/conversations/create/', {'other_user_id': self.user2.id})
        force_authenticate(request, user=self.user1)
        view = CreateConversationView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('conversation_sid', response.data)
        self.assertTrue(Conversation.objects.filter(twilio_sid='CHfake123').exists())

    def test_duplicate_conversation(self):
        # Create an existing convo in DB
        convo = Conversation.objects.create(twilio_sid='CHexisting')
        convo.participants.add(self.user1, self.user2)

        request = self.factory.post('/messaging/conversations/create/', {'other_user_id': self.user2.id})
        force_authenticate(request, user=self.user1)
        view = CreateConversationView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['conversation_sid'], 'CHexisting')

    def test_invalid_user(self):
        request = self.factory.post('/messaging/conversations/create/', {'other_user_id': 999})
        force_authenticate(request, user=self.user1)
        view = CreateConversationView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)