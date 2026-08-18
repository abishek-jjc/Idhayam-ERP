from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import SystemNotification
from .serializers import SystemNotificationSerializer

class SystemNotificationViewSet(viewsets.ModelViewSet):
    queryset = SystemNotification.objects.all().order_by('-created_at')
    serializer_class = SystemNotificationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'is_read']
    search_fields = ['title', 'message']

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        updated = SystemNotification.objects.filter(is_read=False).update(is_read=True)
        return Response({'message': f'Marked {updated} notifications as read.', 'count': updated}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch', 'post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response(SystemNotificationSerializer(notification).data, status=status.HTTP_200_OK)

