from django.contrib import admin
from django.urls import path, include
from apps.process_engine.views import ProcessAttributeValueViewSet, ProcessLinkViewSet
from rest_framework.routers import DefaultRouter

alias_router = DefaultRouter()
alias_router.register(r'process-attribute-values', ProcessAttributeValueViewSet, basename='process-attribute-values')
alias_router.register(r'process-links', ProcessLinkViewSet, basename='process-links')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/core/', include('apps.core.urls')),
    path('api/masters/', include('apps.masters.urls')),
    path('api/process/', include('apps.process_engine.urls')),
    path('api/workflow/', include('apps.workflow.urls')),
    path('api/journal/', include('apps.journal.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/', include(alias_router.urls)),
]

