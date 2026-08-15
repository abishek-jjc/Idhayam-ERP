from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import SystemNotification
from .serializers import SystemNotificationSerializer

class SystemNotificationViewSet(viewsets.ModelViewSet):
    queryset = SystemNotification.objects.all().order_by('-created_at')
    serializer_class = SystemNotificationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'is_read']
    search_fields = ['title', 'message']
