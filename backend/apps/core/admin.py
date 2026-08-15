from django.contrib import admin
from .models import (
    Company, Plant, Department, Designation, Employee, EmployeeDetail,
    EmployeeBankAccount, Role, EmployeeRole, Permission, Vendor, Machine,
    StorageLocationBlock, StorageLocation, Document, ChartOfAccount
)

class EmployeeDetailInline(admin.StackedInline):
    model = EmployeeDetail
    extra = 0

class EmployeeBankAccountInline(admin.TabularInline):
    model = EmployeeBankAccount
    extra = 1

class EmployeeRoleInline(admin.TabularInline):
    model = EmployeeRole
    extra = 1

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'gst_number', 'created_at')
    search_fields = ('id', 'name', 'gst_number', 'remarks')
    ordering = ('-created_at',)

@admin.register(Plant)
class PlantAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'company', 'plant_type', 'is_active', 'created_at')
    list_filter = ('plant_type', 'is_active', 'company')
    search_fields = ('id', 'name', 'remarks')
    ordering = ('-created_at',)

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'plant', 'is_shared_across_plants', 'created_at')
    list_filter = ('is_shared_across_plants', 'plant')
    search_fields = ('id', 'name', 'remarks')
    ordering = ('-created_at',)

@admin.register(Designation)
class DesignationAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'department', 'hierarchy_level', 'created_at')
    list_filter = ('department', 'hierarchy_level')
    search_fields = ('id', 'title', 'remarks')
    ordering = ('department', 'hierarchy_level')

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'department', 'designation', 'plant', 'status', 'user_account_id', 'created_at')
    list_filter = ('status', 'plant', 'department', 'designation')
    search_fields = ('id', 'name', 'user_account_id', 'remarks')
    inlines = [EmployeeDetailInline, EmployeeBankAccountInline, EmployeeRoleInline]
    ordering = ('-created_at',)

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'remarks')
    search_fields = ('id', 'name', 'remarks')

@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'designation', 'role', 'module', 'process_type', 'master_category', 'can_view', 'can_create', 'can_edit', 'can_delete', 'can_approve')
    list_filter = ('module', 'can_view', 'can_create', 'can_edit', 'can_delete', 'can_approve', 'designation', 'role')
    search_fields = ('id', 'module', 'action')
    ordering = ('id',)

@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'gst_number', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('id', 'name', 'gst_number', 'remarks')
    ordering = ('-created_at',)

@admin.register(Machine)
class MachineAdmin(admin.ModelAdmin):
    list_display = ('id', 'code', 'name', 'plant', 'department', 'status', 'capacity', 'registration_number', 'fastag_number', 'fastag_status', 'created_at')
    list_filter = ('status', 'plant', 'department', 'fastag_status')
    search_fields = ('id', 'code', 'name', 'registration_number', 'fastag_number', 'remarks')
    ordering = ('-created_at',)

@admin.register(StorageLocationBlock)
class StorageLocationBlockAdmin(admin.ModelAdmin):
    list_display = ('id', 'department', 'start_code', 'end_code', 'remarks')
    list_filter = ('department',)
    search_fields = ('id', 'start_code', 'end_code', 'remarks')

@admin.register(StorageLocation)
class StorageLocationAdmin(admin.ModelAdmin):
    list_display = ('id', 'code', 'plant', 'department', 'storage_location_block', 'capacity', 'status')
    list_filter = ('status', 'plant', 'department')
    search_fields = ('id', 'code', 'remarks')

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('id', 'entity_table', 'entity_id', 'file_path', 'version_no', 'uploaded_by', 'created_at')
    list_filter = ('entity_table', 'uploaded_by')
    search_fields = ('id', 'entity_table', 'entity_id', 'file_path', 'remarks')
    ordering = ('-created_at',)

@admin.register(ChartOfAccount)
class ChartOfAccountAdmin(admin.ModelAdmin):
    list_display = ('id', 'code', 'name', 'account_type', 'remarks')
    list_filter = ('account_type',)
    search_fields = ('id', 'code', 'name', 'remarks')
    ordering = ('code',)
