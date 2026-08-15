from rest_framework import serializers
from .models import SystemNotification

class SystemNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemNotification
        fields = '__all__'
