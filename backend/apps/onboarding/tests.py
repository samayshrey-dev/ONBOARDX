from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.onboarding.models import Blueprint, ChecklistRequirement, OnboardingApplication, ApplicationChecklistItem
from apps.documents.models import Document
from apps.activity.models import ActivityLog

User = get_user_model()

class BlueprintAndSnapshotChecklistTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.admin = User.objects.create_user(
            username='admin_user',
            password='AdminPassword123!',
            role=User.Role.ADMIN,
            is_staff=True
        )

        self.partner = User.objects.create_user(
            username='partner_user',
            password='PartnerPassword123!',
            company_name='Acme Logistics',
            role=User.Role.PARTNER
        )

    def test_blueprint_creation_and_requirement_management_admin_only(self):
        # Partner attempt to create Blueprint -> Blocked
        self.client.force_authenticate(user=self.partner)
        res_partner = self.client.post('/api/v1/onboarding/blueprints/', {
            'title': 'Company Blueprint',
            'partner_type_code': 'COMPANY'
        })
        self.assertEqual(res_partner.status_code, status.HTTP_403_FORBIDDEN)

        # Admin creates Blueprint
        self.client.force_authenticate(user=self.admin)
        res_admin = self.client.post('/api/v1/onboarding/blueprints/', {
            'title': 'Company Blueprint',
            'partner_type_code': 'COMPANY',
            'description': 'Master blueprint for company vendor onboarding.'
        })
        self.assertEqual(res_admin.status_code, status.HTTP_201_CREATED)
        bp_id = res_admin.data['id']

        # Admin adds requirements to Blueprint
        req_res = self.client.post(f'/api/v1/onboarding/blueprints/{bp_id}/requirements/', {
            'document_name': 'GST Registration Certificate',
            'description': 'Official tax registration document.',
            'is_mandatory': True,
            'order': 1
        })
        self.assertEqual(req_res.status_code, status.HTTP_201_CREATED)

    def test_automatic_snapshot_checklist_generation(self):
        # 1. Setup Blueprint with 2 master requirements
        bp = Blueprint.objects.create(
            title='Individual Blueprint',
            partner_type_code='INDIVIDUAL',
            description='Blueprint for individual contractors.'
        )
        req1 = ChecklistRequirement.objects.create(blueprint=bp, document_name='PAN Card', is_mandatory=True)
        req2 = ChecklistRequirement.objects.create(blueprint=bp, document_name='Identity Proof', is_mandatory=True)

        # 2. Partner creates application referencing Blueprint
        self.client.force_authenticate(user=self.partner)
        app_res = self.client.post('/api/v1/onboarding/applications/', {
            'blueprint': str(bp.id),
            'business_name': 'John Doe Contracting',
            'contact_email': 'john@contracting.com'
        })
        self.assertEqual(app_res.status_code, status.HTTP_201_CREATED)
        app_id = app_res.data['id']

        # 3. Retrieve Application Checklist
        checklist_res = self.client.get(f'/api/v1/onboarding/applications/{app_id}/checklist/')
        self.assertEqual(checklist_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(checklist_res.data), 2)
        doc_names = [item['document_name'] for item in checklist_res.data]
        self.assertIn('PAN Card', doc_names)
        self.assertIn('Identity Proof', doc_names)

    def test_snapshot_immutability_against_future_blueprint_edits(self):
        # 1. Setup Blueprint with 1 requirement
        bp = Blueprint.objects.create(title='Vendor BP', partner_type_code='VENDOR')
        ChecklistRequirement.objects.create(blueprint=bp, document_name='Bank Statement', is_mandatory=True)

        # 2. Partner creates Application
        self.client.force_authenticate(user=self.partner)
        app_res = self.client.post('/api/v1/onboarding/applications/', {
            'blueprint': str(bp.id),
            'business_name': 'Vendor Corp',
            'contact_email': 'vendor@corp.com'
        })
        app_id = app_res.data['id']

        # Application has 1 checklist item
        app = OnboardingApplication.objects.get(id=app_id)
        self.assertEqual(app.checklist_items.count(), 1)

        # 3. Admin adds a NEW 2nd requirement to the master Blueprint later
        ChecklistRequirement.objects.create(blueprint=bp, document_name='ISO Certification', is_mandatory=False)

        # 4. Existing application checklist remains unchanged (1 item snapshot preserved)
        self.assertEqual(app.checklist_items.count(), 1)
        self.assertNotIn('ISO Certification', [item.document_name for item in app.checklist_items.all()])


class SecurityAndAuthorizationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.admin = User.objects.create_user(
            username='admin_sec',
            password='AdminPassword123!',
            role=User.Role.ADMIN,
            is_staff=True
        )

        self.reviewer = User.objects.create_user(
            username='reviewer_sec',
            password='ReviewerPassword123!',
            role=User.Role.REVIEWER
        )

        self.partner_a = User.objects.create_user(
            username='partner_a',
            password='PartnerPassword123!',
            role=User.Role.PARTNER
        )

        self.partner_b = User.objects.create_user(
            username='partner_b',
            password='PartnerPassword123!',
            role=User.Role.PARTNER
        )

        self.bp = Blueprint.objects.create(title='Security BP', partner_type_code='SECURITY')
        self.req = ChecklistRequirement.objects.create(blueprint=self.bp, document_name='Tax Form', is_mandatory=True)

        # Partner A creates Application A
        self.app_a = OnboardingApplication.objects.create(
            partner=self.partner_a,
            blueprint=self.bp,
            business_name='Partner A Business',
            status=OnboardingApplication.Status.DRAFT
        )
        self.item_a = ApplicationChecklistItem.objects.create(
            application=self.app_a,
            requirement_source=self.req,
            document_name='Tax Form',
            is_mandatory=True
        )

    def test_horizontal_privilege_escalation_partner_a_vs_partner_b(self):
        """Protection against: Partner B accessing or modifying Partner A's sensitive application."""
        self.client.force_authenticate(user=self.partner_b)

        # Partner B tries to fetch Partner A's application detail -> Blocked
        res_detail = self.client.get(f'/api/v1/onboarding/applications/{self.app_a.id}/')
        self.assertEqual(res_detail.status_code, status.HTTP_404_NOT_FOUND)

        # Partner B tries to list Partner A's documents -> Blocked
        res_docs = self.client.get(f'/api/v1/documents/application/{self.app_a.id}/')
        self.assertEqual(res_docs.status_code, status.HTTP_403_FORBIDDEN)

        # Partner B tries to upload file to Partner A's checklist item -> Blocked
        sample_file = SimpleUploadedFile("fake.pdf", b"fake content", content_type="application/pdf")
        res_upload = self.client.post(f'/api/v1/documents/items/{self.item_a.id}/upload/', {'file': sample_file}, format='multipart')
        self.assertEqual(res_upload.status_code, status.HTTP_403_FORBIDDEN)

    def test_partner_cannot_approve_documents_or_applications(self):
        """Protection against: Partner self-approving compliance documents or final onboarding application."""
        # Create document for Partner A
        doc = Document.objects.create(
            application=self.app_a,
            checklist_item=self.item_a,
            file_name='tax.pdf',
            file_size=1024,
            status=Document.Status.UPLOADED
        )

        self.client.force_authenticate(user=self.partner_a)

        # Partner A tries to approve document -> Blocked
        res_doc_app = self.client.patch(f'/api/v1/documents/{doc.id}/review/', {'status': 'APPROVED'})
        self.assertEqual(res_doc_app.status_code, status.HTTP_403_FORBIDDEN)

        # Partner A tries to approve final application -> Blocked
        res_app_app = self.client.post(f'/api/v1/approvals/applications/{self.app_a.id}/decide/', {'decision': 'APPROVED'})
        self.assertEqual(res_app_app.status_code, status.HTTP_403_FORBIDDEN)

    def test_reviewer_cannot_grant_final_admin_approval(self):
        """Protection against: Reviewer bypassing admin role to grant level-2 final approval."""
        self.client.force_authenticate(user=self.reviewer)

        res_final = self.client.post(f'/api/v1/approvals/applications/{self.app_a.id}/decide/', {'decision': 'APPROVED'})
        self.assertEqual(res_final.status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_file_extension_and_size_validation(self):
        """Protection against: Executable file upload scripts or DoS via oversized files (>5MB)."""
        self.client.force_authenticate(user=self.partner_a)

        # Disallowed Extension (.exe / .py / .sh)
        bad_ext_file = SimpleUploadedFile("malware.exe", b"MZExecutableBinaryContent", content_type="application/octet-stream")
        res_bad_ext = self.client.post(f'/api/v1/documents/items/{self.item_a.id}/upload/', {'file': bad_ext_file}, format='multipart')
        self.assertEqual(res_bad_ext.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Unsupported file format", res_bad_ext.data['error'])

        # Oversized File (> 5MB)
        large_content = b"0" * (5 * 1024 * 1024 + 100)
        large_file = SimpleUploadedFile("large.pdf", large_content, content_type="application/pdf")
        res_large = self.client.post(f'/api/v1/documents/items/{self.item_a.id}/upload/', {'file': large_file}, format='multipart')
        self.assertEqual(res_large.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("File size exceeds 5MB limit", res_large.data['error'])

    def test_invalid_status_transition_prevents_unearned_approval(self):
        """Protection against: Forcing an application to APPROVED status while mandatory documents remain unapproved."""
        self.client.force_authenticate(user=self.admin)

        # Application app_a status is DRAFT and mandatory 'Tax Form' is NOT approved
        res_unearned = self.client.post(f'/api/v1/approvals/applications/{self.app_a.id}/decide/', {'decision': 'APPROVED'})
        self.assertEqual(res_unearned.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Only applications in 'PENDING_APPROVAL' status can receive final approval", res_unearned.data['error'])


class FullSystemWorkflowTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Admin
        self.admin = User.objects.create_user(
            username='admin_boss',
            password='AdminPassword123!',
            email='admin@onboardx.com',
            role=User.Role.ADMIN,
            is_staff=True,
            is_superuser=True
        )

        # Create Reviewer
        self.reviewer = User.objects.create_user(
            username='reviewer_inspector',
            password='ReviewerPassword123!',
            email='reviewer@onboardx.com',
            role=User.Role.REVIEWER
        )

        # Setup Blueprint: COMPANY with 4 required documents (PAN, GST, Registration, Bank Details)
        self.client.force_authenticate(user=self.admin)
        bp_res = self.client.post('/api/v1/onboarding/blueprints/', {
            'title': 'Company Blueprint',
            'partner_type_code': 'COMPANY',
            'description': 'Master onboarding blueprint for corporate partners.'
        })
        self.assertEqual(bp_res.status_code, status.HTTP_201_CREATED)
        self.bp_id = bp_res.data['id']

        for doc_name in ['PAN Card', 'GST Certificate', 'Registration Certificate', 'Bank Details']:
            req_res = self.client.post(f'/api/v1/onboarding/blueprints/{self.bp_id}/requirements/', {
                'document_name': doc_name,
                'description': f'Mandatory {doc_name}',
                'is_mandatory': True
            })
            self.assertEqual(req_res.status_code, status.HTTP_201_CREATED)

    def test_complete_20_step_real_world_workflow(self):
        # -------------------------------------------------------------
        # STEP 1: Partner registers.
        # -------------------------------------------------------------
        self.client.logout()
        reg_res = self.client.post('/api/v1/auth/register/', {
            'username': 'acme_partner',
            'email': 'partner@acmelogistics.com',
            'password': 'PartnerSecret123!',
            'first_name': 'Acme',
            'last_name': 'Partner',
            'company_name': 'Acme Global Logistics',
            'phone_number': '+15550192834',
            'role': 'PARTNER'
        })
        self.assertEqual(reg_res.status_code, status.HTTP_201_CREATED)

        # -------------------------------------------------------------
        # STEP 2: Partner logs in (obtains JWT token pair).
        # -------------------------------------------------------------
        login_res = self.client.post('/api/v1/auth/login/', {
            'username': 'acme_partner',
            'password': 'PartnerSecret123!'
        })
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertIn('access', login_res.data)
        access_token = login_res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        # -------------------------------------------------------------
        # STEP 3: Partner completes profile.
        # -------------------------------------------------------------
        profile_res = self.client.patch('/api/v1/auth/profile/', {
            'business_name': 'Acme Global Logistics Inc.',
            'phone': '+15550192834',
            'address': '100 Enterprise Way, Industrial Zone',
            'registration_number': 'REG-2026-8899',
            'website': 'https://acmelogistics.com'
        })
        self.assertEqual(profile_res.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_res.data['business_name'], 'Acme Global Logistics Inc.')

        # -------------------------------------------------------------
        # STEP 4: Partner creates application.
        # STEP 5: Blueprint is selected (COMPANY blueprint).
        # -------------------------------------------------------------
        app_create_res = self.client.post('/api/v1/onboarding/applications/', {
            'blueprint': self.bp_id,
            'business_name': 'Acme Global Logistics Inc.',
            'contact_email': 'partner@acmelogistics.com',
            'contact_phone': '+15550192834'
        })
        self.assertEqual(app_create_res.status_code, status.HTTP_201_CREATED)
        app_id = app_create_res.data['id']
        self.assertTrue(app_create_res.data['is_editable'])

        # -------------------------------------------------------------
        # STEP 6: Application checklist is generated (4 mandatory items).
        # -------------------------------------------------------------
        checklist_res = self.client.get(f'/api/v1/onboarding/applications/{app_id}/checklist/')
        self.assertEqual(checklist_res.status_code, status.HTTP_200_OK)
        checklist_items = checklist_res.data
        self.assertEqual(len(checklist_items), 4)

        item_map = {item['document_name']: item['id'] for item in checklist_items}
        self.assertIn('PAN Card', item_map)
        self.assertIn('GST Certificate', item_map)
        self.assertIn('Registration Certificate', item_map)
        self.assertIn('Bank Details', item_map)

        # -------------------------------------------------------------
        # STEP 7: Partner uploads documents.
        # -------------------------------------------------------------
        uploaded_doc_ids = {}
        for doc_name, item_id in item_map.items():
            sample_file = SimpleUploadedFile(
                name=f"{doc_name.lower().replace(' ', '_')}.pdf",
                content=b"%PDF-1.4 Mock document binary content",
                content_type="application/pdf"
            )
            upload_res = self.client.post(
                f'/api/v1/documents/items/{item_id}/upload/',
                {'file': sample_file},
                format='multipart'
            )
            self.assertEqual(upload_res.status_code, status.HTTP_201_CREATED)
            uploaded_doc_ids[doc_name] = upload_res.data['document']['id']

        # Verify all 4 documents uploaded
        docs_res = self.client.get(f'/api/v1/documents/application/{app_id}/')
        self.assertEqual(len(docs_res.data), 4)

        # -------------------------------------------------------------
        # STEP 8: Partner submits application.
        # -------------------------------------------------------------
        submit_res = self.client.post(f'/api/v1/onboarding/applications/{app_id}/submit/')
        self.assertEqual(submit_res.status_code, status.HTTP_200_OK)
        self.assertEqual(submit_res.data['application']['status'], 'SUBMITTED')

        # -------------------------------------------------------------
        # STEP 9: Reviewer sees it in Review Queue.
        # -------------------------------------------------------------
        self.client.force_authenticate(user=self.reviewer)
        queue_res = self.client.get('/api/v1/onboarding/reviewer/queue/')
        self.assertEqual(queue_res.status_code, status.HTTP_200_OK)
        queue_app_ids = [app['id'] for app in queue_res.data]
        self.assertIn(app_id, queue_app_ids)

        # -------------------------------------------------------------
        # STEP 10: Reviewer reviews documents.
        # -------------------------------------------------------------
        rev_docs_res = self.client.get(f'/api/v1/documents/application/{app_id}/')
        self.assertEqual(len(rev_docs_res.data), 4)

        # Reviewer approves PAN Card, GST Certificate, Registration Certificate
        for doc_name in ['PAN Card', 'GST Certificate', 'Registration Certificate']:
            doc_id = uploaded_doc_ids[doc_name]
            rev_res = self.client.patch(f'/api/v1/documents/{doc_id}/review/', {
                'status': 'APPROVED',
                'reviewer_comment': f'{doc_name} verified clear.'
            })
            self.assertEqual(rev_res.status_code, status.HTTP_200_OK)

        # -------------------------------------------------------------
        # STEP 11: Reviewer rejects one document (Bank Details).
        # -------------------------------------------------------------
        bank_doc_id = uploaded_doc_ids['Bank Details']
        bank_reject_res = self.client.patch(f'/api/v1/documents/{bank_doc_id}/review/', {
            'status': 'REJECTED',
            'reviewer_comment': 'Bank account number blurry and illegible. Please upload clear scan.'
        })
        self.assertEqual(bank_reject_res.status_code, status.HTTP_200_OK)
        self.assertEqual(bank_reject_res.data['application_status'], 'CORRECTION_REQUIRED')

        # -------------------------------------------------------------
        # STEP 12: Partner sees rejection and comment.
        # -------------------------------------------------------------
        self.client.force_authenticate(user=User.objects.get(username='acme_partner'))
        partner_app_res = self.client.get(f'/api/v1/onboarding/applications/{app_id}/')
        self.assertEqual(partner_app_res.data['status'], 'CORRECTION_REQUIRED')
        self.assertTrue(partner_app_res.data['is_editable'])

        partner_docs_res = self.client.get(f'/api/v1/documents/application/{app_id}/')
        bank_doc_item = next(d for d in partner_docs_res.data if d['id'] == bank_doc_id)
        self.assertEqual(bank_doc_item['status'], 'REJECTED')
        self.assertIn('blurry and illegible', bank_doc_item['reviewer_comment'])

        # -------------------------------------------------------------
        # STEP 13: Partner replaces document (uploads clear Bank Details).
        # -------------------------------------------------------------
        bank_item_id = item_map['Bank Details']
        replacement_file = SimpleUploadedFile(
            name="bank_details_clear_hd.pdf",
            content=b"%PDF-1.4 Clear high resolution bank statement binary content",
            content_type="application/pdf"
        )
        re_upload_res = self.client.post(
            f'/api/v1/documents/items/{bank_item_id}/upload/',
            {'file': replacement_file},
            format='multipart'
        )
        self.assertEqual(re_upload_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(re_upload_res.data['document']['status'], 'UPLOADED')

        # -------------------------------------------------------------
        # STEP 14: Reviewer approves it.
        # -------------------------------------------------------------
        self.client.force_authenticate(user=self.reviewer)
        rev_approve_bank = self.client.patch(f'/api/v1/documents/{bank_doc_id}/review/', {
            'status': 'APPROVED',
            'reviewer_comment': 'Replacement bank details verified clear.'
        })
        self.assertEqual(rev_approve_bank.status_code, status.HTTP_200_OK)

        # -------------------------------------------------------------
        # STEP 15: All required documents become approved.
        # STEP 16: Application becomes eligible for final approval (PENDING_APPROVAL).
        # -------------------------------------------------------------
        self.assertEqual(rev_approve_bank.data['application_status'], 'PENDING_APPROVAL')

        app_check = OnboardingApplication.objects.get(id=app_id)
        self.assertEqual(app_check.status, 'PENDING_APPROVAL')

        # -------------------------------------------------------------
        # STEP 17: Admin reviews application.
        # -------------------------------------------------------------
        self.client.force_authenticate(user=self.admin)
        admin_inspect_res = self.client.get(f'/api/v1/onboarding/applications/{app_id}/')
        self.assertEqual(admin_inspect_res.status_code, status.HTTP_200_OK)
        self.assertEqual(admin_inspect_res.data['status'], 'PENDING_APPROVAL')

        # -------------------------------------------------------------
        # STEP 18: Admin approves application.
        # -------------------------------------------------------------
        final_decide_res = self.client.post(f'/api/v1/approvals/applications/{app_id}/decide/', {
            'decision': 'APPROVED',
            'comment': 'Granted executive final approval for Acme Global Logistics Inc.'
        })
        self.assertEqual(final_decide_res.status_code, status.HTTP_200_OK)
        self.assertEqual(final_decide_res.data['application_status'], 'APPROVED')

        # -------------------------------------------------------------
        # STEP 19: Partner sees APPROVED.
        # -------------------------------------------------------------
        self.client.force_authenticate(user=User.objects.get(username='acme_partner'))
        final_partner_res = self.client.get(f'/api/v1/onboarding/applications/{app_id}/')
        self.assertEqual(final_partner_res.data['status'], 'APPROVED')
        self.assertFalse(final_partner_res.data['is_editable'])

        # -------------------------------------------------------------
        # STEP 20: Activity timeline contains the complete history.
        # -------------------------------------------------------------
        timeline_res = self.client.get(f'/api/v1/activity/applications/{app_id}/')
        self.assertEqual(timeline_res.status_code, status.HTTP_200_OK)
        timeline = timeline_res.data
        self.assertTrue(len(timeline) >= 6)

        actions = [event['action'] for event in timeline]
        self.assertIn('CREATED', actions)
        self.assertIn('SUBMITTED', actions)
        self.assertIn('DOC_UPLOADED', actions)
        self.assertIn('DOC_REJECTED', actions)
        self.assertIn('DOC_REPLACED', actions)
        self.assertIn('DOC_APPROVED', actions)
        self.assertIn('FINAL_APPROVED', actions)
