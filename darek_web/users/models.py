from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator, MinLengthValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    class Roles(models.TextChoices):
        STUDENT = "student", "Student"
        LANDLORD = "landlord", "Landlord"
        OTHER = "other", "Other"

    class Genders(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"


    # Override email to make it unique (fixes auth.E003)
    email = models.EmailField(_('email address'), unique=True)
    username = models.CharField(
        unique=True,
        max_length=20,
        validators=[
            MinLengthValidator(3, message='Username must be at least 3 characters long.'),
            RegexValidator(
                    regex=r'^[a-zA-Z0-9._]+$',
                    message='Username can only contain letters, numbers, periods (.), underscores (_).',
                    code='invalid_username'
                )
            ]
)

    role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.OTHER)
    gender = models.CharField(max_length=10, choices=Genders.choices)
    phone = models.CharField(max_length=30, blank=True)
    is_email_verified = models.BooleanField(default=False)

    # If using email for login/authentication
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']  # Keep username as required if needed; adjust as per your needs

    def __str__(self):
        return f"{self.username} ({self.role})"