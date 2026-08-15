from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MasterCategoryViewSet, MasterItemViewSet, MasterItemVersionViewSet,
    MasterAttributeViewSet, MasterInstanceViewSet, MasterAttributeValueViewSet
)

router = DefaultRouter()
router.register(r'categories', MasterCategoryViewSet)
router.register(r'items', MasterItemViewSet)
router.register(r'versions', MasterItemVersionViewSet)
router.register(r'attributes', MasterAttributeViewSet)
router.register(r'instances', MasterInstanceViewSet)
router.register(r'attribute-values', MasterAttributeValueViewSet)

urlpatterns = [
    path('', include(router.urls)),
]


