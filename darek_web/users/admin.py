from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "role", "gender", "get_is_email_verified", "is_active")
    list_filter = ("role", "gender", "is_active")  # Removed 'is_email_verified' to fix E116

    fieldsets = BaseUserAdmin.fieldsets + (
        ("UniStay Info", {"fields": ("role", "gender", "phone", "is_email_verified")}),
    )

    def get_is_email_verified(self, obj):
        return obj.is_email_verified

    get_is_email_verified.boolean = True  # Displays as a boolean icon in admin
    get_is_email_verified.short_description = "Email Verified"  # Column header