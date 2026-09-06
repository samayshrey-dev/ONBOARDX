import uuid
import os
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from apps.onboarding.models import OnboardingApplication, ApplicationChecklistItem

def validate_file_extension_and_size(file_obj):
    allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png']
    ext = os.path.splitext(file_obj.name)[1].lower()
    if ext not in allowed_extensions:
        raise ValidationError(f"Unsupported file format '{ext}'. Allowed formats: {', '.join(allowed_extensions)}")
    
    max_size = 5 * 1024 * 1024  # 5MB
    if file_obj.size > max_size:
        raise ValidationError(f"File size exceeds 5MB limit ({file_obj.size / (1024 * 1024):.2f}MB).")

class Document(models.Model):
    class Status(models.TextChoices):
        NOT_UPLOADED = 'NOT_UPLOADED', 'Not Uploaded'
        UPLOADED = 'UPLOADED', 'Uploaded'
        UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(
        OnboardingApplication,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    checklist_item = models.OneToOneField(
        ApplicationChecklistItem,
        on_delete=models.CASCADE,
        related_name='document'
    )
    file = models.FileField(
        upload_to='partner_documents/',
        validators=[validate_file_extension_and_size]
    )
    file_name = models.CharField(max_length=255)
    file_size = models.IntegerField(help_text="File size in bytes")
    file_type = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.UPLOADED
    )
    reviewer_comment = models.TextField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_replaceable_by_partner(self):
        """Approved documents cannot be replaced; rejected or uploaded documents can be replaced."""
        return self.status != self.Status.APPROVED

    def __str__(self):
        return f"{self.checklist_item.document_name} ({self.status}) - App #{self.application.application_number}"
