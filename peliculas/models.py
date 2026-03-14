from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator

# Create your models here.
class Pelicula(models.Model):
    nombre = models.CharField(max_length=255)
    genero = models.CharField(max_length=50)
    puntuacion = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(10)])

    