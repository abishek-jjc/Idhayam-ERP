from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from .models import JournalEntry, Stock
from apps.core.models import Plant, Department, StorageLocation, Vendor, Employee
from apps.masters.models import MasterItem

def get_or_default_storage_location(plant=None, department=None, location=None):
    if location:
        return location
    # Try finding an existing storage location matching plant/department
    query = StorageLocation.objects.all()
    if plant:
        query = query.filter(plant=plant)
    if department:
        query = query.filter(department=department)
    loc = query.first()
    if not loc:
        loc = StorageLocation.objects.first()
    if not loc:
        # Fallback create default bin
        default_plant = plant or Plant.objects.first()
        default_dept = department or Department.objects.first()
        loc, _ = StorageLocation.objects.get_or_create(
            code='LOC-DEFAULT-BIN',
            defaults={
                'name': 'Default Storage Location',
                'plant': default_plant,
                'department': default_dept,
            }
        )
    return loc

def update_stock_cache_from_entry(entry):
    """
    Synchronizes journal_stock cache whenever a journal entry movement is posted.
    - Decrements stock for source (from_plant, from_department, material_id, from_storage_location).
    - Increments stock for target (to_plant, to_department, material_id, to_storage_location).
    """
    if not entry.material_id:
        return

    qty = Decimal(str(entry.quantity or 0))
    if qty <= 0:
        return

    with transaction.atomic():
        # 1. Source Stock Decrement
        if entry.from_plant and entry.from_department:
            from_loc = get_or_default_storage_location(entry.from_plant, entry.from_department, entry.from_storage_location)
            source_stock, _ = Stock.objects.get_or_create(
                plant=entry.from_plant,
                department=entry.from_department,
                material_id=entry.material_id,
                storage_location=from_loc,
                defaults={'quantity': Decimal('0.0000'), 'unit_id': entry.unit or 'KG'}
            )
            new_source_qty = max(Decimal('0.0000'), source_stock.quantity - qty)
            source_stock.quantity = new_source_qty
            source_stock.save()

        # 2. Target Stock Increment / Upsert
        if entry.to_plant and entry.to_department:
            to_loc = get_or_default_storage_location(entry.to_plant, entry.to_department, entry.to_storage_location)
            target_stock, _ = Stock.objects.get_or_create(
                plant=entry.to_plant,
                department=entry.to_department,
                material_id=entry.material_id,
                storage_location=to_loc,
                defaults={'quantity': Decimal('0.0000'), 'unit_id': entry.unit or 'KG'}
            )
            target_stock.quantity = target_stock.quantity + qty
            target_stock.save()

def create_automated_journal_entry(
    movement_type='internal',
    material_id=None,
    quantity=1.0,
    unit='KG',
    value_amount=None,
    from_plant=None,
    from_department=None,
    from_storage_location=None,
    to_plant=None,
    to_department=None,
    to_storage_location=None,
    vendor=None,
    posted_by=None,
    process_instance=None,
    remarks=None
):
    """
    Service helper function to automatically create a JournalEntry and trigger stock synchronization.
    """
    if not material_id:
        first_item = MasterItem.objects.first()
        material_id = first_item.id if first_item else 'MAT-GENERAL'

    if not posted_by:
        posted_by = Employee.objects.first()

    entry = JournalEntry.objects.create(
        movement_type=movement_type,
        material_id=material_id,
        quantity=Decimal(str(quantity or 1.0)),
        unit=unit or 'KG',
        value_amount=Decimal(str(value_amount)) if value_amount else None,
        from_plant=from_plant,
        from_department=from_department,
        from_storage_location=from_storage_location,
        to_plant=to_plant,
        to_department=to_department,
        to_storage_location=to_storage_location,
        vendor=vendor,
        posted_by=posted_by,
        process_instance=process_instance,
        remarks=remarks or f"Automated entry logged via process/workflow execution"
    )

    update_stock_cache_from_entry(entry)
    return entry
