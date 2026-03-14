from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class RegistroSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('email', 'nombre_completo', 'password', 'telefono')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
