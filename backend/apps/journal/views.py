from rest_framework import viewsets
from .models import JournalEntry, Stock
from .serializers import JournalEntrySerializer, StockSerializer

class JournalEntryViewSet(viewsets.ModelViewSet):
    queryset = JournalEntry.objects.all().order_by('-entry_date')
    serializer_class = JournalEntrySerializer
    filterset_fields = ['movement_type', 'from_plant', 'to_plant', 'from_department', 'to_department']
    search_fields = ['remarks']

class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.all().order_by('-updated_at')
    serializer_class = StockSerializer
    filterset_fields = ['plant', 'department', 'material_id', 'stock_status']
    search_fields = ['material_id']
