from django.contrib import admin
from .models import (
    ProcessType, ProcessAttributeDefinition, ProcessInstance,
    ProcessAttributeValue, ProcessLink, AdminVerification
)

class ProcessAttributeDefinitionInline(admin.TabularInline):
    model = ProcessAttributeDefinition
    extra = 1

class ProcessAttributeValueInline(admin.TabularInline):
    model = ProcessAttributeValue
    extra = 1

class AdminVerificationInline(admin.StackedInline):
    model = AdminVerification
    extra = 0

@admin.register(ProcessType)
class ProcessTypeAdmin(admin.ModelAdmin):
    list_display = ('id', 'code', 'name', 'category', 'owning_department', 'requires_approval', 'created_at')
    list_filter = ('category', 'requires_approval', 'owning_department')
    search_fields = ('id', 'code', 'name', 'remarks')
    inlines = [ProcessAttributeDefinitionInline]
    ordering = ('-created_at',)

@admin.register(ProcessAttributeDefinition)
class ProcessAttributeDefinitionAdmin(admin.ModelAdmin):
    list_display = ('id', 'process_type', 'attribute_code', 'attribute_name', 'data_type', 'reference_table', 'is_required', 'sort_order')
    list_filter = ('data_type', 'is_required', 'process_type')
    search_fields = ('id', 'attribute_code', 'attribute_name', 'remarks')
    ordering = ('process_type', 'sort_order')

@admin.register(ProcessInstance)
class ProcessInstanceAdmin(admin.ModelAdmin):
    list_display = ('id', 'process_type', 'plant', 'department', 'performed_by', 'status', 'start_time', 'end_time', 'created_at')
    list_filter = ('status', 'process_type', 'plant', 'department')
    search_fields = ('id', 'proposal_id', 'remarks')
    inlines = [ProcessAttributeValueInline, AdminVerificationInline]
    ordering = ('-created_at',)

@admin.register(ProcessAttributeValue)
class ProcessAttributeValueAdmin(admin.ModelAdmin):
    list_display = ('id', 'process_instance', 'attribute_definition', 'value_text', 'value_number', 'value_date', 'value_boolean', 'value_reference_id', 'created_at')
    list_filter = ('attribute_definition__data_type', 'created_at')
    search_fields = ('id', 'value_text', 'value_reference_id', 'attribute_definition__attribute_name')
    ordering = ('-created_at',)

@admin.register(ProcessLink)
class ProcessLinkAdmin(admin.ModelAdmin):
    list_display = ('id', 'from_process_instance', 'to_process_instance', 'link_type', 'created_at')
    list_filter = ('link_type',)
    search_fields = ('id', 'from_process_instance__id', 'to_process_instance__id', 'remarks')
    ordering = ('-created_at',)

@admin.register(AdminVerification)
class AdminVerificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'process_instance', 'verified_by', 'status', 'verified_at')
    list_filter = ('status',)
    search_fields = ('id', 'process_instance__id', 'remarks')
    ordering = ('-verified_at',)
