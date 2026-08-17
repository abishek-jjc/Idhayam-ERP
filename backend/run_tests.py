import os, sys, django, json, uuid

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from apps.core.models import *
from apps.masters.models import *
from apps.process_engine.models import *
from apps.workflow.models import *
from apps.journal.models import *

client = Client()
errors = []
uid = uuid.uuid4().hex[:6]

def test_endpoint(method, url, data=None):
    try:
        if method == 'GET':
            res = client.get(url)
        elif method == 'POST':
            res = client.post(url, data=json.dumps(data) if data is not None else '{}', content_type='application/json')
        elif method == 'PUT':
            res = client.put(url, data=json.dumps(data) if data is not None else '{}', content_type='application/json')
        elif method == 'PATCH':
            res = client.patch(url, data=json.dumps(data) if data is not None else '{}', content_type='application/json')
        elif method == 'DELETE':
            res = client.delete(url)
        
        if res.status_code >= 400:
            errors.append({
                'method': method,
                'url': url,
                'status': res.status_code,
                'response': res.content.decode('utf-8', errors='replace'),
                'sent_data': data
            })
            print(f"FAILED: {method} {url} -> {res.status_code}: {res.content.decode('utf-8', errors='replace')[:200]}")
            return False, res
        else:
            print(f"PASSED: {method} {url} -> {res.status_code}")
            return True, res
    except Exception as e:
        errors.append({
            'method': method,
            'url': url,
            'status': 500,
            'response': str(e),
            'sent_data': data
        })
        print(f"EXCEPTION: {method} {url} -> {str(e)}")
        return False, None

print("=== 1. Testing Structural Master Creations as sent by UI ===")
comp = Company.objects.first()
plant = Plant.objects.first()
dept = Department.objects.first()
desig = Designation.objects.first()
emp = Employee.objects.first()
vendor = Vendor.objects.first()

# Test Plant creation with arbitrary company ID (fallback handles it) and plant_type 'processing'
test_endpoint('POST', '/api/core/plants/', {'code': f'PLN-{uid}', 'name': f'Test Plant {uid}', 'plant_type': 'processing', 'company': 'CMP-13-08-2026-0001'})
# Test Plant creation with valid plant_type
test_endpoint('POST', '/api/core/plants/', {'code': f'PLN2-{uid}', 'name': f'Test Plant 2 {uid}', 'plant_type': 'manufacturing', 'company': comp.id if comp else ''})

# Test Department creation
test_endpoint('POST', '/api/core/departments/', {'name': f'QC Dept {uid}', 'code': f'DPT-{uid}', 'is_shared_across_plants': False})

# Test Employee creation
test_endpoint('POST', '/api/core/employees/', {'name': f'Test Emp {uid}', 'designation': desig.id if desig else '', 'department': dept.id if dept else '', 'plant': plant.id if plant else '', 'status': 'active'})

# Test Machine creation (as sent by UI without plant & department)
test_endpoint('POST', '/api/core/machines/', {'name': f'Test Machine {uid}', 'code': f'MCH-{uid}', 'machine_type': 'single_machine', 'registration_number': ''})
# Test Machine creation with plant & department
test_endpoint('POST', '/api/core/machines/', {'name': f'Test Machine 2 {uid}', 'code': f'MCH2-{uid}', 'plant': plant.id if plant else '', 'department': dept.id if dept else '', 'registration_number': f'TN-{uid}', 'status': 'active'})

print("\n=== 2. Testing Dynamic Masters Creations ===")
cat = MasterCategory.objects.first()
test_endpoint('POST', '/api/masters/categories/', {'code': f'cat_{uid}', 'name': f'Test Category {uid}', 'remarks': ''})
test_endpoint('POST', '/api/masters/attributes/', {'attribute_code': f'attr_{uid}', 'attribute_name': f'Test Attr {uid}', 'data_type': 'text', 'reference_table': '', 'is_required': False, 'sort_order': 1, 'remarks': '', 'master_category': cat.id if cat else ''})
test_endpoint('POST', '/api/masters/items/', {'category': cat.id if cat else '', 'code': f'ITM-{uid}', 'name': f'Test Item {uid}', 'attributes': {'purity': '99%'}, 'values': {'purity': '99%'}})

item = MasterItem.objects.first()
if item:
    test_endpoint('PATCH', f'/api/masters/items/{item.id}/', {'name': 'Updated Item Name'})
    test_endpoint('POST', '/api/masters/versions/', {'master_item': item.id, 'version_no': 999, 'value': {'rate': 12.5}, 'effective_from': '2026-04-01', 'effective_to': '2026-12-31', 'remarks': 'Test'})

print("\n=== 3. Testing Process Engine Creations & Updates ===")
pt = ProcessType.objects.first()
test_endpoint('POST', '/api/process/types/', {'code': f'pt_{uid}', 'name': f'Test QC Process {uid}', 'category': 'qc', 'requires_approval': False})
test_endpoint('POST', '/api/process/definitions/', {'process_type': pt.id if pt else '', 'attribute_code': f'moisture_{uid}', 'attribute_name': 'Moisture %', 'data_type': 'number', 'reference_table': None, 'is_required': False})

# Process Instance creation as sent by UI (with attributes list)
test_endpoint('POST', '/api/process/instances/', {
    'process_type': pt.id if pt else '',
    'plant': plant.id if plant else '',
    'department': dept.id if dept else '',
    'performed_by': emp.id if emp else '',
    'status': 'pending',
    'remarks': 'Executed via dynamic UI process runner',
    'attributes': [{'attribute_code': f'moisture_{uid}', 'value': 5.5}]
})
# Process Instance creation with values dict
test_endpoint('POST', '/api/process/instances/', {
    'process_type': pt.id if pt else '',
    'plant': plant.id if plant else '',
    'department': dept.id if dept else '',
    'performed_by': emp.id if emp else '',
    'status': 'pending',
    'remarks': 'Executed with values dict',
    'values': {f'moisture_{uid}': 5.5}
})

