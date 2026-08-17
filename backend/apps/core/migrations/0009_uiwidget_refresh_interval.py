from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('core', '0008_uimenu_page_key')]

    operations = [
        migrations.AddField(
            model_name='uiwidget',
            name='refresh_interval',
            field=models.PositiveIntegerField(default=0, help_text='Automatic refresh interval in seconds; 0 disables polling'),
        ),
    ]
