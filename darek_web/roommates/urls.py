from django.urls import path
from django.http import HttpResponse
from . import views


urlpatterns = [
    path('',views.showRoommates,name="Show Roommates page")
    ]