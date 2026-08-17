from django.test import TestCase
from rest_framework.test import APIClient

from apps.process_engine.models import ProcessType
from .models import (
    Company, Department, Designation, Employee, EmployeeRole, Permission, Plant, Role,
    UIMenu, UITheme, UIWidget, UIDashboardLayout, GlobalSearchConfiguration,
    ConfigAuditLog, ConfigVersion, UIForm, UIFormField,
)
from .permissions import create_access_token


class CentralConfigurationIntegrationTests(TestCase):
    def setUp(self):
        self.company = Company.objects.create(id='CMP-TEST', name='Test Company')
        self.plant = Plant.objects.create(id='PLN-TEST', company=self.company, name='Test Plant')
        self.department = Department.objects.create(id='DPT-TEST', plant=self.plant, name='Test Department')
        self.user_designation = Designation.objects.create(
            id='DSG-USER-TEST', department=self.department, title='Test Operator', hierarchy_level=1,
        )
        self.admin_designation = Designation.objects.create(
            id='DSG-ADMIN-TEST', department=self.department, title='Test Admin', hierarchy_level=99,
        )
        self.client = APIClient()

    def authorize(self, designation, superadmin=False):
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {create_access_token(designation, superadmin)}'
        )

    def test_backend_rejects_unauthorized_mutations(self):
        Permission.objects.create(
            id='PRM-STRUCT-TEST', designation=self.user_designation,
            module='structural_masters', can_view=True, can_create=False,
        )
        self.authorize(self.user_designation)
        self.assertEqual(self.client.get('/api/core/plants/').status_code, 200)
        response = self.client.post('/api/core/plants/', {'name': 'Blocked Plant'}, format='json')
        self.assertEqual(response.status_code, 403)

    def test_process_configuration_filters_the_real_endpoint(self):
        allowed = ProcessType.objects.create(id='PCT-ALLOW', code='allowed', name='Allowed Process')
        ProcessType.objects.create(id='PCT-DENY', code='denied', name='Denied Process')
        Permission.objects.create(
            id='PRM-PROCESS-TEST', designation=self.user_designation,
            module='process_engine', process_type=allowed, can_view=True,
        )
        self.authorize(self.user_designation)
        response = self.client.get('/api/process/types/')
        self.assertEqual(response.status_code, 200)
        results = response.data.get('results', response.data)
        self.assertEqual([item['id'] for item in results], [allowed.id])

    def test_impact_reports_real_consumers(self):
        menu = UIMenu.objects.create(
            id='MNU-TEST', menu_name='Employee Portal', menu_path='/employee',
            module_code='user_page', page_key='user_page', active=True,
        )
        self.authorize(self.admin_designation, True)
        response = self.client.get('/api/core/ui-config-impact/', {
            'config_type': 'menu', 'item_id': menu.id,
        })
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['connected_to_live_pages'])
        self.assertIn('User Portal', response.data['affected_pages'])
        self.assertIn('Global Search', response.data['affected_components'])

    def test_only_one_theme_can_be_active(self):
        first = UITheme.objects.create(id='THM-FIRST', theme_name='First', active=True)
        second = UITheme.objects.create(id='THM-SECOND', theme_name='Second', active=True)
        first.refresh_from_db()
        second.refresh_from_db()
        self.assertFalse(first.active)
        self.assertTrue(second.active)
        self.assertEqual(UITheme.objects.filter(active=True).count(), 1)

    def test_widget_impact_and_refresh_configuration_are_persisted(self):
        widget = UIWidget.objects.create(
            id='WGT-TEST', widget_name='Sales Summary', position=2,
            grid_width='col-span-2', refresh_interval=30, active=True,
        )
        self.authorize(self.admin_designation, True)
        response = self.client.get('/api/core/ui-config-impact/', {
            'config_type': 'widget', 'item_id': widget.id,
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['affected_pages'], ['Executive Dashboard'])
        self.assertEqual(UIWidget.objects.get(pk=widget.pk).refresh_interval, 30)

    def test_global_search_returns_real_records_and_respects_module_permission(self):
        Employee.objects.create(
            id='EMP-SEARCH-001', name='Arun Searchable', plant=self.plant,
            department=self.department, designation=self.user_designation,
        )
        GlobalSearchConfiguration.objects.update_or_create(
            entity_key='employees', defaults={
                'display_name': 'Employees', 'module': 'structural_masters',
                'model_label': 'core.Employee', 'searchable_fields': ['id', 'name'],
                'display_fields': ['name', 'id'], 'status_field': 'status',
                'route': '/structural-masters', 'active': True,
            },
        )
        self.authorize(self.user_designation)
        denied = self.client.get('/api/core/global-search/', {'q': 'Arun'})
        self.assertEqual(denied.status_code, 200)
        self.assertEqual(denied.data['results'], [])
        Permission.objects.create(
            id='PRM-SEARCH-TEST', designation=self.user_designation,
            module='structural_masters', can_view=True,
        )
        allowed = self.client.get('/api/core/global-search/', {'q': 'Arun'})
        self.assertEqual(allowed.data['results'][0]['record_id'], 'EMP-SEARCH-001')
        self.assertEqual(allowed.data['results'][0]['route'], '/structural-masters?record=EMP-SEARCH-001')

    def test_dashboard_layout_and_widget_role_visibility_are_runtime_filtered(self):
        role = Role.objects.create(id='ROL-DASH-TEST', name='Dashboard Operator')
        employee = Employee.objects.create(
            id='EMP-DASH-TEST', name='Dashboard User', plant=self.plant,
            department=self.department, designation=self.user_designation,
        )
        EmployeeRole.objects.create(id='EMR-DASH-TEST', employee=employee, role=role)
        Permission.objects.create(id='PRM-DASH-TEST', designation=self.user_designation, module='dashboard', can_view=True)
        layout = UIDashboardLayout.objects.create(id='DBL-ROLE-TEST', layout_name='Compact Operators', role=role, layout_mode='compact', desktop_columns=6)
        visible = UIWidget.objects.create(id='WGT-ROLE-YES', widget_name='Visible Widget', active=True)
        hidden_role = Role.objects.create(id='ROL-DASH-OTHER', name='Other Dashboard Role')
        hidden = UIWidget.objects.create(id='WGT-ROLE-NO', widget_name='Hidden Widget', active=True)
        visible.roles.add(role)
        hidden.roles.add(hidden_role)
        self.authorize(self.user_designation)
        widgets = self.client.get('/api/core/ui-widgets/?active=true').data
        widgets = widgets.get('results', widgets)
        self.assertEqual([item['id'] for item in widgets], [visible.id])
        layouts = self.client.get('/api/core/ui-dashboard-layouts/?active=true').data
        layouts = layouts.get('results', layouts)
        self.assertEqual(layouts[0]['id'], layout.id)

    def test_form_rules_are_persisted_for_the_live_renderer(self):
        form = UIForm.objects.create(id='FRM-RULE-TEST', form_name='rule_test', module='masters', title='Rule Test')
        field = UIFormField.objects.create(
            id='FLD-RULE-TEST', form=form, field_name='Asset Code', field_code='asset_code',
            placeholder='ABC-123', help_text='Use the corporate asset code',
            validation_regex=r'^[A-Z]{3}-\d{3}$', validation_message='Use ABC-123 format',
            min_length=7, max_length=7, read_only=True,
            conditional_field='asset_type', conditional_value='machine', column_span=2,
        )
        self.assertEqual(field.column_span, 2)
        self.assertTrue(field.read_only)
        self.assertEqual(field.validation_message, 'Use ABC-123 format')

    def test_rollback_creates_reversible_versions_and_full_audit_metadata(self):
        widget = UIWidget.objects.create(id='WGT-ROLLBACK', widget_name='Original', active=True)
        self.authorize(self.admin_designation, True)
        self.client.patch('/api/core/ui-widgets/WGT-ROLLBACK/', {'widget_name': 'Version One'}, format='json')
        first_version = ConfigVersion.objects.get(config_type='widget', item_id=widget.id, version_number=1)
        self.client.patch('/api/core/ui-widgets/WGT-ROLLBACK/', {'widget_name': 'Version Two'}, format='json')
        response = self.client.post('/api/core/ui-config-rollback/', {'version_id': first_version.id}, format='json')
        self.assertEqual(response.status_code, 200)
        widget.refresh_from_db()
        self.assertEqual(widget.widget_name, 'Version One')
        self.assertGreaterEqual(ConfigVersion.objects.filter(config_type='widget', item_id=widget.id).count(), 4)
        audit = ConfigAuditLog.objects.filter(config_type='widget', item_id=widget.id, action='ROLLBACK').first()
        self.assertIsNotNone(audit)
        self.assertTrue(audit.request_id)
        self.assertEqual(audit.changed_by_name, 'System Super Administrator')
