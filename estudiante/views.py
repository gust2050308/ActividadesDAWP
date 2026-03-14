from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny

from .models import Estudiante
from .serializers import EstudianteSerializer


class EstudianteViewSet(viewsets.ModelViewSet):
    queryset = Estudiante.objects.all()
    serializer_class = EstudianteSerializer

    # ------------------------------------------------------------------ #
    # Endpoint personalizado: GET /api/estudiante/{id}/foto/              #
    # Sirve la imagen almacenada como BLOB en la BD.                      #
    # ------------------------------------------------------------------ #
    # permission_classes=[AllowAny] → sobreescribe el permiso global
    # (IsAuthenticated) SOLO para este endpoint, permitiendo que las
    # etiquetas <img src="..."> carguen la foto sin necesidad de token.
    @action(
        detail=True,
        methods=['get'],
        url_path='foto',
        url_name='foto',
        permission_classes=[AllowAny],
        authentication_classes=[],
    )
    def foto(self, request, pk=None):
        """Devuelve la imagen de perfil directamente desde la BD."""
        estudiante = self.get_object()
        if not estudiante.foto_perfil:
            return HttpResponse(status=404)
        return HttpResponse(
            bytes(estudiante.foto_perfil),
            content_type=estudiante.foto_perfil_content_type or 'image/jpeg',
        )

    def _guardar_archivos(self, serializer):
        """Extrae los archivos del payload y prepara los datos extra para save()."""
        archivo_foto = serializer.validated_data.pop('archivo_foto', None)
        archivo_boleta = serializer.validated_data.pop('archivo_boleta', None)

        extra = {}

        if archivo_foto:
            extra['foto_perfil'] = archivo_foto.read()
            extra['foto_perfil_content_type'] = archivo_foto.content_type

        if archivo_boleta:
            extra['boleta_pdf'] = archivo_boleta

        serializer.save(**extra)

    def perform_create(self, serializer):
        self._guardar_archivos(serializer)

    def perform_update(self, serializer):
        self._guardar_archivos(serializer)
