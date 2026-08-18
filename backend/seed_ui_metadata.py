import os
import django
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.core.models import UIMenu, UINavbar, UITheme, UIWidget, UIForm, UIFormField, UIModal, Role

def seed():
    print("Seeding ERP v3 UI Metadata...")

    # 1. Clean obsolete standalone process sidebar menus
    UIMenu.objects.filter(menu_path__in=['/process-engine', '/process-attribute-values', '/process-links']).delete()

    # Seed Dynamic Menus
    menus_data = [
        {'menu_name': 'Dashboard', 'menu_path': '/', 'module_code': 'dashboard', 'page_key': 'dashboard', 'menu_icon': 'LayoutDashboard', 'display_order': 1},
        {'menu_name': 'User Portal', 'menu_path': '/user', 'module_code': 'user_page', 'page_key': 'user_page', 'menu_icon': 'UserCheck', 'display_order': 2},
        {'menu_name': 'Admin Console', 'menu_path': '/admin-console', 'module_code': 'admin', 'page_key': 'admin', 'menu_icon': 'ShieldCheck', 'display_order': 3},
        {'menu_name': 'Structural Masters', 'menu_path': '/structural-masters', 'module_code': 'structural_masters', 'page_key': 'structural_masters', 'menu_icon': 'Building2', 'display_order': 4},
        {'menu_name': 'Dynamic Masters (EAV)', 'menu_path': '/dynamic-masters', 'module_code': 'dynamic_masters', 'page_key': 'dynamic_masters', 'menu_icon': 'Layers', 'display_order': 5},
        {'menu_name': 'Process Management', 'menu_path': '/process-management', 'module_code': 'process_management', 'page_key': 'process_management', 'menu_icon': 'Cpu', 'display_order': 6},
        {'menu_name': 'Workflow & Approvals', 'menu_path': '/workflow-approvals', 'module_code': 'workflow', 'page_key': 'workflow', 'menu_icon': 'GitPullRequest', 'display_order': 7},
        {'menu_name': 'Journal & Stock Ledger', 'menu_path': '/journal-stock', 'module_code': 'journal', 'page_key': 'journal', 'menu_icon': 'BookOpenCheck', 'display_order': 8},
    ]

    for m in menus_data:
        UIMenu.objects.update_or_create(
            menu_path=m['menu_path'],
            defaults=m
        )

    # 2. Seed Navbars
    navbars_data = [
        {'page_name': 'default', 'title': 'ERP v3 Enterprise Platform', 'icon': 'Layers', 'show_search': True, 'show_notification': True, 'show_profile': True, 'show_logout': True},
        {'page_name': 'dashboard', 'title': 'Executive Intelligence Dashboard', 'icon': 'LayoutDashboard', 'show_search': True, 'show_notification': True, 'show_profile': True, 'show_logout': True},
        {'page_name': 'admin-console', 'title': 'UI Configuration Console & Metadata Studio', 'icon': 'ShieldCheck', 'show_search': True, 'show_notification': True, 'show_profile': True, 'show_logout': True},
        {'page_name': 'process-management', 'title': 'Runtime Process Instance Management & Execution', 'icon': 'Cpu', 'show_search': True, 'show_notification': True, 'show_profile': True, 'show_logout': True},
    ]

    for n in navbars_data:
        UINavbar.objects.get_or_create(
            page_name=n['page_name'],
            defaults=n
        )

    # 3. Seed Themes
    themes_data = [
        {
            'theme_name': 'Enterprise Blue (Corporate)',
            'primary_color': '#1B4E9B',
            'secondary_color': '#9C9D9E',
            'background_color': '#F8FAFC',
            'card_bg_color': '#FFFFFF',
            'text_color': '#1e293b',
            'border_color': '#cbd5e1',
            'active': True
        },
        {
            'theme_name': 'Dark (Glassmorphism)',
            'primary_color': '#3b82f6',
            'secondary_color': '#6366f1',
            'background_color': '#0b0f19',
            'card_bg_color': 'rgba(15, 23, 42, 0.75)',
            'text_color': '#f8fafc',
            'border_color': 'rgba(255, 255, 255, 0.1)',
            'active': False
        },
        {
            'theme_name': 'Light Corporate',
            'primary_color': '#2563eb',
            'secondary_color': '#4f46e5',
            'background_color': '#f8fafc',
            'card_bg_color': '#ffffff',
            'text_color': '#0f172a',
            'border_color': '#e2e8f0',
            'active': False
        },
        {
            'theme_name': 'Cyberpunk Blue',
            'primary_color': '#06b6d4',
            'secondary_color': '#3b82f6',
            'background_color': '#030712',
            'card_bg_color': 'rgba(17, 24, 39, 0.8)',
            'text_color': '#ecfeff',
            'border_color': 'rgba(6, 182, 212, 0.25)',
            'active': False
        }
    ]

    for t in themes_data:
        UITheme.objects.update_or_create(
            theme_name=t['theme_name'],
            defaults=t
        )

    # 4. Seed Dashboard Widgets
    widgets_data = [
        {'widget_name': 'Active Employees', 'widget_type': 'kpi', 'data_source': '/api/core/employees/', 'position': 1, 'grid_width': 'col-span-1'},
        {'widget_name': 'Registered Machines', 'widget_type': 'kpi', 'data_source': '/api/core/machines/', 'position': 2, 'grid_width': 'col-span-1'},
        {'widget_name': 'Pending Workflow Approvals', 'widget_type': 'kpi', 'data_source': '/api/workflow/steps/', 'position': 3, 'grid_width': 'col-span-1'},
        {'widget_name': 'Process Executions', 'widget_type': 'kpi', 'data_source': '/api/process/instances/', 'position': 4, 'grid_width': 'col-span-1'},
        {'widget_name': 'Process Flow Visualization', 'widget_type': 'shortcut', 'data_source': '/admin-console', 'position': 5, 'grid_width': 'col-span-2'},
        {'widget_name': 'Recent System Activity', 'widget_type': 'list', 'data_source': '/api/process/instances/', 'position': 6, 'grid_width': 'col-span-2'},
    ]

    for w in widgets_data:
        UIWidget.objects.get_or_create(
            widget_name=w['widget_name'],
            defaults=w
        )

    # 5. Seed Universal Forms Registry
    forms_list = [
        {
            'form_name': 'add_employee_modal_form',
            'module': 'core',
            'title': 'Add New Employee Form',
            'description': 'Configurable form for registering workforce employees.',
            'fields': [
                {'field_name': 'Employee Name', 'field_code': 'name', 'field_type': 'text', 'required': True, 'field_order': 1},
                {'field_name': 'Department Unit', 'field_code': 'department', 'field_type': 'reference', 'reference_table': 'departments', 'required': False, 'field_order': 2},
                {'field_name': 'Designation Role', 'field_code': 'designation', 'field_type': 'reference', 'reference_table': 'designations', 'required': False, 'field_order': 3},
                {'field_name': 'Assigned Plant', 'field_code': 'plant', 'field_type': 'reference', 'reference_table': 'plants', 'required': False, 'field_order': 4},
                {'field_name': 'Shift Preference', 'field_code': 'shift', 'field_type': 'select', 'options': 'Morning,Evening,Night', 'required': False, 'field_order': 5},
                {'field_name': 'Official Email', 'field_code': 'email', 'field_type': 'email', 'required': True, 'field_order': 6},
                {'field_name': 'Contact Phone', 'field_code': 'phone', 'field_type': 'phone', 'required': False, 'field_order': 7},
            ]
        },
        {
            'form_name': 'add_company_form',
            'module': 'core',
            'title': 'Legal Entity & Company Form',
            'description': 'Registration form for legal entities and parent companies.',
            'fields': [
                {'field_name': 'Company Name', 'field_code': 'name', 'field_type': 'text', 'required': True, 'field_order': 1},
                {'field_name': 'GST Number', 'field_code': 'gst_number', 'field_type': 'text', 'required': False, 'field_order': 2},
                {'field_name': 'PAN Number', 'field_code': 'pan_number', 'field_type': 'text', 'required': False, 'field_order': 3},
            ]
        },
        {
            'form_name': 'add_plant_form',
            'module': 'core',
            'title': 'Manufacturing Plant Location Form',
            'description': 'Configuration form for operational units and manufacturing plants.',
            'fields': [
                {'field_name': 'Plant Code', 'field_code': 'code', 'field_type': 'text', 'required': True, 'field_order': 1},
                {'field_name': 'Plant Name', 'field_code': 'name', 'field_type': 'text', 'required': True, 'field_order': 2},
                {'field_name': 'Parent Company', 'field_code': 'company', 'field_type': 'reference', 'reference_table': 'companies', 'required': False, 'field_order': 3},
                {'field_name': 'Plant Type', 'field_code': 'plant_type', 'field_type': 'select', 'options': 'Manufacturing,Processing,Warehouse,Distribution', 'required': True, 'field_order': 4},
                {'field_name': 'Location Address', 'field_code': 'address', 'field_type': 'textarea', 'required': False, 'field_order': 5},
            ]
        },
        {
            'form_name': 'add_department_form',
            'module': 'core',
            'title': 'Add Department Form',
            'description': 'Configuration form for operational departments.',
            'fields': [
                {'field_name': 'Department Code', 'field_code': 'code', 'field_type': 'text', 'required': True, 'field_order': 1},
                {'field_name': 'Department Name', 'field_code': 'name', 'field_type': 'text', 'required': True, 'field_order': 2},
                {'field_name': 'Plant Unit', 'field_code': 'plant', 'field_type': 'reference', 'reference_table': 'plants', 'required': False, 'field_order': 3},
                {'field_name': 'Shared Across Plants', 'field_code': 'is_shared_across_plants', 'field_type': 'boolean', 'required': False, 'field_order': 4},
            ]
        },
        {
            'form_name': 'add_designation_form',
            'module': 'core',
            'title': 'Add Designation Form',
            'description': 'Configuration form for workforce designations.',
            'fields': [
                {'field_name': 'Designation Title', 'field_code': 'title', 'field_type': 'text', 'required': True, 'field_order': 1},
                {'field_name': 'Department Unit', 'field_code': 'department', 'field_type': 'reference', 'reference_table': 'departments', 'required': False, 'field_order': 2},
                {'field_name': 'Hierarchy Level', 'field_code': 'hierarchy_level', 'field_type': 'number', 'required': False, 'field_order': 3},
                {'field_name': 'Remarks', 'field_code': 'remarks', 'field_type': 'textarea', 'required': False, 'field_order': 4},
            ]
        },
        {
            'form_name': 'add_machine_form',
            'module': 'core',
            'title': 'Add Machine & Equipment Form',
            'description': 'Registration form for plant machines and vehicles.',
            'fields': [
                {'field_name': 'Machine Name', 'field_code': 'name', 'field_type': 'text', 'required': True, 'field_order': 1},
                {'field_name': 'Machine Code', 'field_code': 'code', 'field_type': 'text', 'required': True, 'field_order': 2},
                {'field_name': 'Registration / Serial No', 'field_code': 'registration_number', 'field_type': 'text', 'required': False, 'field_order': 3},
                {'field_name': 'Plant Facility', 'field_code': 'plant', 'field_type': 'reference', 'reference_table': 'plants', 'required': False, 'field_order': 4},
                {'field_name': 'Department Unit', 'field_code': 'department', 'field_type': 'reference', 'reference_table': 'departments', 'required': False, 'field_order': 5},
                {'field_name': 'Status', 'field_code': 'status', 'field_type': 'select', 'options': 'active,maintenance,inactive', 'required': False, 'field_order': 6},
            ]
        },
        {
            'form_name': 'add_vendor_form',
            'module': 'core',
            'title': 'Add Vendor & Supplier Form',
            'description': 'Registration form for external vendors and suppliers.',
            'fields': [
                {'field_name': 'Vendor Name', 'field_code': 'name', 'field_type': 'text', 'required': True, 'field_order': 1},
                {'field_name': 'GSTIN Number', 'field_code': 'gst_number', 'field_type': 'text', 'required': False, 'field_order': 2},
                {'field_name': 'Remarks & Contact Info', 'field_code': 'remarks', 'field_type': 'textarea', 'required': False, 'field_order': 3},
            ]
        },
        {
            'form_name': 'add_storage_location_form',
            'module': 'core',
            'title': 'Add Storage Location Form',
            'description': 'Configuration form for plant storage bins and cold rooms.',
            'fields': [
                {'field_name': 'Location Code', 'field_code': 'code', 'field_type': 'text', 'required': True, 'field_order': 1},
                {'field_name': 'Location Name', 'field_code': 'name', 'field_type': 'text', 'required': True, 'field_order': 2},
                {'field_name': 'Plant Facility', 'field_code': 'plant', 'field_type': 'reference', 'reference_table': 'plants', 'required': False, 'field_order': 3},
                {'field_name': 'Department Unit', 'field_code': 'department', 'field_type': 'reference', 'reference_table': 'departments', 'required': False, 'field_order': 4},
                {'field_name': 'Capacity Unit', 'field_code': 'capacity', 'field_type': 'number', 'required': False, 'field_order': 5},
                {'field_name': 'Remarks', 'field_code': 'remarks', 'field_type': 'textarea', 'required': False, 'field_order': 6},
            ]
        },
        {
            'form_name': 'qc_inspection_form',
            'module': 'process_management',
            'title': 'Quality Control Inspection Form',
            'description': 'Universal quality assurance checklist and parameter form.',
            'fields': [
                {'field_name': 'Moisture Level (%)', 'field_code': 'moisture', 'field_type': 'decimal', 'required': True, 'field_order': 1},
                {'field_name': 'Foreign Matter (%)', 'field_code': 'foreign_matter', 'field_type': 'decimal', 'required': True, 'field_order': 2},
                {'field_name': 'Oil Content (%)', 'field_code': 'oil_content', 'field_type': 'decimal', 'required': False, 'field_order': 3},
                {'field_name': 'Inspection Status', 'field_code': 'qc_status', 'field_type': 'select', 'options': 'Accepted,Conditional Approval,Rejected', 'required': True, 'field_order': 4},
                {'field_name': 'Quality Notes', 'field_code': 'remarks', 'field_type': 'textarea', 'required': False, 'field_order': 5},
            ]
        },
        {
            'form_name': 'process_engine_execution_form',
            'module': 'process_management',
            'title': 'Process Engine Execution Form',
            'description': 'Runtime launcher form for dynamic process execution instances.',
            'fields': [
                {'field_name': 'Execution Remarks', 'field_code': 'remarks', 'field_type': 'textarea', 'required': False, 'field_order': 1},
                {'field_name': 'Target Facility', 'field_code': 'plant', 'field_type': 'reference', 'reference_table': 'plants', 'required': True, 'field_order': 2},
                {'field_name': 'Department Unit', 'field_code': 'department', 'field_type': 'reference', 'reference_table': 'departments', 'required': True, 'field_order': 3},
            ]
        },
        {
            'form_name': 'journal_entry_form',
            'module': 'journal',
            'title': 'Financial Journal Entry Form',
            'description': 'General ledger voucher entry form for double-entry bookkeeping.',
            'fields': [
                {'field_name': 'Voucher Date', 'field_code': 'voucher_date', 'field_type': 'date', 'required': True, 'field_order': 1},
                {'field_name': 'Account Code', 'field_code': 'account_code', 'field_type': 'text', 'required': True, 'field_order': 2},
                {'field_name': 'Debit Amount (₹)', 'field_code': 'debit_amount', 'field_type': 'currency', 'required': False, 'field_order': 3},
                {'field_name': 'Credit Amount (₹)', 'field_code': 'credit_amount', 'field_type': 'currency', 'required': False, 'field_order': 4},
                {'field_name': 'Narration', 'field_code': 'narration', 'field_type': 'textarea', 'required': True, 'field_order': 5},
            ]
        },
        {
            'form_name': 'workflow_proposal_form',
            'module': 'workflow',
            'title': 'Initiate Approval Proposal Form',
            'description': 'Dynamic form for submitting multi-stage approval proposals.',
            'fields': [
                {'field_name': 'Proposal Type Mode', 'field_code': 'proposal_type', 'field_type': 'select', 'options': 'basic,formula_restock,project', 'required': True, 'field_order': 1},
                {'field_name': 'Process Execution Instance', 'field_code': 'process_instance', 'field_type': 'reference', 'reference_table': 'process_instance', 'required': False, 'field_order': 2},
                {'field_name': 'Plant Unit', 'field_code': 'plant', 'field_type': 'reference', 'reference_table': 'plants', 'required': False, 'field_order': 3},
                {'field_name': 'Department Unit', 'field_code': 'department', 'field_type': 'reference', 'reference_table': 'departments', 'required': False, 'field_order': 4},
                {'field_name': 'Vendor Quoting Mode', 'field_code': 'vendor_mode', 'field_type': 'select', 'options': 'single,multiple', 'required': True, 'field_order': 5},
                {'field_name': 'Restock Lead Time (Days)', 'field_code': 'restock_lead_time_days', 'field_type': 'number', 'required': False, 'field_order': 6},
                {'field_name': 'Check Frequency (Hours)', 'field_code': 'frequency_interval_hours', 'field_type': 'number', 'required': False, 'field_order': 7},
                {'field_name': 'Proposal Justification & Remarks', 'field_code': 'remarks', 'field_type': 'textarea', 'required': False, 'field_order': 8},
            ]
        }
    ]

    for form_def in forms_list:
        fields = form_def.pop('fields', [])
        form_obj, _ = UIForm.objects.update_or_create(
            form_name=form_def['form_name'],
            defaults={**form_def, 'active': True}
        )
        for f in fields:
            UIFormField.objects.update_or_create(
                form=form_obj,
                field_code=f['field_code'],
                defaults={**f, 'form': form_obj}
            )

    # 6. Seed Dynamic Modals for all ERP entities
    modal_definitions = [
        {'modal_name': 'add_company_modal', 'title': 'Add Company Modal', 'form_name': 'add_company_form'},
        {'modal_name': 'add_plant_modal', 'title': 'Add Plant Modal', 'form_name': 'add_plant_form'},
        {'modal_name': 'add_department_modal', 'title': 'Add Department Modal', 'form_name': 'add_department_form'},
        {'modal_name': 'add_designation_modal', 'title': 'Add Designation Modal', 'form_name': 'add_designation_form'},
        {'modal_name': 'add_employee_modal', 'title': 'Add New Employee Modal', 'form_name': 'add_employee_modal_form'},
        {'modal_name': 'add_machine_modal', 'title': 'Add Machine / Vehicle Modal', 'form_name': 'add_machine_form'},
        {'modal_name': 'add_vendor_modal', 'title': 'Add Vendor Supplier Modal', 'form_name': 'add_vendor_form'},
        {'modal_name': 'add_storage_location_modal', 'title': 'Add Storage Bin Modal', 'form_name': 'add_storage_location_form'},
        {'modal_name': 'create_process_instance_modal', 'title': 'Create Process Instance Modal', 'form_name': 'process_engine_execution_form'},
        {'modal_name': 'qc_inspection_modal', 'title': 'QC Inspection Audit Modal', 'form_name': 'qc_inspection_form'},
        {'modal_name': 'journal_entry_modal', 'title': 'Financial Journal Entry Modal', 'form_name': 'journal_entry_form'},
        {'modal_name': 'add_proposal_modal', 'title': 'Initiate Approval Proposal Modal', 'form_name': 'workflow_proposal_form'},
    ]

    for m_def in modal_definitions:
        form_obj = UIForm.objects.filter(form_name=m_def['form_name']).first()
        UIModal.objects.update_or_create(
            modal_name=m_def['modal_name'],
            defaults={
                'title': m_def['title'],
                'width': '800px',
                'height': 'auto',
                'submit_text': 'Save Record',
                'cancel_text': 'Cancel',
                'active': True,
                'form': form_obj
            }
        )

    print("ERP v3 UI Metadata Seeding Completed Successfully!")

if __name__ == '__main__':
    seed()
