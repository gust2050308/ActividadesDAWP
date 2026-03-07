"""
models.py
=========
Definición del modelo Estudiante.

BUENA PRÁCTICA: El método clean() actúa como SEGUNDA LÍNEA DE DEFENSA.
  - La PRIMERA línea es el serializer (valida datos de la API).
  - La SEGUNDA línea es el modelo (valida integridad del dato antes de guardarlo).

Esto garantiza que los datos sean válidos SIN IMPORTAR desde donde
se intente guardar el objeto (admin, shell, otro serializer, etc.).
"""

from django.core.exceptions import ValidationError
from django.db import models

from .validators import (
    validar_formato_matricula,
    validar_longitud_minima,
    validar_rango_edad,
    validar_rango_promedio,
    validar_solo_letras,
)


class Estudiante(models.Model):
    nombre = models.CharField(max_length=255)
    matricula = models.CharField(max_length=20, unique=True)
    email = models.EmailField(unique=True)
    edad = models.IntegerField()
    carrera = models.CharField(max_length=100)
    promedio = models.FloatField()
    foto_perfil = models.URLField(max_length=500, blank=True, null=True)
    boleta_pdf = models.URLField(max_length=500, blank=True, null=True)

    def clean(self):
        """
        Validación a nivel de modelo.

        NOTA DIDÁCTICA: clean() NO se llama automáticamente en save().
        Para que se ejecute hay que llamar full_clean() explícitamente,
        o usar ModelSerializer (DRF lo hace por nosotros si definimos
        'validators' en el Meta del serializer).

        Django Admin sí llama full_clean() automáticamente.
        """
        errors = {}

        # --- Nombre ---
        try:
            validar_solo_letras(self.nombre, "nombre")
            validar_longitud_minima(self.nombre, 3, "nombre")
        except ValidationError as e:
            errors['nombre'] = e.messages

        # --- Matrícula ---
        try:
            validar_formato_matricula(self.matricula)
        except ValidationError as e:
            errors['matricula'] = e.messages

        # --- Edad ---
        try:
            validar_rango_edad(self.edad)
        except ValidationError as e:
            errors['edad'] = e.messages

        # --- Carrera ---
        try:
            validar_solo_letras(self.carrera, "carrera")
            validar_longitud_minima(self.carrera, 3, "carrera")
        except ValidationError as e:
            errors['carrera'] = e.messages

        # --- Promedio ---
        try:
            validar_rango_promedio(self.promedio)
        except ValidationError as e:
            errors['promedio'] = e.messages

        if errors:
            raise ValidationError(errors)

    def __str__(self):
        return f"{self.nombre} ({self.matricula})"

