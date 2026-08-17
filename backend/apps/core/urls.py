from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CompanyViewSet, PlantViewSet, DepartmentViewSet, DesignationViewSet,
    EmployeeViewSet, EmployeeDetailViewSet, EmployeeBankAccountViewSet,
    RoleViewSet, EmployeeRoleViewSet, PermissionViewSet, VendorViewSet,
    MachineViewSet, StorageLocationBlockViewSet, StorageLocationViewSet,
    DocumentViewSet, ChartOfAccountViewSet, login_view, sync_designation_permissions,
    UIMenuViewSet, UIMenuPermissionViewSet, UINavbarViewSet,
    UIFormViewSet, UIFormFieldViewSet, UIModalViewSet,
    UIWidgetViewSet, UIThemeViewSet,
    ConfigAuditLogViewSet, ConfigVersionViewSet, UIDashboardLayoutViewSet,
    GlobalSearchConfigurationViewSet, global_search_view,
    validate_config, where_used_view, config_impact_view, config_rollback_view
)

router = DefaultRouter()
router.register(r'companies', CompanyViewSet)
router.register(r'plants', PlantViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'designations', DesignationViewSet)
router.register(r'employees', EmployeeViewSet)
router.register(r'employee-details', EmployeeDetailViewSet)
router.register(r'employee-bank-accounts', EmployeeBankAccountViewSet)
router.register(r'roles', RoleViewSet)
router.register(r'employee-roles', EmployeeRoleViewSet)
router.register(r'permissions', PermissionViewSet)
router.register(r'vendors', VendorViewSet)
router.register(r'machines', MachineViewSet)
router.register(r'storage-blocks', StorageLocationBlockViewSet)
router.register(r'storage-locations', StorageLocationViewSet)
router.register(r'documents', DocumentViewSet)
router.register(r'chart-of-accounts', ChartOfAccountViewSet)

# UI Metadata & Configuration Control Routes
router.register(r'ui-menus', UIMenuViewSet)
router.register(r'ui-menu-permissions', UIMenuPermissionViewSet)
router.register(r'ui-navbars', UINavbarViewSet)
router.register(r'ui-forms', UIFormViewSet)
router.register(r'ui-form-fields', UIFormFieldViewSet)
router.register(r'ui-modals', UIModalViewSet)
router.register(r'ui-widgets', UIWidgetViewSet)
router.register(r'ui-themes', UIThemeViewSet)
router.register(r'ui-audit-logs', ConfigAuditLogViewSet)
router.register(r'ui-config-versions', ConfigVersionViewSet)
router.register(r'ui-dashboard-layouts', UIDashboardLayoutViewSet)
router.register(r'ui-search-configurations', GlobalSearchConfigurationViewSet)

urlpatterns = [
    path('login/', login_view, name='api-login'),
    path('sync-permissions/', sync_designation_permissions, name='api-sync-permissions'),
    path('ui-config-validate/', validate_config, name='api-ui-config-validate'),
    path('ui-where-used/', where_used_view, name='api-ui-where-used'),
    path('ui-config-impact/', config_impact_view, name='api-ui-config-impact'),
    path('ui-config-rollback/', config_rollback_view, name='api-ui-config-rollback'),
    path('global-search/', global_search_view, name='api-global-search'),
    path('', include(router.urls)),
]


