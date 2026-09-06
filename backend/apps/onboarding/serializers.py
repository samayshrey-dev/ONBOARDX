from rest_framework import serializers
from .models import Blueprint, ChecklistRequirement, OnboardingApplication, ApplicationChecklistItem

class ChecklistRequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistRequirement
        fields = ('id', 'blueprint', 'document_name', 'description', 'is_mandatory', 'order', 'created_at')
        read_only_fields = ('id', 'blueprint', 'created_at')

class BlueprintSerializer(serializers.ModelSerializer):
    requirements = ChecklistRequirementSerializer(many=True, read_only=True)

    class Meta:
        model = Blueprint
        fields = ('id', 'title', 'partner_type_code', 'description', 'is_active', 'requirements', 'created_at', 'updated_at')

class ApplicationChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationChecklistItem
        fields = ('id', 'application', 'requirement_source', 'document_name', 'description', 'is_mandatory', 'status', 'created_at')
        read_only_fields = ('id', 'application', 'requirement_source', 'document_name', 'description', 'is_mandatory', 'status', 'created_at')

class OnboardingApplicationSerializer(serializers.ModelSerializer):
    blueprint_details = BlueprintSerializer(source='blueprint', read_only=True)
    checklist_items = ApplicationChecklistItemSerializer(many=True, read_only=True)
    is_editable = serializers.BooleanField(source='is_editable_by_partner', read_only=True)
    partner_name = serializers.CharField(source='partner.username', read_only=True)

    class Meta:
        model = OnboardingApplication
        fields = (
            'id', 'application_number', 'partner', 'partner_name',
            'blueprint', 'blueprint_details', 'business_name',
            'contact_email', 'contact_phone', 'business_details',
            'status', 'is_editable', 'checklist_items',
            'submitted_at', 'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'application_number', 'partner', 'status',
            'is_editable', 'submitted_at', 'created_at', 'updated_at'
        )

    def validate(self, data):
        if self.instance and not self.instance.is_editable_by_partner:
            raise serializers.ValidationError(
                f"Application '{self.instance.application_number}' is currently in '{self.instance.status}' status and cannot be modified."
            )
        return data
