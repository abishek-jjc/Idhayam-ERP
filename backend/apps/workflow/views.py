from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Proposal, ProposalVendorQuotation, ProposalAmendment,
    ApprovalChainTemplate, ApprovalStep
)
from .serializers import (
    ProposalSerializer, ProposalVendorQuotationSerializer, ProposalAmendmentSerializer,
    ApprovalChainTemplateSerializer, ApprovalStepSerializer
)

class ProposalViewSet(viewsets.ModelViewSet):
    queryset = Proposal.objects.all().order_by('-created_at')
    serializer_class = ProposalSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['plant', 'department', 'status', 'vendor_mode', 'requested_by']
    search_fields = ['remarks']

class ProposalVendorQuotationViewSet(viewsets.ModelViewSet):
    queryset = ProposalVendorQuotation.objects.all().order_by('id')
    serializer_class = ProposalVendorQuotationSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['proposal', 'vendor', 'is_selected']

class ProposalAmendmentViewSet(viewsets.ModelViewSet):
    queryset = ProposalAmendment.objects.all().order_by('-created_at')
    serializer_class = ProposalAmendmentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['proposal', 'amended_by']

class ApprovalChainTemplateViewSet(viewsets.ModelViewSet):
    queryset = ApprovalChainTemplate.objects.all().order_by('id')
    serializer_class = ApprovalChainTemplateSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['process_type_code']

class ApprovalStepViewSet(viewsets.ModelViewSet):
    queryset = ApprovalStep.objects.all().order_by('step_order')
    serializer_class = ApprovalStepSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['proposal', 'designation', 'status']
