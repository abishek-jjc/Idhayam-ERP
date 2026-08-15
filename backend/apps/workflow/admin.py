from django.contrib import admin
from .models import (
    Proposal, ProposalVendorQuotation, ProposalAmendment,
    ApprovalChainTemplate, ApprovalStep
)

class ProposalVendorQuotationInline(admin.TabularInline):
    model = ProposalVendorQuotation
    extra = 1

class ProposalAmendmentInline(admin.StackedInline):
    model = ProposalAmendment
    extra = 0

class ApprovalStepInline(admin.TabularInline):
    model = ApprovalStep
    extra = 1

@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):
    list_display = ('id', 'process_instance', 'requested_by', 'plant', 'department', 'status', 'vendor_mode', 'created_at')
    list_filter = ('status', 'vendor_mode', 'plant', 'department')
    search_fields = ('id', 'process_instance__id', 'remarks')
    inlines = [ProposalVendorQuotationInline, ProposalAmendmentInline, ApprovalStepInline]
    ordering = ('-created_at',)

@admin.register(ProposalVendorQuotation)
class ProposalVendorQuotationAdmin(admin.ModelAdmin):
    list_display = ('id', 'proposal', 'vendor', 'quoted_rate', 'is_selected', 'allocated_percentage', 'remarks')
    list_filter = ('is_selected', 'vendor')
    search_fields = ('id', 'proposal__id', 'vendor__name', 'remarks')

@admin.register(ProposalAmendment)
class ProposalAmendmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'proposal', 'amended_by', 'amendment_reason', 'created_at')
    list_filter = ('amended_by', 'created_at')
    search_fields = ('id', 'proposal__id', 'amendment_reason')
    ordering = ('-created_at',)

@admin.register(ApprovalChainTemplate)
class ApprovalChainTemplateAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'process_type_code', 'remarks')
    search_fields = ('id', 'name', 'process_type_code', 'remarks')

@admin.register(ApprovalStep)
class ApprovalStepAdmin(admin.ModelAdmin):
    list_display = ('id', 'proposal', 'step_order', 'designation', 'acted_by', 'status', 'acted_at')
    list_filter = ('status', 'designation')
    search_fields = ('id', 'proposal__id', 'remarks')
    ordering = ('proposal', 'step_order')
