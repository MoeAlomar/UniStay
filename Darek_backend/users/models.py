# users/models.py
from django.contrib.auth.models import AbstractUser, BaseUserManager ## <-- MODIFIED
from django.db import models

## NEW SECTION - ADD THIS MANAGER CLASS ##
class UserManager(BaseUserManager):
    """Define a model manager for User model with no username field."""

    def _create_user(self, email, password, **extra_fields):
        """Create and save a User with the given email and password."""
        if not email:
            raise ValueError('The given email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a SuperUser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(email, password, **extra_fields)
## END OF NEW SECTION ##


class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = 'STUDENT', 'Student'
        LANDLORD = 'LANDLORD', 'Landlord'
        HOTEL = 'HOTEL', 'Hotel Partner'
        ADMIN = 'ADMIN', 'Admin'

    class Gender(models.TextChoices):
        MALE = 'MALE', 'Male'
        FEMALE = 'FEMALE', 'Female'
        OTHER = 'OTHER', 'Other'

    username = None
    first_name = None
    last_name = None
    email = models.EmailField(unique=True)

    role = models.CharField(max_length=50, choices=Role.choices)
    gender = models.CharField(max_length=50, choices=Gender.choices, null=True, blank=True)
    phone = models.CharField(max_length=20, unique=True, null=True) # <-- Set null=True temporarily
    is_phone_verified = models.BooleanField(default=False)
    is_edu_verified = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    ## MODIFIED - CONNECT THE MANAGER ##
    objects = UserManager()

    def __str__(self):
        return self.email