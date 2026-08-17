from rest_framework import serializers
from .models import (
    Company, Plant, Department, Designation, Employee, EmployeeDetail,
    EmployeeBankAccount, Role, EmployeeRole, Permission, Vendor, Machine,
    StorageLocationBlock, StorageLocation, Document, ChartOfAccount,
    UIMenu, UIMenuPermission, UINavbar, UIForm, UIFormField, UIModal, UIWidget, UITheme
)

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
            comp_val = data.get('company')
            if comp_val:
                comp_obj = Company.objects.filter(id=comp_val).first() or Company.objects.filter(name=comp_val).first()
                if not comp_obj:
                    first_comp = Company.objects.first()
                    if first_comp:
                        data = dict(data)
                        data['company'] = first_comp.id
            elif not comp_val:
                first_comp = Company.objects.first()
                if first_comp:
                    data = dict(data)
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

    class Meta:
        model = Employee
        fields = '__all__'

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

    class Meta:
        model = StorageLocation
        fields = '__all__'

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
    class Meta:
        model = UIWidget
        fields = '__all__'


class UIThemeSerializer(BaseSanitizingSerializer):
    class Meta:
        model = UITheme
        fields = '__all__'

