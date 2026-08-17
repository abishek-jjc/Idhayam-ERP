import datetime
import threading
from django.db import models

_seq_lock = threading.Lock()
_seq_counters = {}

def _get_max_seq_from_db(prefix_key):
    try:
        from django.apps import apps
        max_seq = 0
        pattern = f"{prefix_key}-"
        for model in apps.get_models():
            if hasattr(model, 'id') and hasattr(model._meta, 'pk') and isinstance(model._meta.pk, models.CharField):
                try:
                    matches = model.objects.filter(id__startswith=pattern).values_list('id', flat=True)
                    for pk_val in matches:
                        try:
                            seq_part = int(pk_val.rsplit('-', 1)[-1])
                            if seq_part > max_seq:
                                max_seq = seq_part
                        except (ValueError, IndexError):
                            pass
                except Exception:
                    pass
        return max_seq
    except Exception:
        return 0

def generate_custom_pk(prefix="ERP"):
    now = datetime.datetime.now()
    date_str = now.strftime("%d-%m-%Y")
    key = f"{prefix.upper()}-{date_str}"
    with _seq_lock:
        if key not in _seq_counters:
            _seq_counters[key] = _get_max_seq_from_db(key)
        _seq_counters[key] += 1
        seq = _seq_counters[key]
    return f"{key}-{seq:04d}"

def pk_cmp(): return generate_custom_pk("CMP")
def pk_pln(): return generate_custom_pk("PLN")
def pk_dpt(): return generate_custom_pk("DPT")
def pk_dsg(): return generate_custom_pk("DSG")
def pk_emp(): return generate_custom_pk("EMP")
def pk_edt(): return generate_custom_pk("EDT")
def pk_bnk(): return generate_custom_pk("BNK")
def pk_rol(): return generate_custom_pk("ROL")
def pk_emr(): return generate_custom_pk("EMR")
def pk_prm(): return generate_custom_pk("PRM")
def pk_vnd(): return generate_custom_pk("VND")
def pk_mac(): return generate_custom_pk("MAC")
def pk_blk(): return generate_custom_pk("BLK")
def pk_bin(): return generate_custom_pk("BIN")
def pk_doc(): return generate_custom_pk("DOC")
def pk_coa(): return generate_custom_pk("COA")
def pk_mnu(): return generate_custom_pk("MNU")
def pk_mnp(): return generate_custom_pk("MNP")
def pk_nav(): return generate_custom_pk("NAV")
def pk_mdl(): return generate_custom_pk("MDL")
def pk_frm(): return generate_custom_pk("FRM")
def pk_fld(): return generate_custom_pk("FLD")
def pk_wgt(): return generate_custom_pk("WGT")
def pk_thm(): return generate_custom_pk("THM")

class Company(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_cmp, editable=False)
    name = models.CharField(max_length=200)
    gst_number = models.CharField(max_length=20, blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Plant(models.Model):
    PLANT_TYPES = [
        ('manufacturing', 'Manufacturing'),
        ('processing', 'Processing Unit'),
        ('packaging', 'Packaging Warehouse'),
        ('storage', 'Central Cold Storage'),
        ('transport', 'Transport'),
    ]
    id = models.CharField(primary_key=True, max_length=50, default=pk_pln, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='plants', null=True, blank=True)
    name = models.CharField(max_length=150)
    plant_type = models.CharField(max_length=30, choices=PLANT_TYPES, default='manufacturing')
    is_active = models.BooleanField(default=True)
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.plant_type})"

class Department(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_dpt, editable=False)
    plant = models.ForeignKey(Plant, on_delete=models.CASCADE, related_name='departments', null=True, blank=True)
    name = models.CharField(max_length=150)
    is_shared_across_plants = models.BooleanField(default=False)
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Designation(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_dsg, editable=False)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='designations', null=True, blank=True)
    title = models.CharField(max_length=150)
    hierarchy_level = models.IntegerField(default=1)
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - Level {self.hierarchy_level}"

class Employee(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('terminated', 'Terminated'),
    ]
    id = models.CharField(primary_key=True, max_length=50, default=pk_emp, editable=False)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    designation = models.ForeignKey(Designation, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    plant = models.ForeignKey(Plant, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    name = models.CharField(max_length=150)
    user_account_id = models.CharField(max_length=50, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        desig_str = self.designation.title if self.designation else "Staff"
        return f"{self.name} ({desig_str})"

class EmployeeDetail(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_edt, editable=False)
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='details')
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, blank=True, null=True)
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    date_of_joining = models.DateField(null=True, blank=True)
    emergency_contact_name = models.CharField(max_length=150, blank=True, null=True)
    emergency_contact_number = models.CharField(max_length=20, blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)

class EmployeeBankAccount(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_bnk, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='bank_accounts')
    bank_name = models.CharField(max_length=150)
    account_holder_name = models.CharField(max_length=150)
    account_number = models.CharField(max_length=40)
    ifsc_code = models.CharField(max_length=20)
    is_primary = models.BooleanField(default=True)
    remarks = models.TextField(blank=True, null=True)

class Role(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_rol, editable=False)
    name = models.CharField(max_length=100, unique=True)
    remarks = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class EmployeeRole(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_emr, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='roles')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='employees')

    class Meta:
        unique_together = ('employee', 'role')

