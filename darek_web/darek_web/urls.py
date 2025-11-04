# darek_web/urls.py
from django.contrib import admin
from django.urls import path, include, re_path
from django.http import JsonResponse

# === Swagger imports ===
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

def health_check(request):
    return JsonResponse({"status": "ok"})

schema_view = get_schema_view(
    openapi.Info(
        title="UniStay KSA API",
        default_version="v1",
        description="Backend API for UniStay KSA (users, listings, reviews, messaging, roommates)",
        terms_of_service="https://example.com/terms",
        contact=openapi.Contact(email="support@unistay.example"),
        license=openapi.License(name="Proprietary"),
    ),
    public=True,  # set to False + IsAdminUser in prod if you want to lock it down
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path('admin/', admin.site.urls, name="Admin"),
    path('users/', include('users.urls'), name="Users"),  # Group auth under /users/
    path('listings/', include('listings.urls'), name="listings"),
    path('roommates/', include('roommates.urls'), name="Roommates"),
    path('reviews/', include('reviews.urls'), name="Reviews"),
    path('messaging/', include('messaging.urls'), name="Messages"),
    path('', health_check, name='health'),
    path('home/', health_check, name='home'),

    # === Swagger / ReDoc ===
    re_path(r'^swagger(?P<format>\.json|\.yaml)$',
            schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0),
         name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0),
         name='schema-redoc'),
]