from django.db import models
from rest_framework import serializers
from .models import (
    Company, Plant, Department, Designation, Employee, EmployeeDetail,
    EmployeeBankAccount, Role, EmployeeRole, Permission, Vendor, Machine,
    StorageLocationBlock, StorageLocation, Document, ChartOfAccount,
    UIMenu, UIMenuPermission, UINavbar, UIForm, UIFormField, UIModal, UIWidget, UITheme,
    ConfigAuditLog, ConfigVersion, UIDashboardLayout, GlobalSearchConfiguration
)

class BaseSanitizingSerializer(serializers.ModelSerializer):
    def to_internal_value(self, data):
        if isinstance(data, dict):
            cleaned = {}
            for k, v in data.items():
                if v == "":
                    field = self.fields.get(k)
                    if field and getattr(field, 'allow_null', False):
                        cleaned[k] = None
                    else:
                        cleaned[k] = v
                else:
                    cleaned[k] = v
            data = cleaned
        return super().to_internal_value(data)

class CompanySerializer(BaseSanitizingSerializer):
    class Meta:
        model = Company
        fields = '__all__'

class PlantSerializer(BaseSanitizingSerializer):
    company_name = serializers.ReadOnlyField(source='company.name')

    class Meta:
        model = Plant
        fields = '__all__'

    def to_internal_value(self, data):
        if isinstance(data, dict):
            data = dict(data)
            # Sanitize plant_type choice
            pt = data.get('plant_type')
            if pt:
                pt_str = str(pt).strip().lower()
                valid_map = {
                    'manufacturing': 'manufacturing',
                    'processing': 'processing',
                    'processing unit': 'processing',
                    'packaging': 'packaging',
                    'packaging warehouse': 'packaging',
                    'storage': 'storage',
                    'central cold storage': 'storage',
                    'transport': 'transport',
                }
                mapped = valid_map.get(pt_str)
                if not mapped:
                    for k, v in valid_map.items():
                        if k in pt_str or pt_str in k:
                            mapped = v
                            break
                data['plant_type'] = mapped or 'processing'

            # Sanitize company FK
            comp_val = data.get('company')
            if comp_val:
                import re
                cmp_match = re.search(r'CMP-[\w-]+', str(comp_val))
                if cmp_match:
                    comp_obj = Company.objects.filter(id=cmp_match.group(0)).first()
                else:
                    clean_title = str(comp_val).split('(')[0].strip()
                    comp_obj = Company.objects.filter(id=comp_val).first() or Company.objects.filter(name__icontains=clean_title).first()
                
                if comp_obj:
                    data['company'] = comp_obj.id
                else:
                    first_comp = Company.objects.first()
                    if first_comp:
                        data['company'] = first_comp.id
            else:
                first_comp = Company.objects.first()
                if first_comp:
                    data['company'] = first_comp.id

        return super().to_internal_value(data)

    def create(self, validated_data):
        if not validated_data.get('company'):
            comp = Company.objects.first()
            if not comp:
                comp, _ = Company.objects.get_or_create(id='CMP-001', defaults={'name': 'Enterprise Head Office'})
            validated_data['company'] = comp
        return super().create(validated_data)

class DepartmentSerializer(BaseSanitizingSerializer):
    plant_name = serializers.ReadOnlyField(source='plant.name')

    class Meta:
        model = Department
        fields = '__all__'

