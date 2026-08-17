import datetime
from django.db import models
from apps.core.models import Plant, Department, Employee, generate_custom_pk

def pk_pct(): return generate_custom_pk("PCT")
def pk_pad(): return generate_custom_pk("PAD")
def pk_prc(): return generate_custom_pk("PRC")
def pk_pav(): return generate_custom_pk("PAV")
def pk_lnk(): return generate_custom_pk("LNK")
def pk_vrf(): return generate_custom_pk("VRF")

class ProcessType(models.Model):
    CATEGORY_CHOICES = [
        ('qc', 'Quality Control'),
        ('production', 'Production'),
        ('packaging', 'Packaging'),
        ('purchase', 'Purchase'),
        ('transport', 'Transport'),
        ('hr', 'HR & Payroll'),
        ('finance', 'Finance'),
        ('admin', 'Admin & Maintenance'),
    ]
    id = models.CharField(primary_key=True, max_length=50, default=pk_pct, editable=False)
    code = models.CharField(max_length=80, unique=True)
    name = models.CharField(max_length=200)
    owning_department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='process_types')
    category = models.CharField(max_length=40, choices=CATEGORY_CHOICES, default='qc')
    requires_approval = models.BooleanField(default=False)
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} [{self.code}]"

class ProcessAttributeDefinition(models.Model):
    DATA_TYPES = [
        ('text', 'Text'),
        ('textarea', 'Textarea'),
        ('number', 'Number'),
        ('date', 'Date'),
        ('time', 'Time'),
        ('datetime', 'DateTime'),
        ('boolean', 'Boolean'),
        ('select', 'Dropdown'),
        ('reference', 'Reference FK'),
        ('email', 'Email'),
        ('phone', 'Phone'),
        ('currency', 'Currency'),
        ('file', 'File'),
        ('url', 'URL'),
        ('password', 'Password'),
    ]
    REFERENCE_TABLES = [
        ('storage_location', 'Storage Location'),
        ('machine', 'Machine / Vehicle'),
        ('master_item', 'Master Item'),
        ('master_item_version', 'Master Item Version'),
        ('vendor', 'Vendor'),
        ('employee', 'Employee'),
        ('process_instance', 'Process Instance'),
    ]
    id = models.CharField(primary_key=True, max_length=50, default=pk_pad, editable=False)
    process_type = models.ForeignKey(ProcessType, on_delete=models.CASCADE, related_name='attribute_definitions')
    attribute_code = models.CharField(max_length=80)
    attribute_name = models.CharField(max_length=200)
    data_type = models.CharField(max_length=20, choices=DATA_TYPES)
    options = models.TextField(blank=True, null=True, help_text="Comma separated options for select dropdown")
    reference_table = models.CharField(max_length=80, choices=REFERENCE_TABLES, null=True, blank=True)
    is_required = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)
    remarks = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('process_type', 'attribute_code')
        ordering = ['sort_order']

    def __str__(self):
        return f"{self.process_type.code}.{self.attribute_code} ({self.data_type})"

class ProcessInstance(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]
    id = models.CharField(primary_key=True, max_length=50, default=pk_prc, editable=False)
    process_type = models.ForeignKey(ProcessType, on_delete=models.CASCADE, related_name='instances')
    plant = models.ForeignKey(Plant, on_delete=models.CASCADE, related_name='process_instances')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='process_instances')
    performed_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='performed_processes')
    parent_process_instance = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='child_instances')
    proposal_id = models.CharField(max_length=50, null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Instance {self.id} - {self.process_type.name} ({self.status})"

class ProcessAttributeValue(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_pav, editable=False)
    process_instance = models.ForeignKey(ProcessInstance, on_delete=models.CASCADE, related_name='attribute_values')
    attribute_definition = models.ForeignKey(ProcessAttributeDefinition, on_delete=models.CASCADE, related_name='values')
    value_text = models.TextField(null=True, blank=True)
    value_number = models.DecimalField(max_digits=18, decimal_places=4, null=True, blank=True)
    value_date = models.DateField(null=True, blank=True)
    value_datetime = models.DateTimeField(null=True, blank=True)
    value_boolean = models.BooleanField(null=True, blank=True)
    value_reference_id = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('process_instance', 'attribute_definition')

class ProcessLink(models.Model):
    LINK_TYPES = [
        ('consumes', 'Consumes'),
        ('pays_for', 'Pays For'),
        ('fulfills', 'Fulfills'),
        ('amends', 'Amends'),
        ('splits_into', 'Splits Into'),
        ('generates_pay', 'Generates Pay'),
        ('verifies', 'Verifies'),
        ('settles', 'Settles'),
    ]
    id = models.CharField(primary_key=True, max_length=50, default=pk_lnk, editable=False)
    from_process_instance = models.ForeignKey(ProcessInstance, on_delete=models.CASCADE, related_name='outgoing_links')
    to_process_instance = models.ForeignKey(ProcessInstance, on_delete=models.CASCADE, related_name='incoming_links')
    link_type = models.CharField(max_length=60, choices=LINK_TYPES)
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class AdminVerification(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Sign-off'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    id = models.CharField(primary_key=True, max_length=50, default=pk_vrf, editable=False)
    process_instance = models.ForeignKey(ProcessInstance, on_delete=models.CASCADE, related_name='verifications')
    verified_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='admin_verifications')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    verified_at = models.DateTimeField(null=True, blank=True)
    remarks = models.TextField(blank=True, null=True)
