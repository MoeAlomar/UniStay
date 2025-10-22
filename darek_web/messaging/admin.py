# messaging/admin.py
from django.contrib import admin
from .models import Conversation, Message

class MessageInline(admin.TabularInline):
    model = Message
    extra = 0  # No extra empty forms
    fields = ('sender', 'content', 'is_read', 'created_at', 'twilio_sid')
    readonly_fields = ('sender', 'content', 'is_read', 'created_at', 'twilio_sid')
    can_delete = False  # Prevent accidental deletes

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_participants', 'listing', 'twilio_sid', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('twilio_sid', 'participants__username')
    readonly_fields = ('id', 'twilio_sid', 'created_at', 'updated_at')
    inlines = [MessageInline]

    def get_participants(self, obj):
        return ", ".join([p.username for p in obj.participants.all()])
    get_participants.short_description = 'Participants'

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'conversation', 'sender', 'content_preview', 'is_read', 'created_at', 'twilio_sid')
    list_filter = ('is_read', 'created_at')
    search_fields = ('content', 'sender__username', 'conversation__twilio_sid')
    readonly_fields = ('id', 'created_at', 'twilio_sid')

    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'