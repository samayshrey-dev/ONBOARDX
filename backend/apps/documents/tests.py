from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from apps.onboarding.models import Blueprint, ChecklistRequirement, OnboardingApplication, ApplicationChecklistItem
from apps.documents.models import Document

User = get_user_model()

class ReviewerWorkflowTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.partner = User.objects.create_user(
            username='rev_partner',
            password='Password123!',
            company_name='Partner Corp',
            role=User.Role.PARTNER
        )

        self.reviewer = User.objects.create_user(
            username='rev_officer',
            password='Password123!',
            role=User.Role.REVIEWER
        )

        # Setup Blueprint with 1 mandatory requirement
        self.bp = Blueprint.objects.create(title='Vendor BP', partner_type_code='VENDOR')
        self.req1 = ChecklistRequirement.objects.create(blueprint=self.bp, document_name='Tax GST', is_mandatory=True)

        # Application
        self.app = OnboardingApplication.objects.create(
            partner=self.partner,
            blueprint=self.bp,
            business_name='Partner Corp',
            contact_email='p@test.com'
        )

        self.item_gst = ApplicationChecklistItem.objects.create(
            application=self.app,
            requirement_source=self.req1,
            document_name='Tax GST',
            is_mandatory=True
        )

    def test_reviewer_queue_access(self):
        self.app.status = OnboardingApplication.Status.SUBMITTED
        self.app.save()

        # Reviewer accesses queue
        self.client.force_authenticate(user=self.reviewer)
        queue_res = self.client.get('/api/v1/onboarding/reviewer/queue/')
        self.assertEqual(queue_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(queue_res.data), 1)

        # Partner attempts queue access -> Blocked
        self.client.force_authenticate(user=self.partner)
        p_queue_res = self.client.get('/api/v1/onboarding/reviewer/queue/')
        self.assertEqual(p_queue_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_rejection_requires_comment(self):
        # Upload doc
        self.client.force_authenticate(user=self.partner)
        pdf = SimpleUploadedFile("tax.pdf", b"pdf content", content_type="application/pdf")
        self.client.post(f'/api/v1/documents/items/{self.item_gst.id}/upload/', {'file': pdf}, format='multipart')
        doc = Document.objects.get(checklist_item=self.item_gst)

        # Reviewer attempts rejection without comment -> Blocked
        self.client.force_authenticate(user=self.reviewer)
        no_comment_res = self.client.patch(f'/api/v1/documents/{doc.id}/review/', {
            'status': 'REJECTED',
            'reviewer_comment': ''
        })
        self.assertEqual(no_comment_res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rejection_transitions_application_to_correction_required(self):
        self.client.force_authenticate(user=self.partner)
        pdf = SimpleUploadedFile("tax.pdf", b"pdf content", content_type="application/pdf")
        self.client.post(f'/api/v1/documents/items/{self.item_gst.id}/upload/', {'file': pdf}, format='multipart')
        doc = Document.objects.get(checklist_item=self.item_gst)

        # Reviewer rejects with comment
        self.client.force_authenticate(user=self.reviewer)
        reject_res = self.client.patch(f'/api/v1/documents/{doc.id}/review/', {
            'status': 'REJECTED',
            'reviewer_comment': 'Image blurry. Please re-scan original document.'
        })
        self.assertEqual(reject_res.status_code, status.HTTP_200_OK)
        self.assertEqual(reject_res.data['document']['status'], 'REJECTED')
        
        # Verify application status updated to CORRECTION_REQUIRED
        self.app.refresh_from_db()
        self.assertEqual(self.app.status, OnboardingApplication.Status.CORRECTION_REQUIRED)

    def test_all_approved_documents_transitions_application_to_pending_approval(self):
        self.client.force_authenticate(user=self.partner)
        pdf = SimpleUploadedFile("tax.pdf", b"pdf content", content_type="application/pdf")
        self.client.post(f'/api/v1/documents/items/{self.item_gst.id}/upload/', {'file': pdf}, format='multipart')
        doc = Document.objects.get(checklist_item=self.item_gst)

        # Reviewer approves document
        self.client.force_authenticate(user=self.reviewer)
        approve_res = self.client.patch(f'/api/v1/documents/{doc.id}/review/', {
            'status': 'APPROVED',
            'reviewer_comment': 'Verified with tax authority portal.'
        })
        self.assertEqual(approve_res.status_code, status.HTTP_200_OK)
        
        # Verify application automatically transitioned to PENDING_APPROVAL
        self.app.refresh_from_db()
        self.assertEqual(self.app.status, OnboardingApplication.Status.PENDING_APPROVAL)

    def test_partner_cannot_review_own_document(self):
        self.client.force_authenticate(user=self.partner)
        pdf = SimpleUploadedFile("tax.pdf", b"pdf content", content_type="application/pdf")
        self.client.post(f'/api/v1/documents/items/{self.item_gst.id}/upload/', {'file': pdf}, format='multipart')
        doc = Document.objects.get(checklist_item=self.item_gst)

        # Partner attempts to self-approve
        self.client.force_authenticate(user=self.partner)
        self_review_res = self.client.patch(f'/api/v1/documents/{doc.id}/review/', {
            'status': 'APPROVED'
        })
        self.assertEqual(self_review_res.status_code, status.HTTP_403_FORBIDDEN)
