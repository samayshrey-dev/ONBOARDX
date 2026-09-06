from rest_framework import serializers
from .models import Document

class DocumentSerializer(serializers.ModelSerializer):
    document_name = serializers.CharField(source='checklist_item.document_name', read_only=True)
    is_mandatory = serializers.BooleanField(source='checklist_item.is_mandatory', read_only=True)
    is_replaceable = serializers.BooleanField(source='is_replaceable_by_partner', read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = (
            'id', 'application', 'checklist_item', 'document_name',
            'is_mandatory', 'file', 'file_url', 'file_name', 'file_size',
            'file_type', 'status', 'reviewer_comment', 'is_replaceable',
            'uploaded_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'application', 'checklist_item', 'file_name',
            'file_size', 'file_type', 'status', 'reviewer_comment',
            'is_replaceable', 'uploaded_at', 'updated_at'
        )

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            if request is not None:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
