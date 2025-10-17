from django.shortcuts import render

# Create your views here.
from django.shortcuts import render
from django.http import HttpResponse

def showMessages(request):
    return HttpResponse("Hello from Messages page!")
# Create your views here.
