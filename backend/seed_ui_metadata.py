import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.core.models import UIMenu, UINavbar, UITheme, UIWidget, UIForm, UIFormField, UIModal, Role

def seed():
    print("Seeding ERP v3 UI Metadata...")

    # 1. Seed Dynamic Menus
    menus_data = [
        {'menu_name': 'Dashboard', 'menu_path': '/', 'module_code': 'dashboard', 'menu_icon': 'LayoutDashboard', 'display_order': 1},
        {'menu_name': 'User Portal', 'menu_path': '/user', 'module_code': 'user_page', 'menu_icon': 'UserCheck', 'display_order': 2},
        {'menu_name': 'Admin Console', 'menu_path': '/admin-console', 'module_code': 'admin', 'menu_icon': 'ShieldCheck', 'display_order': 3},
        {'menu_name': 'Structural Masters', 'menu_path': '/structural-masters', 'module_code': 'structural_masters', 'menu_icon': 'Building2', 'display_order': 4},
        {'menu_name': 'Dynamic Masters (EAV)', 'menu_path': '/dynamic-masters', 'module_code': 'dynamic_masters', 'menu_icon': 'Layers', 'display_order': 5},
        {'menu_name': 'Process Engine', 'menu_path': '/process-engine', 'module_code': 'process_engine', 'menu_icon': 'Cpu', 'display_order': 6},
        {'menu_name': 'Workflow & Approvals', 'menu_path': '/workflow-approvals', 'module_code': 'workflow', 'menu_icon': 'GitPullRequest', 'display_order': 7},
        {'menu_name': 'Journal & Stock Ledger', 'menu_path': '/journal-stock', 'module_code': 'journal', 'menu_icon': 'BookOpenCheck', 'display_order': 8},
        {'menu_name': 'Process Attribute Values', 'menu_path': '/process-attribute-values', 'module_code': 'process_engine', 'menu_icon': 'ListFilter', 'display_order': 9},
        {'menu_name': 'Process Links', 'menu_path': '/process-links', 'module_code': 'process_engine', 'menu_icon': 'GitCommit', 'display_order': 10},
    ]

    for m in menus_data:
        UIMenu.objects.get_or_create(
            menu_path=m['menu_path'],
            defaults=m
        )

    # 2. Seed Navbars
    navbars_data = [
        {'page_name': 'default', 'title': 'ERP v3 Enterprise Platform', 'icon': 'Layers', 'show_search': True, 'show_notification': True, 'show_profile': True, 'show_logout': True},
        {'page_name': 'dashboard', 'title': 'Executive Intelligence Dashboard', 'icon': 'LayoutDashboard', 'show_search': True, 'show_notification': True, 'show_profile': True, 'show_logout': True},
        {'page_name': 'admin-console', 'title': 'UI Configuration Console & Metadata Studio', 'icon': 'ShieldCheck', 'show_search': True, 'show_notification': True, 'show_profile': True, 'show_logout': True},
        {'page_name': 'process-engine', 'title': 'Enterprise Process Engine', 'icon': 'Cpu', 'show_search': True, 'show_notification': True, 'show_profile': True, 'show_logout': True},
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
        {'widget_name': 'Process Flow Visualization', 'widget_type': 'shortcut', 'data_source': '/process-links', 'position': 5, 'grid_width': 'col-span-2'},
        {'widget_name': 'Recent System Activity', 'widget_type': 'list', 'data_source': '/api/process/instances/', 'position': 6, 'grid_width': 'col-span-2'},
    ]

    for w in widgets_data:
        UIWidget.objects.get_or_create(
            widget_name=w['widget_name'],
            defaults=w
        )

    # 5. Seed Dynamic Form
    sample_form, _ = UIForm.objects.get_or_create(
        form_name='add_employee_modal_form',
        defaults={
            'module': 'core',
            'title': 'Add New Employee Form',
            'description': 'Configurable form for registering employees.',
            'active': True
        }
    )

    fields_data = [
        {'field_name': 'Employee Name', 'field_code': 'name', 'field_type': 'text', 'required': True, 'field_order': 1},
        {'field_name': 'Shift Preference', 'field_code': 'shift', 'field_type': 'select', 'options': 'Morning,Evening,Night', 'required': False, 'field_order': 2},
        {'field_name': 'Official Email', 'field_code': 'email', 'field_type': 'email', 'required': True, 'field_order': 3},
        {'field_name': 'Contact Phone', 'field_code': 'phone', 'field_type': 'phone', 'required': False, 'field_order': 4},
        {'field_name': 'Joining Time', 'field_code': 'joining_time', 'field_type': 'time', 'required': False, 'field_order': 5},
    ]

    for f in fields_data:
        UIFormField.objects.get_or_create(
            form=sample_form,
            field_code=f['field_code'],
            defaults=f
        )

    # 6. Seed Dynamic Modal
    UIModal.objects.get_or_create(
        modal_name='add_employee_modal',
        defaults={
            'title': 'Add New Employee',
            'width': '800px',
            'height': 'auto',
            'submit_text': 'Save Employee',
            'cancel_text': 'Cancel',
            'active': True,
            'form': sample_form
        }
    )

    print("ERP v3 UI Metadata Seeding Completed Successfully!")

if __name__ == '__main__':
    seed()
