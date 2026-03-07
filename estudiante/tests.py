"""
tests.py
========
Tests unitarios para validaciones del modelo Estudiante.

BUENA PRÁCTICA: Los tests de validación son la documentación ejecutable
de las reglas de negocio. Sirven para:
  - Confirmar que las reglas funcionan correctamente.
  - Proteger contra regresiones al modificar el código.
  - Documentar casos límite y casos de error esperados.

Ejecutar con:
    python manage.py test estudiante
"""

from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status

from .models import Estudiante
from .validators import (
    validar_formato_matricula,
    validar_longitud_minima,
    validar_rango_edad,
    validar_rango_promedio,
    validar_solo_letras,
)


# ====================================================================== #
# SECCIÓN 1: Tests de validators reutilizables                           #
# ====================================================================== #

class TestValidarSoloLetras(TestCase):
    """Prueba el validator que acepta solo letras y espacios."""

    def test_valor_valido(self):
        self.assertEqual(validar_solo_letras("Juan Perez", "nombre"), "Juan Perez")

    def test_rechaza_numeros(self):
        with self.assertRaises(ValidationError):
            validar_solo_letras("Juan123", "nombre")

    def test_rechaza_simbolos(self):
        with self.assertRaises(ValidationError):
            validar_solo_letras("Juan@!", "nombre")


class TestValidarLongitudMinima(TestCase):
    """Prueba el validator de longitud mínima."""

    def test_longitud_exacta(self):
        self.assertEqual(validar_longitud_minima("Ana", 3), "Ana")

    def test_rechaza_muy_corto(self):
        with self.assertRaises(ValidationError):
            validar_longitud_minima("Al", 3)


class TestValidarFormatoMatricula(TestCase):
    """Prueba el validator de formato de matrícula."""

    def test_formato_sin_prefijo_valido(self):
        self.assertEqual(validar_formato_matricula("20233tn132"), "20233tn132")

    def test_formato_con_prefijo_valido(self):
        self.assertEqual(validar_formato_matricula("I20233tn132"), "I20233tn132")

    def test_formato_invalido_letras_al_inicio(self):
        with self.assertRaises(ValidationError):
            validar_formato_matricula("tn20233132")

    def test_formato_invalido_muy_corto(self):
        with self.assertRaises(ValidationError):
            validar_formato_matricula("2023tn1")


class TestValidarRangoEdad(TestCase):
    """Prueba el validator de rango de edad."""

    def test_edad_en_rango(self):
        self.assertEqual(validar_rango_edad(20), 20)

    def test_rechaza_edad_menor_al_minimo(self):
        with self.assertRaises(ValidationError):
            validar_rango_edad(5)

    def test_rechaza_edad_mayor_al_maximo(self):
        with self.assertRaises(ValidationError):
            validar_rango_edad(101)

    def test_edad_en_el_limite_inferior(self):
        self.assertEqual(validar_rango_edad(6), 6)

    def test_edad_en_el_limite_superior(self):
        self.assertEqual(validar_rango_edad(100), 100)


class TestValidarRangoPromedio(TestCase):
    """Prueba el validator de rango de promedio."""

    def test_promedio_valido(self):
        self.assertAlmostEqual(validar_rango_promedio(8.5), 8.5)

    def test_promedio_cero_valido(self):
        self.assertAlmostEqual(validar_rango_promedio(0.0), 0.0)

    def test_promedio_diez_valido(self):
        self.assertAlmostEqual(validar_rango_promedio(10.0), 10.0)

    def test_rechaza_promedio_negativo(self):
        with self.assertRaises(ValidationError):
            validar_rango_promedio(-1.0)

    def test_rechaza_promedio_mayor_a_10(self):
        with self.assertRaises(ValidationError):
            validar_rango_promedio(10.1)


# ====================================================================== #
# SECCIÓN 2: Tests del serializer (API)                                  #
# ====================================================================== #

# Datos base válidos para reutilizar en los tests
ESTUDIANTE_VALIDO = {
    "nombre": "Carlos Lopez",
    "matricula": "20233tn132",
    "edad": 20,
    "carrera": "Sistemas",
    "promedio": 8.5,
}


