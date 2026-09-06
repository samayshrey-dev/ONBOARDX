from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from apps.onboarding.models import Blueprint, ChecklistRequirement, OnboardingApplication, ApplicationChecklistItem
from apps.documents.models import Document
from apps.approvals.models import ApprovalRecord

User = get_user_model()

class FinalApprovalWorkflowTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.admin = User.objects.create_user(
            username='final_admin',
            password='Password123!',
            role=User.Role.ADMIN,
            is_staff=True
        )

        self.reviewer = User.objects.create_user(
            username='final_reviewer',
            password='Password123!',
            role=User.Role.REVIEWER
        )

        self.partner = User.objects.create_user(
            username='final_partner',
            password='Password123!',
            company_name='Acme Logistics',
            role=User.Role.PARTNER
        )

        # Setup Blueprint & Application
        self.bp = Blueprint.objects.create(title='Vendor BP', partner_type_code='VENDOR')
        self.req1 = ChecklistRequirement.objects.create(blueprint=self.bp, document_name='Tax Registration', is_mandatory=True)

        self.app = OnboardingApplication.objects.create(
            partner=self.partner,
            blueprint=self.bp,
            business_name='Acme Logistics',
            contact_email='acme@test.com',
            status=OnboardingApplication.Status.PENDING_APPROVAL
        )

        self.item1 = ApplicationChecklistItem.objects.create(
            application=self.app,
            requirement_source=self.req1,
            document_name='Tax Registration',
            is_mandatory=True,
            status=ApplicationChecklistItem.ItemStatus.VERIFIED
        )

        self.doc1 = Document.objects.create(
            application=self.app,
            checklist_item=self.item1,
            file=SimpleUploadedFile("tax.pdf", b"pdf content", content_type="application/pdf"),
            file_name="tax.pdf",
            file_size=100,
            status=Document.Status.APPROVED
        )

    def test_approval_ineligible_if_mandatory_document_not_approved(self):
        # Change doc status to UPLOADED (not APPROVED)
        self.doc1.status = Document.Status.UPLOADED
        self.doc1.save()

        self.client.force_authenticate(user=self.admin)
        res = self.client.post(f'/api/v1/approvals/applications/{self.app.id}/decide/', {
            'decision': 'APPROVED'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("has not been approved", res.data['error'])

    def test_admin_issues_final_approval(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(f'/api/v1/approvals/applications/{self.app.id}/decide/', {
            'decision': 'APPROVED',
            'comment': 'All compliance checks verified.'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['application_status'], 'APPROVED')

        self.app.refresh_from_db()
        self.assertEqual(self.app.status, OnboardingApplication.Status.APPROVED)
        self.assertEqual(ApprovalRecord.objects.count(), 1)

    def test_non_admin_cannot_give_final_approval(self):
        # Reviewer attempt -> Blocked
        self.client.force_authenticate(user=self.reviewer)
        res_rev = self.client.post(f'/api/v1/approvals/applications/{self.app.id}/decide/', {
            'decision': 'APPROVED'
        })
        self.assertEqual(res_rev.status_code, status.HTTP_403_FORBIDDEN)

        # Partner attempt -> Blocked
        self.client.force_authenticate(user=self.partner)
        res_part = self.client.post(f'/api/v1/approvals/applications/{self.app.id}/decide/', {
            'decision': 'APPROVED'
        })
        self.assertEqual(res_part.status_code, status.HTTP_403_FORBIDDEN)

    def test_rejection_requires_comment(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(f'/api/v1/approvals/applications/{self.app.id}/decide/', {
            'decision': 'REJECTED',
            'comment': ''
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("comment is strictly required", res.data['error'])
