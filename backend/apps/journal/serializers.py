from rest_framework import serializers
from .models import JournalEntry, Stock
from apps.masters.models import MasterItem

class JournalEntrySerializer(serializers.ModelSerializer):
    posted_by_name = serializers.ReadOnlyField(source='posted_by.name')
    from_plant_name = serializers.ReadOnlyField(source='from_plant.name')
    to_plant_name = serializers.ReadOnlyField(source='to_plant.name')
    from_department_name = serializers.ReadOnlyField(source='from_department.name')
    to_department_name = serializers.ReadOnlyField(source='to_department.name')
    from_bin_code = serializers.ReadOnlyField(source='from_storage_location.code')
    to_bin_code = serializers.ReadOnlyField(source='to_storage_location.code')
    vendor_name = serializers.ReadOnlyField(source='vendor.name')
    account_name = serializers.ReadOnlyField(source='account.name')
    material_name = serializers.SerializerMethodField()

    class Meta:
        model = JournalEntry
        fields = '__all__'

    def get_material_name(self, obj):
        if not obj.material_id:
            return "General Material"
        try:
            item = MasterItem.objects.filter(id=obj.material_id).first()
            if item:
                return f"{item.name} [{item.code}]"
            item_by_code = MasterItem.objects.filter(code=obj.material_id).first()
            if item_by_code:
                return f"{item_by_code.name} [{item_by_code.code}]"
        except Exception:
            pass
        return f"Material #{obj.material_id[:10]}"

class StockSerializer(serializers.ModelSerializer):
    plant_name = serializers.ReadOnlyField(source='plant.name')
    department_name = serializers.ReadOnlyField(source='department.name')
    bin_code = serializers.ReadOnlyField(source='storage_location.code')

    class Meta:
        model = Stock
        fields = '__all__'
