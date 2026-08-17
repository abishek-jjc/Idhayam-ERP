import os
import sys
import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from django.utils import timezone
from django.contrib.auth.models import User
from apps.core.models import (
    Company, Plant, Department, Designation, Employee, EmployeeDetail,
    EmployeeBankAccount, Role, EmployeeRole, Permission, Vendor, Machine,
    StorageLocationBlock, StorageLocation, Document, ChartOfAccount,
    UIMenu, UIMenuPermission, UINavbar, UIForm, UIFormField, UIModal,
    UIWidget, UITheme
)
from apps.masters.models import (
    MasterCategory, MasterItem, MasterItemVersion, MasterAttribute,
    MasterInstance, MasterAttributeValue
)
from apps.process_engine.models import (
    ProcessType, ProcessAttributeDefinition, ProcessInstance,
    ProcessAttributeValue, ProcessLink, AdminVerification
)
from apps.workflow.models import (
    Proposal, ProposalVendorQuotation, ProposalAmendment,
    ApprovalChainTemplate, ApprovalStep
)
from apps.journal.models import JournalEntry, Stock
from apps.notifications.models import SystemNotification

def run_seed():
    print("============================================================")
    print("SEEDING IDHAYAM ERP V10 FULL SAMPLE DATA & ADMIN CONSOLE PROPS")
    print("============================================================")

    # 0. Django Superadmin Account
    admin_user, created = User.objects.get_or_create(
        username="admin",
        defaults={
            "email": "admin@idhayam.com",
            "first_name": "System",
            "last_name": "Administrator",
            "is_staff": True,
            "is_superuser": True,
            "is_active": True
        }
    )
    admin_user.set_password("admin123")
    admin_user.is_staff = True
    admin_user.is_superuser = True
    admin_user.save()
    print("[OK] Superadmin user: admin / admin123")

    # 1. Company
    company, _ = Company.objects.get_or_create(
        name="IDHAYAM Industries Ltd",
        defaults={
            "gst_number": "33IDHAYAM0001A1Z5",
            "remarks": "Primary IDHAYAM Enterprise Group Company"
        }
    )
    print(f"[OK] Company: {company.name}")

    # 2. Plants
    plant_main, _ = Plant.objects.get_or_create(
        name="Main Oil Refinery & Extraction Plant",
        defaults={
            "company": company,
            "plant_type": "manufacturing",
            "is_active": True,
            "remarks": "Primary Sesame & Groundnut Oil extraction plant"
        }
    )
    plant_packaging, _ = Plant.objects.get_or_create(
        name="Packaging & Logistics Hub",
        defaults={
            "company": company,
            "plant_type": "packaging",
            "is_active": True,
            "remarks": "Central automated pouch & bottle filling unit"
        }
    )
    print(f"[OK] Plants: {plant_main.name}, {plant_packaging.name}")

    # 3. Departments
    dept_admin, _ = Department.objects.get_or_create(
        name="Administration",
        plant=plant_main,
        defaults={"is_shared_across_plants": True, "remarks": "Executive Admin"}
    )
    dept_prod, _ = Department.objects.get_or_create(
        name="Oil Extraction & Production",
        plant=plant_main,
        defaults={"is_shared_across_plants": False, "remarks": "Extraction line"}
    )
    dept_qc, _ = Department.objects.get_or_create(
        name="Quality Assurance & Lab",
        plant=plant_main,
        defaults={"is_shared_across_plants": True, "remarks": "ISO & FSSAI Testing Lab"}
    )
    dept_stores, _ = Department.objects.get_or_create(
        name="Stores & Raw Material Warehouse",
        plant=plant_main,
        defaults={"is_shared_across_plants": False, "remarks": "Seed storage bins"}
    )
    dept_purch, _ = Department.objects.get_or_create(
        name="Procurement & Seed Purchase",
        plant=plant_main,
        defaults={"is_shared_across_plants": True, "remarks": "Agricultural purchasing"}
    )
    print(f"[OK] Departments: Admin, Production, Quality Control, Stores, Purchase")

    # 4. Designations
    dsg_gm, _ = Designation.objects.get_or_create(
        title="General Manager - Operations",
        department=dept_admin,
        defaults={"hierarchy_level": 1, "remarks": "Plant Manager"}
    )
    dsg_prod_mgr, _ = Designation.objects.get_or_create(
        title="Production Manager",
        department=dept_prod,
        defaults={"hierarchy_level": 2, "remarks": "Oil Pressing Lead"}
    )
    dsg_qc_lead, _ = Designation.objects.get_or_create(
        title="Senior Quality Chemist",
        department=dept_qc,
        defaults={"hierarchy_level": 3, "remarks": "Lab Lead"}
    )
    dsg_store_off, _ = Designation.objects.get_or_create(
        title="Stores Officer",
        department=dept_stores,
        defaults={"hierarchy_level": 4, "remarks": "Inventory Supervisor"}
    )
    print("[OK] Designations created")

    # 5. Employees
    emp_gm, _ = Employee.objects.get_or_create(
        name="Arun Kumar (General Manager)",
        defaults={
            "plant": plant_main,
            "department": dept_admin,
            "designation": dsg_gm,
            "user_account_id": str(admin_user.id),
            "status": "active",
            "remarks": "System Administrator & Plant Head"
        }
    )
    emp_prod, _ = Employee.objects.get_or_create(
        name="M. Muthu (Production Manager)",
        defaults={
            "plant": plant_main,
            "department": dept_prod,
            "designation": dsg_prod_mgr,
            "status": "active",
            "remarks": "Operations Lead"
        }
    )
    emp_qc, _ = Employee.objects.get_or_create(
        name="S. Lakshmi (QC Analyst)",
        defaults={
            "plant": plant_main,
            "department": dept_qc,
            "designation": dsg_qc_lead,
            "status": "active",
            "remarks": "Chemist"
        }
    )
    print("[OK] Employees created")

    # 6. Employee Detail & Bank Account
    EmployeeDetail.objects.get_or_create(
        employee=emp_gm,
        defaults={
            "gender": "Male",
            "contact_number": "+91 9876543210",
            "address": "Idhayam Campus, Virudhunagar, Tamil Nadu",
            "date_of_joining": datetime.date(2020, 1, 15),
            "emergency_contact_name": "Family",
            "emergency_contact_number": "+91 9876543211",
            "remarks": "Primary GM Contact"
        }
    )
    EmployeeBankAccount.objects.get_or_create(
        employee=emp_gm,
        account_number="309100123456789",
        defaults={
            "bank_name": "State Bank of India",
            "account_holder_name": "Arun Kumar",
            "ifsc_code": "SBIN0000951",
            "is_primary": True,
            "remarks": "Salary Account"
        }
    )
    print("[OK] Employee Details & Bank Accounts created")

    # 7. Roles & Permissions
    role_admin, _ = Role.objects.get_or_create(name="ADMIN", defaults={"remarks": "Full Access System Administrator"})
    role_mgr, _ = Role.objects.get_or_create(name="MANAGER", defaults={"remarks": "Departmental Manager"})
    role_op, _ = Role.objects.get_or_create(name="OPERATOR", defaults={"remarks": "Shopfloor Operator"})

    EmployeeRole.objects.get_or_create(employee=emp_gm, role=role_admin)
    EmployeeRole.objects.get_or_create(employee=emp_prod, role=role_mgr)

    Permission.objects.get_or_create(
        role=role_admin,
        module="core",
        defaults={"can_view": True, "can_create": True, "can_edit": True, "can_delete": True, "can_approve": True}
    )
    print("[OK] Roles & Permissions created")

    # 8. Vendors
    vendor_seed, _ = Vendor.objects.get_or_create(
        name="Virudhunagar Agricultural Farmers Producer Co",
        defaults={
            "gst_number": "33AABCV1234F1Z9",
            "contact_info": {"phone": "04562-220011", "email": "procurement@virdhunagarfarmers.org"},
            "is_active": True,
            "remarks": "Raw White & Black Sesame Seed Supplier"
        }
    )
    vendor_pkg, _ = Vendor.objects.get_or_create(
        name="Madurai PolyPack Container Solutions",
        defaults={
            "gst_number": "33XYZPK9876P1Z2",
            "contact_info": {"phone": "0452-2554433", "email": "sales@maduraipolypack.com"},
            "is_active": True,
            "remarks": "HDPE Bottles & Laminated Pouch Supplier"
        }
    )
    print("[OK] Vendors created")

    # 9. Machines
    mac_expeller, _ = Machine.objects.get_or_create(
        code="MAC-EXP-01",
        defaults={
            "name": "Heavy Duty Oil Expeller Machine #1",
            "plant": plant_main,
            "department": dept_prod,
            "capacity": 5000.000,
            "status": "OPERATIONAL",
            "remarks": "5 Metric Ton/day cold press expeller"
        }
    )
    mac_filter, _ = Machine.objects.get_or_create(
        code="MAC-FLT-02",
        defaults={
            "name": "Automated Plate & Frame Oil Filter Press",
            "plant": plant_main,
            "department": dept_prod,
            "capacity": 8000.000,
            "status": "OPERATIONAL",
            "remarks": "High clarity oil filter"
        }
    )
    print("[OK] Machines created")

    # 10. Storage Location Blocks & Locations
    block_a, _ = StorageLocationBlock.objects.get_or_create(
        department=dept_stores,
        start_code="A01",
        end_code="A50",
        defaults={"remarks": "Raw Seed Silo Block A"}
    )
    loc_silo1, _ = StorageLocation.objects.get_or_create(
        code="LOC-SILO-01",
        defaults={
            "name": "Sesame Seed Silo Tank #1",
            "plant": plant_main,
            "department": dept_stores,
            "storage_location_block": block_a,
            "capacity": 50000.000,
            "status": "ACTIVE",
            "remarks": "Primary Raw Sesame Storage"
        }
    )
    loc_tank1, _ = StorageLocation.objects.get_or_create(
        code="LOC-TANK-01",
        defaults={
            "name": "Filtered Sesame Oil Bulk Tank #1",
            "plant": plant_main,
            "department": dept_prod,
            "capacity": 25000.000,
            "status": "ACTIVE",
            "remarks": "Finished Oil Tank"
        }
    )
    print("[OK] Storage Locations created")

    # 11. Chart of Accounts
    coa_raw, _ = ChartOfAccount.objects.get_or_create(
        code="1001-RAW",
        defaults={"name": "Raw Material Inventory Account", "account_type": "ASSET", "remarks": "Seed Inventory Value"}
    )
    coa_fg, _ = ChartOfAccount.objects.get_or_create(
        code="1002-FG",
        defaults={"name": "Finished Goods Oil Inventory", "account_type": "ASSET", "remarks": "Packaged Oil Inventory"}
    )
    coa_sales, _ = ChartOfAccount.objects.get_or_create(
        code="4001-SALES",
        defaults={"name": "Sales & Revenue - Sesame Oil", "account_type": "INCOME", "remarks": "Domestic & Export Sales"}
    )
    print("[OK] Chart of Accounts created")

    # 12. Documents
    Document.objects.get_or_create(
        entity_table="core_company",
        entity_id=company.id,
        version_no=1,
        defaults={
            "file_path": "/docs/compliance/FSSAI_License_2026.pdf",
            "uploaded_by_id": emp_gm.id,
            "remarks": "Annual FSSAI Quality License Renewal"
        }
    )
    print("[OK] Documents created")

    # 13. Full Admin Console & UI Metadata Properties (From seed_ui_metadata.py)
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
        UIMenu.objects.get_or_create(menu_path=m['menu_path'], defaults=m)

    navbars_data = [
        {'page_name': 'default', 'title': 'ERP v3 Enterprise Platform', 'icon': 'Layers', 'show_search': True, 'show_notification': True, 'show_profile': True, 'show_logout': True},
        {'page_name': 'dashboard', 'title': 'Executive Intelligence Dashboard', 'icon': 'LayoutDashboard', 'show_search': True, 'show_notification': True, 'show_profile': True, 'show_logout': True},
        {'page_name': 'admin-console', 'title': 'UI Configuration Console & Metadata Studio', 'icon': 'ShieldCheck', 'show_search': True, 'show_notification': True, 'show_profile': True, 'show_logout': True},
        {'page_name': 'process-engine', 'title': 'Enterprise Process Engine', 'icon': 'Cpu', 'show_search': True, 'show_notification': True, 'show_profile': True, 'show_logout': True},
    ]

    for n in navbars_data:
        UINavbar.objects.get_or_create(page_name=n['page_name'], defaults=n)

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
        },
        {
            'theme_name': 'Idhayam Gold Theme',
            'primary_color': '#D4AF37',
            'secondary_color': '#8B5A2B',
            'background_color': '#0F172A',
            'card_bg_color': '#1E293B',
            'text_color': '#F8FAFC',
            'border_color': '#334155',
            'active': False
        }
    ]

    for t in themes_data:
        UITheme.objects.update_or_create(theme_name=t['theme_name'], defaults=t)

    widgets_data = [
        {'widget_name': 'Active Employees', 'widget_type': 'kpi', 'data_source': '/api/core/employees/', 'position': 1, 'grid_width': 'col-span-1'},
        {'widget_name': 'Registered Machines', 'widget_type': 'kpi', 'data_source': '/api/core/machines/', 'position': 2, 'grid_width': 'col-span-1'},
        {'widget_name': 'Pending Workflow Approvals', 'widget_type': 'kpi', 'data_source': '/api/workflow/steps/', 'position': 3, 'grid_width': 'col-span-1'},
        {'widget_name': 'Process Executions', 'widget_type': 'kpi', 'data_source': '/api/process/instances/', 'position': 4, 'grid_width': 'col-span-1'},
        {'widget_name': 'Process Flow Visualization', 'widget_type': 'shortcut', 'data_source': '/process-links', 'position': 5, 'grid_width': 'col-span-2'},
        {'widget_name': 'Recent System Activity', 'widget_type': 'list', 'data_source': '/api/process/instances/', 'position': 6, 'grid_width': 'col-span-2'},
    ]

    for w in widgets_data:
        UIWidget.objects.get_or_create(widget_name=w['widget_name'], defaults=w)

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
    print("[OK] Admin Console UI Metadata & Properties restored")

    # 14. Dynamic Masters (Categories, Attributes, Items, Versions, Instances, Attribute Values)
    cat_seeds, _ = MasterCategory.objects.get_or_create(
        code="MC-SEEDS",
        defaults={"name": "Raw Sesame & Agricultural Seeds", "owning_department": dept_purch, "remarks": "Agricultural input seeds"}
    )
    cat_oil, _ = MasterCategory.objects.get_or_create(
        code="MC-OIL",
        defaults={"name": "Refined & Virgin Oils", "owning_department": dept_prod, "remarks": "Finished oils"}
    )

    attr_moisture, _ = MasterAttribute.objects.get_or_create(
        master_category=cat_seeds,
        attribute_code="MOISTURE_PCT",
        defaults={"attribute_name": "Moisture Percentage", "data_type": "NUMBER", "is_required": True, "sort_order": 1, "remarks": "Max 6% allowed"}
    )
    attr_ffa, _ = MasterAttribute.objects.get_or_create(
        master_category=cat_oil,
        attribute_code="FFA_PCT",
        defaults={"attribute_name": "Free Fatty Acid (FFA %)", "data_type": "NUMBER", "is_required": True, "sort_order": 1, "remarks": "Quality FFA parameter"}
    )

    item_sesame, _ = MasterItem.objects.get_or_create(
        code="ITM-SESAME-WHITE",
        defaults={
            "category": cat_seeds,
            "name": "Premium White Sesame Seeds Grade-A",
            "plant": plant_main,
            "department": dept_stores,
            "attributes": {"Moisture": "5.2%", "Origin": "Virudhunagar"},
            "is_active": True,
            "remarks": "Raw material for Idhayam Gingelly Oil"
        }
    )
    item_oil_1L, _ = MasterItem.objects.get_or_create(
        code="ITM-OIL-GINGELLY-1L",
        defaults={
            "category": cat_oil,
            "name": "Idhayam Pure Gingelly Oil 1-Litre Bottle",
            "plant": plant_main,
            "department": dept_prod,
            "attributes": {"FFA": "0.8%", "Volume": "1000ml"},
            "is_active": True,
            "remarks": "Finished Product SKU"
        }
    )

    MasterItemVersion.objects.get_or_create(
        master_item=item_sesame,
        version_no=1,
        defaults={"value": {"specification": "Standard 2026 Grade A"}, "effective_from": datetime.date(2026, 1, 1), "remarks": "Initial V1"}
    )

    instance_seed_batch, _ = MasterInstance.objects.get_or_create(
        code="INST-SEED-BATCH-99",
        defaults={
            "master_category": cat_seeds,
            "master_item": item_sesame,
            "name": "Batch #99 Raw Sesame Seed Arrival",
            "plant": plant_main,
            "department": dept_stores,
            "is_active": True,
            "remarks": "50 Tons Lot"
        }
    )

    MasterAttributeValue.objects.get_or_create(
        master_instance=instance_seed_batch,
        master_attribute=attr_moisture,
        defaults={"value_number": 5.4, "value_text": "5.4% (Acceptable)"}
    )
    print("[OK] Dynamic Masters & Attributes created")

    # 15. Process Engine (Types, Attributes, Instances, Attribute Values, Links, Verification)
    proc_type_extract, _ = ProcessType.objects.get_or_create(
        code="PRC-TYPE-EXTRACTION",
        defaults={"name": "Sesame Seed Oil Extraction Process", "owning_department": dept_prod, "category": "manufacturing", "requires_approval": True, "remarks": "Pressing & Filtering"}
    )

    pdef_temp, _ = ProcessAttributeDefinition.objects.get_or_create(
        process_type=proc_type_extract,
        attribute_code="PRESS_TEMP_C",
        defaults={"attribute_name": "Expeller Press Temperature (deg C)", "data_type": "NUMBER", "is_required": True, "sort_order": 1}
    )

    pinst_1, _ = ProcessInstance.objects.get_or_create(
        process_type=proc_type_extract,
        plant=plant_main,
        department=dept_prod,
        defaults={
            "performed_by": emp_prod,
            "status": "COMPLETED",
            "start_time": timezone.now() - datetime.timedelta(hours=6),
            "end_time": timezone.now() - datetime.timedelta(hours=1),
            "remarks": "Batch Pressing Run #101"
        }
    )

    ProcessAttributeValue.objects.get_or_create(
        process_instance=pinst_1,
        attribute_definition=pdef_temp,
        defaults={"value_number": 42.5, "value_text": "42.5 deg C Cold Press"}
    )

    pinst_2, _ = ProcessInstance.objects.get_or_create(
        process_type=proc_type_extract,
        plant=plant_main,
        department=dept_prod,
        defaults={
            "performed_by": emp_prod,
            "status": "IN_PROGRESS",
            "parent_process_instance": pinst_1,
            "start_time": timezone.now(),
            "remarks": "Filtering Run #102 linked to #101"
        }
    )

    ProcessLink.objects.get_or_create(
        from_process_instance=pinst_1,
        to_process_instance=pinst_2,
        defaults={"link_type": "EXTRACTION_TO_FILTERING", "remarks": "Downstream flow"}
    )

    AdminVerification.objects.get_or_create(
        process_instance=pinst_1,
        defaults={"verified_by": emp_qc, "status": "VERIFIED", "verified_at": timezone.now(), "remarks": "Lab test passed"}
    )
    print("[OK] Process Engine Instances & Verification created")

    # 16. Workflow & Proposals (Proposals, Vendor Quotations, Amendments, Approval Chains, Approval Steps)
    proposal_seed, _ = Proposal.objects.get_or_create(
        process_instance=pinst_1,
        defaults={
            "requested_by": emp_prod,
            "plant": plant_main,
            "department": dept_prod,
            "status": "approved",
            "vendor_mode": "multiple",
            "remarks": "Procurement proposal for 100 Tons White Sesame Seeds"
        }
    )

    ProposalVendorQuotation.objects.get_or_create(
        proposal=proposal_seed,
        vendor=vendor_seed,
        defaults={
            "quoted_rate": 75.00,
            "allocated_percentage": 100.00,
            "is_selected": True,
            "remarks": "Rs 75/kg competitive quote"
        }
    )

    ProposalAmendment.objects.get_or_create(
        proposal=proposal_seed,
        amended_by=emp_prod,
        defaults={
            "amendment_reason": "Increased quantity by 10 Tons due to high demand",
            "previous_values": {"quantity_tons": 100},
            "new_values": {"quantity_tons": 110}
        }
    )

    chain_tmpl, _ = ApprovalChainTemplate.objects.get_or_create(
        name="Capital Expenditure & Procurement Approval Chain",
        defaults={
            "process_type_code": "PRC-TYPE-EXTRACTION",
            "remarks": "Standard Approval Chain"
        }
    )

    ApprovalStep.objects.get_or_create(
        proposal=proposal_seed,
        step_order=1,
        designation=dsg_qc_lead,
        defaults={
            "acted_by": emp_qc,
            "status": "approved",
            "acted_at": timezone.now(),
            "remarks": "Quality Review Approved"
        }
    )
    ApprovalStep.objects.get_or_create(
        proposal=proposal_seed,
        step_order=2,
        designation=dsg_gm,
        defaults={
            "acted_by": emp_gm,
            "status": "approved",
            "acted_at": timezone.now(),
            "remarks": "GM Final Approval"
        }
    )
    print("[OK] Workflow Proposals & Approval Chains created")

    # 17. Journal & Stock Ledger
    j_entry, _ = JournalEntry.objects.get_or_create(
        movement_type="internal",
        material_id=item_sesame.id,
        from_plant=plant_main,
        to_plant=plant_main,
        from_department=dept_stores,
        to_department=dept_prod,
        from_storage_location=loc_silo1,
        to_storage_location=loc_tank1,
        defaults={
            "quantity": 1000.0000,
            "unit": "KG",
            "value_amount": 75000.00,
            "account": coa_raw,
            "posted_by": emp_gm,
            "process_instance": pinst_1,
            "remarks": "Internal transfer of Raw Sesame Seed to Expeller Batch #101"
        }
    )

    Stock.objects.get_or_create(
        plant=plant_main,
        department=dept_stores,
        material_id=item_sesame.id,
        storage_location=loc_silo1,
        defaults={
            "quantity": 25000.0000,
            "unit_id": "KG",
            "stock_status": "available"
        }
    )
    Stock.objects.get_or_create(
        plant=plant_main,
        department=dept_prod,
        material_id=item_oil_1L.id,
        storage_location=loc_tank1,
        defaults={
            "quantity": 5000.0000,
            "unit_id": "BOTTLES",
            "stock_status": "available"
        }
    )
    print("[OK] Journal Entries & Stock Ledgers created")

    # 18. System Notifications
    SystemNotification.objects.get_or_create(
        title="Procurement Proposal Approved",
        defaults={
            "message": "Proposal for 100 Tons Raw Sesame Seeds has been fully approved by General Manager.",
            "category": "workflow",
            "is_read": False
        }
    )
    print("[OK] System Notifications created")

    print("============================================================")
    print("ALL SAMPLE DATA & ADMIN CONSOLE PROPS RESTORED SUCCESSFULLY!")
    print("============================================================")

if __name__ == '__main__':
    run_seed()
