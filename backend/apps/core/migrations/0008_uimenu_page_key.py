from django.db import migrations, models


PAGE_KEYS = {
    '/': 'dashboard',
    '/user': 'user_page',
    '/admin-console': 'admin',
    '/structural-masters': 'structural_masters',
    '/dynamic-masters': 'dynamic_masters',
    '/process-engine': 'process_engine',
    '/workflow-approvals': 'workflow',
    '/journal-stock': 'journal',
    '/process-attribute-values': 'process_attribute_values',
    '/process-links': 'process_links',
}


def populate_page_keys(apps, schema_editor):
    UIMenu = apps.get_model('core', 'UIMenu')
    for menu in UIMenu.objects.all():
        menu.page_key = PAGE_KEYS.get(menu.menu_path, menu.module_code)
        menu.save(update_fields=['page_key'])


class Migration(migrations.Migration):
    dependencies = [('core', '0007_configauditlog_configversion_uitheme_accent_color_and_more')]

    operations = [
        migrations.AddField(
            model_name='uimenu',
            name='page_key',
            field=models.CharField(blank=True, default='', help_text='Registered ERP page component', max_length=80),
        ),
        migrations.RunPython(populate_page_keys, migrations.RunPython.noop),
    ]
