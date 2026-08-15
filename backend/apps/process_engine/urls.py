from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProcessTypeViewSet, ProcessAttributeDefinitionViewSet,
    ProcessInstanceViewSet, ProcessAttributeValueViewSet,
    ProcessLinkViewSet, AdminVerificationViewSet
)

router = DefaultRouter()
router.register(r'types', ProcessTypeViewSet)
router.register(r'definitions', ProcessAttributeDefinitionViewSet)
router.register(r'instances', ProcessInstanceViewSet)
router.register(r'values', ProcessAttributeValueViewSet)
router.register(r'links', ProcessLinkViewSet)
router.register(r'verifications', AdminVerificationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
