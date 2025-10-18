from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({"status": "ok"})
urlpatterns = [

    path('admin/', admin.site.urls, name="Admin"),
    path('users/', include('users.urls'), name="Users"),  # Group auth under /api/auth/
    path('listings/', include('listings.urls'), name="listings"),
    path('roommates/', include('roommates.urls'), name="Roommates"),
    path('reviews/', include('reviews.urls'), name="Reviews"),
    path('messaging/', include('messaging.urls'), name="Messages"),
    path('', health_check, name='health'),
    path('home/',health_check,name='home')
]