class Permission(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_prm, editable=False)
    designation = models.ForeignKey(Designation, on_delete=models.CASCADE, related_name='permissions', null=True, blank=True)
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='permissions', null=True, blank=True)
    module = models.CharField(max_length=80)  # dashboard, structural_masters, dynamic_masters, process_engine, workflow, journal, admin
    process_type = models.ForeignKey('process_engine.ProcessType', on_delete=models.CASCADE, related_name='permissions', null=True, blank=True)
    master_category = models.ForeignKey('masters.MasterCategory', on_delete=models.CASCADE, related_name='permissions', null=True, blank=True)
    action = models.CharField(max_length=40, blank=True, null=True)
    can_view = models.BooleanField(default=True)
    can_create = models.BooleanField(default=False)
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)
    can_approve = models.BooleanField(default=False)

    class Meta:
        ordering = ['id']

    def __str__(self):
        target = self.designation.title if self.designation else (self.role.name if self.role else 'Global')
        pt = f" [{self.process_type.name}]" if self.process_type else ""
        return f"{target} -> {self.module}{pt}"


class Vendor(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_vnd, editable=False)
    name = models.CharField(max_length=200)
    gst_number = models.CharField(max_length=20, blank=True, null=True)
    contact_info = models.JSONField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Machine(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('maintenance', 'Under Maintenance'),
        ('inactive', 'Inactive'),
    ]
    id = models.CharField(primary_key=True, max_length=50, default=pk_mac, editable=False)
    plant = models.ForeignKey(Plant, on_delete=models.SET_NULL, null=True, blank=True, related_name='machines')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='machines')
    machine_type_id = models.CharField(max_length=50, null=True, blank=True)
    code = models.CharField(max_length=40, unique=True)
    name = models.CharField(max_length=150)
    capacity = models.DecimalField(max_digits=14, decimal_places=3, null=True, blank=True)
    registration_number = models.CharField(max_length=30, unique=True, null=True, blank=True)
    fastag_number = models.CharField(max_length=30, null=True, blank=True)
    fastag_status = models.CharField(max_length=20, default='active', null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='active')
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} [{self.code}]"

class StorageLocationBlock(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_blk, editable=False)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='blocks')
    start_code = models.CharField(max_length=4)
    end_code = models.CharField(max_length=4)
    remarks = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Block {self.start_code}-{self.end_code} ({self.department.name})"

class StorageLocation(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_bin, editable=False)
    plant = models.ForeignKey(Plant, on_delete=models.CASCADE, related_name='storage_locations')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='storage_locations')
    storage_location_block = models.ForeignKey(StorageLocationBlock, on_delete=models.CASCADE, related_name='locations')
    code = models.CharField(max_length=4)
    capacity = models.DecimalField(max_digits=14, decimal_places=3, null=True, blank=True)
    status = models.CharField(max_length=30, default='active')
    remarks = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('plant', 'code')

    def __str__(self):
        return f"Bin {self.code} ({self.department.name})"

class Document(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_doc, editable=False)
    entity_table = models.CharField(max_length=80)
    entity_id = models.CharField(max_length=50)
    file_path = models.CharField(max_length=500)
    version_no = models.IntegerField(default=1)
    uploaded_by = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='uploaded_documents')
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class ChartOfAccount(models.Model):
    ACCOUNT_TYPES = [
        ('asset', 'Asset'),
        ('liability', 'Liability'),
        ('income', 'Income'),
        ('expense', 'Expense'),
    ]
    id = models.CharField(primary_key=True, max_length=50, default=pk_coa, editable=False)
    code = models.CharField(max_length=30, unique=True)
    name = models.CharField(max_length=150)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPES)
    remarks = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.code} - {self.name} [{self.account_type}]"


# =====================================================================
# ERP v3 Dynamic Metadata Models
# =====================================================================

class UIMenu(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_mnu, editable=False)
    menu_name = models.CharField(max_length=150)
    menu_path = models.CharField(max_length=200)
    module_code = models.CharField(max_length=80)
    menu_icon = models.CharField(max_length=50, default='LayoutDashboard')
    parent_menu = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='submenus')
    display_order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ui_menu'
        ordering = ['display_order', 'menu_name']

    def __str__(self):
        return f"{self.menu_name} ({self.menu_path})"


