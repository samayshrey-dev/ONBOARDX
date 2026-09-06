from django.contrib import admin
from .models import Blueprint, ChecklistRequirement, OnboardingApplication, ApplicationChecklistItem

class ChecklistRequirementInline(admin.TabularInline):
    model = ChecklistRequirement
    extra = 1

class ApplicationChecklistItemInline(admin.TabularInline):
    model = ApplicationChecklistItem
    extra = 0
    readonly_fields = ('document_name', 'description', 'is_mandatory')

@admin.register(Blueprint)
class BlueprintAdmin(admin.ModelAdmin):
    list_display = ('title', 'partner_type_code', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('title', 'partner_type_code')
    inlines = [ChecklistRequirementInline]

@admin.register(OnboardingApplication)
class OnboardingApplicationAdmin(admin.ModelAdmin):
    list_display = ('application_number', 'business_name', 'partner', 'blueprint', 'status', 'submitted_at', 'created_at')
    list_filter = ('status', 'blueprint')
    search_fields = ('application_number', 'business_name', 'partner__username', 'contact_email')
    inlines = [ApplicationChecklistItemInline]

@admin.register(ApplicationChecklistItem)
class ApplicationChecklistItemAdmin(admin.ModelAdmin):
    list_display = ('document_name', 'application', 'is_mandatory', 'status', 'created_at')
    list_filter = ('status', 'is_mandatory')
