# messaging/urls.py
from django.urls import path
from .views import TwilioAccessTokenView, CreateConversationView, SendMessageView, MarkMessageReadView

urlpatterns = [
    path('twilio-token/', TwilioAccessTokenView.as_view(), name='twilio_token'),
    path('conversations/create/', CreateConversationView.as_view(), name='create_conversation'),
    path('messages/send/', SendMessageView.as_view(), name='send_message'),
    path('messages/mark-read/', MarkMessageReadView.as_view(), name='mark_message_read'),
    # Add more endpoints as needed, e.g., for listing conversations or messages
]