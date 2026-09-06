from django.contrib import admin
from .models import ApprovalRecord

@admin.register(ApprovalRecord)
class ApprovalRecordAdmin(admin.ModelAdmin):
    list_display = ('application', 'decision', 'approved_by', 'created_at')
    list_filter = ('decision',)
    search_fields = ('application__application_number', 'approved_by__username', 'comment')
