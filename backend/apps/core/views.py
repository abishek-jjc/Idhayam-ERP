from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Company, Plant, Department, Designation, Employee, EmployeeDetail,
    EmployeeBankAccount, Role, EmployeeRole, Permission, Vendor, Machine,
    StorageLocationBlock, StorageLocation, Document, ChartOfAccount,
    UIMenu, UIMenuPermission, UINavbar, UIForm, UIFormField, UIModal, UIWidget, UITheme
)
from .serializers import (
    CompanySerializer, PlantSerializer, DepartmentSerializer, DesignationSerializer,
    EmployeeSerializer, EmployeeDetailSerializer, EmployeeBankAccountSerializer,
    RoleSerializer, EmployeeRoleSerializer, PermissionSerializer, VendorSerializer,
    MachineSerializer, StorageLocationBlockSerializer, StorageLocationSerializer,
    DocumentSerializer, ChartOfAccountSerializer,
    UIMenuSerializer, UIMenuPermissionSerializer, UINavbarSerializer,
    UIFormSerializer, UIFormFieldSerializer, UIModalSerializer,
    UIWidgetSerializer, UIThemeSerializer
)

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
    if (username.lower() in ['superadmin', 'admin'] and (password == 'SuperAdminPassword123!' or password == 'admin' or not password)) or username.lower() == 'superadmin':
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
        })

    # 2. Check for specific Designation login
    if designation_id:
        try:
            desig = Designation.objects.get(id=designation_id)
            emp = Employee.objects.filter(designation=desig).first()
            emp_name = emp.name if emp else f"User ({desig.title})"
            perms = Permission.objects.filter(designation=desig)
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
        perms = Permission.objects.filter(designation=emp.designation)
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
        })

    return Response({
        'success': True,
        'user': {
            'username': 'operator',
            'name': 'Default Enterprise Operator',
            'is_superadmin': False,
        },
        'designation': None,
        'permissions': []
    })

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


# UI Dynamic Metadata ViewSets

class UIMenuViewSet(viewsets.ModelViewSet):
    queryset = UIMenu.objects.all().order_by('display_order', 'id')
    serializer_class = UIMenuSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['active', 'module_code', 'parent_menu']
    search_fields = ['menu_name', 'menu_path', 'module_code']


class UIMenuPermissionViewSet(viewsets.ModelViewSet):
    queryset = UIMenuPermission.objects.all().order_by('id')
    serializer_class = UIMenuPermissionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['menu', 'role', 'can_view']


class UINavbarViewSet(viewsets.ModelViewSet):
    queryset = UINavbar.objects.all().order_by('id')
    serializer_class = UINavbarSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['page_name', 'active']
    search_fields = ['page_name', 'title']


class UIFormViewSet(viewsets.ModelViewSet):
    queryset = UIForm.objects.all().order_by('id')
    serializer_class = UIFormSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['module', 'active', 'form_name']
    search_fields = ['form_name', 'title', 'module']


class UIFormFieldViewSet(viewsets.ModelViewSet):
    queryset = UIFormField.objects.all().order_by('field_order', 'id')
    serializer_class = UIFormFieldSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['form', 'field_type', 'required', 'active']
    search_fields = ['field_name', 'field_code']


class UIModalViewSet(viewsets.ModelViewSet):
    queryset = UIModal.objects.all().order_by('id')
    serializer_class = UIModalSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['active', 'modal_name', 'form']
    search_fields = ['modal_name', 'title']


class UIWidgetViewSet(viewsets.ModelViewSet):
    queryset = UIWidget.objects.all().order_by('position', 'id')
    serializer_class = UIWidgetSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['active', 'widget_type']
    search_fields = ['widget_name', 'data_source']


class UIThemeViewSet(viewsets.ModelViewSet):
    queryset = UITheme.objects.all().order_by('id')
    serializer_class = UIThemeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['active']
    search_fields = ['theme_name']

