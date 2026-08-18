from apps.core.models import UIForm, UIFormField
from apps.process_engine.models import ProcessType, ProcessAttributeDefinition

DATA_TYPE_MAP = {
    'text': 'text',
    'textarea': 'textarea',
    'number': 'number',
    'decimal': 'decimal',
    'date': 'date',
    'time': 'time',
    'datetime': 'datetime',
    'boolean': 'boolean',
    'select': 'select',
    'reference': 'reference',
    'email': 'email',
    'phone': 'phone',
    'currency': 'currency',
    'file': 'file',
    'url': 'url',
    'password': 'password',
}

def sync_process_type_dynamic_form(process_type):
    """
    Automatically creates/updates an entry in UIForm and UIFormField
    whenever a ProcessType or ProcessAttributeDefinition is created/updated.
    """
    if not process_type:
        return None

    # Form Name = process_type.code + '_form' (and also bind code identifier)
    form_name = f"{process_type.code}_form"
    title = f"{process_type.name} Form"
    description = f"Auto-generated form for Process Type '{process_type.name}' [{process_type.code}]."

    ui_form, _ = UIForm.objects.update_or_create(
        form_name=form_name,
        defaults={
            'module': 'process_engine',
            'title': title,
            'description': description,
            'active': True,
        }
    )

    # Fetch attribute definitions under this process type
    attr_defs = ProcessAttributeDefinition.objects.filter(process_type=process_type).order_by('sort_order', 'id')
    current_codes = []

    for attr in attr_defs:
        current_codes.append(attr.attribute_code)
        field_type = DATA_TYPE_MAP.get(attr.data_type, 'text')

        UIFormField.objects.update_or_create(
            form=ui_form,
            field_code=attr.attribute_code,
            defaults={
                'field_name': attr.attribute_name,
                'field_type': field_type,
                'required': attr.is_required,
                'field_order': attr.sort_order,
                'options': attr.options or '',
                'reference_table': attr.reference_table or '',
                'help_text': attr.remarks or '',
                'active': True,
            }
        )

    # Remove fields that were deleted from process attribute definitions
    UIFormField.objects.filter(form=ui_form).exclude(field_code__in=current_codes).delete()

    return ui_form

def sync_all_process_types():
    """
    Loops through all ProcessType records and synchronizes their dynamic UIForm / UIFormField representations.
    """
    try:
        for pt in ProcessType.objects.all():
            sync_process_type_dynamic_form(pt)
    except Exception as e:
        print("Process type form sync warning:", e)
