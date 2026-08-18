from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import ProcessType, ProcessAttributeDefinition
from .services import sync_process_type_dynamic_form

@receiver(post_save, sender=ProcessType)
def handle_process_type_saved(sender, instance, created, **kwargs):
    sync_process_type_dynamic_form(instance)

@receiver(post_save, sender=ProcessAttributeDefinition)
def handle_attribute_def_saved(sender, instance, created, **kwargs):
    if instance.process_type:
        sync_process_type_dynamic_form(instance.process_type)

@receiver(post_delete, sender=ProcessAttributeDefinition)
def handle_attribute_def_deleted(sender, instance, **kwargs):
    if instance.process_type:
        sync_process_type_dynamic_form(instance.process_type)
