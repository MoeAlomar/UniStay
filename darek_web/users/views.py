from django.shortcuts import render

# Create your views here.
urlpatterns = [
    path('',views.showListings,name="listings")
    ]