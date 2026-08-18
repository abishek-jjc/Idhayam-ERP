from rest_framework import viewsets, filters
from django.db import models
import uuid
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Company, Plant, Department, Designation, Employee, EmployeeDetail,
    EmployeeBankAccount, Role, EmployeeRole, Permission, Vendor, Machine,
    StorageLocationBlock, StorageLocation, Document, ChartOfAccount,
    UIMenu, UIMenuPermission, UINavbar, UIForm, UIFormField, UIModal, UIWidget, UITheme,
    ConfigAuditLog, ConfigVersion, UIDashboardLayout, GlobalSearchConfiguration
)
from .serializers import (
    CompanySerializer, PlantSerializer, DepartmentSerializer, DesignationSerializer,
    EmployeeSerializer, EmployeeDetailSerializer, EmployeeBankAccountSerializer,
    RoleSerializer, EmployeeRoleSerializer, PermissionSerializer, VendorSerializer,
    MachineSerializer, StorageLocationBlockSerializer, StorageLocationSerializer,
    DocumentSerializer, ChartOfAccountSerializer,
    UIMenuSerializer, UIMenuPermissionSerializer, UINavbarSerializer,
    UIFormSerializer, UIFormFieldSerializer, UIModalSerializer,
    UIWidgetSerializer, UIThemeSerializer,
    ConfigAuditLogSerializer, ConfigVersionSerializer, UIDashboardLayoutSerializer,
    GlobalSearchConfigurationSerializer
)
from .permissions import create_access_token, configured_permissions
from .search_service import search_erp_records


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all().order_by('id')
    serializer_class = CompanySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'gst_number']

class PlantViewSet(viewsets.ModelViewSet):
    queryset = Plant.objects.all().order_by('id')
    serializer_class = PlantSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['company', 'plant_type', 'is_active']
    search_fields = ['name']

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all().order_by('id')
    serializer_class = DepartmentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['plant', 'is_shared_across_plants']
    search_fields = ['name']

class DesignationViewSet(viewsets.ModelViewSet):
    queryset = Designation.objects.all().order_by('id')
    serializer_class = DesignationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['department', 'hierarchy_level']
    search_fields = ['title']

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all().order_by('id')
    serializer_class = EmployeeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['department', 'designation', 'plant', 'status']
    search_fields = ['name']

class EmployeeDetailViewSet(viewsets.ModelViewSet):
    queryset = EmployeeDetail.objects.all().order_by('id')
    serializer_class = EmployeeDetailSerializer

class EmployeeBankAccountViewSet(viewsets.ModelViewSet):
    queryset = EmployeeBankAccount.objects.all().order_by('id')
    serializer_class = EmployeeBankAccountSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['employee', 'is_primary']

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all().order_by('id')
    serializer_class = RoleSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'remarks']

class EmployeeRoleViewSet(viewsets.ModelViewSet):
    queryset = EmployeeRole.objects.all().order_by('id')
    serializer_class = EmployeeRoleSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['employee', 'role']

class PermissionViewSet(viewsets.ModelViewSet):
    queryset = Permission.objects.all().order_by('id')
    serializer_class = PermissionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['designation', 'role', 'module', 'process_type', 'master_category']

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

