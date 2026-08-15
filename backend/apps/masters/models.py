import datetime
from django.db import models
from django.utils import timezone
from apps.core.models import generate_custom_pk, Plant, Department

def pk_cat(): return generate_custom_pk("CAT")
def pk_mad(): return generate_custom_pk("MAD")
def pk_itm(): return generate_custom_pk("ITM")
def pk_ver(): return generate_custom_pk("VER")
def pk_mat(): return generate_custom_pk("MAT")
def pk_msc(): return generate_custom_pk("MSC")
def pk_mav(): return generate_custom_pk("MAV")


class MasterCategory(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_cat, editable=False)
    code = models.CharField(max_length=60, unique=True)
    name = models.CharField(max_length=150)
    owning_department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='master_categories')
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.name} [{self.code}]"

class MasterItem(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_itm, editable=False)
    category = models.ForeignKey(MasterCategory, on_delete=models.CASCADE, related_name='items')
    code = models.CharField(max_length=80)
    name = models.CharField(max_length=200)
    plant = models.ForeignKey(Plant, on_delete=models.SET_NULL, null=True, blank=True, related_name='master_items')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='master_items')
    attributes = models.JSONField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('category', 'code')

    def __str__(self):
        return f"{self.name} ({self.category.name})"

class MasterItemVersion(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_ver, editable=False)
    master_item = models.ForeignKey(MasterItem, on_delete=models.CASCADE, related_name='versions')
    value = models.JSONField()
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    version_no = models.IntegerField(default=1)
    remarks = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.master_item.name} v{self.version_no} (From {self.effective_from})"

class MasterAttribute(models.Model):
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
        ('vendor', 'Vendor'),
        ('employee', 'Employee'),
        ('master_item', 'Master Item'),
        ('master_instance', 'Master Instance'),
        ('process_instance', 'Process Instance'),
    ]
    id = models.CharField(primary_key=True, max_length=50, default=pk_mat, editable=False)
    master_category = models.ForeignKey(MasterCategory, on_delete=models.CASCADE, related_name='attributes')
    attribute_code = models.CharField(max_length=80)
    attribute_name = models.CharField(max_length=200)
    data_type = models.CharField(max_length=20, choices=DATA_TYPES, default='text')
    options = models.TextField(blank=True, null=True, help_text="Comma separated options for select dropdown")
    reference_table = models.CharField(max_length=80, choices=REFERENCE_TABLES, null=True, blank=True)
    is_required = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)
    remarks = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('master_category', 'attribute_code')
        ordering = ['sort_order']

    def __str__(self):
        return f"{self.master_category.code}.{self.attribute_code} ({self.data_type})"

class MasterInstance(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_msc, editable=False)
    master_category = models.ForeignKey(MasterCategory, on_delete=models.CASCADE, related_name='instances')
    master_item = models.ForeignKey(MasterItem, on_delete=models.CASCADE, related_name='instances', null=True, blank=True)
    code = models.CharField(max_length=80)
    name = models.CharField(max_length=200)
    plant = models.ForeignKey(Plant, on_delete=models.SET_NULL, null=True, blank=True, related_name='master_instances')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='master_instances')
    is_active = models.BooleanField(default=True)
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Instance {self.id} - {self.name} ({self.master_category.name})"

class MasterAttributeValue(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_mav, editable=False)
    master_instance = models.ForeignKey(MasterInstance, on_delete=models.CASCADE, related_name='attribute_values', null=True, blank=True)
    master_attribute = models.ForeignKey(MasterAttribute, on_delete=models.CASCADE, related_name='values', null=True, blank=True)

    value_text = models.TextField(null=True, blank=True)
    value_number = models.DecimalField(max_digits=18, decimal_places=4, null=True, blank=True)
    value_date = models.DateField(null=True, blank=True)
    value_datetime = models.DateTimeField(null=True, blank=True)
    value_boolean = models.BooleanField(null=True, blank=True)
    value_reference_id = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('master_instance', 'master_attribute')


