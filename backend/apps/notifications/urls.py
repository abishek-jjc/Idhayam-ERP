from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SystemNotificationViewSet

router = DefaultRouter()
router.register(r'system-notifications', SystemNotificationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
