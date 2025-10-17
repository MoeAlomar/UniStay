from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({"status": "ok"})
urlpatterns = [

    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),  # Group auth under /api/auth/
    path('listings/', include('listings.urls')),
    path('roommates/', include('roommates.urls')),
    path('reviews/', include('reviews.urls')),
    path('messaging/', include('messaging.urls')),
    path('', health_check, name='health'),
]