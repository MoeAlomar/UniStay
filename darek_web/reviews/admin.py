from django.contrib import admin
from .models import Review

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'author', 'target_type', 'get_target', 'rating', 'created_at')
    list_filter = ('target_type', 'rating', 'created_at')
    search_fields = ('author__username', 'comment')
    readonly_fields = ('id', 'created_at')

    def get_target(self, obj):
        if obj.target_type == Review.TargetType.USER:
            return obj.target_user.username if obj.target_user else 'N/A'
        elif obj.target_type == Review.TargetType.LISTING:
            return obj.target_listing.title if obj.target_listing else 'N/A'
        return 'N/A'
    get_target.short_description = 'Target'