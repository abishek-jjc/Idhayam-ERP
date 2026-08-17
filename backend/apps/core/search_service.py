from urllib.parse import quote

from django.apps import apps
from django.db.models import Q

from .models import EmployeeRole, GlobalSearchConfiguration
from .permissions import configured_permissions


SEARCH_ENTITY_DEFINITIONS = {
    'core.Company': {'fields': ['id', 'name', 'gst_number', 'remarks'], 'route': '/structural-masters', 'module': 'structural_masters'},
    'core.Employee': {'fields': ['id', 'name', 'status', 'user_account_id', 'designation__title', 'department__name'], 'route': '/structural-masters', 'module': 'structural_masters'},
    'core.Vendor': {'fields': ['id', 'name', 'gst_number', 'remarks'], 'route': '/structural-masters', 'module': 'structural_masters'},
    'core.Machine': {'fields': ['id', 'code', 'name', 'registration_number', 'status'], 'route': '/structural-masters', 'module': 'structural_masters'},
    'core.StorageLocation': {'fields': ['id', 'code', 'name', 'status', 'department__name'], 'route': '/structural-masters', 'module': 'structural_masters'},
    'core.ChartOfAccount': {'fields': ['id', 'code', 'name', 'account_type'], 'route': '/structural-masters', 'module': 'structural_masters'},
    'masters.MasterCategory': {'fields': ['id', 'code', 'name', 'remarks'], 'route': '/dynamic-masters', 'module': 'dynamic_masters'},
    'masters.MasterItem': {'fields': ['id', 'code', 'name', 'category__name', 'remarks'], 'route': '/dynamic-masters', 'module': 'dynamic_masters'},
    'process_engine.ProcessType': {'fields': ['id', 'code', 'name', 'category', 'remarks'], 'route': '/process-engine', 'module': 'process_engine'},
    'process_engine.ProcessInstance': {'fields': ['id', 'status', 'remarks', 'process_type__name', 'process_type__code'], 'route': '/process-engine', 'module': 'process_engine'},
    'workflow.Proposal': {'fields': ['id', 'status', 'remarks', 'requested_by__name', 'process_instance__id'], 'route': '/workflow-approvals', 'module': 'workflow'},
    'journal.JournalEntry': {'fields': ['id', 'material_id', 'movement_type', 'entry_date', 'remarks', 'vendor__name'], 'route': '/journal-stock', 'module': 'journal'},
    'journal.Stock': {'fields': ['id', 'material_id', 'stock_status', 'quantity', 'unit_id', 'storage_location__code'], 'route': '/journal-stock', 'module': 'journal'},
}


def _value_for_field(instance, field_name):
    value = instance
    for part in field_name.split('__'):
        value = getattr(value, part, None)
        if value is None:
            return ''
    return str(value)


def _module_allowed(claims, module):
    if claims.get('is_superadmin'):
        return True
    return configured_permissions(claims, module).filter(can_view=True).exists()


def _apply_record_permissions(queryset, claims, module, model_label):
    if claims.get('is_superadmin'):
        return queryset
    permissions = configured_permissions(claims, module).filter(can_view=True)
    if module == 'process_engine' and model_label in ['process_engine.ProcessType', 'process_engine.ProcessInstance']:
        if permissions.filter(process_type__isnull=True).exists():
            return queryset
        ids = permissions.exclude(process_type__isnull=True).values_list('process_type_id', flat=True)
        return queryset.filter(id__in=ids) if model_label.endswith('ProcessType') else queryset.filter(process_type_id__in=ids)
    if module == 'dynamic_masters' and model_label in ['masters.MasterCategory', 'masters.MasterItem']:
        if permissions.filter(master_category__isnull=True).exists():
            return queryset
        ids = permissions.exclude(master_category__isnull=True).values_list('master_category_id', flat=True)
        return queryset.filter(id__in=ids) if model_label.endswith('MasterCategory') else queryset.filter(category_id__in=ids)
    return queryset


def search_erp_records(query, claims, total_limit=30):
    term = (query or '').strip()
    if len(term) < 2:
        return []
    designation_id = claims.get('designation_id')
    role_ids = set(EmployeeRole.objects.filter(
        employee__designation_id=designation_id
    ).values_list('role_id', flat=True)) if designation_id else set()

    configurations = GlobalSearchConfiguration.objects.filter(active=True).prefetch_related('roles')
    results = []
    for config in configurations:
        definition = SEARCH_ENTITY_DEFINITIONS.get(config.model_label)
        if not definition or not _module_allowed(claims, config.module):
            continue
        configured_roles = set(config.roles.values_list('id', flat=True))
        if configured_roles and not claims.get('is_superadmin') and not configured_roles.intersection(role_ids):
            continue

        model = apps.get_model(config.model_label)
        allowed_fields = set(definition['fields'])
        fields = [field for field in (config.searchable_fields or []) if field in allowed_fields]
        if not fields:
            continue
        lookup = {'exact': 'iexact', 'starts_with': 'istartswith'}.get(config.match_mode, 'icontains')
        criteria = Q()
        for field in fields:
            criteria |= Q(**{f'{field}__{lookup}': term})
        queryset = _apply_record_permissions(model.objects.filter(criteria).distinct(), claims, config.module, config.model_label)

        for instance in queryset[:max(1, min(config.result_limit, 50))]:
            matched_field = next((
                field for field in fields
                if (term.lower() == _value_for_field(instance, field).lower() if config.match_mode == 'exact'
                    else _value_for_field(instance, field).lower().startswith(term.lower()) if config.match_mode == 'starts_with'
                    else term.lower() in _value_for_field(instance, field).lower())
            ), fields[0])
            display_fields = [field for field in (config.display_fields or []) if field in allowed_fields]
            display_values = [_value_for_field(instance, field) for field in display_fields]
            display_values = [value for value in display_values if value]
            record_id = str(instance.pk)
            display_name = display_values[0] if display_values else str(instance)
            description = ' • '.join(display_values[1:]) if len(display_values) > 1 else str(instance)
            status = _value_for_field(instance, config.status_field) if config.status_field in allowed_fields else ''
            route = config.route or definition['route']
            separator = '&' if '?' in route else '?'
            results.append({
                'module': config.module,
                'entity': config.display_name,
                'record_id': record_id,
                'display_name': display_name,
                'description': description,
                'matched_field': matched_field.replace('__', ' / ').replace('_', ' ').title(),
                'matched_value': _value_for_field(instance, matched_field),
                'status': status,
                'route': f'{route}{separator}record={quote(record_id)}',
                'priority': config.result_priority,
            })

    results.sort(key=lambda item: (
        0 if item['matched_value'].lower() == term.lower() else 1,
        0 if item['matched_value'].lower().startswith(term.lower()) else 1,
        item['priority'], item['entity'], item['display_name'],
    ))
    return results[:max(1, min(int(total_limit or 30), 50))]
