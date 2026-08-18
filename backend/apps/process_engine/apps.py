from django.apps import AppConfig

class ProcessEngineConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.process_engine'
    verbose_name = 'ERP Process Engine'

    def ready(self):
        import apps.process_engine.signals  # noqa
