from rest_framework import serializers
from .models import ApprovalRecord

class ApprovalRecordSerializer(serializers.ModelSerializer):
    approver_name = serializers.CharField(source='approved_by.username', read_only=True, default='Admin')

    class Meta:
        model = ApprovalRecord
        fields = ('id', 'application', 'approved_by', 'approver_name', 'decision', 'comment', 'created_at', 'updated_at')
        read_only_fields = ('id', 'application', 'approved_by', 'created_at', 'updated_at')