class DesignationSerializer(BaseSanitizingSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')

    class Meta:
        model = Designation
        fields = '__all__'

class EmployeeDetailSerializer(BaseSanitizingSerializer):
    class Meta:
        model = EmployeeDetail
        fields = '__all__'

class EmployeeBankAccountSerializer(BaseSanitizingSerializer):
    class Meta:
        model = EmployeeBankAccount
        fields = '__all__'

class EmployeeSerializer(BaseSanitizingSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    designation_title = serializers.ReadOnlyField(source='designation.title')
    plant_name = serializers.ReadOnlyField(source='plant.name')
    details = EmployeeDetailSerializer(read_only=True)
    bank_accounts = EmployeeBankAccountSerializer(many=True, read_only=True)
    role_id = serializers.CharField(write_only=False, required=False, allow_null=True, allow_blank=True)
    role_names = serializers.SerializerMethodField()
    role_ids = serializers.SerializerMethodField()

    def get_role_names(self, obj):
        return [er.role.name for er in obj.roles.select_related('role').all()]

    def get_role_ids(self, obj):
        return [er.role_id for er in obj.roles.all()]

    class Meta:
        model = Employee
        fields = '__all__'

    def create(self, validated_data):
        role_id = validated_data.pop('role_id', None) or self.initial_data.get('role_id') or self.initial_data.get('role')
        employee = super().create(validated_data)
        if role_id:
            role_obj = Role.objects.filter(models.Q(id=role_id) | models.Q(name=role_id)).first()
            if role_obj:
                EmployeeRole.objects.get_or_create(employee=employee, role=role_obj)
        return employee

    def update(self, instance, validated_data):
        role_id = validated_data.pop('role_id', None) or self.initial_data.get('role_id') or self.initial_data.get('role')
        employee = super().update(instance, validated_data)
        if role_id is not None:
            if role_id:
                role_obj = Role.objects.filter(models.Q(id=role_id) | models.Q(name=role_id)).first()
                if role_obj:
                    EmployeeRole.objects.filter(employee=employee).exclude(role=role_obj).delete()
                    EmployeeRole.objects.get_or_create(employee=employee, role=role_obj)
            else:
                EmployeeRole.objects.filter(employee=employee).delete()
        return employee

class RoleSerializer(BaseSanitizingSerializer):
    class Meta:
        model = Role
        fields = '__all__'

class EmployeeRoleSerializer(BaseSanitizingSerializer):
    class Meta:
        model = EmployeeRole
        fields = '__all__'

class PermissionSerializer(BaseSanitizingSerializer):
    designation_title = serializers.ReadOnlyField(source='designation.title')
    role_name = serializers.ReadOnlyField(source='role.name')
    process_type_name = serializers.ReadOnlyField(source='process_type.name')
    process_type_code = serializers.ReadOnlyField(source='process_type.code')
    master_category_name = serializers.ReadOnlyField(source='master_category.name')
    master_category_code = serializers.ReadOnlyField(source='master_category.code')

    class Meta:
        model = Permission
        fields = '__all__'

class VendorSerializer(BaseSanitizingSerializer):
    class Meta:
        model = Vendor
        fields = '__all__'

class MachineSerializer(BaseSanitizingSerializer):
    plant_name = serializers.ReadOnlyField(source='plant.name')
    department_name = serializers.ReadOnlyField(source='department.name')

    class Meta:
        model = Machine
        fields = '__all__'

class StorageLocationBlockSerializer(BaseSanitizingSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')

    class Meta:
        model = StorageLocationBlock
        fields = '__all__'

class StorageLocationSerializer(BaseSanitizingSerializer):
    plant_name = serializers.ReadOnlyField(source='plant.name')
    department_name = serializers.ReadOnlyField(source='department.name')
    block_name = serializers.ReadOnlyField(source='storage_location_block.start_code')

    class Meta:
        model = StorageLocation
        fields = '__all__'

    def create(self, validated_data):
        if not validated_data.get('storage_location_block') and validated_data.get('department'):
            dept = validated_data.get('department')
            blk, _ = StorageLocationBlock.objects.get_or_create(
                department=dept,
                start_code='A0',
                end_code='Z9',
                defaults={'remarks': 'Auto Default Block'}
            )
            validated_data['storage_location_block'] = blk
        return super().create(validated_data)

class DocumentSerializer(BaseSanitizingSerializer):
    uploaded_by_name = serializers.ReadOnlyField(source='uploaded_by.name')

    class Meta:
        model = Document
        fields = '__all__'

class ChartOfAccountSerializer(BaseSanitizingSerializer):
    class Meta:
        model = ChartOfAccount
        fields = '__all__'

# Dynamic UI Metadata Serializers

class UIMenuSerializer(BaseSanitizingSerializer):
    parent_menu_name = serializers.ReadOnlyField(source='parent_menu.menu_name')

    class Meta:
        model = UIMenu
        fields = '__all__'

class UIMenuPermissionSerializer(BaseSanitizingSerializer):
    menu_name = serializers.ReadOnlyField(source='menu.menu_name')
    role_name = serializers.ReadOnlyField(source='role.name')

    class Meta:
        model = UIMenuPermission
        fields = '__all__'

class UINavbarSerializer(BaseSanitizingSerializer):
    class Meta:
        model = UINavbar
        fields = '__all__'

class UIFormFieldSerializer(BaseSanitizingSerializer):
    class Meta:
        model = UIFormField
        fields = '__all__'

class UIFormSerializer(BaseSanitizingSerializer):
    fields = UIFormFieldSerializer(many=True, read_only=True)

    class Meta:
        model = UIForm
        fields = '__all__'

class UIModalSerializer(BaseSanitizingSerializer):
    form_name = serializers.ReadOnlyField(source='form.form_name')
    form_title = serializers.ReadOnlyField(source='form.title')

    class Meta:
        model = UIModal
        fields = '__all__'

class UIWidgetSerializer(BaseSanitizingSerializer):
    role_names = serializers.SerializerMethodField()

    def get_role_names(self, obj):
        return list(obj.roles.values_list('name', flat=True))

    class Meta:
        model = UIWidget
        fields = '__all__'

class UIThemeSerializer(BaseSanitizingSerializer):
    class Meta:
        model = UITheme
        fields = '__all__'

class ConfigAuditLogSerializer(BaseSanitizingSerializer):
    class Meta:
        model = ConfigAuditLog
        fields = '__all__'

class ConfigVersionSerializer(BaseSanitizingSerializer):
    class Meta:
        model = ConfigVersion
        fields = '__all__'

class UIDashboardLayoutSerializer(BaseSanitizingSerializer):
    role_name = serializers.ReadOnlyField(source='role.name')

    class Meta:
        model = UIDashboardLayout
        fields = '__all__'

class GlobalSearchConfigurationSerializer(BaseSanitizingSerializer):
    role_names = serializers.SerializerMethodField()

    def get_role_names(self, obj):
        return list(obj.roles.values_list('name', flat=True))

    def validate(self, attrs):
        from .search_service import SEARCH_ENTITY_DEFINITIONS
        model_label = attrs.get('model_label', getattr(self.instance, 'model_label', None))
        definition = SEARCH_ENTITY_DEFINITIONS.get(model_label)
        if not definition:
            raise serializers.ValidationError({'model_label': 'This model is not approved for global search.'})
        for key in ['searchable_fields', 'display_fields']:
            values = attrs.get(key, getattr(self.instance, key, []) if self.instance else []) or []
            invalid = sorted(set(values) - set(definition['fields']))
            if invalid:
                raise serializers.ValidationError({key: f"Unsupported fields: {', '.join(invalid)}"})
        status_field = attrs.get('status_field', getattr(self.instance, 'status_field', '') if self.instance else '')
        if status_field and status_field not in definition['fields']:
            raise serializers.ValidationError({'status_field': 'Status field is not approved for this entity.'})
        return attrs

    class Meta:
        model = GlobalSearchConfiguration
        fields = '__all__'
