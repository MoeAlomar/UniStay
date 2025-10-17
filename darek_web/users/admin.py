# users/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Define admin model for custom User with extra fields."""
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Darek Role & Verification", {
            'fields': (
                'phone_number', 'is_student', 'is_landlord', 'is_hotel_partner',
                'email_verified', 'phone_verified',
            ),
        }),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("Darek Role & Verification", {
            'classes': ('wide',),
            'fields': (
                'phone_number', 'is_student', 'is_landlord', 'is_hotel_partner',
                'email_verified', 'phone_verified',
            ),
        }),
    )
