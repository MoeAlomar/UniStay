from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings

User = get_user_model()

@receiver(post_save, sender=User)
def send_verification_email(sender, instance, created, **kwargs):
    if created and not instance.is_email_verified:
        token = default_token_generator.make_token(instance)
        uid = urlsafe_base64_encode(force_bytes(instance.pk))
        verification_link = f"{settings.VERIFICATION_BASE_URL}/users/verify/{uid}/{token}/"

        subject = "Verify Your UniStay KSA Account"
        message = render_to_string('users/verification_email.txt', {  # Create this template
            'user': instance,
            'verification_link': verification_link,
        })
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [instance.email])