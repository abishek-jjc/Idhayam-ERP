from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import JournalEntry
from .services import update_stock_cache_from_entry

@receiver(post_save, sender=JournalEntry)
def handle_journal_entry_post_save(sender, instance, created, **kwargs):
    """
    Guarantees that whenever a JournalEntry record is created in the database,
    the live stock cache (journal_stock) is automatically updated.
    """
    if created:
        update_stock_cache_from_entry(instance)