@api_view(['POST'])
def login_view(request):
    data = request.data or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    designation_id = data.get('designation_id', '')

    # Ensure a fallback Department exists if structural masters are empty
    dept = Department.objects.first()
    if not dept:
        comp, _ = Company.objects.get_or_create(id='CMP-001', defaults={'name': 'Enterprise Head Office'})
        plant, _ = Plant.objects.get_or_create(id='PLN-001', defaults={'company': comp, 'name': 'Main Production Plant'})
        dept, _ = Department.objects.get_or_create(id='DPT-001', defaults={'plant': plant, 'name': 'Administration & Management'})

    # 1. Check for SuperAdmin credentials
    if username.lower() in ['superadmin', 'admin'] and password in ['SuperAdminPassword123!', 'admin']:
        # Ensure SuperAdmin designation exists
        desig, _ = Designation.objects.get_or_create(
            id='DSG-SUPERADMIN',
            defaults={
                'title': 'Super Administrator',
                'hierarchy_level': 99,
                'department': dept
            }
        )
        # Get all permissions for superadmin or generate all-access matrix
        perms = Permission.objects.filter(designation=desig)
        perm_serializer = PermissionSerializer(perms, many=True)
        return Response({
            'success': True,
            'user': {
                'username': 'superadmin',
                'name': 'System Super Administrator',
                'is_superadmin': True,
            },
            'designation': {
                'id': desig.id,
                'title': desig.title,
                'hierarchy_level': desig.hierarchy_level
            },
            'permissions': perm_serializer.data,
            'token': create_access_token(desig, True),
        })

    if username.lower() in ['superadmin', 'admin']:
        return Response({'success': False, 'error': 'Invalid SuperAdmin credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

    # 2. Check for specific Designation login
    if designation_id:
        try:
            desig = Designation.objects.get(id=designation_id)
            emp = Employee.objects.filter(designation=desig).first()
            emp_name = emp.name if emp else f"User ({desig.title})"
            perms = Permission.objects.filter(
                models.Q(designation=desig) | models.Q(role__employees__employee__designation=desig)
            ).distinct()
            perm_serializer = PermissionSerializer(perms, many=True)
            return Response({
                'success': True,
                'user': {
                    'username': desig.title.lower().replace(' ', '_'),
                    'name': emp_name,
                    'is_superadmin': desig.id == 'DSG-SUPERADMIN' or desig.hierarchy_level >= 99,
                },
                'designation': {
                    'id': desig.id,
                    'title': desig.title,
                    'hierarchy_level': desig.hierarchy_level
                },
                'permissions': perm_serializer.data,
                'token': create_access_token(desig, desig.id == 'DSG-SUPERADMIN' or desig.hierarchy_level >= 99),
            })
        except Designation.DoesNotExist:
            return Response({'error': 'Selected designation not found'}, status=status.HTTP_400_BAD_REQUEST)


    # 3. Default fallback login by employee name or username
    emp = None
    if username:
        emp = Employee.objects.filter(name__icontains=username).first() or Employee.objects.first()
    else:
        emp = Employee.objects.first()

    if emp and emp.designation:
        perms = Permission.objects.filter(
            models.Q(designation=emp.designation) | models.Q(role__employees__employee__designation=emp.designation)
        ).distinct()
        perm_serializer = PermissionSerializer(perms, many=True)
        return Response({
            'success': True,
            'user': {
                'username': emp.name.lower().replace(' ', '_'),
                'name': emp.name,
                'is_superadmin': emp.designation.hierarchy_level >= 99,
            },
            'designation': {
                'id': emp.designation.id,
                'title': emp.designation.title,
                'hierarchy_level': emp.designation.hierarchy_level
            },
            'permissions': perm_serializer.data,
            'token': create_access_token(emp.designation, emp.designation.hierarchy_level >= 99),
        })

    return Response({'success': False, 'error': 'Invalid ERP credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
def sync_designation_permissions(request):
    """
    Allows SuperAdmin to bulk update permissions for a specific designation.
    Payload: { "designation_id": "DSG-...", "permissions": [ {...}, ... ] }
    """
    data = request.data or {}
    designation_id = data.get('designation_id')
    permissions_list = data.get('permissions', [])

    if not designation_id:
        return Response({'error': 'designation_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        desig = Designation.objects.get(id=designation_id)
    except Designation.DoesNotExist:
        return Response({'error': 'Designation not found'}, status=status.HTTP_404_NOT_FOUND)

    # Clear existing permissions for this designation
    Permission.objects.filter(designation=desig).delete()

    created_perms = []
    for item in permissions_list:
        p = Permission.objects.create(
            designation=desig,
            module=item.get('module', 'dashboard'),
            process_type_id=item.get('process_type'),
            master_category_id=item.get('master_category'),
            can_view=item.get('can_view', True),
            can_create=item.get('can_create', False),
            can_edit=item.get('can_edit', False),
            can_delete=item.get('can_delete', False),
            can_approve=item.get('can_approve', False),
        )
        created_perms.append(p)

    return Response({
        'success': True,
        'message': f"Updated {len(created_perms)} permissions for designation '{desig.title}'",
        'permissions': PermissionSerializer(created_perms, many=True).data
    })


class VendorViewSet(viewsets.ModelViewSet):
    queryset = Vendor.objects.all().order_by('id')
    serializer_class = VendorSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'gst_number']

class MachineViewSet(viewsets.ModelViewSet):
    queryset = Machine.objects.all().order_by('id')
    serializer_class = MachineSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['plant', 'department', 'status', 'machine_type_id']
    search_fields = ['name', 'code', 'registration_number', 'fastag_number']

class StorageLocationBlockViewSet(viewsets.ModelViewSet):
    queryset = StorageLocationBlock.objects.all().order_by('id')
    serializer_class = StorageLocationBlockSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['department']

class StorageLocationViewSet(viewsets.ModelViewSet):
    queryset = StorageLocation.objects.all().order_by('id')
    serializer_class = StorageLocationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['plant', 'department', 'status']
    search_fields = ['code']

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all().order_by('id')
    serializer_class = DocumentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['entity_table', 'entity_id', 'uploaded_by']

class ChartOfAccountViewSet(viewsets.ModelViewSet):
    queryset = ChartOfAccount.objects.all().order_by('id')
    serializer_class = ChartOfAccountSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['account_type']
    search_fields = ['code', 'name']


# UI Dynamic Metadata & Central Configuration Control ViewSets

def request_actor(request):
    claims = getattr(request, 'erp_claims', {}) if request else {}
    if claims.get('is_superadmin'):
        return 'System Super Administrator'
    designation = Designation.objects.filter(id=claims.get('designation_id')).values_list('title', flat=True).first()
    return designation or 'ERP Administrator'


def record_audit(config_type, item_id, item_name, action, old_values=None, new_values=None,
                 request=None, module=None, user_name=None):
    try:
        forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '') if request else ''
        ConfigAuditLog.objects.create(
            config_type=config_type,
            module=module or '',
            item_id=str(item_id) if item_id else '',
            item_name=item_name or config_type,
            action=action,
            old_values=old_values,
            new_values=new_values,
            changed_by_name=user_name or request_actor(request),
            ip_address=(forwarded.split(',')[0].strip() if forwarded else request.META.get('REMOTE_ADDR')) if request else None,
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500] if request else '',
            request_id=request.headers.get('X-Request-ID', str(uuid.uuid4())) if request else str(uuid.uuid4()),
        )
    except Exception as e:
        print(f"Audit log error: {e}")

def create_snapshot(config_type, item_id, item_name, snapshot_data, description,
                    user_name='System Super Administrator'):
    try:
        last_ver = ConfigVersion.objects.filter(
            config_type=config_type, item_id=str(item_id),
        ).order_by('-version_number').first()
        next_ver = (last_ver.version_number + 1) if last_ver else 1
        ConfigVersion.objects.create(
            version_number=next_ver,
            config_type=config_type,
            item_id=str(item_id),
            item_name=item_name,
            snapshot_data=snapshot_data,
            description=description,
            created_by_name=user_name
        )
    except Exception as e:
        print(f"Version snapshot error: {e}")


class ConfigAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ConfigAuditLog.objects.all().order_by('-timestamp')
    serializer_class = ConfigAuditLogSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['config_type', 'module', 'action', 'changed_by_name']
    search_fields = ['item_name', 'config_type', 'action', 'changed_by_name']


class ConfigVersionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ConfigVersion.objects.all().order_by('-version_number')
    serializer_class = ConfigVersionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['config_type', 'item_id']
    search_fields = ['config_type', 'item_name', 'description', 'created_by_name']


class AuditModelViewSet(viewsets.ModelViewSet):
    config_type = 'general'

    def get_item_name(self, instance):
        return getattr(instance, 'menu_name', None) or getattr(instance, 'page_name', None) or getattr(instance, 'theme_name', None) or getattr(instance, 'form_name', None) or getattr(instance, 'widget_name', None) or getattr(instance, 'modal_name', None) or getattr(instance, 'layout_name', None) or getattr(instance, 'display_name', None) or getattr(instance, 'field_name', None) or getattr(instance, 'title', None) or str(instance)

    def get_module(self, instance):
        return getattr(instance, 'module', None) or getattr(instance, 'module_code', None) or self.config_type

    def perform_create(self, serializer):
        instance = serializer.save()
        new_val = serializer.data
        name = self.get_item_name(instance)
        actor = request_actor(self.request)
        record_audit(self.config_type, instance.id, name, 'CREATE', old_values=None, new_values=new_val,
                     request=self.request, module=self.get_module(instance), user_name=actor)
        create_snapshot(self.config_type, instance.id, name, new_val, f"Created {name}", actor)

    def perform_update(self, serializer):
        old_inst = self.get_object()
        old_val = self.get_serializer(old_inst).data
        instance = serializer.save()
        new_val = serializer.data
        name = self.get_item_name(instance)
        action = 'UPDATE'
        if 'active' in old_val and old_val.get('active') != new_val.get('active'):
            action = 'ENABLE' if new_val.get('active') else 'DISABLE'
        if self.config_type == 'theme' and new_val.get('active') and not old_val.get('active'):
            action = 'PUBLISH'
        actor = request_actor(self.request)
        record_audit(self.config_type, instance.id, name, action, old_values=old_val, new_values=new_val,
                     request=self.request, module=self.get_module(instance), user_name=actor)
        create_snapshot(self.config_type, instance.id, name, new_val, f"{action.title()} {name}", actor)

    def perform_destroy(self, instance):
        old_val = self.get_serializer(instance).data
        name = self.get_item_name(instance)
        item_id = instance.id
        actor = request_actor(self.request)
        create_snapshot(self.config_type, item_id, name, old_val, f"Before deleting {name}", actor)
        instance.delete()
        record_audit(self.config_type, item_id, name, 'DELETE', old_values=old_val, new_values=None,
                     request=self.request, module=self.get_module(instance), user_name=actor)


class UIMenuViewSet(AuditModelViewSet):
    config_type = 'menu'
    queryset = UIMenu.objects.all().order_by('display_order', 'id')
    serializer_class = UIMenuSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['active', 'module_code', 'parent_menu']
    search_fields = ['menu_name', 'menu_path', 'module_code', 'page_key']

    def get_queryset(self):
        queryset = super().get_queryset()
        claims = getattr(self.request, 'erp_claims', None)
        if not claims or claims.get('is_superadmin'):
            return queryset
        designation_id = claims.get('designation_id')
        role_ids = EmployeeRole.objects.filter(
            employee__designation_id=designation_id
        ).values_list('role_id', flat=True)
        return queryset.filter(
            models.Q(permissions__isnull=True)
            | models.Q(permissions__role__isnull=True, permissions__can_view=True)
            | models.Q(permissions__role_id__in=role_ids, permissions__can_view=True)
        ).distinct()


class UIMenuPermissionViewSet(viewsets.ModelViewSet):
    queryset = UIMenuPermission.objects.all().order_by('id')
    serializer_class = UIMenuPermissionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['menu', 'role', 'can_view']


class UINavbarViewSet(AuditModelViewSet):
    config_type = 'navbar'
    queryset = UINavbar.objects.all().order_by('id')
    serializer_class = UINavbarSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['page_name', 'active']
    search_fields = ['page_name', 'title']


class UIFormViewSet(AuditModelViewSet):
    config_type = 'form'
    queryset = UIForm.objects.all().order_by('id')
    serializer_class = UIFormSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['module', 'active', 'form_name']
    search_fields = ['form_name', 'title', 'module']


class UIFormFieldViewSet(AuditModelViewSet):
    config_type = 'form_field'
    queryset = UIFormField.objects.all().order_by('field_order', 'id')
    serializer_class = UIFormFieldSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['form', 'field_type', 'required', 'active']
    search_fields = ['field_name', 'field_code']


class UIModalViewSet(AuditModelViewSet):
    config_type = 'modal'
    queryset = UIModal.objects.all().order_by('id')
    serializer_class = UIModalSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['active', 'modal_name', 'form']
    search_fields = ['modal_name', 'title']


class UIWidgetViewSet(AuditModelViewSet):
    config_type = 'widget'
    queryset = UIWidget.objects.all().order_by('position', 'id')
    serializer_class = UIWidgetSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['active', 'widget_type']
    search_fields = ['widget_name', 'data_source']

    def get_queryset(self):
        queryset = super().get_queryset().prefetch_related('roles')
        claims = getattr(self.request, 'erp_claims', None)
        if not claims or claims.get('is_superadmin'):
            return queryset
        designation_id = claims.get('designation_id')
        role_ids = EmployeeRole.objects.filter(employee__designation_id=designation_id).values_list('role_id', flat=True)
        allowed_modules = configured_permissions(claims, 'dashboard').filter(can_view=True).exists()
        if not allowed_modules:
            return queryset.none()
        queryset = queryset.filter(models.Q(roles__isnull=True) | models.Q(roles__id__in=role_ids)).distinct()
        permitted_widget_modules = [
            module for module in queryset.exclude(permission_module='').values_list('permission_module', flat=True).distinct()
            if configured_permissions(claims, module).filter(can_view=True).exists()
        ]
        return queryset.filter(models.Q(permission_module='') | models.Q(permission_module__in=permitted_widget_modules))


class UIThemeViewSet(AuditModelViewSet):
    config_type = 'theme'
    queryset = UITheme.objects.all().order_by('id')
    serializer_class = UIThemeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['active']
    search_fields = ['theme_name']


class UIDashboardLayoutViewSet(AuditModelViewSet):
    config_type = 'dashboard_layout'
    queryset = UIDashboardLayout.objects.all().order_by('role_id', 'layout_name')
    serializer_class = UIDashboardLayoutSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['role', 'layout_mode', 'active']
    search_fields = ['layout_name', 'layout_mode']

    def get_queryset(self):
        queryset = super().get_queryset()
        claims = getattr(self.request, 'erp_claims', None)
        if not claims or claims.get('is_superadmin'):
            return queryset
        designation_id = claims.get('designation_id')
        role_ids = EmployeeRole.objects.filter(employee__designation_id=designation_id).values_list('role_id', flat=True)
        return queryset.filter(
            models.Q(role__isnull=True) | models.Q(role_id__in=role_ids)
        ).order_by(models.F('role_id').desc(nulls_last=True), 'layout_name')


class GlobalSearchConfigurationViewSet(AuditModelViewSet):
    config_type = 'search'
    queryset = GlobalSearchConfiguration.objects.all().prefetch_related('roles')
    serializer_class = GlobalSearchConfigurationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['module', 'model_label', 'active', 'match_mode']
    search_fields = ['entity_key', 'display_name', 'module', 'model_label']


@api_view(['GET'])
def global_search_view(request):
    query = request.query_params.get('q', '')
    if len(query.strip()) < 2:
        return Response({'query': query, 'count': 0, 'results': []})
    claims = getattr(request, 'erp_claims', {})
    results = search_erp_records(query, claims, request.query_params.get('limit', 30))
    return Response({'query': query, 'count': len(results), 'results': results})


# Advanced Control System Endpoints: Validation, Where-Used, Impact, Rollback

@api_view(['POST'])
def validate_config(request):
    data = request.data or {}
    config_type = data.get('config_type', '')
    payload = data.get('payload', {})

    errors = []
    warnings = []

    if config_type == 'menu':
        path = payload.get('menu_path', '')
        name = payload.get('menu_name', '')
        if not path.startswith('/'):
            errors.append("Menu route path must start with '/'")
        if not name:
            errors.append("Menu name is required")
        if UIMenu.objects.filter(menu_name=name).exclude(id=payload.get('id')).exists():
            warnings.append(f"A menu named '{name}' already exists.")

    elif config_type == 'form_field':
        code = payload.get('field_code', '')
        if not code:
            errors.append("Field code is required")
        if ' ' in code:
            errors.append("Field code cannot contain spaces")

    elif config_type == 'theme':
        pcolor = payload.get('primary_color', '')
        if not pcolor.startswith('#') and not pcolor.startswith('rgb'):
            warnings.append("Color format should ideally be hex (e.g. #3b82f6) or rgba.")

    is_valid = len(errors) == 0
    return Response({
        'is_valid': is_valid,
        'errors': errors,
        'warnings': warnings
    })


MODULE_LABELS = {
    'dashboard': 'Executive Dashboard', 'user_page': 'User Portal', 'admin': 'Admin Console',
    'structural_masters': 'Structural Masters', 'masters': 'Dynamic Masters (EAV)',
    'dynamic_masters': 'Dynamic Masters (EAV)', 'process_engine': 'Process Engine',
    'workflow': 'Workflow & Approvals', 'journal': 'Journal & Stock Ledger',
    'process_attribute_values': 'Process Attribute Values', 'process_links': 'Process Links',
}


def configuration_usage(config_type, item_id):
    used_in, affected_pages, affected_components = [], [], []

    if config_type in ['form', 'form_field']:
        if config_type == 'form_field':
            field = UIFormField.objects.select_related('form').filter(id=item_id).first()
            form = field.form if field else None
        else:
            form = UIForm.objects.filter(id=item_id).first()
        if form:
            page = MODULE_LABELS.get(form.module, form.module.replace('_', ' ').title())
            affected_pages.append(page)
            affected_components.extend(['Forms', 'Validation'])
            used_in.append({'type': 'Real ERP Form', 'name': form.title, 'module': form.module})
            for modal in UIModal.objects.filter(form=form):
                used_in.append({'type': 'Modal', 'name': modal.title, 'module': form.module})
                affected_components.append('Modals')

    elif config_type == 'modal':
        modal = UIModal.objects.select_related('form').filter(id=item_id).first()
        if modal:
            module = modal.form.module if modal.form else 'admin'
            affected_pages.append(MODULE_LABELS.get(module, module.replace('_', ' ').title()))
            affected_components.append('Modals')
            used_in.append({'type': 'Real ERP Modal', 'name': modal.title, 'module': module})

    elif config_type == 'menu':
        menu = UIMenu.objects.filter(id=item_id).first()
        if menu:
            target_page = MODULE_LABELS.get(menu.page_key or menu.module_code, menu.menu_name)
            affected_pages.extend(['Application Navigation', target_page])
            affected_components.extend(['Sidebar', 'Breadcrumbs', 'Global Search', 'Routing'])
            used_in.append({'type': 'Sidebar Navigation', 'name': menu.menu_name, 'module': menu.module_code})
            used_in.append({'type': 'Real ERP Page Route', 'name': target_page, 'module': menu.module_code})
            for submenu in UIMenu.objects.filter(parent_menu=menu.id):
                used_in.append({'type': 'Child Menu', 'name': submenu.menu_name, 'module': submenu.module_code})

    elif config_type == 'navbar':
        navbar = UINavbar.objects.filter(id=item_id).first()
        if navbar:
            menu = UIMenu.objects.filter(
                models.Q(module_code=navbar.page_name) | models.Q(menu_path=f'/{navbar.page_name}')
            ).first()
            page = menu.menu_name if menu else MODULE_LABELS.get(navbar.page_name, navbar.page_name.replace('-', ' ').title())
            affected_pages.append(page)
            affected_components.extend(['Top Navbar', 'Global Search', 'Notifications', 'User Profile'])
            used_in.append({'type': 'Real Page Navbar', 'name': page, 'module': navbar.page_name})

    elif config_type == 'widget':
        widget = UIWidget.objects.filter(id=item_id).first()
        if widget:
            affected_pages.append('Executive Dashboard')
            affected_components.extend(['Dashboard Widgets', 'KPI Grid', 'Role Visibility', 'Responsive Layout'])
            used_in.append({'type': 'Executive Dashboard Widget', 'name': widget.widget_name, 'module': 'dashboard'})

    elif config_type == 'dashboard_layout':
        layout = UIDashboardLayout.objects.select_related('role').filter(id=item_id).first()
        if layout:
            affected_pages.append('Executive Dashboard')
            affected_components.extend(['Dashboard Grid', 'Responsive Columns', 'Widget Spacing'])
            audience = layout.role.name if layout.role else 'All roles'
            used_in.append({'type': 'Dashboard Layout', 'name': f'{layout.layout_name} — {audience}', 'module': 'dashboard'})

    elif config_type == 'search':
        search_config = GlobalSearchConfiguration.objects.filter(id=item_id).first()
        if search_config:
            page = MODULE_LABELS.get(search_config.module, search_config.module.replace('_', ' ').title())
            affected_pages.extend(['Application Navigation', page])
            affected_components.extend(['Top Navbar', 'Global Record Search', 'Permission Filtering'])
            used_in.append({'type': 'Database Search Entity', 'name': search_config.display_name, 'module': search_config.module})

    elif config_type == 'theme':
        theme = UITheme.objects.filter(id=item_id).first()
        if theme:
            affected_pages.extend(list(UIMenu.objects.filter(active=True).values_list('menu_name', flat=True)))
            affected_pages.append('Login')
            affected_components.extend(['Global Theme', 'Forms', 'Tables', 'Navbar', 'Sidebar', 'Login', 'Dashboard Widgets'])
            used_in.extend(
                {'type': 'Global Theme Consumer', 'name': page, 'module': 'all'} for page in affected_pages
            )

    return {
        'used_in': used_in,
        'affected_pages': list(dict.fromkeys(affected_pages)),
        'affected_components': list(dict.fromkeys(affected_components)),
    }


@api_view(['GET'])
def where_used_view(request):
    config_type = request.query_params.get('config_type', '')
    item_id = request.query_params.get('item_id', '')
    usage = configuration_usage(config_type, item_id)
    return Response({
        'config_type': config_type, 'item_id': item_id,
        'total_references': len(usage['used_in']), **usage,
    })


@api_view(['GET'])
def config_impact_view(request):
    config_type = request.query_params.get('config_type', '')
    item_id = request.query_params.get('item_id', '')

    usage = configuration_usage(config_type, item_id)
    impact = {component: 1 for component in usage['affected_components']}
    total_impact = len(usage['affected_pages']) + len(usage['affected_components'])
    return Response({
        'config_type': config_type,
        'item_id': item_id,
        'total_impact': total_impact,
        'affected_page_count': len(usage['affected_pages']),
        'affected_pages': usage['affected_pages'],
        'affected_components': usage['affected_components'],
        'impact_breakdown': impact,
        'connected_to_live_pages': bool(usage['affected_pages']),
    })


@api_view(['POST'])
def config_rollback_view(request):
    data = request.data or {}
    version_id = data.get('version_id')

    if not version_id:
        return Response({'error': 'version_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    ver = ConfigVersion.objects.filter(id=version_id).first()
    if not ver:
        return Response({'error': 'Version snapshot not found'}, status=status.HTTP_404_NOT_FOUND)

    config_type = ver.config_type
    snapshot = ver.snapshot_data or {}
    item_id = ver.item_id or snapshot.get('id')
    registry = {
        'menu': (UIMenu, UIMenuSerializer),
        'navbar': (UINavbar, UINavbarSerializer),
        'theme': (UITheme, UIThemeSerializer),
        'form': (UIForm, UIFormSerializer),
        'form_field': (UIFormField, UIFormFieldSerializer),
        'modal': (UIModal, UIModalSerializer),
        'widget': (UIWidget, UIWidgetSerializer),
        'dashboard_layout': (UIDashboardLayout, UIDashboardLayoutSerializer),
        'search': (GlobalSearchConfiguration, GlobalSearchConfigurationSerializer),
    }
    model_serializer = registry.get(config_type)
    instance = model_serializer[0].objects.filter(id=item_id).first() if model_serializer and item_id else None

    if instance:
        serializer_class = model_serializer[1]
        current = serializer_class(instance).data
        name = ver.item_name or str(instance)
        actor = request_actor(request)
        create_snapshot(config_type, item_id, name, current,
                        f"Before rollback to Version #{ver.version_number}", actor)
        serializer = serializer_class(instance, data=snapshot, partial=True)
        if not serializer.is_valid():
            return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        restored_instance = serializer.save()
        restored_snapshot = serializer_class(restored_instance).data
        record_audit(config_type, item_id, name, 'ROLLBACK', old_values=current,
                     new_values=restored_snapshot, request=request,
                     module=getattr(restored_instance, 'module', config_type), user_name=actor)
        create_snapshot(config_type, item_id, name, restored_snapshot,
                        f"Rolled back to Version #{ver.version_number}", actor)
        return Response({
            'success': True,
            'message': f"Successfully restored {config_type} to Version #{ver.version_number}",
            'restored': restored_snapshot,
        })
    return Response({'error': 'Could not restore snapshot data; the configured item no longer exists.'}, status=status.HTTP_400_BAD_REQUEST)


