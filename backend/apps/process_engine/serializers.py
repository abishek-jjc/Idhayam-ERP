from rest_framework import serializers
from .models import (
    ProcessType, ProcessAttributeDefinition, ProcessInstance,
    ProcessAttributeValue, ProcessLink, AdminVerification
)

class ProcessAttributeDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessAttributeDefinition
        fields = '__all__'

class ProcessTypeSerializer(serializers.ModelSerializer):
    attribute_definitions = ProcessAttributeDefinitionSerializer(many=True, read_only=True)
    owning_department_name = serializers.ReadOnlyField(source='owning_department.name')

    class Meta:
        model = ProcessType
        fields = '__all__'

class ProcessAttributeValueSerializer(serializers.ModelSerializer):
    attribute_code = serializers.ReadOnlyField(source='attribute_definition.attribute_code')
    attribute_name = serializers.ReadOnlyField(source='attribute_definition.attribute_name')
    data_type = serializers.ReadOnlyField(source='attribute_definition.data_type')
    process_type_name = serializers.ReadOnlyField(source='process_instance.process_type.name')
    performed_by_name = serializers.ReadOnlyField(source='process_instance.performed_by.name')
    display_value = serializers.SerializerMethodField()

    class Meta:
        model = ProcessAttributeValue
        fields = '__all__'

    def get_display_value(self, obj):
        if obj.value_text is not None:
            return str(obj.value_text)
        if obj.value_number is not None:
            return str(obj.value_number)
        if obj.value_date is not None:
            return str(obj.value_date)
        if obj.value_datetime is not None:
            return str(obj.value_datetime)
        if obj.value_boolean is not None:
            return "Yes" if obj.value_boolean else "No"
        if obj.value_reference_id is not None:
            return str(obj.value_reference_id)
        return ""

class ProcessInstanceSerializer(serializers.ModelSerializer):
    process_type_name = serializers.ReadOnlyField(source='process_type.name')
    process_type_code = serializers.ReadOnlyField(source='process_type.code')
    plant_name = serializers.ReadOnlyField(source='plant.name')
    department_name = serializers.ReadOnlyField(source='department.name')
    performed_by_name = serializers.ReadOnlyField(source='performed_by.name')
    attribute_values = ProcessAttributeValueSerializer(many=True, read_only=True)

    class Meta:
        model = ProcessInstance
        fields = '__all__'

class ProcessInstanceCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating instance with dynamic attribute values map.
    values = { "attribute_code": value, ... }
    """
    values = serializers.JSONField(write_only=True, required=False, default=dict)

    class Meta:
        model = ProcessInstance
        fields = '__all__'

    def create(self, validated_data):
        values_data = validated_data.pop('values', {})
        instance = ProcessInstance.objects.create(**validated_data)
        
        # Save dynamic values according to attribute definition data types
        definitions = ProcessAttributeDefinition.objects.filter(process_type=instance.process_type)
        for attr_def in definitions:
            val = values_data.get(attr_def.attribute_code)
            if val is not None and val != "":
                val_kwargs = {
                    'process_instance': instance,
                    'attribute_definition': attr_def,
                }
                dt = attr_def.data_type
                if dt == 'number':
                    val_kwargs['value_number'] = val
                elif dt == 'date':
                    val_kwargs['value_date'] = val
                elif dt == 'datetime':
                    val_kwargs['value_datetime'] = val
                elif dt == 'boolean':
                    val_kwargs['value_boolean'] = bool(val)
                elif dt == 'reference':
                    val_kwargs['value_reference_id'] = str(val)
                else: # text, textarea, time, select, email, phone, currency, file, url, password
                    val_kwargs['value_text'] = str(val)
                
                ProcessAttributeValue.objects.create(**val_kwargs)
        return instance

class ProcessLinkSerializer(serializers.ModelSerializer):
    from_process_name = serializers.ReadOnlyField(source='from_process_instance.process_type.name')
    to_process_name = serializers.ReadOnlyField(source='to_process_instance.process_type.name')

    class Meta:
        model = ProcessLink
        fields = '__all__'

class AdminVerificationSerializer(serializers.ModelSerializer):
    verified_by_name = serializers.ReadOnlyField(source='verified_by.name')

    class Meta:
        model = AdminVerification
        fields = '__all__'
