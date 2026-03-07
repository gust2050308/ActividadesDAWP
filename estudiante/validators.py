"""
validators.py
=============
Validators reutilizables para la app 'estudiante'.

BUENA PRÁCTICA: Separar la lógica de validación en funciones
independientes permite:
  - Reutilizarlos en múltiples serializers o modelos.
  - Escribir tests unitarios específicos para cada regla.
  - Mantener el serializer limpio y legible.
"""

import re
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import UploadedFile
from PIL import Image, UnidentifiedImageError


def validar_solo_letras(value: str, nombre_campo: str = "campo") -> str:
    """
    Valida que un string contenga únicamente letras y espacios.

    Args:
        value: El valor a validar.
        nombre_campo: Nombre del campo para el mensaje de error.

    Raises:
        ValidationError: Si el valor contiene caracteres no alfabéticos.
    """
    if not value.replace(' ', '').isalpha():
        raise ValidationError(
            f"El {nombre_campo} debe contener solo letras (sin números ni símbolos)."
        )
    return value


def validar_longitud_minima(value: str, minimo: int = 3, nombre_campo: str = "campo") -> str:
    """
    Valida que un string tenga al menos `minimo` caracteres.

    Raises:
        ValidationError: Si el valor es más corto que el mínimo.
    """
    if len(value.strip()) < minimo:
        raise ValidationError(
            f"El {nombre_campo} debe tener al menos {minimo} caracteres."
        )
    return value


def validar_formato_matricula(value: str) -> str:
    """
    Valida que la matrícula siga uno de los formatos aceptados:
      - Formato sin prefijo:  20233tn132  (5 dígitos + 2 letras + 3 dígitos)
      - Formato con prefijo:  I20233tn132 (1 letra  + 5 dígitos + 2 letras + 3 dígitos)

    Raises:
        ValidationError: Si la matrícula no cumple el patrón.
    """
    patron = r'^((\d{5}[a-zA-Z]{2}\d{3})|([a-zA-Z]\d{5}[a-zA-Z]{2}\d{3}))$'
    if not re.match(patron, value):
        raise ValidationError(
            "La matrícula debe seguir el formato: 20233tn132 o I20233tn132"
        )
    return value


def validar_rango_edad(value: int, minimo: int = 6, maximo: int = 100) -> int:
    """
    Valida que la edad esté dentro de un rango razonable.

    Raises:
        ValidationError: Si la edad no está en [minimo, maximo].
    """
    if value < minimo:
        raise ValidationError(
            f"La edad mínima para inscribirse es {minimo} años."
        )
    if value > maximo:
        raise ValidationError(
            f"La edad no puede ser mayor a {maximo} años."
        )
    return value


def validar_rango_promedio(value: float, minimo: float = 0.0, maximo: float = 10.0) -> float:
    """
    Valida que el promedio esté en la escala permitida (0–10 por defecto).

    Raises:
        ValidationError: Si el promedio está fuera del rango.
    """
    if not (minimo <= value <= maximo):
        raise ValidationError(
            f"El promedio debe estar entre {minimo} y {maximo}."
        )
    return value


def validar_imagen_segura(file: UploadedFile) -> UploadedFile:
    """
    Valida de manera estricta que un archivo subido sea realmente una imagen segura.
    
    1. Verifica que el tamaño no exceda el límite (ej. 5MB).
    2. Usa Pillow (PIL) para abrir y verificar la cabecera real del archivo,
       asegurando que no sea un script malicioso (ej. .php o .js) renombrado como .jpg.
    3. Verifica dimensiones máximas para evitar bombas de descompresión (Zip bombs).
    
    Raises:
        ValidationError: Si el archivo es demasiado grande, no es una imagen, o está corrupto.
    """
    # 1. Validar Tamaño Máximo (5 MB)
    MAX_SIZE_MB = 5
    if file.size > MAX_SIZE_MB * 1024 * 1024:
        raise ValidationError(f"La imagen no puede exceder los {MAX_SIZE_MB}MB.")

    # 2. Validar que realmente es una imagen usando Pillow
    try:
        # Abrimos la imagen con Pillow. open() no lee toda la imagen a memoria, 
        # solo los headers, por lo que es eficiente.
        img = Image.open(file)
        
        # verify() comprueba que el formato sea válido sin decodificar toda la imagen.
        img.verify()
        
        # 3. (Opcional) Validar dimensiones razonables
        # Necesitamos volver a abrirla porque verify() cierra/inutiliza la instancia en algunos formatos
        file.seek(0) 
        img = Image.open(file)
        if img.width > 4000 or img.height > 4000:
             raise ValidationError("Las dimensiones de la imagen son demasiado grandes (máx 4000x4000px).")
             
    except (UnidentifiedImageError, SyntaxError):
        # UnidentifiedImageError se lanza si Pillow no reconoce el archivo como imagen.
        raise ValidationError("El archivo subido no es una imagen válida o está corrupto.")
    except Exception as e:
        # Capturar otros posibles errores de lectura
        raise ValidationError("Error al procesar la imagen asegurate de que tenga un formato correcto.")
    finally:
        # Siempre devolver el puntero del archivo al inicio para que pueda ser leído
        # posteriormente por el proceso de subida a Supabase.
        file.seek(0)

    return file


def validar_pdf_seguro(file: UploadedFile) -> UploadedFile:
    """
    Valida que el archivo subido sea un PDF razonablemente seguro.

    1. Verifica tamaño máximo (ej. 5MB).
    2. Verifica el content-type reportado por el navegador.
    3. Verifica la cabecera real del archivo (%PDF) para evitar archivos falsos.
    """
    MAX_SIZE_MB = 5
    if file.size > MAX_SIZE_MB * 1024 * 1024:
        raise ValidationError(f"El PDF no puede exceder los {MAX_SIZE_MB}MB.")

    # Verificar content-type proporcionado por el cliente
    allowed_types = {"application/pdf", "application/x-pdf"}
    if file.content_type not in allowed_types:
        raise ValidationError("El archivo debe ser un PDF válido.")

    # Verificar cabecera real del archivo
    header = file.read(4)
    if header != b"%PDF":
        raise ValidationError("El archivo no parece ser un PDF válido.")

    # Devolver el puntero al inicio para que pueda ser leído posteriormente
    file.seek(0)
    return file
