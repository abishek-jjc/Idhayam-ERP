import datetime
from django.db import models
from apps.core.models import Plant, Department, Designation, Employee, Vendor, generate_custom_pk
from apps.process_engine.models import ProcessInstance

def pk_prp(): return generate_custom_pk("PRP")
def pk_quo(): return generate_custom_pk("QUO")
def pk_amd(): return generate_custom_pk("AMD")
def pk_act(): return generate_custom_pk("ACT")
def pk_stp(): return generate_custom_pk("STP")

class Proposal(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('amended', 'Amended'),
    ]
    VENDOR_MODES = [
        ('single', 'Single Vendor'),
        ('multiple', 'Multiple Vendors'),
    ]
    id = models.CharField(primary_key=True, max_length=50, default=pk_prp, editable=False)
    process_instance = models.ForeignKey(ProcessInstance, on_delete=models.CASCADE, related_name='proposals', null=True, blank=True)
    requested_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='proposals_requested')
    plant = models.ForeignKey(Plant, on_delete=models.SET_NULL, null=True, blank=True, related_name='proposals')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='proposals')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='draft')
    vendor_mode = models.CharField(max_length=20, choices=VENDOR_MODES, default='single')
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Proposal {self.id} ({self.status})"

class ProposalVendorQuotation(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_quo, editable=False)
    proposal = models.ForeignKey(Proposal, on_delete=models.CASCADE, related_name='quotations')
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='quotations')
    quoted_rate = models.DecimalField(max_digits=14, decimal_places=2)
    is_selected = models.BooleanField(default=False)
    allocated_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    remarks = models.TextField(blank=True, null=True)

class ProposalAmendment(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_amd, editable=False)
    proposal = models.ForeignKey(Proposal, on_delete=models.CASCADE, related_name='amendments')
    amended_by = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='amendments_made')
    amendment_reason = models.TextField()
    previous_values = models.JSONField()
    new_values = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

class ApprovalChainTemplate(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_act, editable=False)
    name = models.CharField(max_length=150)
    process_type_code = models.CharField(max_length=80)
    remarks = models.TextField(blank=True, null=True)

class ApprovalStep(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    id = models.CharField(primary_key=True, max_length=50, default=pk_stp, editable=False)
    proposal = models.ForeignKey(Proposal, on_delete=models.CASCADE, related_name='approval_steps')
    step_order = models.IntegerField(default=1)
    designation = models.ForeignKey(Designation, on_delete=models.CASCADE, related_name='approval_steps')
    acted_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='approval_actions')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    acted_at = models.DateTimeField(null=True, blank=True)
    remarks = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['step_order']
