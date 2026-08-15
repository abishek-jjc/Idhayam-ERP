from django.contrib import admin
from .models import SystemNotification

@admin.register(SystemNotification)
class SystemNotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'category', 'is_read', 'created_at')
    list_filter = ('category', 'is_read', 'created_at')
    search_fields = ('id', 'title', 'message')
    ordering = ('-created_at',)
