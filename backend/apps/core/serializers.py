from rest_framework import serializers
from .models import (
    Company, Plant, Department, Designation, Employee, EmployeeDetail,
    EmployeeBankAccount, Role, EmployeeRole, Permission, Vendor, Machine,
    StorageLocationBlock, StorageLocation, Document, ChartOfAccount,
    UIMenu, UIMenuPermission, UINavbar, UIForm, UIFormField, UIModal, UIWidget, UITheme
)

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'

class PlantSerializer(serializers.ModelSerializer):
    company_name = serializers.ReadOnlyField(source='company.name')

    class Meta:
        model = Plant
        fields = '__all__'

class DepartmentSerializer(serializers.ModelSerializer):
    plant_name = serializers.ReadOnlyField(source='plant.name')

    class Meta:
        model = Department
        fields = '__all__'

class DesignationSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')

    class Meta:
        model = Designation
        fields = '__all__'

class EmployeeDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeDetail
        fields = '__all__'

class EmployeeBankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeBankAccount
        fields = '__all__'

class EmployeeSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    designation_title = serializers.ReadOnlyField(source='designation.title')
    plant_name = serializers.ReadOnlyField(source='plant.name')
    details = EmployeeDetailSerializer(read_only=True)
    bank_accounts = EmployeeBankAccountSerializer(many=True, read_only=True)

    class Meta:
        model = Employee
        fields = '__all__'

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'

class EmployeeRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeRole
        fields = '__all__'

class PermissionSerializer(serializers.ModelSerializer):
    designation_title = serializers.ReadOnlyField(source='designation.title')
    role_name = serializers.ReadOnlyField(source='role.name')
    process_type_name = serializers.ReadOnlyField(source='process_type.name')
    process_type_code = serializers.ReadOnlyField(source='process_type.code')
    master_category_name = serializers.ReadOnlyField(source='master_category.name')
    master_category_code = serializers.ReadOnlyField(source='master_category.code')

    class Meta:
        model = Permission
        fields = '__all__'


class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = '__all__'

class MachineSerializer(serializers.ModelSerializer):
    plant_name = serializers.ReadOnlyField(source='plant.name')
    department_name = serializers.ReadOnlyField(source='department.name')

    class Meta:
        model = Machine
        fields = '__all__'

class StorageLocationBlockSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')

    class Meta:
        model = StorageLocationBlock
        fields = '__all__'

class StorageLocationSerializer(serializers.ModelSerializer):
    plant_name = serializers.ReadOnlyField(source='plant.name')
    department_name = serializers.ReadOnlyField(source='department.name')

    class Meta:
        model = StorageLocation
        fields = '__all__'

class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.ReadOnlyField(source='uploaded_by.name')

    class Meta:
        model = Document
        fields = '__all__'

class ChartOfAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChartOfAccount
        fields = '__all__'


# Dynamic UI Metadata Serializers

class UIMenuSerializer(serializers.ModelSerializer):
    parent_menu_name = serializers.ReadOnlyField(source='parent_menu.menu_name')

    class Meta:
        model = UIMenu
        fields = '__all__'


class UIMenuPermissionSerializer(serializers.ModelSerializer):
    menu_name = serializers.ReadOnlyField(source='menu.menu_name')
    role_name = serializers.ReadOnlyField(source='role.name')

    class Meta:
        model = UIMenuPermission
        fields = '__all__'


class UINavbarSerializer(serializers.ModelSerializer):
    class Meta:
        model = UINavbar
        fields = '__all__'


class UIFormFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = UIFormField
        fields = '__all__'


class UIFormSerializer(serializers.ModelSerializer):
    fields = UIFormFieldSerializer(many=True, read_only=True)

    class Meta:
        model = UIForm
        fields = '__all__'


class UIModalSerializer(serializers.ModelSerializer):
    form_name = serializers.ReadOnlyField(source='form.form_name')
    form_title = serializers.ReadOnlyField(source='form.title')

    class Meta:
        model = UIModal
        fields = '__all__'


class UIWidgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = UIWidget
        fields = '__all__'


class UIThemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = UITheme
        fields = '__all__'

