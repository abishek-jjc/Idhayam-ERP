from django.core import signing
from django.db.models import Q
from rest_framework.permissions import BasePermission, SAFE_METHODS

from .models import Permission


TOKEN_SALT = 'idhayam-erp-access'
TOKEN_MAX_AGE_SECONDS = 60 * 60 * 12


def create_access_token(designation, is_superadmin=False):
    return signing.dumps(
        {'designation_id': designation.id if designation else None, 'is_superadmin': bool(is_superadmin)},
        salt=TOKEN_SALT,
        compress=True,
    )


def configured_permissions(claims, module):
    if not claims or not claims.get('designation_id'):
        return Permission.objects.none()
    designation_id = claims['designation_id']
    return Permission.objects.filter(
        Q(designation_id=designation_id) | Q(role__employees__employee__designation_id=designation_id),
        Q(module=module) | Q(module='all'),
    ).distinct()


class ERPModulePermission(BasePermission):
    """Enforce the Admin Console permission matrix at the API boundary."""

    message = 'Your ERP role does not allow this operation.'

    def _claims(self, request):
        header = request.headers.get('Authorization', '')
        if not header.startswith('Bearer '):
            return None
        try:
            return signing.loads(
                header[7:], salt=TOKEN_SALT, max_age=TOKEN_MAX_AGE_SECONDS,
            )
        except signing.BadSignature:
            return None

    def _module_for_path(self, path):
        if path.startswith('/api/core/ui-') or path.startswith('/api/core/permissions') or path.startswith('/api/core/roles') or path.startswith('/api/core/employee-roles') or path.startswith('/api/core/sync-permissions'):
            return 'admin'
        if path.startswith('/api/core/'):
            return 'structural_masters'
        if path.startswith('/api/masters/'):
            return 'dynamic_masters'
        if path.startswith('/api/process/') or path.startswith('/api/process-'):
            return 'process_engine'
        if path.startswith('/api/workflow/'):
            return 'workflow'
        if path.startswith('/api/journal/'):
            return 'journal'
        if path.startswith('/api/notifications/'):
            return 'dashboard'
        return None

    def has_permission(self, request, view):
        path = request.path
        if path == '/api/core/login/':
            return True
        if path == '/api/core/global-search/':
            claims = self._claims(request)
            if not claims:
                self.message = 'A valid ERP login token is required.'
                return False
            request.erp_claims = claims
            return True
        # Authenticated users may read filtered runtime configuration. Only basic
        # branding/navigation metadata is public for the login shell.
        if request.method in SAFE_METHODS and path.startswith('/api/core/ui-'):
            claims = self._claims(request)
            if claims:
                request.erp_claims = claims
                return True
            return (
                path.startswith('/api/core/ui-menus/')
                or path.startswith('/api/core/ui-navbars/')
                or path.startswith('/api/core/ui-themes/')
            )
        if request.method in SAFE_METHODS and path.startswith('/api/core/designations/'):
            return True

        claims = self._claims(request)
        if not claims:
            self.message = 'A valid ERP login token is required.'
            return False
        request.erp_claims = claims
        if claims.get('is_superadmin'):
            return True

        designation_id = claims.get('designation_id')
        module = self._module_for_path(path)
        if not designation_id or not module:
            return False

        action_field = {
            'GET': 'can_view',
            'HEAD': 'can_view',
            'OPTIONS': 'can_view',
            'POST': 'can_create',
            'PUT': 'can_edit',
            'PATCH': 'can_edit',
            'DELETE': 'can_delete',
        }.get(request.method)
        if module == 'workflow' and request.method in ['PUT', 'PATCH'] and request.data.get('status') in ['approved', 'rejected']:
            action_field = 'can_approve'
        if path.startswith('/api/process/verifications/') and request.method == 'POST':
            action_field = 'can_approve'
        if not action_field:
            return False

        permissions = configured_permissions(claims, module)
        permissions = permissions.filter(**{action_field: True})

        if module == 'process_engine':
            process_type_id = request.data.get('process_type')
            if process_type_id:
                permissions = permissions.filter(Q(process_type__isnull=True) | Q(process_type_id=process_type_id))
        if module == 'dynamic_masters':
            category_id = request.data.get('master_category') or request.data.get('category')
            if category_id:
                permissions = permissions.filter(Q(master_category__isnull=True) | Q(master_category_id=category_id))
        return permissions.exists()

    def has_object_permission(self, request, view, obj):
        claims = getattr(request, 'erp_claims', None) or self._claims(request)
        if not claims:
            return False
        if claims.get('is_superadmin'):
            return True
        module = self._module_for_path(request.path)
        action_field = {
            'GET': 'can_view', 'HEAD': 'can_view', 'OPTIONS': 'can_view',
            'PUT': 'can_edit', 'PATCH': 'can_edit', 'DELETE': 'can_delete',
        }.get(request.method)
        if not module or not action_field:
            return False
        if module == 'workflow' and request.method in ['PUT', 'PATCH'] and request.data.get('status') in ['approved', 'rejected']:
            action_field = 'can_approve'
        permissions = configured_permissions(claims, module).filter(**{action_field: True})

        if module == 'process_engine':
            process_type_id = getattr(obj, 'process_type_id', None)
            if process_type_id is None and hasattr(obj, 'process_instance'):
                process_type_id = getattr(obj.process_instance, 'process_type_id', None)
            if process_type_id is None and hasattr(obj, 'from_process_instance'):
                process_type_id = getattr(obj.from_process_instance, 'process_type_id', None)
            if process_type_id:
                permissions = permissions.filter(Q(process_type__isnull=True) | Q(process_type_id=process_type_id))

        if module == 'dynamic_masters':
            category_id = getattr(obj, 'master_category_id', None) or getattr(obj, 'category_id', None)
            if category_id is None and hasattr(obj, 'master_item'):
                category_id = getattr(obj.master_item, 'category_id', None)
            if category_id is None and hasattr(obj, 'master_instance'):
                category_id = getattr(obj.master_instance, 'master_category_id', None)
            if category_id:
                permissions = permissions.filter(Q(master_category__isnull=True) | Q(master_category_id=category_id))
        return permissions.exists()
