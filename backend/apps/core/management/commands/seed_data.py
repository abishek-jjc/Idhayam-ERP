import datetime
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.contrib.auth.models import User
from django.utils import timezone

from apps.core.models import (
    Company, Plant, Department, Designation, Employee, EmployeeDetail,
    EmployeeBankAccount, Role, EmployeeRole, Permission, Vendor, Machine,
    StorageLocationBlock, StorageLocation, Document, ChartOfAccount
)
from apps.masters.models import (
    MasterCategory, MasterItem, MasterItemVersion, MasterAttribute,
    MasterInstance, MasterAttributeValue
)
from apps.process_engine.models import (
    ProcessType, ProcessAttributeDefinition, ProcessInstance, ProcessAttributeValue
)
from apps.workflow.models import (
    Proposal, ProposalVendorQuotation, ProposalAmendment, ApprovalChainTemplate, ApprovalStep
)
from apps.journal.models import JournalEntry, Stock
from apps.notifications.models import SystemNotification


class Command(BaseCommand):
    help = 'Clears database and seeds IDHAYAM ERP Version-9 configuration and master data'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Clearing existing database data..."))
        call_command('flush', interactive=False)
        self.stdout.write(self.style.SUCCESS("Database flushed successfully!"))

        self.stdout.write(self.style.WARNING("Starting IDHAYAM ERP Version-9 Data Seeding..."))

        # 1. Create Superuser / Admin
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@erp.local',
                'first_name': 'Super',
                'last_name': 'Admin',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.set_password('admin123')
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()
        self.stdout.write(self.style.SUCCESS("Superadmin user verified: admin / admin123"))

        # 2. Company & Plants
        company, _ = Company.objects.get_or_create(
            name='IDHAYAM Industries',
            defaults={
                'gst_number': '33IDHAYAM0001A1Z5',
                'remarks': 'Initial administrator seed company'
            }
        )

        plant_main, _ = Plant.objects.get_or_create(
            company=company,
            name='Main Plant',
            defaults={
                'plant_type': 'manufacturing',
                'is_active': True,
                'remarks': 'Initial administrator seed plant'
            }
        )

        # 3. Departments
        dept_names = [
            'Administration', 'Production', 'Quality Control', 'Stores',
            'Purchase', 'Transport', 'Human Resources', 'Payroll'
        ]
        departments = {}
        for name in dept_names:
            dept, _ = Department.objects.get_or_create(
                plant=plant_main,
                name=name,
                defaults={
                    'is_shared_across_plants': False,
                    'remarks': f'Initial administrator seed department ({name})'
                }
            )
            departments[name] = dept

        # 4. Designations under Administration
        desig_titles = [
            ('Administrator', 1),
            ('Manager', 2),
            ('Supervisor', 3),
            ('Officer', 4),
            ('Operator', 5)
        ]
        designations = {}
        admin_dept = departments['Administration']
        for title, level in desig_titles:
            desig, _ = Designation.objects.get_or_create(
                department=admin_dept,
                title=title,
                defaults={
                    'hierarchy_level': level,
                    'remarks': f'Initial administrator seed designation ({title})'
                }
            )
            designations[title] = desig

        # 5. Employees & Details
        admin_desig = designations['Administrator']
        employee_admin, _ = Employee.objects.get_or_create(
            name='ERP Administrator',
            plant=plant_main,
            defaults={
                'department': admin_dept,
                'designation': admin_desig,
                'user_account_id': str(admin_user.id),
                'status': 'active',
                'remarks': 'Initial ERP administrator account owner'
            }
        )

        EmployeeDetail.objects.get_or_create(
            employee=employee_admin,
            defaults={
                'date_of_joining': datetime.date.today(),
                'remarks': 'Initial administrator employee detail'
            }
        )

        # 6. Roles & EmployeeRoles
        roles_data = [
            ('ADMIN', 'Full ERP administrator access'),
            ('MANAGER', 'Management access'),
            ('OPERATOR', 'Operational access'),
            ('HR', 'Hiring and employee administration'),
            ('PAYROLL', 'Payroll administration')
        ]
        roles = {}
        for role_name, remarks in roles_data:
            role, _ = Role.objects.get_or_create(
                name=role_name,
                defaults={'remarks': remarks}
            )
            roles[role_name] = role

        admin_role = roles['ADMIN']
        EmployeeRole.objects.get_or_create(
            employee=employee_admin,
            role=admin_role
        )

        # Permissions for ADMIN role
        permission_specs = [
            ('core', 'view'), ('core', 'create'), ('core', 'edit'), ('core', 'delete'),
            ('masters', 'view'), ('masters', 'create'), ('masters', 'edit'), ('masters', 'delete'),
            ('machine_log', 'view'), ('machine_log', 'create'), ('machine_log', 'edit'),
            ('candidate_interview', 'view'), ('candidate_interview', 'create'),
            ('worker_paybill', 'view'), ('worker_paybill', 'create'), ('worker_paybill', 'approve'),
            ('work_allocation', 'view'), ('work_allocation', 'create')
        ]
        for module, act in permission_specs:
            Permission.objects.get_or_create(
                role=admin_role,
                module=module,
                action=act,
                defaults={
                    'can_view': act in ['view', 'create', 'edit', 'delete', 'approve'],
                    'can_create': act in ['create', 'edit', 'delete'],
                    'can_edit': act in ['edit', 'delete'],
                    'can_delete': act == 'delete',
                    'can_approve': act == 'approve',
                }
            )

        # 7. Dynamic Master Categories
        master_categories_data = [
            ('machine_type', 'Machine Type', 'QC, production, package, transport and vehicle classifications'),
            ('proposal_type', 'Proposal Type', 'Basic, formula and project proposals'),
            ('business_rule', 'Business Rule', 'GST, HRA, DA, ESI, PF and reusable rules'),
            ('work_center', 'Work Center', 'Single machine or machine cluster'),
            ('shift', 'Shift', 'Shift timing configuration'),
            ('material', 'Material', 'Dynamic material master'),
            ('unit', 'Unit', 'Measurement units'),
            ('reorder_type', 'Reorder Type', 'Stock reorder configuration'),
            ('payment_term', 'Payment Term', 'Payment configuration'),
            ('quality_grade', 'Quality Grade', 'Quality classification')
        ]
        master_categories = {}
        for code, name, remarks in master_categories_data:
            cat, _ = MasterCategory.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                    'owning_department': departments['Administration'],
                    'remarks': remarks
                }
            )
            master_categories[code] = cat

        # 8. Dynamic Master Items
        master_items_data = [
            ('machine_type', 'QC', 'Quality Control Machine', {'machine_group': 'QC', 'purpose': 'quality_inspection', 'inspection_required': True, 'capacity_unit': 'KG'}, 'Machine master attribute example'),
            ('machine_type', 'PRODUCTION', 'Production Machine', {'machine_group': 'production', 'purpose': 'production', 'capacity_unit': 'KG', 'maintenance_required': True}, 'Machine master attribute example'),
            ('machine_type', 'PACKAGE', 'Packaging Machine', {'machine_group': 'package', 'purpose': 'packaging', 'capacity_unit': 'NOS', 'maintenance_required': True}, 'Machine master attribute example'),
            ('machine_type', 'TRANSPORT', 'Transport Machine', {'machine_group': 'transport', 'purpose': 'transport', 'fuel_type': 'diesel', 'trip_tracking': True}, 'Machine master attribute example'),
            ('machine_type', 'VEHICLE', 'Vehicle', {'machine_group': 'transport', 'vehicle_type': 'road_vehicle', 'registration_required': True, 'fastag_supported': True}, 'Vehicle is represented as a machine'),

            ('proposal_type', 'BASIC', 'Basic', {'proposal_scope': 'basic', 'approval_required': True, 'quotation_required': False, 'priority': 'normal'}, 'Proposal master attributes'),
            ('proposal_type', 'FORMULA', 'Formula', {'proposal_scope': 'formula', 'approval_required': True, 'formula_required': True, 'quotation_required': True, 'priority': 'high'}, 'Proposal master attributes'),
            ('proposal_type', 'PROJECT', 'Project', {'proposal_scope': 'project', 'approval_required': True, 'project_code_required': True, 'quotation_required': True, 'milestone_required': True}, 'Proposal master attributes'),

            ('business_rule', 'GST-OUT-18', 'GST Output 18%', {'rule_scope': 'tax', 'tax_type': 'output_gst', 'rate': 18, 'basis': 'percentage', 'applies_to': 'taxable_value'}, 'Business rule attributes'),
            ('business_rule', 'HRA-2026', 'HRA', {'rule_scope': 'payroll', 'component': 'basic_salary', 'rate': 40, 'basis': 'percentage', 'maximum_amount': None}, 'Business rule attributes'),
            ('business_rule', 'DA-2026', 'DA', {'rule_scope': 'payroll', 'component': 'basic_salary', 'rate': 10, 'basis': 'percentage', 'maximum_amount': None}, 'Business rule attributes'),
            ('business_rule', 'PF-2026', 'PF', {'rule_scope': 'payroll', 'component': 'basic_salary', 'employee_share': 12, 'employer_share': 12, 'basis': 'percentage'}, 'Business rule attributes'),
            ('business_rule', 'ESI-2026', 'ESI', {'rule_scope': 'payroll', 'component': 'gross_salary', 'rate': 0.75, 'basis': 'percentage', 'employee_rate': 0.75, 'employer_rate': 3.25}, 'Business rule attributes'),

            ('work_center', 'WC-QC-01', 'QC Work Center', {'work_center_type': 'single_machine', 'primary_machine_id': 'machine-qc-001', 'member_machine_ids': ['machine-qc-001'], 'capacity_unit': 'KG'}, 'Work center attributes'),
            ('work_center', 'WC-PROD-01', 'Production Work Center', {'work_center_type': 'machine_cluster', 'primary_machine_id': 'machine-prod-001', 'member_machine_ids': ['machine-prod-001', 'machine-prod-002'], 'capacity_unit': 'KG'}, 'Work center attributes'),

            ('shift', 'SHIFT-A', 'General Shift', {'shift_code': 'A', 'start_time': '09:00', 'end_time': '18:00', 'break_minutes': 60, 'working_hours': 8}, 'Shift attributes'),
            ('shift', 'SHIFT-B', 'Second Shift', {'shift_code': 'B', 'start_time': '18:00', 'end_time': '02:00', 'break_minutes': 30, 'working_hours': 7.5}, 'Shift attributes'),

            ('material', 'RM-RICE-001', 'Raw Rice', {'material_type': 'raw_material', 'base_unit': 'KG', 'is_batch_tracked': True, 'expiry_required': True, 'quality_check_required': True}, 'Material attributes'),
            ('material', 'PKG-BAG-001', 'Packaging Bag', {'material_type': 'packaging', 'base_unit': 'NOS', 'is_batch_tracked': False, 'expiry_required': False, 'quality_check_required': True}, 'Material attributes'),

            ('unit', 'KG', 'Kilogram', {'precision': 3, 'decimal_places': 3, 'base_unit': True, 'conversion_factor': 1}, 'Unit attributes'),
            ('unit', 'LTR', 'Litre', {'precision': 3, 'decimal_places': 3, 'base_unit': True, 'conversion_factor': 1}, 'Unit attributes'),

            ('reorder_type', 'MINMAX', 'Min-Max Reorder', {'method': 'min_max', 'reorder_level_required': True, 'frequency_days': 30, 'auto_reorder': True}, 'Reorder attributes'),
            ('payment_term', 'NET30', 'Net 30 Days', {'credit_days': 30, 'discount_days': 10, 'discount_percentage': 1, 'due_date_rule': 'invoice_date_plus_credit_days'}, 'Payment attributes'),
            ('quality_grade', 'A', 'Grade A', {'grade': 'A', 'quality_level': 'premium', 'quality_score_min': 90, 'moisture_max': 5}, 'Quality attributes')
        ]
        master_items = {}
        for cat_code, code, name, attrs, remarks in master_items_data:
            cat = master_categories[cat_code]
            item, _ = MasterItem.objects.get_or_create(
                category=cat,
                code=code,
                defaults={
                    'name': name,
                    'plant': plant_main,
                    'department': departments['Production'],
                    'attributes': attrs,
                    'is_active': True,
                    'remarks': remarks
                }
            )
            master_items[code] = item

        # 9. Master Item Versions
        version_data = [
            ('GST-OUT-18', {'rate': 18, 'basis': 'percentage', 'tax_type': 'output_gst', 'effective_rule': 'taxable_value'}, datetime.date(2026, 4, 1), datetime.date(2026, 12, 31), 1, 'GST version'),
            ('HRA-2026', {'rate': 40, 'basis': 'percentage', 'component': 'basic_salary'}, datetime.date(2026, 4, 1), datetime.date(2026, 12, 31), 1, 'HRA version'),
            ('DA-2026', {'rate': 10, 'basis': 'percentage', 'component': 'basic_salary'}, datetime.date(2026, 4, 1), datetime.date(2026, 12, 31), 1, 'DA version'),
            ('PF-2026', {'employee_share': 12, 'employer_share': 12, 'basis': 'percentage', 'component': 'basic_salary'}, datetime.date(2026, 4, 1), datetime.date(2026, 12, 31), 1, 'PF version'),
            ('ESI-2026', {'employee_rate': 0.75, 'employer_rate': 3.25, 'basis': 'percentage', 'component': 'gross_salary'}, datetime.date(2026, 4, 1), datetime.date(2026, 12, 31), 1, 'ESI version'),
            ('SHIFT-A', {'start_time': '09:00', 'end_time': '18:00', 'break_minutes': 60, 'working_hours': 8}, datetime.date(2026, 1, 1), datetime.date(2026, 12, 31), 1, 'Shift version'),
            ('BASIC', {'approval_required': True, 'quotation_required': False, 'approval_level': 1}, datetime.date(2026, 1, 1), datetime.date(2026, 12, 31), 1, 'Basic proposal configuration'),
            ('FORMULA', {'approval_required': True, 'formula_required': True, 'quotation_required': True, 'approval_level': 2}, datetime.date(2026, 1, 1), datetime.date(2026, 12, 31), 1, 'Formula proposal configuration'),
            ('PROJECT', {'approval_required': True, 'project_code_required': True, 'quotation_required': True, 'milestone_required': True, 'approval_level': 3}, datetime.date(2026, 1, 1), datetime.date(2026, 12, 31), 1, 'Project proposal configuration')
        ]
        for item_code, val, eff_from, eff_to, ver_no, remarks in version_data:
            item = master_items.get(item_code)
            if item:
                MasterItemVersion.objects.get_or_create(
                    master_item=item,
                    version_no=ver_no,
                    defaults={
                        'value': val,
                        'effective_from': eff_from,
                        'effective_to': eff_to,
                        'remarks': remarks
                    }
                )

        # 10. Machines
        machines_data = [
            ('QC-MCH-001', 'QC Machine 001', 'Quality Control', 'QC', Decimal('500.000'), None, None, None, 'QC machine seed'),
            ('PROD-MCH-001', 'Production Machine 001', 'Production', 'PRODUCTION', Decimal('1000.000'), None, None, None, 'Production machine seed'),
            ('PROD-MCH-002', 'Production Machine 002', 'Production', 'PRODUCTION', Decimal('1000.000'), None, None, None, 'Production machine seed'),
            ('PKG-MCH-001', 'Packaging Machine 001', 'Production', 'PACKAGE', Decimal('100.000'), None, None, None, 'Packaging machine seed'),
            ('VEH-001', 'Transport Vehicle 001', 'Transport', 'VEHICLE', Decimal('0.000'), 'TN-00-AA-0001', 'FASTAG-0001', 'active', 'Vehicle represented as machine')
        ]
        for code, name, dept_name, mtype_code, capacity, reg_no, fastag_no, fastag_status, remarks in machines_data:
            mtype_item = master_items.get(mtype_code)
            mtype_id = mtype_item.id if mtype_item else None
            Machine.objects.get_or_create(
                code=code,
                defaults={
                    'plant': plant_main,
                    'department': departments[dept_name],
                    'machine_type_id': mtype_id,
                    'name': name,
                    'capacity': capacity,
                    'registration_number': reg_no,
                    'fastag_number': fastag_no,
                    'fastag_status': fastag_status or 'active',
                    'status': 'active',
                    'remarks': remarks
                }
            )

        # 11. Storage Location Block & Locations
        stores_dept = departments['Stores']
        block_stores, _ = StorageLocationBlock.objects.get_or_create(
            department=stores_dept,
            start_code='A001',
            end_code='A999',
            defaults={'remarks': 'Initial storage block'}
        )

        locations_data = [
            ('A001', Decimal('10000.000'), 'Raw material storage'),
            ('A002', Decimal('10000.000'), 'Finished goods storage'),
            ('A003', Decimal('5000.000'), 'Packaging material storage')
        ]
        for bin_code, cap, remarks in locations_data:
            StorageLocation.objects.get_or_create(
                plant=plant_main,
                code=bin_code,
                defaults={
                    'department': stores_dept,
                    'storage_location_block': block_stores,
                    'capacity': cap,
                    'status': 'active',
                    'remarks': remarks
                }
            )

        # 12. Process Types
        process_types_data = [
            ('qc_incoming_load', 'QC Incoming Load', 'Quality Control', 'qc', True),
            ('qc_incoming_sample', 'QC Incoming Sample', 'Quality Control', 'qc', True),
            ('qc_inward_processing', 'QC Inward Processing', 'Quality Control', 'qc', True),
            ('qc_tunnel_drying', 'QC Tunnel Drying', 'Quality Control', 'qc', False),
            ('qc_bhuler_cleaning', 'QC Bhuler Cleaning', 'Quality Control', 'qc', False),
            ('qc_bhuler_cleaning_output', 'QC Bhuler Cleaning Output', 'Quality Control', 'qc', False),
            ('disposal_transfer', 'Disposal Transfer', 'Quality Control', 'qc', True),
            ('gunny_bag_usage', 'Gunny Bag Usage', 'Quality Control', 'qc', False),
            ('rejection', 'Rejection', 'Quality Control', 'qc', True),

            ('production_order', 'Production Order', 'Production', 'production', True),
            ('production_material_requisition', 'Production Material Requisition', 'Production', 'production', False),
            ('production_batch', 'Production Batch', 'Production', 'production', True),
            ('machine_allocation', 'Machine Allocation', 'Production', 'production', False),
            ('worker_allocation', 'Worker Allocation', 'Production', 'production', False),
            ('production_qc', 'Production QC', 'Production', 'qc', True),

            ('packaging_material_requisition', 'Packaging Material Requisition', 'Production', 'packaging', False),
            ('packaging_run', 'Packaging Run', 'Production', 'packaging', True),
            ('finished_goods', 'Finished Goods', 'Production', 'packaging', False),
            ('final_qc', 'Final QC', 'Production', 'qc', True),

            ('work_allocation', 'Work Allocation', 'Production', 'admin', False),
            ('housekeeping_shift_assignment', 'Housekeeping Shift Assignment', 'Production', 'admin', False),

            ('material_request', 'Material Request', 'Purchase', 'purchase', True),
            ('purchase_order', 'Purchase Order', 'Purchase', 'purchase', True),
            ('bill', 'Bill', 'Purchase', 'finance', True),
            ('bill_line_item', 'Bill Line Item', 'Purchase', 'finance', False),
            ('goods_receipt', 'Goods Receipt', 'Purchase', 'purchase', True),

            ('gdc', 'Goods Dispatch / GDC', 'Transport', 'transport', True),
            ('vehicle_trip', 'Vehicle Trip', 'Transport', 'transport', False),
            ('delivery_tracking', 'Delivery Tracking', 'Transport', 'transport', False),

            ('machine_log', 'Machine Log', 'Production', 'admin', False),
            ('fuel_log', 'Fuel Log', 'Production', 'admin', False),
            ('maintenance_log', 'Maintenance Log', 'Production', 'admin', False),

            ('candidate_resume_extraction', 'Candidate Resume Extraction', 'Human Resources', 'hr', False),
            ('candidate_first_round', 'Candidate First Round', 'Human Resources', 'hr', True),
            ('candidate_interview', 'Candidate Interview', 'Human Resources', 'hr', True),
            ('worker_paybill', 'Worker Paybill', 'Payroll', 'finance', True)
        ]
        process_types = {}
        for code, name, dept_name, category, req_app in process_types_data:
            pt, _ = ProcessType.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                    'owning_department': departments[dept_name],
                    'category': category,
                    'requires_approval': req_app,
                    'remarks': 'V9 dynamic replacement of former domain-specific table/process'
                }
            )
            process_types[code] = pt

        # 13. Process Attribute Definitions
        attribute_specs = [
            # QC incoming load
            ('qc_incoming_load', 'goods_receipt_id', 'Goods Receipt', 'reference', 'process_instance', True, 1),
            ('qc_incoming_load', 'plant_id', 'Plant', 'reference', None, True, 2),
            ('qc_incoming_load', 'department_id', 'Department', 'reference', None, True, 3),
            ('qc_incoming_load', 'storage_location_id', 'Storage Location', 'reference', 'storage_location', True, 4),
            ('qc_incoming_load', 'load_datetime', 'Load Date/Time', 'datetime', None, True, 5),
            ('qc_incoming_load', 'material_id', 'Material', 'reference', 'master_item', True, 6),
            ('qc_incoming_load', 'bag_count', 'Bag Count', 'number', None, True, 7),
            ('qc_incoming_load', 'total_input_weight', 'Total Input Weight', 'number', None, True, 8),
            ('qc_incoming_load', 'weight_unit_id', 'Weight Unit', 'reference', 'master_item', True, 9),
            ('qc_incoming_load', 'party_name', 'Party Name', 'text', None, False, 10),
            ('qc_incoming_load', 'party_contact', 'Party Contact', 'text', None, False, 11),
            ('qc_incoming_load', 'status', 'Status', 'text', None, True, 12),

            # QC incoming sample
            ('qc_incoming_sample', 'qc_incoming_load_id', 'QC Incoming Load', 'reference', 'process_instance', True, 1),
            ('qc_incoming_sample', 'sample_bag_refs', 'Sample Bag References', 'text', None, False, 2),
            ('qc_incoming_sample', 'ffa', 'FFA', 'number', None, False, 3),
            ('qc_incoming_sample', 'moisture', 'Moisture', 'number', None, False, 4),
            ('qc_incoming_sample', 'description', 'Description', 'text', None, False, 5),
            ('qc_incoming_sample', 'result', 'Result', 'text', None, True, 6),
            ('qc_incoming_sample', 'inspector_id', 'Inspector', 'reference', 'employee', True, 7),
            ('qc_incoming_sample', 'md_approved_by', 'MD Approved By', 'reference', 'employee', False, 8),
            ('qc_incoming_sample', 'md_approved_at', 'MD Approved At', 'datetime', None, False, 9),
            ('qc_incoming_sample', 'tested_at', 'Tested At', 'datetime', None, False, 10),

            # QC inward processing
            ('qc_inward_processing', 'qc_incoming_load_id', 'QC Incoming Load', 'reference', 'process_instance', True, 1),
            ('qc_inward_processing', 'from_storage_location_id', 'From Storage Location', 'reference', 'storage_location', True, 2),
            ('qc_inward_processing', 'attempt_no', 'Attempt No', 'number', None, True, 3),
            ('qc_inward_processing', 'parent_attempt_id', 'Parent Attempt', 'reference', 'process_instance', False, 4),
            ('qc_inward_processing', 'bags_total', 'Bags Total', 'number', None, True, 5),
            ('qc_inward_processing', 'bags_manual_drying', 'Bags Manual Drying', 'number', None, False, 6),
            ('qc_inward_processing', 'bags_remaining', 'Bags Remaining', 'number', None, False, 7),
            ('qc_inward_processing', 'jaggery_material_request_id', 'Jaggery Material Request', 'reference', 'process_instance', False, 8),
            ('qc_inward_processing', 'jaggery_storage_location_id', 'Jaggery Storage Location', 'reference', 'storage_location', False, 9),
            ('qc_inward_processing', 'oil_result', 'Oil Result', 'number', None, False, 10),
            ('qc_inward_processing', 'oil_cake_result', 'Oil Cake Result', 'number', None, False, 11),
            ('qc_inward_processing', 'sludge_result', 'Sludge Result', 'number', None, False, 12),
            ('qc_inward_processing', 'result_unit_id', 'Result Unit', 'reference', 'master_item', False, 13),
            ('qc_inward_processing', 'md_id', 'MD', 'reference', 'employee', False, 14),
            ('qc_inward_processing', 'party_approved', 'Party Approved', 'boolean', None, False, 15),
            ('qc_inward_processing', 'status', 'Status', 'text', None, True, 16),

            # QC tunnel drying
            ('qc_tunnel_drying', 'qc_incoming_load_id', 'QC Incoming Load', 'reference', 'process_instance', True, 1),
            ('qc_tunnel_drying', 'storage_location_id', 'Storage Location', 'reference', 'storage_location', True, 2),
            ('qc_tunnel_drying', 'machine_id', 'Machine', 'reference', 'machine', True, 3),
            ('qc_tunnel_drying', 'moisture_before', 'Moisture Before', 'number', None, False, 4),
            ('qc_tunnel_drying', 'moisture_after', 'Moisture After', 'number', None, False, 5),
            ('qc_tunnel_drying', 'triggered_reason', 'Triggered Reason', 'text', None, False, 6),
            ('qc_tunnel_drying', 'operator_id', 'Operator', 'reference', 'employee', True, 7),
            ('qc_tunnel_drying', 'start_time', 'Start Time', 'datetime', None, True, 8),
            ('qc_tunnel_drying', 'end_time', 'End Time', 'datetime', None, False, 9),
            ('qc_tunnel_drying', 'status', 'Status', 'text', None, True, 10),

            # Bhuler cleaning
            ('qc_bhuler_cleaning', 'qc_incoming_load_id', 'QC Incoming Load', 'reference', 'process_instance', True, 1),
            ('qc_bhuler_cleaning', 'qc_tunnel_drying_id', 'QC Tunnel Drying', 'reference', 'process_instance', False, 2),
            ('qc_bhuler_cleaning', 'machine_id', 'Machine', 'reference', 'machine', True, 3),
            ('qc_bhuler_cleaning', 'input_weight', 'Input Weight', 'number', None, True, 4),
            ('qc_bhuler_cleaning', 'input_weight_unit_id', 'Input Weight Unit', 'reference', 'master_item', True, 5),
            ('qc_bhuler_cleaning', 'operator_id', 'Operator', 'reference', 'employee', True, 6),
            ('qc_bhuler_cleaning', 'start_time', 'Start Time', 'datetime', None, True, 7),
            ('qc_bhuler_cleaning', 'end_time', 'End Time', 'datetime', None, False, 8),
            ('qc_bhuler_cleaning', 'status', 'Status', 'text', None, True, 9),

            ('qc_bhuler_cleaning_output', 'qc_bhuler_cleaning_id', 'QC Bhuler Cleaning', 'reference', 'process_instance', True, 1),
            ('qc_bhuler_cleaning_output', 'output_category_id', 'Output Category', 'reference', 'master_item', True, 2),
            ('qc_bhuler_cleaning_output', 'storage_location_id', 'Storage Location', 'reference', 'storage_location', True, 3),
            ('qc_bhuler_cleaning_output', 'quantity', 'Quantity', 'number', None, True, 4),
            ('qc_bhuler_cleaning_output', 'unit_id', 'Unit', 'reference', 'master_item', True, 5),
            ('qc_bhuler_cleaning_output', 'onward_movement', 'Onward Movement', 'text', None, False, 6),

            # Production batch
            ('production_batch', 'production_order_id', 'Production Order', 'reference', 'process_instance', True, 1),
            ('production_batch', 'batch_no', 'Batch No', 'text', None, True, 2),
            ('production_batch', 'batch_quantity', 'Batch Quantity', 'number', None, True, 3),
            ('production_batch', 'batch_quantity_unit_id', 'Batch Quantity Unit', 'reference', 'master_item', True, 4),
            ('production_batch', 'start_date', 'Start Date', 'date', None, True, 5),
            ('production_batch', 'end_date', 'End Date', 'date', None, False, 6),
            ('production_batch', 'oil_quantity', 'Oil Quantity', 'number', None, False, 7),
            ('production_batch', 'oil_cake_quantity', 'Oil Cake Quantity', 'number', None, False, 8),
            ('production_batch', 'output_unit_id', 'Output Unit', 'reference', 'master_item', False, 9),
            ('production_batch', 'status', 'Status', 'text', None, True, 10),

            # Work allocation
            ('work_allocation', 'plant_id', 'Plant', 'reference', None, True, 1),
            ('work_allocation', 'department_id', 'Department', 'reference', None, True, 2),
            ('work_allocation', 'employee_id', 'Employee', 'reference', 'employee', True, 3),
            ('work_allocation', 'shift_id', 'Shift', 'reference', 'master_item', True, 4),
            ('work_allocation', 'work_center_id', 'Work Center', 'reference', 'master_item', True, 5),
            ('work_allocation', 'work_date', 'Work Date', 'date', None, True, 6),
            ('work_allocation', 'task_description', 'Task Description', 'text', None, False, 7),
            ('work_allocation', 'reference_process_id', 'Reference Process', 'reference', 'process_instance', False, 8),
            ('work_allocation', 'status', 'Status', 'text', None, True, 9),
            ('work_allocation', 'electricity_units_reading', 'Electricity Units Reading', 'number', None, False, 10),
            ('work_allocation', 'fuel_consumption_ltrs', 'Fuel Consumption Ltrs', 'number', None, False, 11),

            # Machine log
            ('machine_log', 'machine_id', 'Machine', 'reference', 'machine', True, 1),
            ('machine_log', 'log_type', 'Log Type', 'text', None, True, 2),
            ('machine_log', 'start_time', 'Start Time', 'datetime', None, True, 3),
            ('machine_log', 'end_time', 'End Time', 'datetime', None, False, 4),
            ('machine_log', 'reason', 'Reason', 'text', None, False, 5),
            ('machine_log', 'status', 'Status', 'text', None, True, 6),

            # Hiring
            ('candidate_resume_extraction', 'candidate_id', 'Candidate', 'reference', 'process_instance', True, 1),
            ('candidate_resume_extraction', 'document_id', 'Resume Document', 'reference', None, True, 2),
            ('candidate_resume_extraction', 'extracted_data', 'Extracted Data', 'text', None, False, 3),
            ('candidate_resume_extraction', 'extraction_status', 'Extraction Status', 'text', None, True, 4),
            ('candidate_resume_extraction', 'reviewed_by', 'Reviewed By', 'reference', 'employee', False, 5),

            ('candidate_first_round', 'candidate_id', 'Candidate', 'reference', 'process_instance', True, 1),
            ('candidate_first_round', 'marks', 'Marks', 'number', None, False, 2),
            ('candidate_first_round', 'result', 'Result', 'text', None, True, 3),

            ('candidate_interview', 'candidate_id', 'Candidate', 'reference', 'process_instance', True, 1),
            ('candidate_interview', 'interviewer_id', 'Interviewer', 'reference', 'employee', True, 2),
            ('candidate_interview', 'interview_date', 'Interview Date', 'date', None, True, 3),
            ('candidate_interview', 'result', 'Result', 'text', None, True, 4),

            # Payroll
            ('worker_paybill', 'employee_id', 'Employee', 'reference', 'employee', True, 1),
            ('worker_paybill', 'plant_id', 'Plant', 'reference', None, True, 2),
            ('worker_paybill', 'department_id', 'Department', 'reference', None, True, 3),
            ('worker_paybill', 'pay_period_start', 'Pay Period Start', 'date', None, True, 4),
            ('worker_paybill', 'pay_period_end', 'Pay Period End', 'date', None, True, 5),
            ('worker_paybill', 'da_rule_version_id', 'DA Rule Version', 'reference', 'master_item_version', True, 6),
            ('worker_paybill', 'hra_rule_version_id', 'HRA Rule Version', 'reference', 'master_item_version', True, 7),
            ('worker_paybill', 'esi_rule_version_id', 'ESI Rule Version', 'reference', 'master_item_version', False, 8),
            ('worker_paybill', 'pf_rule_version_id', 'PF Rule Version', 'reference', 'master_item_version', False, 9),
            ('worker_paybill', 'gross_amount', 'Gross Amount', 'number', None, True, 10),
            ('worker_paybill', 'deductions', 'Deductions', 'number', None, False, 11),
            ('worker_paybill', 'net_amount', 'Net Amount', 'number', None, True, 12),
            ('worker_paybill', 'status', 'Status', 'text', None, True, 13)
        ]
        for pt_code, attr_code, attr_name, d_type, ref_tbl, is_req, s_order in attribute_specs:
            pt = process_types.get(pt_code)
            if pt:
                ProcessAttributeDefinition.objects.get_or_create(
                    process_type=pt,
                    attribute_code=attr_code,
                    defaults={
                        'attribute_name': attr_name,
                        'data_type': d_type,
                        'reference_table': ref_tbl,
                        'is_required': is_req,
                        'sort_order': s_order,
                        'remarks': 'Migrated from former domain table field'
                    }
                )

        # 14. Approval Chain Templates
        mgr_desig = designations['Manager']
        approval_templates = [
            ('purchase_order', 1, mgr_desig),
            ('goods_receipt', 1, mgr_desig),
            ('worker_paybill', 1, mgr_desig),
            ('candidate_interview', 1, mgr_desig)
        ]
        for pt_code, step_order, desig in approval_templates:
            pt = process_types.get(pt_code)
            if pt:
                ApprovalChainTemplate.objects.get_or_create(
                    name=f'{pt.name} Approval Chain',
                    process_type_code=pt_code,
                    defaults={
                        'remarks': f'Template step {step_order} for {pt.name}'
                    }
                )

        # 15. System Notifications
        SystemNotification.objects.get_or_create(
            title='IDHAYAM ERP Version-9 Initialized',
            defaults={
                'message': 'Database cleared and seeded with full IDHAYAM ERP Version-9 configuration dataset.',
                'category': 'system',
                'is_read': False
            }
        )

        self.stdout.write(self.style.SUCCESS("IDHAYAM ERP Version-9 database seeding completed successfully!"))
