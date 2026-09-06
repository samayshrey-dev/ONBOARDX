import uuid
from django.db import models
from django.conf import settings

class Blueprint(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    partner_type_code = models.CharField(max_length=50, unique=True, help_text="e.g. COMPANY, INDIVIDUAL, VENDOR")
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.partner_type_code})"

class ChecklistRequirement(models.Model):
    """
    TEMPLATE DEFINITION: Blueprint Requirement created by Admin.
    Serves as the master template for what a partner type needs.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    blueprint = models.ForeignKey(Blueprint, on_delete=models.CASCADE, related_name='requirements')
    document_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    is_mandatory = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.document_name} [{self.blueprint.partner_type_code}]"

class OnboardingApplication(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        SUBMITTED = 'SUBMITTED', 'Submitted'
        UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
        CORRECTION_REQUIRED = 'CORRECTION_REQUIRED', 'Correction Required'
        PENDING_APPROVAL = 'PENDING_APPROVAL', 'Pending Approval'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application_number = models.CharField(max_length=50, unique=True, blank=True)
    partner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='applications'
    )
    blueprint = models.ForeignKey(
        Blueprint,
        on_delete=models.PROTECT,
        related_name='applications'
    )
    business_name = models.CharField(max_length=255)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=50, blank=True, null=True)
    business_details = models.TextField(blank=True, null=True)
    
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.DRAFT
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_editable_by_partner(self):
        return self.status in [self.Status.DRAFT, self.Status.CORRECTION_REQUIRED]

    def save(self, *args, **kwargs):
        if not self.application_number:
            count = OnboardingApplication.objects.count() + 1
            self.application_number = f"APP-2026-{count:04d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.application_number} - {self.business_name} [{self.status}]"

class ApplicationChecklistItem(models.Model):
    """
    APPLICATION INSTANCE ITEM: Snapshot instance created from Blueprint requirements.
    Belongs strictly to a single OnboardingApplication.
    Prevents future Admin Blueprint edits from breaking active applications.
    """
    class ItemStatus(models.TextChoices):
        NOT_PROVIDED = 'NOT_PROVIDED', 'Not Provided'
        PROVIDED = 'PROVIDED', 'Provided'
        VERIFIED = 'VERIFIED', 'Verified'
        REJECTED = 'REJECTED', 'Rejected'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(
        OnboardingApplication,
        on_delete=models.CASCADE,
        related_name='checklist_items'
    )
    requirement_source = models.ForeignKey(
        ChecklistRequirement,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='application_items'
    )
    document_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    is_mandatory = models.BooleanField(default=True)
    status = models.CharField(
        max_length=30,
        choices=ItemStatus.choices,
        default=ItemStatus.NOT_PROVIDED
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.document_name} ({self.status}) - App #{self.application.application_number}"
