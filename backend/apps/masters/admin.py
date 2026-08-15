from django.contrib import admin
from .models import (
    MasterCategory, MasterItem, MasterItemVersion,
    MasterAttribute, MasterInstance, MasterAttributeValue
)

class MasterAttributeInline(admin.TabularInline):
    model = MasterAttribute
    extra = 1

class MasterItemVersionInline(admin.StackedInline):
    model = MasterItemVersion
    extra = 1

class MasterAttributeValueInline(admin.TabularInline):
    model = MasterAttributeValue
    extra = 1

@admin.register(MasterCategory)
class MasterCategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'code', 'name', 'owning_department', 'created_at')
    list_filter = ('owning_department',)
    search_fields = ('id', 'code', 'name', 'remarks')
    inlines = [MasterAttributeInline]
    ordering = ('-created_at',)

@admin.register(MasterItem)
class MasterItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'code', 'name', 'category', 'plant', 'department', 'is_active', 'created_at')
    list_filter = ('is_active', 'category', 'plant', 'department')
    search_fields = ('id', 'code', 'name', 'remarks')
    inlines = [MasterItemVersionInline]
    ordering = ('-created_at',)

@admin.register(MasterItemVersion)
class MasterItemVersionAdmin(admin.ModelAdmin):
    list_display = ('id', 'master_item', 'version_no', 'effective_from', 'effective_to', 'remarks')
    list_filter = ('version_no', 'effective_from', 'master_item__category')
    search_fields = ('id', 'master_item__name', 'master_item__code', 'remarks')
    ordering = ('-effective_from',)

@admin.register(MasterAttribute)
class MasterAttributeAdmin(admin.ModelAdmin):
    list_display = ('id', 'master_category', 'attribute_code', 'attribute_name', 'data_type', 'reference_table', 'is_required', 'sort_order')
    list_filter = ('data_type', 'is_required', 'master_category')
    search_fields = ('id', 'attribute_code', 'attribute_name', 'remarks')
    ordering = ('master_category', 'sort_order')

@admin.register(MasterInstance)
class MasterInstanceAdmin(admin.ModelAdmin):
    list_display = ('id', 'code', 'name', 'master_category', 'master_item', 'plant', 'department', 'is_active', 'created_at')
    list_filter = ('is_active', 'master_category', 'plant', 'department')
    search_fields = ('id', 'code', 'name', 'remarks')
    inlines = [MasterAttributeValueInline]
    ordering = ('-created_at',)

@admin.register(MasterAttributeValue)
class MasterAttributeValueAdmin(admin.ModelAdmin):
    list_display = ('id', 'master_instance', 'master_attribute', 'value_text', 'value_number', 'value_date', 'value_boolean', 'value_reference_id', 'created_at')
    list_filter = ('master_attribute__data_type', 'created_at')
    search_fields = ('id', 'value_text', 'value_reference_id', 'master_instance__name', 'master_attribute__attribute_name')
    ordering = ('-created_at',)
