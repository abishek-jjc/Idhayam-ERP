from django.apps import AppConfig

class JournalConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.journal'
    verbose_name = 'ERP Inventory & Financial Journal'

    def ready(self):
        try:
            import apps.journal.signals  # noqa
        except ImportError:
            pass

