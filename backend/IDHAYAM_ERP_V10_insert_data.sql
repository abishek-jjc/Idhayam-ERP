-- ============================================================
-- IDHAYAM ERP V10
-- PLAIN POSTGRESQL INSERT SEED DATA
-- Based on the uploaded Django seed data with explicit UUID primary keys.
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. COMPANY
-- ============================================================

INSERT INTO core_company (id, name, gst_number, remarks, created_at)
VALUES
(gen_random_uuid()::text, 'IDHAYAM Industries', '33IDHAYAM0001A1Z5',
 'Initial administrator seed company', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. PLANT
-- ============================================================

INSERT INTO core_plant
(id, company_id, name, plant_type, is_active, remarks, created_at)
SELECT
    gen_random_uuid()::text,
    c.id,
    'Main Plant',
    'manufacturing',
    TRUE,
    'Initial administrator seed plant',
    NOW()
FROM core_company c
WHERE c.name = 'IDHAYAM Industries'
  AND NOT EXISTS (
      SELECT 1 FROM core_plant p
      WHERE p.company_id = c.id AND p.name = 'Main Plant'
  );

-- ============================================================
-- 3. DEPARTMENTS
-- ============================================================

INSERT INTO core_department
(id, plant_id, name, is_shared_across_plants, remarks, created_at)
SELECT gen_random_uuid()::text, p.id, v.name, FALSE,
       'Initial administrator seed department (' || v.name || ')',
       NOW()
FROM core_plant p
CROSS JOIN (
    VALUES
    ('Administration'),
    ('Production'),
    ('Quality Control'),
    ('Stores'),
    ('Purchase'),
    ('Transport'),
    ('Human Resources'),
    ('Payroll')
) AS v(name)
WHERE p.name = 'Main Plant'
  AND NOT EXISTS (
      SELECT 1 FROM core_department d
      WHERE d.plant_id = p.id AND d.name = v.name
  );

-- ============================================================
-- 4. DESIGNATIONS
-- ============================================================

INSERT INTO core_designation
(id, department_id, title, hierarchy_level, remarks, created_at)
SELECT gen_random_uuid()::text, d.id, v.title, v.level,
       'Initial administrator seed designation (' || v.title || ')',
       NOW()
FROM core_department d
CROSS JOIN (
    VALUES
    ('Administrator',1),
    ('Manager',2),
    ('Supervisor',3),
    ('Officer',4),
    ('Operator',5)
) AS v(title, level)
WHERE d.name = 'Administration'
  AND NOT EXISTS (
      SELECT 1 FROM core_designation x
      WHERE x.department_id = d.id AND x.title = v.title
  );

-- ============================================================
-- 5. ADMIN EMPLOYEE
-- ============================================================

INSERT INTO core_employee
(id, name, plant_id, department_id, designation_id,
 status, remarks, created_at)
SELECT
    gen_random_uuid()::text,
    'ERP Administrator',
    p.id,
    d.id,
    ds.id,
    'active',
    'Initial ERP administrator account owner',
    NOW()
FROM core_plant p
JOIN core_department d
  ON d.plant_id = p.id AND d.name = 'Administration'
JOIN core_designation ds
  ON ds.department_id = d.id AND ds.title = 'Administrator'
WHERE p.name = 'Main Plant'
  AND NOT EXISTS (
      SELECT 1 FROM core_employee e
      WHERE e.name = 'ERP Administrator'
        AND e.plant_id = p.id
  );

INSERT INTO core_employeedetail
(id, employee_id, date_of_joining, remarks)
SELECT gen_random_uuid()::text, e.id, CURRENT_DATE,
       'Initial administrator employee detail'
FROM core_employee e
WHERE e.name = 'ERP Administrator'
  AND NOT EXISTS (
      SELECT 1 FROM core_employeedetail ed
      WHERE ed.employee_id = e.id
  );

-- ============================================================
-- 6. ROLES
-- ============================================================

INSERT INTO core_role (id, name, remarks)
VALUES
(gen_random_uuid()::text, 'ADMIN', 'Full ERP administrator access'),
(gen_random_uuid()::text, 'MANAGER', 'Management access'),
(gen_random_uuid()::text, 'OPERATOR', 'Operational access'),
(gen_random_uuid()::text, 'HR', 'Hiring and employee administration'),
(gen_random_uuid()::text, 'PAYROLL', 'Payroll administration')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. EMPLOYEE ROLE
-- ============================================================

INSERT INTO core_employeerole (id, employee_id, role_id)
SELECT gen_random_uuid()::text, e.id, r.id
FROM core_employee e
JOIN core_role r ON r.name = 'ADMIN'
WHERE e.name = 'ERP Administrator'
  AND NOT EXISTS (
      SELECT 1 FROM core_employeerole er
      WHERE er.employee_id = e.id AND er.role_id = r.id
  );

-- ============================================================
-- 8. ADMIN PERMISSIONS
-- ============================================================

INSERT INTO core_permission
(id, role_id, module, action,
 can_view, can_create, can_edit, can_delete, can_approve)
SELECT gen_random_uuid()::text, r.id, v.module, v.action,
       v.can_view, v.can_create, v.can_edit, v.can_delete, v.can_approve
FROM core_role r
CROSS JOIN (
    VALUES
    ('core','view',TRUE,FALSE,FALSE,FALSE,FALSE),
    ('core','create',TRUE,TRUE,FALSE,FALSE,FALSE),
    ('core','edit',TRUE,TRUE,TRUE,FALSE,FALSE),
    ('core','delete',TRUE,TRUE,TRUE,TRUE,FALSE),

    ('masters','view',TRUE,FALSE,FALSE,FALSE,FALSE),
    ('masters','create',TRUE,TRUE,FALSE,FALSE,FALSE),
    ('masters','edit',TRUE,TRUE,TRUE,FALSE,FALSE),
    ('masters','delete',TRUE,TRUE,TRUE,TRUE,FALSE),

    ('machine_log','view',TRUE,FALSE,FALSE,FALSE,FALSE),
    ('machine_log','create',TRUE,TRUE,FALSE,FALSE,FALSE),
    ('machine_log','edit',TRUE,TRUE,TRUE,FALSE,FALSE),

    ('candidate_interview','view',TRUE,FALSE,FALSE,FALSE,FALSE),
    ('candidate_interview','create',TRUE,TRUE,FALSE,FALSE,FALSE),

    ('worker_paybill','view',TRUE,FALSE,FALSE,FALSE,FALSE),
    ('worker_paybill','create',TRUE,TRUE,FALSE,FALSE,FALSE),
    ('worker_paybill','approve',TRUE,FALSE,FALSE,FALSE,TRUE),

    ('work_allocation','view',TRUE,FALSE,FALSE,FALSE,FALSE),
    ('work_allocation','create',TRUE,TRUE,FALSE,FALSE,FALSE)
) AS v(module,action,can_view,can_create,can_edit,can_delete,can_approve)
WHERE r.name = 'ADMIN'
  AND NOT EXISTS (
      SELECT 1 FROM core_permission p
      WHERE p.role_id = r.id
        AND p.module = v.module
        AND p.action = v.action
  );

-- ============================================================
-- 9. DYNAMIC MASTER CATEGORIES
-- ============================================================

INSERT INTO masters_mastercategory
(id, owning_department_id, code, name, remarks, created_at)
SELECT gen_random_uuid()::text, d.id, v.code, v.name, v.remarks, NOW()
FROM core_department d
CROSS JOIN (
    VALUES
    ('machine_type','Machine Type',
     'QC, production, package, transport and vehicle classifications'),
    ('proposal_type','Proposal Type',
     'Basic, formula and project proposals'),
    ('business_rule','Business Rule',
     'GST, HRA, DA, ESI, PF and reusable rules'),
    ('work_center','Work Center',
     'Single machine or machine cluster'),
    ('shift','Shift',
     'Shift timing configuration'),
    ('material','Material',
     'Dynamic material master'),
    ('unit','Unit',
     'Measurement units'),
    ('reorder_type','Reorder Type',
     'Stock reorder configuration'),
    ('payment_term','Payment Term',
     'Payment configuration'),
    ('quality_grade','Quality Grade',
     'Quality classification')
) AS v(code,name,remarks)
WHERE d.name = 'Administration'
  AND NOT EXISTS (
      SELECT 1 FROM masters_mastercategory mc
      WHERE mc.code = v.code
  );

-- ============================================================
-- 10. MASTER ITEMS
-- ============================================================

INSERT INTO masters_masteritem
(id, category_id, code, name, plant_id, department_id, attributes,
 is_active, remarks, created_at)
SELECT
    gen_random_uuid()::text,
    mc.id,
    v.code,
    v.name,
    p.id,
    d.id,
    v.attributes::jsonb,
    TRUE,
    v.remarks,
    NOW()
FROM (
    VALUES
    ('machine_type','QC','Quality Control Machine',
     '{"machine_group":"QC","purpose":"quality_inspection","inspection_required":true,"capacity_unit":"KG"}',
     'Machine master attribute example'),
    ('machine_type','PRODUCTION','Production Machine',
     '{"machine_group":"production","purpose":"production","capacity_unit":"KG","maintenance_required":true}',
     'Machine master attribute example'),
    ('machine_type','PACKAGE','Packaging Machine',
     '{"machine_group":"package","purpose":"packaging","capacity_unit":"NOS","maintenance_required":true}',
     'Machine master attribute example'),
    ('machine_type','TRANSPORT','Transport Machine',
     '{"machine_group":"transport","purpose":"transport","fuel_type":"diesel","trip_tracking":true}',
     'Machine master attribute example'),
    ('machine_type','VEHICLE','Vehicle',
     '{"machine_group":"transport","vehicle_type":"road_vehicle","registration_required":true,"fastag_supported":true}',
     'Vehicle is represented as a machine'),

    ('proposal_type','BASIC','Basic',
     '{"proposal_scope":"basic","approval_required":true,"quotation_required":false,"priority":"normal"}',
     'Proposal master attributes'),
    ('proposal_type','FORMULA','Formula',
     '{"proposal_scope":"formula","approval_required":true,"formula_required":true,"quotation_required":true,"priority":"high"}',
     'Proposal master attributes'),
    ('proposal_type','PROJECT','Project',
     '{"proposal_scope":"project","approval_required":true,"project_code_required":true,"quotation_required":true,"milestone_required":true}',
     'Proposal master attributes'),

    ('business_rule','GST-OUT-18','GST Output 18%',
     '{"rule_scope":"tax","tax_type":"output_gst","rate":18,"basis":"percentage","applies_to":"taxable_value"}',
     'Business rule attributes'),
    ('business_rule','HRA-2026','HRA',
     '{"rule_scope":"payroll","component":"basic_salary","rate":40,"basis":"percentage","maximum_amount":null}',
     'Business rule attributes'),
    ('business_rule','DA-2026','DA',
     '{"rule_scope":"payroll","component":"basic_salary","rate":10,"basis":"percentage","maximum_amount":null}',
     'Business rule attributes'),
    ('business_rule','PF-2026','PF',
     '{"rule_scope":"payroll","component":"basic_salary","employee_share":12,"employer_share":12,"basis":"percentage"}',
     'Business rule attributes'),
    ('business_rule','ESI-2026','ESI',
     '{"rule_scope":"payroll","component":"gross_salary","rate":0.75,"basis":"percentage","employee_rate":0.75,"employer_rate":3.25}',
     'Business rule attributes'),

    ('work_center','WC-QC-01','QC Work Center',
     '{"work_center_type":"single_machine","primary_machine_id":"machine-qc-001","member_machine_ids":["machine-qc-001"],"capacity_unit":"KG"}',
     'Work center attributes'),
    ('work_center','WC-PROD-01','Production Work Center',
     '{"work_center_type":"machine_cluster","primary_machine_id":"machine-prod-001","member_machine_ids":["machine-prod-001","machine-prod-002"],"capacity_unit":"KG"}',
     'Work center attributes'),

    ('shift','SHIFT-A','General Shift',
     '{"shift_code":"A","start_time":"09:00","end_time":"18:00","break_minutes":60,"working_hours":8}',
     'Shift attributes'),
    ('shift','SHIFT-B','Second Shift',
     '{"shift_code":"B","start_time":"18:00","end_time":"02:00","break_minutes":30,"working_hours":7.5}',
     'Shift attributes'),

    ('material','RM-RICE-001','Raw Rice',
     '{"material_type":"raw_material","base_unit":"KG","is_batch_tracked":true,"expiry_required":true,"quality_check_required":true}',
     'Material attributes'),
    ('material','PKG-BAG-001','Packaging Bag',
     '{"material_type":"packaging","base_unit":"NOS","is_batch_tracked":false,"expiry_required":false,"quality_check_required":true}',
     'Material attributes'),

    ('unit','KG','Kilogram',
     '{"precision":3,"decimal_places":3,"base_unit":true,"conversion_factor":1}',
     'Unit attributes'),
    ('unit','LTR','Litre',
     '{"precision":3,"decimal_places":3,"base_unit":true,"conversion_factor":1}',
     'Unit attributes'),

    ('reorder_type','MINMAX','Min-Max Reorder',
     '{"method":"min_max","reorder_level_required":true,"frequency_days":30,"auto_reorder":true}',
     'Reorder attributes'),

    ('payment_term','NET30','Net 30 Days',
     '{"credit_days":30,"discount_days":10,"discount_percentage":1,"due_date_rule":"invoice_date_plus_credit_days"}',
     'Payment attributes'),

    ('quality_grade','A','Grade A',
     '{"grade":"A","quality_level":"premium","quality_score_min":90,"moisture_max":5}',
     'Quality attributes')
) AS v(cat_code,code,name,attributes,remarks)
JOIN masters_mastercategory mc ON mc.code = v.cat_code
JOIN core_plant p ON p.name = 'Main Plant'
JOIN core_department d ON d.name = 'Production' AND d.plant_id = p.id
WHERE NOT EXISTS (
    SELECT 1 FROM masters_masteritem mi
    WHERE mi.category_id = mc.id AND mi.code = v.code
);

-- ============================================================
-- 11. MASTER ITEM VERSIONS
-- ============================================================

INSERT INTO masters_masteritemversion
(id, master_item_id, value, effective_from, effective_to, version_no, remarks)
SELECT gen_random_uuid()::text, mi.id, v.value::jsonb, v.eff_from, v.eff_to, v.ver_no, v.remarks
FROM (
    VALUES
    ('GST-OUT-18','{"rate":18,"basis":"percentage","tax_type":"output_gst","effective_rule":"taxable_value"}'::text,DATE '2026-04-01',DATE '2026-12-31',1,'GST version'),
    ('HRA-2026','{"rate":40,"basis":"percentage","component":"basic_salary"}',DATE '2026-04-01',DATE '2026-12-31',1,'HRA version'),
    ('DA-2026','{"rate":10,"basis":"percentage","component":"basic_salary"}',DATE '2026-04-01',DATE '2026-12-31',1,'DA version'),
    ('PF-2026','{"employee_share":12,"employer_share":12,"basis":"percentage","component":"basic_salary"}',DATE '2026-04-01',DATE '2026-12-31',1,'PF version'),
    ('ESI-2026','{"employee_rate":0.75,"employer_rate":3.25,"basis":"percentage","component":"gross_salary"}',DATE '2026-04-01',DATE '2026-12-31',1,'ESI version'),
    ('SHIFT-A','{"start_time":"09:00","end_time":"18:00","break_minutes":60,"working_hours":8}',DATE '2026-01-01',DATE '2026-12-31',1,'Shift version'),
    ('BASIC','{"approval_required":true,"quotation_required":false,"approval_level":1}',DATE '2026-01-01',DATE '2026-12-31',1,'Basic proposal configuration'),
    ('FORMULA','{"approval_required":true,"formula_required":true,"quotation_required":true,"approval_level":2}',DATE '2026-01-01',DATE '2026-12-31',1,'Formula proposal configuration'),
    ('PROJECT','{"approval_required":true,"project_code_required":true,"quotation_required":true,"milestone_required":true,"approval_level":3}',DATE '2026-01-01',DATE '2026-12-31',1,'Project proposal configuration')
) AS v(item_code,value,eff_from,eff_to,ver_no,remarks)
JOIN masters_masteritem mi ON mi.code = v.item_code
WHERE NOT EXISTS (
    SELECT 1 FROM masters_masteritemversion x
    WHERE x.master_item_id = mi.id
      AND x.version_no = v.ver_no
);

-- ============================================================
-- 12. MACHINES
-- ============================================================

INSERT INTO core_machine
(id, plant_id, department_id, machine_type_id, code, name, capacity,
 registration_number, fastag_number, fastag_status, status, remarks, created_at)
SELECT
    gen_random_uuid()::text,
    p.id,
    d.id,
    mt.id,
    v.code,
    v.name,
    v.capacity::numeric,
    v.reg_no,
    v.fastag_no,
    COALESCE(v.fastag_status,'active'),
    'active',
    v.remarks,
    NOW()
FROM (
    VALUES
    ('QC-MCH-001','QC Machine 001','Quality Control','QC','500.000',NULL,NULL,NULL,'QC machine seed'),
    ('PROD-MCH-001','Production Machine 001','Production','PRODUCTION','1000.000',NULL,NULL,NULL,'Production machine seed'),
    ('PROD-MCH-002','Production Machine 002','Production','PRODUCTION','1000.000',NULL,NULL,NULL,'Production machine seed'),
    ('PKG-MCH-001','Packaging Machine 001','Production','PACKAGE','100.000',NULL,NULL,NULL,'Packaging machine seed'),
    ('VEH-001','Transport Vehicle 001','Transport','VEHICLE','0.000','TN-00-AA-0001','FASTAG-0001','active','Vehicle represented as machine')
) AS v(code,name,dept_name,mtype_code,capacity,reg_no,fastag_no,fastag_status,remarks)
JOIN core_plant p ON p.name = 'Main Plant'
JOIN core_department d ON d.name = v.dept_name AND d.plant_id = p.id
LEFT JOIN masters_masteritem mt ON mt.code = v.mtype_code
WHERE NOT EXISTS (
    SELECT 1 FROM core_machine m WHERE m.code = v.code
);

-- ============================================================
-- 13. STORAGE LOCATION BLOCK
-- ============================================================

INSERT INTO core_storagelocationblock
(id, department_id, start_code, end_code, remarks)
SELECT gen_random_uuid()::text, d.id, 'A001', 'A999', 'Initial storage block'
FROM core_department d
WHERE d.name = 'Stores'
  AND NOT EXISTS (
      SELECT 1 FROM core_storagelocationblock b
      WHERE b.department_id = d.id
        AND b.start_code = 'A001'
        AND b.end_code = 'A999'
  );

-- ============================================================
-- 14. STORAGE LOCATIONS
-- ============================================================

INSERT INTO core_storagelocation
(id, plant_id, department_id, storage_location_block_id, code,
 capacity, status, remarks)
SELECT
    gen_random_uuid()::text,
    p.id,
    d.id,
    b.id,
    v.code,
    v.capacity::numeric,
    'active',
    v.remarks
FROM (
    VALUES
    ('A001','10000.000','Raw material storage'),
    ('A002','10000.000','Finished goods storage'),
    ('A003','5000.000','Packaging material storage')
) AS v(code,capacity,remarks)
JOIN core_plant p ON p.name = 'Main Plant'
JOIN core_department d ON d.name = 'Stores' AND d.plant_id = p.id
JOIN core_storagelocationblock b
  ON b.department_id = d.id
 AND b.start_code = 'A001'
 AND b.end_code = 'A999'
WHERE NOT EXISTS (
    SELECT 1 FROM core_storagelocation sl
    WHERE sl.plant_id = p.id AND sl.code = v.code
);

-- ============================================================
-- 15. PROCESS TYPES
-- ============================================================

INSERT INTO process_engine_processtype
(id, owning_department_id, code, name, category, requires_approval, remarks, created_at)
SELECT gen_random_uuid()::text, d.id, v.code, v.name, v.category, v.req_app,
       'V10 dynamic process configuration', NOW()
FROM (
    VALUES
    ('qc_incoming_load','QC Incoming Load','Quality Control','qc',TRUE),
    ('qc_incoming_sample','QC Incoming Sample','Quality Control','qc',TRUE),
    ('qc_inward_processing','QC Inward Processing','Quality Control','qc',TRUE),
    ('qc_tunnel_drying','QC Tunnel Drying','Quality Control','qc',FALSE),
    ('qc_bhuler_cleaning','QC Bhuler Cleaning','Quality Control','qc',FALSE),
    ('qc_bhuler_cleaning_output','QC Bhuler Cleaning Output','Quality Control','qc',FALSE),
    ('disposal_transfer','Disposal Transfer','Quality Control','qc',TRUE),
    ('gunny_bag_usage','Gunny Bag Usage','Quality Control','qc',FALSE),
    ('rejection','Rejection','Quality Control','qc',TRUE),

    ('production_order','Production Order','Production','production',TRUE),
    ('production_material_requisition','Production Material Requisition','Production','production',FALSE),
    ('production_batch','Production Batch','Production','production',TRUE),
    ('machine_allocation','Machine Allocation','Production','production',FALSE),
    ('worker_allocation','Worker Allocation','Production','production',FALSE),
    ('production_qc','Production QC','Production','qc',TRUE),

    ('packaging_material_requisition','Packaging Material Requisition','Production','packaging',FALSE),
    ('packaging_run','Packaging Run','Production','packaging',TRUE),
    ('finished_goods','Finished Goods','Production','packaging',FALSE),
    ('final_qc','Final QC','Production','qc',TRUE),

    ('work_allocation','Work Allocation','Production','admin',FALSE),
    ('housekeeping_shift_assignment','Housekeeping Shift Assignment','Production','admin',FALSE),

    ('material_request','Material Request','Purchase','purchase',TRUE),
    ('purchase_order','Purchase Order','Purchase','purchase',TRUE),
    ('bill','Bill','Purchase','finance',TRUE),
    ('bill_line_item','Bill Line Item','Purchase','finance',FALSE),
    ('goods_receipt','Goods Receipt','Purchase','purchase',TRUE),

    ('gdc','Goods Dispatch / GDC','Transport','transport',TRUE),
    ('vehicle_trip','Vehicle Trip','Transport','transport',FALSE),
    ('delivery_tracking','Delivery Tracking','Transport','transport',FALSE),

    ('machine_log','Machine Log','Production','admin',FALSE),
    ('fuel_log','Fuel Log','Production','admin',FALSE),
    ('maintenance_log','Maintenance Log','Production','admin',FALSE),

    ('candidate_resume_extraction','Candidate Resume Extraction','Human Resources','hr',FALSE),
    ('candidate_first_round','Candidate First Round','Human Resources','hr',TRUE),
    ('candidate_interview','Candidate Interview','Human Resources','hr',TRUE),
    ('worker_paybill','Worker Paybill','Payroll','finance',TRUE)
) AS v(code,name,dept_name,category,req_app)
JOIN core_department d ON d.name = v.dept_name
WHERE NOT EXISTS (
    SELECT 1 FROM process_engine_processtype pt
    WHERE pt.code = v.code
);

-- ============================================================
-- 16. PROCESS ATTRIBUTE DEFINITIONS
-- ============================================================

INSERT INTO process_engine_processattributedefinition
(id, process_type_id, attribute_code, attribute_name, data_type,
 reference_table, is_required, sort_order, remarks)
SELECT
    gen_random_uuid()::text,
    pt.id, v.attr_code, v.attr_name, v.data_type,
    v.ref_table, v.is_required, v.sort_order,
    'Migrated from uploaded Django seed definition'
FROM (
    VALUES
    ('qc_incoming_load','goods_receipt_id','Goods Receipt','reference','process_instance',TRUE,1),
    ('qc_incoming_load','plant_id','Plant','reference',NULL,TRUE,2),
    ('qc_incoming_load','department_id','Department','reference',NULL,TRUE,3),
    ('qc_incoming_load','storage_location_id','Storage Location','reference','storage_location',TRUE,4),
    ('qc_incoming_load','load_datetime','Load Date/Time','datetime',NULL,TRUE,5),
    ('qc_incoming_load','material_id','Material','reference','master_item',TRUE,6),
    ('qc_incoming_load','bag_count','Bag Count','number',NULL,TRUE,7),
    ('qc_incoming_load','total_input_weight','Total Input Weight','number',NULL,TRUE,8),
    ('qc_incoming_load','weight_unit_id','Weight Unit','reference','master_item',TRUE,9),
    ('qc_incoming_load','party_name','Party Name','text',NULL,FALSE,10),
    ('qc_incoming_load','party_contact','Party Contact','text',NULL,FALSE,11),
    ('qc_incoming_load','status','Status','text',NULL,TRUE,12),

    ('qc_incoming_sample','qc_incoming_load_id','QC Incoming Load','reference','process_instance',TRUE,1),
    ('qc_incoming_sample','sample_bag_refs','Sample Bag References','text',NULL,FALSE,2),
    ('qc_incoming_sample','ffa','FFA','number',NULL,FALSE,3),
    ('qc_incoming_sample','moisture','Moisture','number',NULL,FALSE,4),
    ('qc_incoming_sample','description','Description','text',NULL,FALSE,5),
    ('qc_incoming_sample','result','Result','text',NULL,TRUE,6),
    ('qc_incoming_sample','inspector_id','Inspector','reference','employee',TRUE,7),
    ('qc_incoming_sample','md_approved_by','MD Approved By','reference','employee',FALSE,8),
    ('qc_incoming_sample','md_approved_at','MD Approved At','datetime',NULL,FALSE,9),
    ('qc_incoming_sample','tested_at','Tested At','datetime',NULL,FALSE,10),

    ('qc_inward_processing','qc_incoming_load_id','QC Incoming Load','reference','process_instance',TRUE,1),
    ('qc_inward_processing','from_storage_location_id','From Storage Location','reference','storage_location',TRUE,2),
    ('qc_inward_processing','attempt_no','Attempt No','number',NULL,TRUE,3),
    ('qc_inward_processing','parent_attempt_id','Parent Attempt','reference','process_instance',FALSE,4),
    ('qc_inward_processing','bags_total','Bags Total','number',NULL,TRUE,5),
    ('qc_inward_processing','bags_manual_drying','Bags Manual Drying','number',NULL,FALSE,6),
    ('qc_inward_processing','bags_remaining','Bags Remaining','number',NULL,FALSE,7),
    ('qc_inward_processing','jaggery_material_request_id','Jaggery Material Request','reference','process_instance',FALSE,8),
    ('qc_inward_processing','jaggery_storage_location_id','Jaggery Storage Location','reference','storage_location',FALSE,9),
    ('qc_inward_processing','oil_result','Oil Result','number',NULL,FALSE,10),
    ('qc_inward_processing','oil_cake_result','Oil Cake Result','number',NULL,FALSE,11),
    ('qc_inward_processing','sludge_result','Sludge Result','number',NULL,FALSE,12),
    ('qc_inward_processing','result_unit_id','Result Unit','reference','master_item',FALSE,13),
    ('qc_inward_processing','md_id','MD','reference','employee',FALSE,14),
    ('qc_inward_processing','party_approved','Party Approved','boolean',NULL,FALSE,15),
    ('qc_inward_processing','status','Status','text',NULL,TRUE,16),

    ('qc_tunnel_drying','qc_incoming_load_id','QC Incoming Load','reference','process_instance',TRUE,1),
    ('qc_tunnel_drying','storage_location_id','Storage Location','reference','storage_location',TRUE,2),
    ('qc_tunnel_drying','machine_id','Machine','reference','machine',TRUE,3),
    ('qc_tunnel_drying','moisture_before','Moisture Before','number',NULL,FALSE,4),
    ('qc_tunnel_drying','moisture_after','Moisture After','number',NULL,FALSE,5),
    ('qc_tunnel_drying','triggered_reason','Triggered Reason','text',NULL,FALSE,6),
    ('qc_tunnel_drying','operator_id','Operator','reference','employee',TRUE,7),
    ('qc_tunnel_drying','start_time','Start Time','datetime',NULL,TRUE,8),
    ('qc_tunnel_drying','end_time','End Time','datetime',NULL,FALSE,9),
    ('qc_tunnel_drying','status','Status','text',NULL,TRUE,10),

    ('qc_bhuler_cleaning','qc_incoming_load_id','QC Incoming Load','reference','process_instance',TRUE,1),
    ('qc_bhuler_cleaning','qc_tunnel_drying_id','QC Tunnel Drying','reference','process_instance',FALSE,2),
    ('qc_bhuler_cleaning','machine_id','Machine','reference','machine',TRUE,3),
    ('qc_bhuler_cleaning','input_weight','Input Weight','number',NULL,TRUE,4),
    ('qc_bhuler_cleaning','input_weight_unit_id','Input Weight Unit','reference','master_item',TRUE,5),
    ('qc_bhuler_cleaning','operator_id','Operator','reference','employee',TRUE,6),
    ('qc_bhuler_cleaning','start_time','Start Time','datetime',NULL,TRUE,7),
    ('qc_bhuler_cleaning','end_time','End Time','datetime',NULL,FALSE,8),
    ('qc_bhuler_cleaning','status','Status','text',NULL,TRUE,9),

    ('qc_bhuler_cleaning_output','qc_bhuler_cleaning_id','QC Bhuler Cleaning','reference','process_instance',TRUE,1),
    ('qc_bhuler_cleaning_output','output_category_id','Output Category','reference','master_item',TRUE,2),
    ('qc_bhuler_cleaning_output','storage_location_id','Storage Location','reference','storage_location',TRUE,3),
    ('qc_bhuler_cleaning_output','quantity','Quantity','number',NULL,TRUE,4),
    ('qc_bhuler_cleaning_output','unit_id','Unit','reference','master_item',TRUE,5),
    ('qc_bhuler_cleaning_output','onward_movement','Onward Movement','text',NULL,FALSE,6),

    ('production_batch','production_order_id','Production Order','reference','process_instance',TRUE,1),
    ('production_batch','batch_no','Batch No','text',NULL,TRUE,2),
    ('production_batch','batch_quantity','Batch Quantity','number',NULL,TRUE,3),
    ('production_batch','batch_quantity_unit_id','Batch Quantity Unit','reference','master_item',TRUE,4),
    ('production_batch','start_date','Start Date','date',NULL,TRUE,5),
    ('production_batch','end_date','End Date','date',NULL,FALSE,6),
    ('production_batch','oil_quantity','Oil Quantity','number',NULL,FALSE,7),
    ('production_batch','oil_cake_quantity','Oil Cake Quantity','number',NULL,FALSE,8),
    ('production_batch','output_unit_id','Output Unit','reference','master_item',FALSE,9),
    ('production_batch','status','Status','text',NULL,TRUE,10),

    ('work_allocation','plant_id','Plant','reference',NULL,TRUE,1),
    ('work_allocation','department_id','Department','reference',NULL,TRUE,2),
    ('work_allocation','employee_id','Employee','reference','employee',TRUE,3),
    ('work_allocation','shift_id','Shift','reference','master_item',TRUE,4),
    ('work_allocation','work_center_id','Work Center','reference','master_item',TRUE,5),
    ('work_allocation','work_date','Work Date','date',NULL,TRUE,6),
    ('work_allocation','task_description','Task Description','text',NULL,FALSE,7),
    ('work_allocation','reference_process_id','Reference Process','reference','process_instance',FALSE,8),
    ('work_allocation','status','Status','text',NULL,TRUE,9),
    ('work_allocation','electricity_units_reading','Electricity Units Reading','number',NULL,FALSE,10),
    ('work_allocation','fuel_consumption_ltrs','Fuel Consumption Ltrs','number',NULL,FALSE,11),

    ('machine_log','machine_id','Machine','reference','machine',TRUE,1),
    ('machine_log','log_type','Log Type','text',NULL,TRUE,2),
    ('machine_log','start_time','Start Time','datetime',NULL,TRUE,3),
    ('machine_log','end_time','End Time','datetime',NULL,FALSE,4),
    ('machine_log','reason','Reason','text',NULL,FALSE,5),
    ('machine_log','status','Status','text',NULL,TRUE,6),

    ('candidate_resume_extraction','candidate_id','Candidate','reference','process_instance',TRUE,1),
    ('candidate_resume_extraction','document_id','Resume Document','reference',NULL,TRUE,2),
    ('candidate_resume_extraction','extracted_data','Extracted Data','text',NULL,FALSE,3),
    ('candidate_resume_extraction','extraction_status','Extraction Status','text',NULL,TRUE,4),
    ('candidate_resume_extraction','reviewed_by','Reviewed By','reference','employee',FALSE,5),

    ('candidate_first_round','candidate_id','Candidate','reference','process_instance',TRUE,1),
    ('candidate_first_round','marks','Marks','number',NULL,FALSE,2),
    ('candidate_first_round','result','Result','text',NULL,TRUE,3),

    ('candidate_interview','candidate_id','Candidate','reference','process_instance',TRUE,1),
    ('candidate_interview','interviewer_id','Interviewer','reference','employee',TRUE,2),
    ('candidate_interview','interview_date','Interview Date','date',NULL,TRUE,3),
    ('candidate_interview','result','Result','text',NULL,TRUE,4),

    ('worker_paybill','employee_id','Employee','reference','employee',TRUE,1),
    ('worker_paybill','plant_id','Plant','reference',NULL,TRUE,2),
    ('worker_paybill','department_id','Department','reference',NULL,TRUE,3),
    ('worker_paybill','pay_period_start','Pay Period Start','date',NULL,TRUE,4),
    ('worker_paybill','pay_period_end','Pay Period End','date',NULL,TRUE,5),
    ('worker_paybill','da_rule_version_id','DA Rule Version','reference','master_item_version',TRUE,6),
    ('worker_paybill','hra_rule_version_id','HRA Rule Version','reference','master_item_version',TRUE,7),
    ('worker_paybill','esi_rule_version_id','ESI Rule Version','reference','master_item_version',FALSE,8),
    ('worker_paybill','pf_rule_version_id','PF Rule Version','reference','master_item_version',FALSE,9),
    ('worker_paybill','gross_amount','Gross Amount','number',NULL,TRUE,10),
    ('worker_paybill','deductions','Deductions','number',NULL,FALSE,11),
    ('worker_paybill','net_amount','Net Amount','number',NULL,TRUE,12),
    ('worker_paybill','status','Status','text',NULL,TRUE,13)
) AS v(pt_code,attr_code,attr_name,data_type,ref_table,is_required,sort_order)
JOIN process_engine_processtype pt ON pt.code = v.pt_code
WHERE NOT EXISTS (
    SELECT 1
    FROM process_engine_processattributedefinition pad
    WHERE pad.process_type_id = pt.id
      AND pad.attribute_code = v.attr_code
);

-- ============================================================
-- 17. APPROVAL CHAIN TEMPLATES
-- ============================================================

INSERT INTO workflow_approvalchaintemplate
(id, name, process_type_code, remarks)
VALUES
(gen_random_uuid()::text, 'Purchase Order Approval Chain','purchase_order','Template step 1 for Purchase Order'),
(gen_random_uuid()::text, 'Goods Receipt Approval Chain','goods_receipt','Template step 1 for Goods Receipt'),
(gen_random_uuid()::text, 'Worker Paybill Approval Chain','worker_paybill','Template step 1 for Worker Paybill'),
(gen_random_uuid()::text, 'Candidate Interview Approval Chain','candidate_interview','Template step 1 for Candidate Interview')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 18. SYSTEM NOTIFICATION
-- ============================================================

INSERT INTO notifications_systemnotification
(id, title, message, category, is_read, created_at)
VALUES
(gen_random_uuid()::text, 'IDHAYAM ERP Version-10 Initialized',
 'Database configuration and master/process data seeded from the updated V10 SQL insert definition.',
 'system',
 FALSE,
 NOW())
ON CONFLICT DO NOTHING;

COMMIT;