class TestEstudianteSerializerValidaciones(APITestCase):
    """
    Prueba las validaciones del serializer vía la API REST.

    NOTA: APITestCase de DRF incluye un cliente HTTP especial
    que facilita hacer peticiones POST, PUT, etc. en los tests.
    """

    def _post(self, data):
        return self.client.post('/api/estudiante/', data, format='json')

    # --- Casos válidos ---

    def test_crear_estudiante_valido(self):
        response = self._post(ESTUDIANTE_VALIDO)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # --- Validaciones de nombre ---

    def test_nombre_con_numeros_rechazado(self):
        data = {**ESTUDIANTE_VALIDO, "nombre": "Carlos123"}
        response = self._post(data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("nombre", response.data)

    def test_nombre_muy_corto_rechazado(self):
        data = {**ESTUDIANTE_VALIDO, "nombre": "Al"}
        response = self._post(data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("nombre", response.data)

    # --- Validaciones de matrícula ---

    def test_matricula_formato_invalido_rechazada(self):
        data = {**ESTUDIANTE_VALIDO, "matricula": "abc123"}
        response = self._post(data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("matricula", response.data)

    def test_matricula_formato_con_prefijo_valido(self):
        data = {**ESTUDIANTE_VALIDO, "matricula": "I20233tn132"}
        response = self._post(data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # --- Validaciones de edad ---

    def test_edad_menor_a_6_rechazada(self):
        data = {**ESTUDIANTE_VALIDO, "edad": 5}
        response = self._post(data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("edad", response.data)

    def test_edad_mayor_a_100_rechazada(self):
        data = {**ESTUDIANTE_VALIDO, "edad": 150}
        response = self._post(data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("edad", response.data)

    # --- Validaciones de promedio ---

    def test_promedio_negativo_rechazado(self):
        data = {**ESTUDIANTE_VALIDO, "promedio": -1.0}
        response = self._post(data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("promedio", response.data)

    def test_promedio_mayor_a_10_rechazado(self):
        data = {**ESTUDIANTE_VALIDO, "promedio": 11.0}
        response = self._post(data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("promedio", response.data)


# ====================================================================== #
# SECCIÓN 3: Tests de validación cruzada — validate()                   #
# ====================================================================== #

class TestValidacionCruzada(APITestCase):
    """
    Prueba las reglas de negocio que involucran múltiples campos.

    Estas reglas viven en el método validate() del serializer y
    no pueden verificarse campo por campo.
    """

    def _post(self, data):
        return self.client.post('/api/estudiante/', data, format='json')

    def test_medicina_con_mayoria_de_edad_es_valido(self):
        data = {**ESTUDIANTE_VALIDO, "carrera": "Medicina", "edad": 20, "matricula": "20240ab001"}
        response = self._post(data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_medicina_sin_mayoria_de_edad_rechazado(self):
        """Un estudiante de 16 años no puede inscribirse en Medicina."""
        data = {**ESTUDIANTE_VALIDO, "carrera": "Medicina", "edad": 16, "matricula": "20240ab002"}
        response = self._post(data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_ingenieria_con_promedio_alto_es_valido(self):
        data = {**ESTUDIANTE_VALIDO, "carrera": "Ingenieria", "promedio": 8.0, "matricula": "20240ab003"}
        response = self._post(data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_ingenieria_con_promedio_bajo_rechazado(self):
        """Un promedio de 6.5 no alcanza el mínimo requerido para Ingeniería."""
        data = {**ESTUDIANTE_VALIDO, "carrera": "Ingenieria", "promedio": 6.5, "matricula": "20240ab004"}
        response = self._post(data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ====================================================================== #
# SECCIÓN 4: Tests de validación a nivel de modelo — clean()            #
# ====================================================================== #

class TestModeloClean(TestCase):
    """
    Prueba el método clean() del modelo.

    NOTA DIDÁCTICA: Aquí llamamos full_clean() directamente para
    demostrar que la validación existe a nivel de modelo, independiente
    del serializer (segunda línea de defensa).
    """

    def _crear_estudiante(self, **kwargs):
        defaults = {
            "nombre": "Ana Garcia",
            "matricula": "20233tn999",
            "edad": 22,
            "carrera": "Contabilidad",
            "promedio": 9.0,
        }
        defaults.update(kwargs)
        return Estudiante(**defaults)

    def test_modelo_valido_no_lanza_excepcion(self):
        estudiante = self._crear_estudiante()
        estudiante.full_clean()  # No debe lanzar error

    def test_modelo_nombre_invalido_lanza_ValidationError(self):
        estudiante = self._crear_estudiante(nombre="Ana123")
        with self.assertRaises(ValidationError):
            estudiante.full_clean()

    def test_modelo_promedio_invalido_lanza_ValidationError(self):
        estudiante = self._crear_estudiante(promedio=11.0)
        with self.assertRaises(ValidationError):
            estudiante.full_clean()

    def test_modelo_edad_invalida_lanza_ValidationError(self):
        estudiante = self._crear_estudiante(edad=3)
        with self.assertRaises(ValidationError):
            estudiante.full_clean()

