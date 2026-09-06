from django.contrib import admin
from .models import ActivityLog

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'actor', 'application', 'created_at')
    list_filter = ('action', 'created_at')
    search_fields = ('description', 'application__application_number', 'actor__username')
    readonly_fields = ('application', 'actor', 'action', 'description', 'created_at')
