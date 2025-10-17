from django.shortcuts import render
from django.http import HttpResponse

def showListings(request):
    return HttpResponse("Hello from listings!")
# Create your views here.
