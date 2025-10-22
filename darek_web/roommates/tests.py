# roommates/tests.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from .models import RoommatePost, RoommateRequest, RoommateGroup
from .views import RoommatePostViewSet, RoommateRequestViewSet
from unittest.mock import patch

User = get_user_model()

class RoommatesTests(TestCase):
    def setUp(self):
        self.student1 = User.objects.create_user(username='student1', email='s1@edu.sa', password='pass', role='student', gender='male')
        self.student2 = User.objects.create_user(username='student2', email='s2@edu.sa', password='pass', role='student', gender='male')
        self.factory = APIRequestFactory()

    def test_create_post(self):
        post_data = {'max_budget': 1000, 'preferred_type': 'APARTMENT', 'female_only': False, 'university': 'KSU'}
        request = self.factory.post('/roommates/posts/', post_data)
        force_authenticate(request, user=self.student1)
        view = RoommatePostViewSet.as_view({'post': 'create'})
        response = view(request)
        self.assertEqual(response.status_code, 201)
        self.assertTrue(RoommatePost.objects.filter(author=self.student1).exists())

    @patch('twilio.rest.Client')  # Mock for group convo creation
    def test_accept_request(self, mock_client):
        # Setup mock Twilio
        mock_convo = mock_client.return_value.conversations.services.return_value.conversations.create.return_value
        mock_convo.sid = 'CHtest'
        mock_client.return_value.conversations.services.return_value.conversations.return_value.participants.create.return_value = None

        req = RoommateRequest.objects.create(sender=self.student1, receiver=self.student2)
        request = self.factory.post(f'/roommates/requests/{req.id}/accept/')
        force_authenticate(request, user=self.student2)
        view = RoommateRequestViewSet.as_view({'post': 'accept'})
        response = view(request, pk=req.id)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(RoommateRequest.objects.get(id=req.id).status, 'ACCEPTED')
        self.assertTrue(RoommateGroup.objects.filter(members__in=[self.student1, self.student2]).exists())