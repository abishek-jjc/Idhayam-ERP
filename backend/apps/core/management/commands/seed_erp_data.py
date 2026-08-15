from django.core.management.base import BaseCommand
from apps.core.models import (
    Company, Plant, Department, Designation, Employee, Role, Permission
)
from apps.masters.models import (
    MasterCategory, MasterItem, MasterItemVersion,
    MasterAttribute, MasterInstance, MasterAttributeValue
)
from apps.masters.serializers import sync_json_attributes_to_eav
from apps.process_engine.models import ProcessType, ProcessAttributeDefinition

class Command(BaseCommand):
    help = "Seeds initial ERP v2 Enterprise demonstration data, SuperAdmin account, process types, master categories, and permission matrix."

    def handle(self, *args, **options):
        self.stdout.write("Starting ERP v2 Data Seeding...")

        # 1. Company & Facilities
        company, _ = Company.objects.get_or_create(
            name="Apex Industrial Enterprises Ltd",
            defaults={"gst_number": "27AAACA1234B1Z5", "remarks": "Primary HQ Holding"}
        )

        plant_mfg, _ = Plant.objects.get_or_create(
            company=company,
            name="Plant 01 - Pune Heavy Mfg",
            defaults={"plant_type": "manufacturing", "is_active": True}
        )

        plant_log, _ = Plant.objects.get_or_create(
            company=company,
            name="Plant 02 - Logistics & Shipping Hub",
            defaults={"plant_type": "transport", "is_active": True}
        )

        # 2. Departments
        dept_prod, _ = Department.objects.get_or_create(name="Production & Operations", defaults={"plant": plant_mfg})
        dept_qc, _ = Department.objects.get_or_create(name="Quality Assurance & QC", defaults={"plant": plant_mfg})
        dept_maint, _ = Department.objects.get_or_create(name="Maintenance & Equipment", defaults={"plant": plant_mfg})
        dept_admin, _ = Department.objects.get_or_create(name="Super Admin & Corporate Governance", defaults={"is_shared_across_plants": True})

        # 3. Designations
        dsg_superadmin, _ = Designation.objects.get_or_create(
            id="DSG-SUPERADMIN",
            defaults={"title": "Super Administrator", "department": dept_admin, "hierarchy_level": 99}
        )
        dsg_plant_mgr, _ = Designation.objects.get_or_create(
            title="Plant Operations Manager",
            defaults={"department": dept_prod, "hierarchy_level": 10}
        )
        dsg_qc_inspector, _ = Designation.objects.get_or_create(
            title="Quality Control Lead",
            defaults={"department": dept_qc, "hierarchy_level": 5}
        )
        dsg_shift_engineer, _ = Designation.objects.get_or_create(
            title="Shift Maintenance Engineer",
            defaults={"department": dept_maint, "hierarchy_level": 4}
        )

        # 4. SuperAdmin Employee
        emp_superadmin, _ = Employee.objects.get_or_create(
            name="System SuperAdmin",
            defaults={
                "department": dept_admin,
                "designation": dsg_superadmin,
                "plant": plant_mfg,
                "user_account_id": "superadmin",
                "status": "active",
                "remarks": "SuperAdmin credentials: superadmin / SuperAdminPassword123!"
            }
        )

        # 5. Process Types
        pt_qc, _ = ProcessType.objects.get_or_create(
            code="PRC-QC-INSPECT-01",
            defaults={
                "name": "Incoming Material QC Inspection",
                "category": "qc",
                "owning_department": dept_qc,
                "requires_approval": True,
                "remarks": "Statutory quality control parameters audit"
            }
        )
        pt_prod, _ = ProcessType.objects.get_or_create(
            code="PRC-PROD-BATCH-01",
            defaults={
                "name": "Production Batch Execution",
                "category": "production",
                "owning_department": dept_prod,
                "requires_approval": False,
                "remarks": "Assembly line batch output logging"
            }
        )

        # Process Attributes
        ProcessAttributeDefinition.objects.get_or_create(
            process_type=pt_qc, attribute_code="moisture_percent",
            defaults={"attribute_name": "Moisture Content (%)", "data_type": "number", "is_required": True, "sort_order": 1}
        )
        ProcessAttributeDefinition.objects.get_or_create(
            process_type=pt_qc, attribute_code="passed_visual_qc",
            defaults={"attribute_name": "Passed Visual Inspection", "data_type": "boolean", "is_required": True, "sort_order": 2}
        )

        # 6. Master Categories (Master Types)
        cat_raw, _ = MasterCategory.objects.get_or_create(
            code="cat_raw_materials",
            defaults={"name": "Raw Chemical Ingredients", "owning_department": dept_prod, "remarks": "Master inventory catalog"}
        )
        cat_param, _ = MasterCategory.objects.get_or_create(
            code="cat_qc_standard",
            defaults={"name": "QC Tolerance Standards", "owning_department": dept_qc, "remarks": "Statutory quality parameters"}
        )

        # Master Attributes
        mat_grade, _ = MasterAttribute.objects.get_or_create(
            master_category=cat_raw, attribute_code="chemical_grade",
            defaults={"attribute_name": "Chemical Grade Standard", "data_type": "text", "is_required": True, "sort_order": 1}
        )
        mat_purity, _ = MasterAttribute.objects.get_or_create(
            master_category=cat_raw, attribute_code="purity_rating",
            defaults={"attribute_name": "Min Purity Rating (%)", "data_type": "number", "is_required": False, "sort_order": 2}
        )

        # Master Items & Automatic JSON Syncing to MasterInstance & MasterAttributeValue
        item_poly, _ = MasterItem.objects.get_or_create(
            category=cat_raw, code="RAW-CHEM-POLY-01",
            defaults={"name": "Industrial Polymer Compound Grade A", "attributes": {"chemical_grade": "Pharma Grade", "purity_rating": 99.4}, "plant": plant_mfg}
        )
        sync_json_attributes_to_eav(item_poly, item_poly.attributes)

        item_resin, _ = MasterItem.objects.get_or_create(
            category=cat_raw, code="RAW-CHEM-RESIN-02",
            defaults={"name": "Synthetic Epoxy Resin Standard", "attributes": {"chemical_grade": "Industrial Standard", "purity_rating": 98.2}, "plant": plant_mfg}
        )
        sync_json_attributes_to_eav(item_resin, item_resin.attributes)

        # 7. Seed Permissions Matrix per Designation
        modules = ['dashboard', 'structural_masters', 'dynamic_masters', 'process_engine', 'workflow', 'journal', 'admin']
        
        # SuperAdmin: full access across all modules
        for mod in modules:
            Permission.objects.get_or_create(
                designation=dsg_superadmin, module=mod, process_type=None,
                defaults={"can_view": True, "can_create": True, "can_edit": True, "can_delete": True, "can_approve": True}
            )
        for pt in [pt_qc, pt_prod]:
            Permission.objects.get_or_create(
                designation=dsg_superadmin, module='process_engine', process_type=pt,
                defaults={"can_view": True, "can_create": True, "can_edit": True, "can_delete": True, "can_approve": True}
            )

        # QC Inspector: QC process type & dynamic masters
        for mod in ['dashboard', 'dynamic_masters', 'process_engine', 'workflow']:
            Permission.objects.get_or_create(
                designation=dsg_qc_inspector, module=mod, process_type=None,
                defaults={"can_view": True, "can_create": True, "can_edit": True, "can_delete": False, "can_approve": True}
            )
        Permission.objects.get_or_create(
            designation=dsg_qc_inspector, module='process_engine', process_type=pt_qc,
            defaults={"can_view": True, "can_create": True, "can_edit": True, "can_delete": False, "can_approve": True}
        )

        # Plant Manager: all operational modules except admin configuration
        for mod in ['dashboard', 'structural_masters', 'dynamic_masters', 'process_engine', 'workflow', 'journal']:
            Permission.objects.get_or_create(
                designation=dsg_plant_mgr, module=mod, process_type=None,
                defaults={"can_view": True, "can_create": True, "can_edit": True, "can_delete": True, "can_approve": True}
            )

        self.stdout.write(self.style.SUCCESS("Successfully seeded ERP v2 data, 6-table masters engine, and SuperAdmin credentials!"))
