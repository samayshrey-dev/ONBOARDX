import uuid
from django.db import models
from django.conf import settings
from apps.onboarding.models import OnboardingApplication

class ApprovalRecord(models.Model):
    class Decision(models.TextChoices):
        APPROVED = 'APPROVED', 'Final Approved'
        REJECTED = 'REJECTED', 'Final Rejected'
        CORRECTION_REQUIRED = 'CORRECTION_REQUIRED', 'Correction Required'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.OneToOneField(
        OnboardingApplication,
        on_delete=models.CASCADE,
        related_name='final_approval'
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='admin_approvals'
    )
    decision = models.CharField(
        max_length=30,
        choices=Decision.choices
    )
    comment = models.TextField(blank=True, null=True, help_text="Mandatory explanation on rejection or correction request.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        approver_name = self.approved_by.username if self.approved_by else "Admin"
        return f"Final [{self.decision}] for App #{self.application.application_number} by {approver_name}"