p_inst = ProcessInstance.objects.first()
if p_inst:
    test_endpoint('PATCH', f'/api/process/instances/{p_inst.id}/', {'status': 'completed'})
    test_endpoint('PATCH', f'/api/process/instances/{p_inst.id}/', {'status': 'completed', 'values': {f'moisture_{uid}': 6.0}})
    test_endpoint('POST', '/api/process/verifications/', {'process_instance': p_inst.id, 'verified_by': emp.id if emp else '', 'status': 'verified', 'remarks': 'Sign-off'})

print("\n=== 4. Testing Workflow Proposals & Quotations ===")
if p_inst:
    test_endpoint('POST', '/api/workflow/proposals/', {
        'process_instance': p_inst.id,
        'requested_by': emp.id if emp else '',
        'plant': plant.id if plant else '',
        'department': dept.id if dept else '',
        'status': 'pending',
        'vendor_mode': 'single',
        'remarks': 'Standard proposal'
    })

prop = Proposal.objects.first()
if prop:
    test_endpoint('PATCH', f'/api/workflow/proposals/{prop.id}/', {'status': 'approved'})
    if vendor:
        test_endpoint('POST', '/api/workflow/quotations/', {
            'proposal': prop.id,
            'vendor': vendor.id,
            'quoted_rate': 1500,
            'allocated_percentage': 100,
            'is_selected': True,
            'remarks': 'Quotation details'
        })
    test_endpoint('POST', '/api/workflow/amendments/', {
        'proposal': prop.id,
        'amended_by': emp.id if emp else '',
        'amendment_reason': 'Reason',
        'previous_values': {'remarks': ''},
        'new_values': {'new_quoted_rate': 1800}
    })

print("\n=== 5. Testing Journal & Stock Entries ===")
test_endpoint('POST', '/api/journal/entries/', {
    'movement_type': 'external_in',
    'material_id': item.id if item else 'MAT-001',
    'from_department': '',
    'to_department': dept.id if dept else '',
    'quantity': 1000,
    'unit': 'KG',
    'remarks': 'Test entry',
    'posted_by': emp.id if emp else ''
})

test_endpoint('POST', '/api/journal/entries/', {
    'movement_type': 'internal',
    'material_id': item.id if item else 'MAT-001',
    'from_plant': '',
    'to_plant': '',
    'from_department': dept.id if dept else '',
    'to_department': dept.id if dept else '',
    'from_storage_location': '',
    'to_storage_location': '',
    'vendor': '',
    'account': '',
    'quantity': 500,
    'unit': 'KG',
    'remarks': 'Internal transfer with empty FKs',
    'posted_by': emp.id if emp else ''
})

print("\n=== 6. Testing Process Links ===")
instances_list = list(ProcessInstance.objects.all()[:2])
if len(instances_list) >= 2:
    test_endpoint('POST', '/api/process-links/', {
        'from_process_instance': instances_list[0].id,
        'to_process_instance': instances_list[1].id,
        'link_type': 'settles',
        'remarks': 'Settlement'
    })
    test_endpoint('POST', '/api/process-links/', {
        'from_process_instance': instances_list[0].id,
        'to_process_instance': instances_list[1].id,
        'link_type': 'fulfills',
        'remarks': 'Fulfillment'
    })

print("\n=== 7. Testing UI Metadata Endpoints ===")
test_endpoint('POST', '/api/core/ui-forms/', {'form_name': f'form_{uid}', 'module': 'core', 'title': f'Form {uid}', 'description': '', 'active': True})
uiform = UIForm.objects.filter(form_name=f'form_{uid}').first()
if uiform:
    test_endpoint('POST', '/api/core/ui-form-fields/', {
        'form': uiform.id,
        'field_name': 'Shift Name',
        'field_code': f'shift_{uid}',
        'field_type': 'text',
        'required': False,
        'default_value': '',
        'options': '',
        'reference_table': '',
        'field_order': 1,
        'active': True
    })
    test_endpoint('POST', '/api/core/ui-modals/', {
        'modal_name': f'modal_{uid}',
        'title': f'Test Modal {uid}',
        'width': '600px',
        'height': 'auto',
        'submit_text': 'Submit',
        'cancel_text': 'Cancel',
        'active': True,
        'form': uiform.id
    })

test_endpoint('POST', '/api/core/ui-navbars/', {'page_name': f'page_{uid}', 'title': f'Test Page {uid}', 'show_search': True, 'show_notification': True, 'show_profile': True, 'show_logout': True, 'active': True})
test_endpoint('POST', '/api/core/ui-widgets/', {'widget_name': f'Test KPI {uid}', 'widget_type': 'kpi', 'data_source': '', 'position': 1, 'grid_width': 'col-span-1', 'active': True})
test_endpoint('POST', '/api/core/ui-themes/', {'theme_name': f'theme_{uid}', 'primary_color': '#3b82f6', 'secondary_color': '#6366f1', 'background_color': '#0f172a', 'card_bg_color': '#1e293b', 'text_color': '#f8fafc', 'border_color': 'rgba(255,255,255,0.1)', 'active': False})

print(f"\n================ SUMMARY: {len(errors)} ERRORS DETECTED ================")
for err in errors:
    print(f"\n[ERROR] {err['method']} {err['url']} -> HTTP {err['status']}")
    print(f"  Response: {err['response']}")
    print(f"  Payload: {json.dumps(err['sent_data'])}")

