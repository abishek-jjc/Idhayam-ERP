from django.contrib import admin
from .models import JournalEntry, Stock

@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ('id', 'entry_date', 'movement_type', 'material_id', 'quantity', 'unit', 'value_amount', 'from_plant', 'to_plant', 'posted_by')
    list_filter = ('movement_type', 'entry_date', 'from_plant', 'to_plant')
    search_fields = ('id', 'material_id', 'remarks')
    ordering = ('-entry_date', '-id')

@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ('id', 'material_id', 'plant', 'department', 'storage_location', 'quantity', 'unit_id', 'stock_status', 'updated_at')
    list_filter = ('stock_status', 'plant', 'department')
    search_fields = ('id', 'material_id', 'storage_location__code')
    ordering = ('-updated_at',)
