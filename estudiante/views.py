import os
import uuid
from django.conf import settings
from rest_framework import viewsets
from rest_framework.response import Response
from supabase import create_client, Client

from .models import Estudiante
from .serializers import EstudianteSerializer


class EstudianteViewSet(viewsets.ModelViewSet):
    queryset = Estudiante.objects.all()
    serializer_class = EstudianteSerializer

    def get_supabase_client(self) -> Client:
        url: str = settings.SUPABASE_URL
        key: str = settings.SUPABASE_KEY
        return create_client(url, key)

    def _subir_imagen_a_supabase(self, archivo_foto) -> str:
        """Sube una imagen de perfil a Supabase Storage y retorna la URL pública."""
        supabase = self.get_supabase_client()
        bucket_name = settings.SUPABASE_BUCKET_NAME

        # Generar un nombre único para evitar colisiones
        ext = os.path.splitext(archivo_foto.name)[1]
        file_path = f"perfiles/{uuid.uuid4()}{ext}"

        supabase.storage.from_(bucket_name).upload(
            file=archivo_foto.read(),
            path=file_path,
            file_options={"content-type": archivo_foto.content_type},
        )

        return supabase.storage.from_(bucket_name).get_public_url(file_path)

    def _subir_boleta_a_supabase(self, archivo_boleta) -> str:
        """Sube un PDF de boleta a Supabase Storage y retorna la URL pública."""
        supabase = self.get_supabase_client()
        bucket_name = settings.SUPABASE_BUCKET_BOLETAS

        ext = os.path.splitext(archivo_boleta.name)[1] or ".pdf"
        file_path = f"boletas/{uuid.uuid4()}{ext}"

        supabase.storage.from_(bucket_name).upload(
            file=archivo_boleta.read(),
            path=file_path,
            file_options={"content-type": archivo_boleta.content_type},
        )

        return supabase.storage.from_(bucket_name).get_public_url(file_path)

    def perform_create(self, serializer):
        archivo_foto = serializer.validated_data.pop('archivo_foto', None)
        archivo_boleta = serializer.validated_data.pop('archivo_boleta', None)

        foto_url = None
        boleta_url = None

        if archivo_foto:
            foto_url = self._subir_imagen_a_supabase(archivo_foto)

        if archivo_boleta:
            boleta_url = self._subir_boleta_a_supabase(archivo_boleta)

        extra_data = {}
        if foto_url:
            extra_data["foto_perfil"] = foto_url
        if boleta_url:
            extra_data["boleta_pdf"] = boleta_url

        serializer.save(**extra_data)

    def perform_update(self, serializer):
        archivo_foto = serializer.validated_data.pop('archivo_foto', None)
        archivo_boleta = serializer.validated_data.pop('archivo_boleta', None)

        foto_url = None
        boleta_url = None

        if archivo_foto:
            foto_url = self._subir_imagen_a_supabase(archivo_foto)

        if archivo_boleta:
            boleta_url = self._subir_boleta_a_supabase(archivo_boleta)

        extra_data = {}
        if foto_url:
            extra_data["foto_perfil"] = foto_url
        if boleta_url:
            extra_data["boleta_pdf"] = boleta_url

        serializer.save(**extra_data)
