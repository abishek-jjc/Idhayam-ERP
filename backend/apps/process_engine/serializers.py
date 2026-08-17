from rest_framework import serializers
from .models import (
    ProcessType, ProcessAttributeDefinition, ProcessInstance,
    ProcessAttributeValue, ProcessLink, AdminVerification
)
from apps.core.models import Plant, Department, Employee

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

class ProcessAttributeDefinitionSerializer(BaseSanitizingSerializer):
    class Meta:
        model = ProcessAttributeDefinition
        fields = '__all__'

    def to_internal_value(self, data):
        if isinstance(data, dict):
            pt_val = data.get('process_type')
            if pt_val:
                pt_obj = ProcessType.objects.filter(id=pt_val).first() or ProcessType.objects.filter(code=pt_val).first()
                if pt_obj:
                    data = dict(data)
                    data['process_type'] = pt_obj.id
        return super().to_internal_value(data)

class ProcessTypeSerializer(BaseSanitizingSerializer):
    attribute_definitions = ProcessAttributeDefinitionSerializer(many=True, read_only=True)
    owning_department_name = serializers.ReadOnlyField(source='owning_department.name')

    class Meta:
        model = ProcessType
        fields = '__all__'

class ProcessAttributeValueSerializer(BaseSanitizingSerializer):
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
        if obj.value_text is not None and obj.value_text != "":
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

class ProcessInstanceSerializer(BaseSanitizingSerializer):
    process_type_name = serializers.ReadOnlyField(source='process_type.name')
    process_type_code = serializers.ReadOnlyField(source='process_type.code')
    plant_name = serializers.ReadOnlyField(source='plant.name')
    department_name = serializers.ReadOnlyField(source='department.name')
    performed_by_name = serializers.ReadOnlyField(source='performed_by.name')
    attribute_values = ProcessAttributeValueSerializer(many=True, read_only=True)

    class Meta:
        model = ProcessInstance
        fields = '__all__'

def save_instance_attribute_values(instance, values_data):
    if not values_data:
        return
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
                try:
                    val_kwargs['value_number'] = float(val)
                except (ValueError, TypeError):
                    val_kwargs['value_text'] = str(val)
            elif dt == 'date':
                val_kwargs['value_date'] = val
            elif dt == 'datetime':
                val_kwargs['value_datetime'] = val
            elif dt == 'boolean':
                val_kwargs['value_boolean'] = True if str(val).lower() in ['true', '1', 'yes'] else bool(val)
            elif dt == 'reference':
                val_kwargs['value_reference_id'] = str(val)
            else:
                val_kwargs['value_text'] = str(val)
            
            ProcessAttributeValue.objects.update_or_create(
                process_instance=instance,
                attribute_definition=attr_def,
                defaults=val_kwargs
            )

class ProcessInstanceCreateSerializer(BaseSanitizingSerializer):
    """
    Serializer for creating and updating instance with dynamic attribute values map or attributes list.
    """
    values = serializers.JSONField(write_only=True, required=False, default=dict)
    attributes = serializers.JSONField(write_only=True, required=False, default=list)

    class Meta:
        model = ProcessInstance
        fields = '__all__'

    def to_internal_value(self, data):
        if isinstance(data, dict):
            # Allow process_type by code or id
            pt_val = data.get('process_type')
            if pt_val:
                pt_obj = ProcessType.objects.filter(id=pt_val).first() or ProcessType.objects.filter(code=pt_val).first()
                if pt_obj:
                    data = dict(data)
                    data['process_type'] = pt_obj.id

            # Ensure valid plant or fallback
            plant_val = data.get('plant')
            if plant_val:
                plant_obj = Plant.objects.filter(id=plant_val).first()
                if not plant_obj:
                    first_plant = Plant.objects.first()
                    if first_plant:
                        data = dict(data)
                        data['plant'] = first_plant.id
            elif not plant_val:
                first_plant = Plant.objects.first()
                if first_plant:
                    data = dict(data)
                    data['plant'] = first_plant.id

            # Ensure valid department or fallback
            dept_val = data.get('department')
            if dept_val:
                dept_obj = Department.objects.filter(id=dept_val).first()
                if not dept_obj:
                    first_dept = Department.objects.first()
                    if first_dept:
                        data = dict(data)
                        data['department'] = first_dept.id
            elif not dept_val:
                first_dept = Department.objects.first()
                if first_dept:
                    data = dict(data)
                    data['department'] = first_dept.id

        return super().to_internal_value(data)

    def create(self, validated_data):
        values_data = validated_data.pop('values', {})
        attributes_list = validated_data.pop('attributes', [])

        # Convert attributes list to values dict if provided
        merged_values = {}
        if isinstance(values_data, dict):
            merged_values.update(values_data)
        if isinstance(attributes_list, list):
            for item in attributes_list:
                if isinstance(item, dict) and 'attribute_code' in item:
                    merged_values[item['attribute_code']] = item.get('value')

        instance = ProcessInstance.objects.create(**validated_data)
        save_instance_attribute_values(instance, merged_values)
        return instance

    def update(self, instance, validated_data):
        values_data = validated_data.pop('values', None)
        attributes_list = validated_data.pop('attributes', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        merged_values = {}
        if isinstance(values_data, dict):
            merged_values.update(values_data)
        if isinstance(attributes_list, list):
            for item in attributes_list:
                if isinstance(item, dict) and 'attribute_code' in item:
                    merged_values[item['attribute_code']] = item.get('value')

        if merged_values:
            save_instance_attribute_values(instance, merged_values)

        return instance

class ProcessLinkSerializer(BaseSanitizingSerializer):
    from_process_name = serializers.ReadOnlyField(source='from_process_instance.process_type.name')
    to_process_name = serializers.ReadOnlyField(source='to_process_instance.process_type.name')

    class Meta:
        model = ProcessLink
        fields = '__all__'

class AdminVerificationSerializer(BaseSanitizingSerializer):
    verified_by_name = serializers.ReadOnlyField(source='verified_by.name')

    class Meta:
        model = AdminVerification
        fields = '__all__'
