from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    MasterCategory, MasterItem, MasterItemVersion,
    MasterAttribute, MasterInstance, MasterAttributeValue
)
from .serializers import (
    MasterCategorySerializer, MasterItemSerializer, MasterItemCreateSerializer,
    MasterItemVersionSerializer, MasterAttributeSerializer, MasterInstanceSerializer,
    MasterAttributeValueSerializer
)

class MasterCategoryViewSet(viewsets.ModelViewSet):
    queryset = MasterCategory.objects.all().order_by('id')
    serializer_class = MasterCategorySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['code', 'name']

class MasterItemViewSet(viewsets.ModelViewSet):
    queryset = MasterItem.objects.all().order_by('-created_at', 'id')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'category__code', 'is_active', 'plant', 'department']
    search_fields = ['code', 'name']

    def get_serializer_class(self):
        if self.action == 'create':
            return MasterItemCreateSerializer
        return MasterItemSerializer

class MasterItemVersionViewSet(viewsets.ModelViewSet):
    queryset = MasterItemVersion.objects.all().order_by('id')
    serializer_class = MasterItemVersionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['master_item', 'version_no']

class MasterAttributeViewSet(viewsets.ModelViewSet):
    queryset = MasterAttribute.objects.all().order_by('sort_order', 'id')
    serializer_class = MasterAttributeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['master_category', 'master_category__code']
    search_fields = ['attribute_code', 'attribute_name']

class MasterInstanceViewSet(viewsets.ModelViewSet):
    queryset = MasterInstance.objects.all().order_by('-created_at', 'id')
    serializer_class = MasterInstanceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['master_category', 'master_item', 'is_active', 'plant', 'department']
    search_fields = ['code', 'name']

class MasterAttributeValueViewSet(viewsets.ModelViewSet):
    queryset = MasterAttributeValue.objects.all().order_by('id')
    serializer_class = MasterAttributeValueSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['master_instance', 'master_attribute']


