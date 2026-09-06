from rest_framework import serializers
from .models import ActivityLog

class ActivityLogSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source='actor.username', read_only=True, default='System')
    actor_role = serializers.CharField(source='actor.role', read_only=True, default='')

    class Meta:
        model = ActivityLog
        fields = (
            'id', 'application', 'actor', 'actor_username',
            'actor_role', 'action', 'description', 'created_at'
        )
        read_only_fields = fields
