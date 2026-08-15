import datetime
from django.db import models
from apps.core.models import Plant, Department, StorageLocation, Vendor, Employee, ChartOfAccount, generate_custom_pk
from apps.process_engine.models import ProcessInstance

def pk_jrn(): return generate_custom_pk("JRN")
def pk_stk(): return generate_custom_pk("STK")

class JournalEntry(models.Model):
    MOVEMENT_TYPES = [
        ('internal', 'Internal Department Transfer'),
        ('external_in', 'External Receipt (Vendor Inward)'),
        ('external_out', 'External Dispatch (Customer Outward)'),
    ]
    id = models.CharField(primary_key=True, max_length=50, default=pk_jrn, editable=False)
    entry_date = models.DateField(auto_now_add=True)
    movement_type = models.CharField(max_length=40, choices=MOVEMENT_TYPES)
    material_id = models.CharField(max_length=50)
    quantity = models.DecimalField(max_digits=16, decimal_places=4)
    unit = models.CharField(max_length=50, default='KG', blank=True, null=True)
    from_plant = models.ForeignKey(Plant, on_delete=models.SET_NULL, null=True, blank=True, related_name='journal_from_plants')
    to_plant = models.ForeignKey(Plant, on_delete=models.SET_NULL, null=True, blank=True, related_name='journal_to_plants')
    from_department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='journal_from_depts')
    to_department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='journal_to_depts')
    from_storage_location = models.ForeignKey(StorageLocation, on_delete=models.SET_NULL, null=True, blank=True, related_name='journal_from_bins')
    to_storage_location = models.ForeignKey(StorageLocation, on_delete=models.SET_NULL, null=True, blank=True, related_name='journal_to_bins')
    vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, blank=True, related_name='journal_entries')
    value_amount = models.DecimalField(max_digits=16, decimal_places=2, null=True, blank=True)
    account = models.ForeignKey(ChartOfAccount, on_delete=models.SET_NULL, null=True, blank=True, related_name='journal_entries')
    posted_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='posted_journals')
    process_instance = models.ForeignKey(ProcessInstance, on_delete=models.SET_NULL, null=True, blank=True, related_name='journal_entries')
    remarks = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Journal {self.id} ({self.movement_type} - {self.quantity})"

class Stock(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_stk, editable=False)
    plant = models.ForeignKey(Plant, on_delete=models.CASCADE, related_name='stocks')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='stocks')
    material_id = models.CharField(max_length=50)
    storage_location = models.ForeignKey(StorageLocation, on_delete=models.CASCADE, related_name='stocks')
    quantity = models.DecimalField(max_digits=16, decimal_places=4, default=0.0000)
    unit_id = models.CharField(max_length=50, null=True, blank=True)
    stock_status = models.CharField(max_length=40, default='available')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('plant', 'department', 'material_id', 'storage_location')

    def __str__(self):
        return f"Stock {self.material_id} at {self.storage_location.code}: {self.quantity}"
