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
from apps.core.permissions import configured_permissions


def allowed_master_category_ids(request):
    claims = getattr(request, 'erp_claims', {})
    if claims.get('is_superadmin'):
        return None
    permissions = configured_permissions(claims, 'dynamic_masters').filter(can_view=True)
    if permissions.filter(master_category__isnull=True).exists():
        return None
    return permissions.exclude(master_category__isnull=True).values_list('master_category_id', flat=True)

class MasterCategoryViewSet(viewsets.ModelViewSet):
    queryset = MasterCategory.objects.all().order_by('id')
    serializer_class = MasterCategorySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['code', 'name']

    def get_queryset(self):
        queryset = super().get_queryset()
        allowed_ids = allowed_master_category_ids(self.request)
        return queryset if allowed_ids is None else queryset.filter(id__in=allowed_ids)

class MasterItemViewSet(viewsets.ModelViewSet):
    queryset = MasterItem.objects.all().order_by('-created_at', 'id')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'category__code', 'is_active', 'plant', 'department']
    search_fields = ['code', 'name']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return MasterItemCreateSerializer
        return MasterItemSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        allowed_ids = allowed_master_category_ids(self.request)
        return queryset if allowed_ids is None else queryset.filter(category_id__in=allowed_ids)

class MasterItemVersionViewSet(viewsets.ModelViewSet):
    queryset = MasterItemVersion.objects.all().order_by('id')
    serializer_class = MasterItemVersionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['master_item', 'version_no']

    def get_queryset(self):
        queryset = super().get_queryset()
        allowed_ids = allowed_master_category_ids(self.request)
        return queryset if allowed_ids is None else queryset.filter(master_item__category_id__in=allowed_ids)

class MasterAttributeViewSet(viewsets.ModelViewSet):
    queryset = MasterAttribute.objects.all().order_by('sort_order', 'id')
    serializer_class = MasterAttributeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['master_category', 'master_category__code']
    search_fields = ['attribute_code', 'attribute_name']

    def get_queryset(self):
        queryset = super().get_queryset()
        allowed_ids = allowed_master_category_ids(self.request)
        return queryset if allowed_ids is None else queryset.filter(master_category_id__in=allowed_ids)

class MasterInstanceViewSet(viewsets.ModelViewSet):
    queryset = MasterInstance.objects.all().order_by('-created_at', 'id')
    serializer_class = MasterInstanceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['master_category', 'master_item', 'is_active', 'plant', 'department']
    search_fields = ['code', 'name']

    def get_queryset(self):
        queryset = super().get_queryset()
        allowed_ids = allowed_master_category_ids(self.request)
        return queryset if allowed_ids is None else queryset.filter(master_category_id__in=allowed_ids)

class MasterAttributeValueViewSet(viewsets.ModelViewSet):
    queryset = MasterAttributeValue.objects.all().order_by('id')
    serializer_class = MasterAttributeValueSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['master_instance', 'master_attribute']

    def get_queryset(self):
        queryset = super().get_queryset()
        allowed_ids = allowed_master_category_ids(self.request)
        return queryset if allowed_ids is None else queryset.filter(master_instance__master_category_id__in=allowed_ids)


