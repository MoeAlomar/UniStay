# roommates/admin.py
from django.contrib import admin
from .models import RoommatePost, RoommateRequest, RoommateGroup

@admin.register(RoommatePost)
class RoommatePostAdmin(admin.ModelAdmin):
    list_display = ('id', 'author', 'max_budget', 'university', 'female_only', 'created_at')
    list_filter = ('female_only', 'preferred_type', 'created_at')
    search_fields = ('author__username', 'university', 'notes')

@admin.register(RoommateRequest)
class RoommateRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'sender', 'receiver', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('sender__username', 'receiver__username')

@admin.register(RoommateGroup)
class RoommateGroupAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'leader', 'get_members_count', 'status', 'created_at')
    list_filter = ('status', 'female_only', 'created_at')
    search_fields = ('name', 'university', 'members__username')

    def get_members_count(self, obj):
        return obj.members.count()
    get_members_count.short_description = 'Members'