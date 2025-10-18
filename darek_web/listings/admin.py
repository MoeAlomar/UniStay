from django.contrib import admin
from .models import Listing
from django.contrib.auth import get_user_model

User = get_user_model()


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'owner_email', 'status', 'price', 'type',
        'female_only', 'roommates_allowed', 'student_discount',
        'address', 'created_at', 'modified_at'
    ]
    list_filter = [
        'status', 'type', 'female_only', 'roommates_allowed',
        'student_discount'
    ]
    search_fields = ['title', 'description', 'address']
    readonly_fields = ['id', 'created_at', 'modified_at']
    list_editable = ['status', 'price', 'female_only', 'roommates_allowed', 'student_discount']
    list_per_page = 20
    ordering = ['-created_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'owner', 'owner_national_id', 'title', 'description')
        }),
        ('Property Details', {
            'fields': ('price', 'type', 'status', 'female_only',
                       'roommates_allowed', 'student_discount')
        }),
        ('Location', {
            'fields': ('address', 'latitude', 'longitude', 'location_link')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'modified_at'),
            'classes': ('collapse',)
        }),
    )

    actions = ['make_available', 'make_reserved', 'make_draft', 'apply_student_discount']

    def owner_email(self, obj):
        return obj.owner.email

    owner_email.short_description = 'Owner Email'
    owner_email.admin_order_field = 'owner__email'

    def make_available(self, request, queryset):
        queryset.update(status='AVAILABLE')

    make_available.short_description = "Mark selected listings as Available"

    def make_reserved(self, request, queryset):
        queryset.update(status='RESERVED')

    make_reserved.short_description = "Mark selected listings as Reserved"

    def make_draft(self, request, queryset):
        queryset.update(status='DRAFT')

    make_draft.short_description = "Mark selected listings as Draft"

    def apply_student_discount(self, request, queryset):
        queryset.update(student_discount=True)

    apply_student_discount.short_description = "Apply student discount to selected listings"

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not request.user.is_superuser and hasattr(request.user, 'role') and request.user.role == 'landlord':
            return qs.filter(owner=request.user)
        return qs

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "owner":
            kwargs["queryset"] = User.objects.filter(role='landlord')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def has_delete_permission(self, request, obj=None):
        if obj and not request.user.is_superuser and request.user != obj.owner:
            return False
        return super().has_delete_permission(request, obj)

    def has_change_permission(self, request, obj=None):
        if obj and not request.user.is_superuser and request.user != obj.owner:
            return False
        return super().has_change_permission(request, obj)