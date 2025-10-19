from django.contrib import admin
from .models import Listing
from django.contrib.auth import get_user_model
from django import forms
import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)
User = get_user_model()

class ListingAdminForm(forms.ModelForm):
    class Meta:
        model = Listing
        fields = '__all__'

    def clean(self):
        cleaned_data = super().clean()
        deed_number = cleaned_data.get('deed_number')
        id_number = cleaned_data.get('owner_identification_id')
        id_type = cleaned_data.get('id_type')
        if deed_number and id_number and id_type:
            url = f"https://api.wathq.sa/moj/real-estate/deed/{deed_number}/{id_number}/{id_type}"
            headers = {"apiKey": settings.WATHQ_API_KEY}
            logger.info(f"Calling Wathq API (admin): {url} with id_type={id_type}")
            try:
                response = requests.get(url, headers=headers, timeout=5)
                logger.info(f"Wathq API response (admin): status={response.status_code}, body={response.text}")
                if response.status_code != 200:
                    raise forms.ValidationError(f"Wathq API validation failed: {response.json().get('message', 'Invalid response')}")
                response_data = response.json()
                if response_data.get('deedStatus') != 'active':
                    raise forms.ValidationError("Deed status must be active.")
            except requests.RequestException as e:
                logger.error(f"Wathq API error (admin): {str(e)}")
                raise forms.ValidationError(f"Wathq API error: {str(e)}")
        else:
            logger.warning(f"Missing Wathq API inputs (admin): deed_number={deed_number}, id_number={id_number}, id_type={id_type}")
            raise forms.ValidationError("Deed number, owner identification ID, and ID type are required for validation.")
        return cleaned_data

@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    form = ListingAdminForm
    list_display = [
        'title', 'owner_email', 'status', 'price', 'type',
        'female_only', 'roommates_allowed', 'student_discount',
        'district', 'location_link', 'created_at', 'modified_at'
    ]
    list_filter = [
        'status', 'type', 'female_only', 'roommates_allowed',
        'student_discount', 'district'
    ]
    search_fields = ['title', 'description', 'district', 'owner__email']
    readonly_fields = ['id', 'created_at', 'modified_at']
    list_editable = ['status', 'price', 'female_only', 'roommates_allowed', 'student_discount']
    list_per_page = 20
    ordering = ['-created_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'owner', 'title', 'description')
        }),
        ('Owner Information', {
            'fields': ('id_type', 'owner_identification_id', 'deed_number')
        }),
        ('Property Details', {
            'fields': ('price', 'type', 'status', 'female_only',
                       'roommates_allowed', 'student_discount')
        }),
        ('Location', {
            'fields': ('district', 'location_link')
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