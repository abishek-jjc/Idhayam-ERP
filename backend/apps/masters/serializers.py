from rest_framework import serializers
from .models import (
    MasterCategory, MasterItem, MasterItemVersion,
    MasterAttribute, MasterInstance, MasterAttributeValue
)

def sync_json_attributes_to_eav(master_item, attributes_dict):
    """
    Extracts key-value pairs from JSON attributes dictionary and creates/updates
    corresponding MasterInstance, MasterAttribute, and MasterAttributeValue records.
    """
    if not attributes_dict or not isinstance(attributes_dict, dict):
        return None

    # 1. Get or Create MasterInstance
    msc_instance, _ = MasterInstance.objects.get_or_create(
        master_item=master_item,
        defaults={
            'master_category': master_item.category,
            'code': f"MSC-{master_item.code}",
            'name': master_item.name,
            'plant': master_item.plant,
            'department': master_item.department,
            'is_active': master_item.is_active,
            'remarks': master_item.remarks,
        }
    )

    # 2. Iterate through JSON keys and create MasterAttribute + MasterAttributeValue
    for key, val in attributes_dict.items():
        if val is None or val == "":
            continue

        # Determine data_type dynamically
        dt = 'text'
        if isinstance(val, bool):
            dt = 'boolean'
        elif isinstance(val, (int, float)):
            dt = 'number'

        mat_attr, _ = MasterAttribute.objects.get_or_create(
            master_category=master_item.category,
            attribute_code=key,
            defaults={
                'attribute_name': key.replace('_', ' ').title(),
                'data_type': dt,
            }
        )

        val_kwargs = {
            'master_instance': msc_instance,
            'master_attribute': mat_attr,
        }

        if dt == 'boolean':
            val_kwargs['value_boolean'] = bool(val)
        elif dt == 'number':
            val_kwargs['value_number'] = val
        else:
            val_kwargs['value_text'] = str(val)

        MasterAttributeValue.objects.update_or_create(
            master_instance=msc_instance,
            master_attribute=mat_attr,
            defaults=val_kwargs
        )
    return msc_instance

class MasterAttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MasterAttribute
        fields = '__all__'

class MasterCategorySerializer(serializers.ModelSerializer):
    attributes = MasterAttributeSerializer(many=True, read_only=True)
    owning_department_name = serializers.ReadOnlyField(source='owning_department.name')

    class Meta:
        model = MasterCategory
        fields = '__all__'

class MasterAttributeValueSerializer(serializers.ModelSerializer):
    attribute_code = serializers.ReadOnlyField(source='master_attribute.attribute_code')
    attribute_name = serializers.ReadOnlyField(source='master_attribute.attribute_name')
    data_type = serializers.ReadOnlyField(source='master_attribute.data_type')

    class Meta:
        model = MasterAttributeValue
        fields = '__all__'

class MasterInstanceSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='master_category.name')
    category_code = serializers.ReadOnlyField(source='master_category.code')
    attribute_values = MasterAttributeValueSerializer(many=True, read_only=True)

    class Meta:
        model = MasterInstance
        fields = '__all__'

class MasterItemVersionSerializer(serializers.ModelSerializer):
    master_item_name = serializers.ReadOnlyField(source='master_item.name')

    class Meta:
        model = MasterItemVersion
        fields = '__all__'

class MasterItemSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    category_code = serializers.ReadOnlyField(source='category.code')
    plant_name = serializers.ReadOnlyField(source='plant.name')
    department_name = serializers.ReadOnlyField(source='department.name')
    instances = MasterInstanceSerializer(many=True, read_only=True)
    versions = MasterItemVersionSerializer(many=True, read_only=True)

    class Meta:
        model = MasterItem
        fields = '__all__'

class MasterItemCreateSerializer(serializers.ModelSerializer):
    values = serializers.JSONField(write_only=True, required=False, default=dict)

    class Meta:
        model = MasterItem
        fields = '__all__'

    def create(self, validated_data):
        values_data = validated_data.pop('values', {})
        instance = MasterItem.objects.create(**validated_data)
        
        # Combine JSON attributes and values input
        merged_attrs = {}
        if instance.attributes and isinstance(instance.attributes, dict):
            merged_attrs.update(instance.attributes)
        if values_data and isinstance(values_data, dict):
            merged_attrs.update(values_data)
            instance.attributes = merged_attrs
            instance.save()

        sync_json_attributes_to_eav(instance, merged_attrs)
        return instance


