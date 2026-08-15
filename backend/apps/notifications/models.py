import datetime
from django.db import models
from apps.core.models import generate_custom_pk

def pk_not(): return generate_custom_pk("NOT")

class SystemNotification(models.Model):
    id = models.CharField(primary_key=True, max_length=50, default=pk_not, editable=False)
    title = models.CharField(max_length=200)
    message = models.TextField()
    category = models.CharField(max_length=50, default='system')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
