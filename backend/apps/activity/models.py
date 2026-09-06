import uuid
from django.db import models
from django.conf import settings
from apps.onboarding.models import OnboardingApplication

class ActivityLog(models.Model):
    class Action(models.TextChoices):
        CREATED = 'CREATED', 'Application Created'
        SUBMITTED = 'SUBMITTED', 'Application Submitted'
        DOC_UPLOADED = 'DOC_UPLOADED', 'Document Uploaded'
        DOC_REPLACED = 'DOC_REPLACED', 'Document Replaced'
        DOC_APPROVED = 'DOC_APPROVED', 'Document Approved'
        DOC_REJECTED = 'DOC_REJECTED', 'Document Rejected'
        CORRECTION_REQUESTED = 'CORRECTION_REQUESTED', 'Correction Requested'
        PENDING_APPROVAL = 'PENDING_APPROVAL', 'Moved to Pending Approval'
        FINAL_APPROVED = 'FINAL_APPROVED', 'Final Application Approved'
        FINAL_REJECTED = 'FINAL_REJECTED', 'Final Application Rejected'
        COMMENT_ADDED = 'COMMENT_ADDED', 'Comment Added'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(
        OnboardingApplication,
        on_delete=models.CASCADE,
        related_name='activities'
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activities_triggered'
    )
    action = models.CharField(
        max_length=40,
        choices=Action.choices
    )
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        actor_name = self.actor.username if self.actor else "System"
        return f"[{self.action}] {actor_name} - App #{self.application.application_number} at {self.created_at.strftime('%H:%M')}"
