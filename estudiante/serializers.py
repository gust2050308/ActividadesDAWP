"""
serializers.py
==============
Serializer del modelo Estudiante con validaciones en tres niveles:

  NIVEL 1 — validate_<campo>()
      Valida cada campo de forma individual.
      Se ejecuta automáticamente por DRF antes de guardar.

  NIVEL 2 — validate()
      Valida COMBINACIONES de campos (reglas de negocio cruzadas).
      Útil cuando la validez de un campo depende del valor de otro.

  NIVEL 3 — Validators reutilizables (validators.py)
      La lógica de validación se importa como funciones independientes,
      en lugar de estar incrustada directamente aquí.
      Esto facilita reusar y testear cada regla por separado.
"""

from rest_framework import serializers

from .models import Estudiante
from .validators import (
    validar_formato_matricula,
    validar_longitud_minima,
    validar_rango_edad,
    validar_rango_promedio,
    validar_solo_letras,
    validar_imagen_segura,
    validar_pdf_seguro,
)


class EstudianteSerializer(serializers.ModelSerializer):
    # Este campo procesará el archivo binario subido
    archivo_foto = serializers.ImageField(
        write_only=True,
        required=False,
        validators=[validar_imagen_segura]
    )
    # Este campo solo devolverá la URL pública guardada
    foto_perfil = serializers.URLField(read_only=True)

    # Campo para subir la boleta en PDF
    archivo_boleta = serializers.FileField(
        write_only=True,
        required=False,
        validators=[validar_pdf_seguro],
    )
    # URL pública de la boleta almacenada en Supabase
    boleta_pdf = serializers.URLField(read_only=True)

    class Meta:
        model = Estudiante
        fields = [
            'id',
            'nombre',
            'matricula',
            'email',
            'edad',
            'carrera',
            'promedio',
            'foto_perfil',
            'archivo_foto',
            'boleta_pdf',
            'archivo_boleta',
        ]

    # ------------------------------------------------------------------ #
    # NIVEL 1: Validación individual por campo                            #
    # ------------------------------------------------------------------ #

    def validate_nombre(self, value):
        """Valida que el nombre solo tenga letras y tenga longitud mínima."""
        validar_solo_letras(value, "nombre")
        validar_longitud_minima(value, 3, "nombre")
        return value

    def validate_matricula(self, value):
        """Valida el formato de la matrícula usando regex."""
        validar_formato_matricula(value)
        return value

    def validate_edad(self, value):
        """Valida que la edad esté en el rango permitido (6–100)."""
        validar_rango_edad(value)
        return value

    def validate_carrera(self, value):
        """Valida que la carrera solo tenga letras y tenga longitud mínima."""
        validar_solo_letras(value, "carrera")
        validar_longitud_minima(value, 3, "carrera")
        return value

    def validate_promedio(self, value):
        """Valida que el promedio esté en escala de 0 a 10."""
        validar_rango_promedio(value)
        return value

    # ------------------------------------------------------------------ #
    # NIVEL 2: Validación cruzada (reglas de negocio multi-campo)        #
    # ------------------------------------------------------------------ #

    def validate(self, data):
        """
        Validación cruzada entre campos.

        NOTA DIDÁCTICA: Este método se llama DESPUÉS de que cada
        validate_<campo>() pasó exitosamente. Aquí podemos aplicar
        reglas que involucran dos o más campos a la vez.

        Ejemplo de regla de negocio:
          - Para la carrera 'Medicina', el estudiante debe ser mayor de 17 años.
          - Un promedio menor a 6.0 solo es válido para primer semestre
            (esto se modelaría con un campo 'semestre', aquí es ilustrativo).
        """
        carrera = data.get('carrera', '').strip().lower()
        edad = data.get('edad')
        promedio = data.get('promedio')

        # Regla 1: Medicina requiere mayoría de edad
        if carrera == 'medicina' and edad is not None and edad < 18:
            raise serializers.ValidationError(
                "Para inscribirse en Medicina se requiere tener al menos 18 años."
            )

        # Regla 2: Ingeniería requiere promedio mínimo de 7.0
        if carrera == 'ingenieria' and promedio is not None and promedio < 7.0:
            raise serializers.ValidationError(
                "Para inscribirse en Ingeniería se requiere un promedio mínimo de 7.0."
            )

        return data
