from django.contrib import admin
from .models import Document

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('file_name', 'application', 'checklist_item', 'status', 'file_size', 'uploaded_at')
    list_filter = ('status',)
    search_fields = ('file_name', 'application__application_number', 'checklist_item__document_name')
