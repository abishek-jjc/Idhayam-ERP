from rest_framework import serializers
from .models import (
    Proposal, ProposalVendorQuotation, ProposalAmendment,
    ApprovalChainTemplate, ApprovalStep
)

class ProposalVendorQuotationSerializer(serializers.ModelSerializer):
    vendor_name = serializers.ReadOnlyField(source='vendor.name')

    class Meta:
        model = ProposalVendorQuotation
        fields = '__all__'

class ProposalAmendmentSerializer(serializers.ModelSerializer):
    amended_by_name = serializers.ReadOnlyField(source='amended_by.name')

    class Meta:
        model = ProposalAmendment
        fields = '__all__'

class ApprovalStepSerializer(serializers.ModelSerializer):
    designation_title = serializers.ReadOnlyField(source='designation.title')
    acted_by_name = serializers.ReadOnlyField(source='acted_by.name')

    class Meta:
        model = ApprovalStep
        fields = '__all__'

class ProposalSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.ReadOnlyField(source='requested_by.name')
    plant_name = serializers.ReadOnlyField(source='plant.name')
    department_name = serializers.ReadOnlyField(source='department.name')
    process_type_name = serializers.ReadOnlyField(source='process_instance.process_type.name')
    quotations = ProposalVendorQuotationSerializer(many=True, read_only=True)
    amendments = ProposalAmendmentSerializer(many=True, read_only=True)
    approval_steps = ApprovalStepSerializer(many=True, read_only=True)

    class Meta:
        model = Proposal
        fields = '__all__'

class ApprovalChainTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApprovalChainTemplate
        fields = '__all__'
