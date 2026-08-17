from rest_framework import serializers
from .models import (
    Proposal, ProposalVendorQuotation, ProposalAmendment,
    ApprovalChainTemplate, ApprovalStep
)
from apps.core.models import Employee, Plant, Department
from apps.process_engine.models import ProcessInstance

class BaseSanitizingSerializer(serializers.ModelSerializer):
    def to_internal_value(self, data):
        if isinstance(data, dict):
            cleaned = {}
            for k, v in data.items():
                if v == "":
                    field = self.fields.get(k)
                    if field:
                        cleaned[k] = None
                    else:
                        cleaned[k] = v
                else:
                    cleaned[k] = v
            data = cleaned
        return super().to_internal_value(data)

class ProposalVendorQuotationSerializer(BaseSanitizingSerializer):
    vendor_name = serializers.ReadOnlyField(source='vendor.name')

    class Meta:
        model = ProposalVendorQuotation
        fields = '__all__'

class ProposalAmendmentSerializer(BaseSanitizingSerializer):
    amended_by_name = serializers.ReadOnlyField(source='amended_by.name')

    class Meta:
        model = ProposalAmendment
        fields = '__all__'

class ApprovalStepSerializer(BaseSanitizingSerializer):
    designation_title = serializers.ReadOnlyField(source='designation.title')
    acted_by_name = serializers.ReadOnlyField(source='acted_by.name')

    class Meta:
        model = ApprovalStep
        fields = '__all__'

class ProposalSerializer(BaseSanitizingSerializer):
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

    def to_internal_value(self, data):
        if isinstance(data, dict):
            # If process_instance is not provided or empty, resolve to first instance
            if not data.get('process_instance'):
                first_inst = ProcessInstance.objects.first()
                if first_inst:
                    data = dict(data)
                    data['process_instance'] = first_inst.id
            if not data.get('requested_by'):
                first_emp = Employee.objects.first()
                if first_emp:
                    data = dict(data)
                    data['requested_by'] = first_emp.id
            if not data.get('plant'):
                first_plant = Plant.objects.first()
                if first_plant:
                    data = dict(data)
                    data['plant'] = first_plant.id
            if not data.get('department'):
                first_dept = Department.objects.first()
                if first_dept:
                    data = dict(data)
                    data['department'] = first_dept.id
        return super().to_internal_value(data)

class ApprovalChainTemplateSerializer(BaseSanitizingSerializer):
    class Meta:
        model = ApprovalChainTemplate
        fields = '__all__'
