from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from apps.onboarding.models import Blueprint, ChecklistRequirement, OnboardingApplication, ApplicationChecklistItem
from apps.documents.models import Document
from apps.activity.models import ActivityLog

User = get_user_model()

class ActivityTimelineTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.partner_a = User.objects.create_user(
            username='act_partner_a',
            password='Password123!',
            role=User.Role.PARTNER
        )

        self.partner_b = User.objects.create_user(
            username='act_partner_b',
            password='Password123!',
            role=User.Role.PARTNER
        )

        self.reviewer = User.objects.create_user(
            username='act_reviewer',
            password='Password123!',
            role=User.Role.REVIEWER
        )

        self.admin = User.objects.create_user(
            username='act_admin',
            password='Password123!',
            role=User.Role.ADMIN,
            is_staff=True
        )

        # Setup Blueprint & Application
        self.bp = Blueprint.objects.create(title='Vendor BP', partner_type_code='VENDOR')
        self.req = ChecklistRequirement.objects.create(blueprint=self.bp, document_name='Tax GST', is_mandatory=True)

    def test_automatic_activity_logging_lifecycle(self):
        # 1. Partner creates application -> Activity CREATED
        self.client.force_authenticate(user=self.partner_a)
        app_res = self.client.post('/api/v1/onboarding/applications/', {
            'blueprint': str(self.bp.id),
            'business_name': 'Acme Corp',
            'contact_email': 'acme@test.com'
        })
        app_id = app_res.data['id']

        # 2. Partner submits application -> Activity SUBMITTED
        self.client.post(f'/api/v1/onboarding/applications/{app_id}/submit/')

        # 3. Partner uploads document -> Activity DOC_UPLOADED
        app = OnboardingApplication.objects.get(id=app_id)
        item = app.checklist_items.first()
        pdf = SimpleUploadedFile("tax.pdf", b"pdf content", content_type="application/pdf")
        self.client.post(f'/api/v1/documents/items/{item.id}/upload/', {'file': pdf}, format='multipart')

        # 4. Reviewer approves document -> Activity DOC_APPROVED & PENDING_APPROVAL
        self.client.force_authenticate(user=self.reviewer)
        doc = Document.objects.get(checklist_item=item)
        self.client.patch(f'/api/v1/documents/{doc.id}/review/', {
            'status': 'APPROVED',
            'reviewer_comment': 'Verified'
        })

        # 5. Admin issues final approval -> Activity FINAL_APPROVED
        self.client.force_authenticate(user=self.admin)
        self.client.post(f'/api/v1/approvals/applications/{app_id}/decide/', {
            'decision': 'APPROVED',
            'comment': 'Final sign-off.'
        })

        # 6. Retrieve Timeline
        self.client.force_authenticate(user=self.partner_a)
        timeline_res = self.client.get(f'/api/v1/activity/applications/{app_id}/')
        self.assertEqual(timeline_res.status_code, status.HTTP_200_OK)
        
        actions = [entry['action'] for entry in timeline_res.data]
        self.assertIn('CREATED', actions)
        self.assertIn('SUBMITTED', actions)
        self.assertIn('DOC_UPLOADED', actions)
        self.assertIn('DOC_APPROVED', actions)
        self.assertIn('FINAL_APPROVED', actions)

    def test_unauthorized_partner_cannot_view_timeline(self):
        # Create application for Partner A
        app = OnboardingApplication.objects.create(partner=self.partner_a, blueprint=self.bp, business_name='App A')

        # Partner B attempts to fetch timeline -> Blocked
        self.client.force_authenticate(user=self.partner_b)
        res = self.client.get(f'/api/v1/activity/applications/{app.id}/')
        self.assertIn(res.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])
