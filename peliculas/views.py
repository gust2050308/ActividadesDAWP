from django.shortcuts import render
from rest_framework import generics, permissions
from .serializers import PeliculaSerializer


# Create your views here.
class PeliculaView(generics.CreateAPIView):
    serializer_class = PeliculaSerializer
    permission_classes = [permissions.AllowAny]


    