class UIMenuPermission(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_mnp, editable=False)
    menu = models.ForeignKey(UIMenu, on_delete=models.CASCADE, related_name='permissions')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='menu_permissions', null=True, blank=True)
    permission = models.CharField(max_length=50, default='view')
    can_view = models.BooleanField(default=True)

    class Meta:
        db_table = 'ui_menu_permission'
        unique_together = ('menu', 'role', 'permission')

    def __str__(self):
        role_str = self.role.name if self.role else 'All Roles'
        return f"{self.menu.menu_name} - {role_str}"


class UINavbar(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_nav, editable=False)
    page_name = models.CharField(max_length=100, unique=True)
    title = models.CharField(max_length=150)
    icon = models.CharField(max_length=50, blank=True, null=True)
    show_search = models.BooleanField(default=True)
    show_notification = models.BooleanField(default=True)
    show_profile = models.BooleanField(default=True)
    show_logout = models.BooleanField(default=True)
    active = models.BooleanField(default=True)

    class Meta:
        db_table = 'ui_navbar'

    def __str__(self):
        return f"Navbar Config ({self.page_name})"


class UIForm(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_frm, editable=False)
    form_name = models.CharField(max_length=100, unique=True)
    module = models.CharField(max_length=80)
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    active = models.BooleanField(default=True)

    class Meta:
        db_table = 'ui_form'

    def __str__(self):
        return f"{self.title} [{self.form_name}]"


class UIFormField(models.Model):
    FIELD_TYPES = [
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
        ('file', 'File Upload'),
        ('url', 'URL'),
        ('password', 'Password'),
    ]
    id = models.CharField(primary_key=True, max_length=50, default=pk_fld, editable=False)
    form = models.ForeignKey(UIForm, on_delete=models.CASCADE, related_name='fields')
    field_name = models.CharField(max_length=150)
    field_code = models.CharField(max_length=80)
    field_type = models.CharField(max_length=30, choices=FIELD_TYPES, default='text')
    required = models.BooleanField(default=False)
    default_value = models.CharField(max_length=255, blank=True, null=True)
    options = models.TextField(blank=True, null=True, help_text="Comma separated choices for dropdown")
    reference_table = models.CharField(max_length=80, blank=True, null=True)
    field_order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)

    class Meta:
        db_table = 'ui_form_field'
        ordering = ['field_order']

    def __str__(self):
        return f"{self.form.form_name}.{self.field_code} ({self.field_type})"


class UIModal(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_mdl, editable=False)
    modal_name = models.CharField(max_length=100, unique=True)
    title = models.CharField(max_length=150)
    width = models.CharField(max_length=30, default='600px')
    height = models.CharField(max_length=30, default='auto')
    submit_text = models.CharField(max_length=50, default='Submit')
    cancel_text = models.CharField(max_length=50, default='Cancel')
    active = models.BooleanField(default=True)
    form = models.ForeignKey(UIForm, on_delete=models.SET_NULL, null=True, blank=True, related_name='modals')

    class Meta:
        db_table = 'ui_modal'

    def __str__(self):
        return f"Modal: {self.title} ({self.width})"


class UIWidget(models.Model):
    WIDGET_TYPES = [
        ('kpi', 'KPI Metric Card'),
        ('chart_bar', 'Bar Chart'),
        ('chart_pie', 'Pie Chart'),
        ('table', 'Summary Table'),
        ('list', 'Activity List'),
        ('shortcut', 'Quick Shortcut'),
    ]
    id = models.CharField(primary_key=True, max_length=50, default=pk_wgt, editable=False)
    widget_name = models.CharField(max_length=150)
    widget_type = models.CharField(max_length=50, choices=WIDGET_TYPES, default='kpi')
    data_source = models.CharField(max_length=200, blank=True, null=True)
    position = models.IntegerField(default=0)
    grid_width = models.CharField(max_length=30, default='col-span-1')
    active = models.BooleanField(default=True)

    class Meta:
        db_table = 'ui_widget'
        ordering = ['position']

    def __str__(self):
        return f"Widget: {self.widget_name} ({self.widget_type})"


class UITheme(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_thm, editable=False)
    theme_name = models.CharField(max_length=100, unique=True)
    primary_color = models.CharField(max_length=30, default='#3b82f6')
    secondary_color = models.CharField(max_length=30, default='#6366f1')
    background_color = models.CharField(max_length=30, default='#0f172a')
    card_bg_color = models.CharField(max_length=30, default='#1e293b')
    text_color = models.CharField(max_length=30, default='#f8fafc')
    border_color = models.CharField(max_length=30, default='rgba(255,255,255,0.1)')
    active = models.BooleanField(default=False)

    class Meta:
        db_table = 'ui_theme'

    def __str__(self):
        return f"Theme: {self.theme_name} {'[ACTIVE]' if self.active else ''}"

