# messaging/admin.py
from django.contrib import admin
from .models import Message

class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'recipient', 'listing', 'timestamp', 'is_read')
    list_filter = ('is_read',)
    search_fields = ('sender__email', 'recipient__email', 'listing__title', 'body')

admin.site.register(Message, MessageAdmin)