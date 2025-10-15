# listings/admin.py
from django.contrib import admin
from .models import Campus, Listing, ListingImage, Review, RoommatePost

class ListingImageInline(admin.TabularInline):
    model = ListingImage
    extra = 3 # How many extra image forms to show

class ListingAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'campus', 'monthly_price', 'status', 'is_active')
    list_filter = ('status', 'room_type', 'campus', 'female_only')
    search_fields = ('title', 'owner__email', 'address')
    inlines = [ListingImageInline]

admin.site.register(Campus)
admin.site.register(Listing, ListingAdmin)
admin.site.register(Review)
admin.site.register(RoommatePost)