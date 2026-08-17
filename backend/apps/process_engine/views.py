from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    ProcessType, ProcessAttributeDefinition, ProcessInstance,
    ProcessAttributeValue, ProcessLink, AdminVerification
)
from .serializers import (
    ProcessTypeSerializer, ProcessAttributeDefinitionSerializer,
    ProcessInstanceSerializer, ProcessInstanceCreateSerializer,
    ProcessAttributeValueSerializer, ProcessLinkSerializer, AdminVerificationSerializer
)
from apps.core.permissions import configured_permissions


def allowed_process_type_ids(request):
    claims = getattr(request, 'erp_claims', {})
    if claims.get('is_superadmin'):
        return None
    permissions = configured_permissions(claims, 'process_engine').filter(can_view=True)
    if permissions.filter(process_type__isnull=True).exists():
        return None
    return permissions.exclude(process_type__isnull=True).values_list('process_type_id', flat=True)

class ProcessTypeViewSet(viewsets.ModelViewSet):
    queryset = ProcessType.objects.all().order_by('id')
    serializer_class = ProcessTypeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'requires_approval', 'owning_department']
    search_fields = ['code', 'name']

    def get_queryset(self):
        queryset = super().get_queryset()
        allowed_ids = allowed_process_type_ids(self.request)
        return queryset if allowed_ids is None else queryset.filter(id__in=allowed_ids)

class ProcessAttributeDefinitionViewSet(viewsets.ModelViewSet):
    queryset = ProcessAttributeDefinition.objects.all().order_by('id')
    serializer_class = ProcessAttributeDefinitionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['process_type', 'data_type', 'is_required']

    def get_queryset(self):
        queryset = super().get_queryset()
        allowed_ids = allowed_process_type_ids(self.request)
        return queryset if allowed_ids is None else queryset.filter(process_type_id__in=allowed_ids)

class ProcessInstanceViewSet(viewsets.ModelViewSet):
    queryset = ProcessInstance.objects.all().order_by('-created_at')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['process_type', 'process_type__code', 'plant', 'department', 'status']
    search_fields = ['remarks']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProcessInstanceCreateSerializer
        return ProcessInstanceSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        allowed_ids = allowed_process_type_ids(self.request)
        return queryset if allowed_ids is None else queryset.filter(process_type_id__in=allowed_ids)

class ProcessAttributeValueViewSet(viewsets.ModelViewSet):
    queryset = ProcessAttributeValue.objects.all().order_by('-created_at')
    serializer_class = ProcessAttributeValueSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['process_instance', 'attribute_definition']
    search_fields = ['value_text', 'attribute_definition__attribute_name', 'attribute_definition__attribute_code']

    def get_queryset(self):
        queryset = super().get_queryset()
        allowed_ids = allowed_process_type_ids(self.request)
        return queryset if allowed_ids is None else queryset.filter(process_instance__process_type_id__in=allowed_ids)

class ProcessLinkViewSet(viewsets.ModelViewSet):
    queryset = ProcessLink.objects.all().order_by('-created_at')
    serializer_class = ProcessLinkSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['from_process_instance', 'to_process_instance', 'link_type']
    search_fields = ['link_type', 'remarks', 'from_process_instance__process_type__name', 'to_process_instance__process_type__name']

    def get_queryset(self):
        queryset = super().get_queryset()
        allowed_ids = allowed_process_type_ids(self.request)
        return queryset if allowed_ids is None else queryset.filter(
            from_process_instance__process_type_id__in=allowed_ids,
            to_process_instance__process_type_id__in=allowed_ids,
        )

class AdminVerificationViewSet(viewsets.ModelViewSet):
    queryset = AdminVerification.objects.all().order_by('id')
    serializer_class = AdminVerificationSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['process_instance', 'status', 'verified_by']

    def get_queryset(self):
        queryset = super().get_queryset()
        allowed_ids = allowed_process_type_ids(self.request)
        return queryset if allowed_ids is None else queryset.filter(process_instance__process_type_id__in=allowed_ids)
