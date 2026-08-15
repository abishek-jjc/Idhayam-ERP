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

class ProcessTypeViewSet(viewsets.ModelViewSet):
    queryset = ProcessType.objects.all().order_by('id')
    serializer_class = ProcessTypeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'requires_approval', 'owning_department']
    search_fields = ['code', 'name']

class ProcessAttributeDefinitionViewSet(viewsets.ModelViewSet):
    queryset = ProcessAttributeDefinition.objects.all().order_by('id')
    serializer_class = ProcessAttributeDefinitionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['process_type', 'data_type', 'is_required']

class ProcessInstanceViewSet(viewsets.ModelViewSet):
    queryset = ProcessInstance.objects.all().order_by('-created_at')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['process_type', 'process_type__code', 'plant', 'department', 'status']
    search_fields = ['remarks']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProcessInstanceCreateSerializer
        return ProcessInstanceSerializer

class ProcessAttributeValueViewSet(viewsets.ModelViewSet):
    queryset = ProcessAttributeValue.objects.all().order_by('-created_at')
    serializer_class = ProcessAttributeValueSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['process_instance', 'attribute_definition']
    search_fields = ['value_text', 'attribute_definition__attribute_name', 'attribute_definition__attribute_code']

class ProcessLinkViewSet(viewsets.ModelViewSet):
    queryset = ProcessLink.objects.all().order_by('-created_at')
    serializer_class = ProcessLinkSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['from_process_instance', 'to_process_instance', 'link_type']
    search_fields = ['link_type', 'remarks', 'from_process_instance__process_type__name', 'to_process_instance__process_type__name']

class AdminVerificationViewSet(viewsets.ModelViewSet):
    queryset = AdminVerification.objects.all().order_by('id')
    serializer_class = AdminVerificationSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['process_instance', 'status', 'verified_by']
