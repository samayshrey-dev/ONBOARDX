from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings
import os
import uuid
from datetime import timedelta

from apps.accounts.models import CustomUser, PartnerProfile
from apps.onboarding.models import (
    Blueprint,
    ChecklistRequirement,
    OnboardingApplication,
    ApplicationChecklistItem
)
from apps.documents.models import Document
from apps.approvals.models import ApprovalRecord
from apps.activity.models import ActivityLog


class Command(BaseCommand):
    help = 'Seeds complete realistic enterprise demo data for ONBOARDX platform.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Starting ONBOARDX enterprise data seeding..."))

        # 1. Create Demo Users across Roles
        users_data = [
            {
                'username': 'admin',
                'email': 'admin@onboardx.com',
                'role': CustomUser.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'password': 'AdminPassword123!',
                'company_name': 'ONBOARDX Governance Corp',
                'phone_number': '+91 98765 43210'
            },
            {
                'username': 'reviewer',
                'email': 'reviewer@onboardx.com',
                'role': CustomUser.Role.REVIEWER,
                'is_staff': True,
                'is_superuser': False,
                'password': 'ReviewerPassword123!',
                'company_name': 'ONBOARDX Compliance Ops',
                'phone_number': '+91 98123 45678'
            },
            {
                'username': 'partner',
                'email': 'partner@onboardx.com',
                'role': CustomUser.Role.PARTNER,
                'is_staff': False,
                'is_superuser': False,
                'password': 'PartnerPassword123!',
                'company_name': 'Acme Global Solutions',
                'phone_number': '+91 98234 56789'
            },
            {
                'username': 'apex_logistics',
                'email': 'ops@apexlogistics.com',
                'role': CustomUser.Role.PARTNER,
                'is_staff': False,
                'is_superuser': False,
                'password': 'PartnerPassword123!',
                'company_name': 'Apex Logistics Corp',
                'phone_number': '+91 98345 67890'
            },
            {
                'username': 'nexus_retail',
                'email': 'compliance@nexusretail.io',
                'role': CustomUser.Role.PARTNER,
                'is_staff': False,
                'is_superuser': False,
                'password': 'PartnerPassword123!',
                'company_name': 'Nexus Retail Holdings',
                'phone_number': '+91 98456 78901'
            },
            {
                'username': 'zenith_energy',
                'email': 'onboarding@zenithenergy.com',
                'role': CustomUser.Role.PARTNER,
                'is_staff': False,
                'is_superuser': False,
                'password': 'PartnerPassword123!',
                'company_name': 'Zenith Energy Innovations',
                'phone_number': '+91 98567 89012'
            },
            {
                'username': 'vanguard_dist',
                'email': 'partner@vanguarddist.org',
                'role': CustomUser.Role.PARTNER,
                'is_staff': False,
                'is_superuser': False,
                'password': 'PartnerPassword123!',
                'company_name': 'Vanguard Regional Distribution',
                'phone_number': '+91 98678 90123'
            },
            {
                'username': 'quantum_tech',
                'email': 'ceo@quantumtech.io',
                'role': CustomUser.Role.PARTNER,
                'is_staff': False,
                'is_superuser': False,
                'password': 'PartnerPassword123!',
                'company_name': 'Quantum Tech Solutions',
                'phone_number': '+91 98789 01234'
            },
        ]

        users_dict = {}
        for u_data in users_data:
            user, created = CustomUser.objects.get_or_create(
                username=u_data['username'],
                defaults={
                    'email': u_data['email'],
                    'role': u_data['role'],
                    'is_staff': u_data['is_staff'],
                    'is_superuser': u_data['is_superuser'],
                    'company_name': u_data['company_name'],
                    'phone_number': u_data['phone_number'],
                }
            )
            user.set_password(u_data['password'])
            user.email = u_data['email']
            user.company_name = u_data['company_name']
            user.phone_number = u_data['phone_number']
            user.role = u_data['role']
            user.is_staff = u_data['is_staff']
            user.is_superuser = u_data['is_superuser']
            user.save()

            if user.role == CustomUser.Role.PARTNER:
                profile, _ = PartnerProfile.objects.get_or_create(user=user)
                profile.business_name = u_data['company_name']
                profile.phone = u_data['phone_number']
                profile.registration_number = f"REG-2026-{user.username.upper()[:4]}"
                profile.website = f"https://www.{user.username.replace('_', '')}.com"
                profile.address = "100 Enterprise Boulevard, Suite 400, Financial District"
                profile.save()

            users_dict[u_data['username']] = user
            self.stdout.write(f"User synced: {user.username} [{user.role}]")

        # 2. Create Blueprints & Requirements
        blueprints_data = [
            {
                'title': 'Company Vendor Blueprint',
                'partner_type_code': 'COMPANY',
                'description': 'Master onboarding requirements for corporate vendors and suppliers.',
                'requirements': [
                    ('PAN Card', 'Official Corporate PAN Card Copy', True, 1),
                    ('GST Certificate', 'GST Registration Certificate', True, 2),
                    ('Registration Certificate', 'Certificate of Incorporation / Business Registration', True, 3),
                    ('Bank Details', 'Cancelled Cheque or Audited Bank Statement', True, 4),
                ]
            },
            {
                'title': 'Regional Distributor Blueprint',
                'partner_type_code': 'DISTRIBUTOR',
                'description': 'Onboarding requirements for regional distribution partners.',
                'requirements': [
                    ('Trade License', 'Valid Regional Trade License', True, 1),
                    ('GST Certificate', 'GST Registration Certificate', True, 2),
                    ('Audited Financials', 'Past 2 Years Balance Sheet & PnL Statement', True, 3),
                    ('Warehouse Lease Deed', 'Lease Agreement or Property Ownership Title', False, 4),
                ]
            },
            {
                'title': 'Franchisee Partner Blueprint',
                'partner_type_code': 'FRANCHISEE',
                'description': 'Onboarding blueprint for franchise retail outlet owners.',
                'requirements': [
                    ('Identity Proof', 'Government Photo ID of Franchise Owner (Passport / Aadhaar)', True, 1),
                    ('PAN Card', 'PAN Card Copy of Franchisee Entity', True, 2),
                    ('Store Premises Deed', 'Store Lease Agreement or Property Ownership Deed', True, 3),
                    ('Bank Account Verification', 'Bank Account Verification Details', True, 4),
                ]
            }
        ]

        blueprints_dict = {}
        for bp_info in blueprints_data:
            bp, _ = Blueprint.objects.get_or_create(
                partner_type_code=bp_info['partner_type_code'],
                defaults={
                    'title': bp_info['title'],
                    'description': bp_info['description'],
                    'is_active': True,
                }
            )
            blueprints_dict[bp_info['partner_type_code']] = bp

            for req_name, req_desc, is_mand, order_val in bp_info['requirements']:
                ChecklistRequirement.objects.get_or_create(
                    blueprint=bp,
                    document_name=req_name,
                    defaults={
                        'description': req_desc,
                        'is_mandatory': is_mand,
                        'order': order_val
                    }
                )

        # 3. Create Sample Document Files in media directory
        media_doc_dir = os.path.join(settings.MEDIA_ROOT, 'partner_documents')
        os.makedirs(media_doc_dir, exist_ok=True)

        def create_sample_pdf(filename_prefix):
            file_name = f"{filename_prefix}_{uuid.uuid4().hex[:6]}.pdf"
            relative_path = f"partner_documents/{file_name}"
            full_path = os.path.join(settings.MEDIA_ROOT, relative_path)
            content = f"%PDF-1.4\n1 0 obj\n<< /Title ({filename_prefix}) /Author (ONBOARDX Compliance System) >>\nendobj\n%%EOF".encode('utf-8')
            with open(full_path, 'wb') as f:
                f.write(content)
            return relative_path, file_name, len(content)

        # 4. Clean existing applications & logs for idempotent re-seeding
        OnboardingApplication.objects.all().delete()
        ActivityLog.objects.all().delete()

        now = timezone.now()

        # 5. Enterprise Applications Seed Data
        apps_to_create = [
            {
                'app_num': 'APP-2026-0001',
                'partner': users_dict['apex_logistics'],
                'blueprint': blueprints_dict['COMPANY'],
                'business_name': 'Apex Logistics Corp',
                'contact_email': 'ops@apexlogistics.com',
                'contact_phone': '+91 98345 67890',
                'business_details': 'Global supply chain & multimodal freight logistics provider with 14 distribution hubs.',
                'status': OnboardingApplication.Status.APPROVED,
                'created_days_ago': 7,
                'submitted_days_ago': 6,
                'docs_config': [
                    {'req_name': 'PAN Card', 'status': Document.Status.APPROVED, 'item_status': ApplicationChecklistItem.ItemStatus.VERIFIED, 'comment': 'Corporate PAN verified against ITD database.'},
                    {'req_name': 'GST Certificate', 'status': Document.Status.APPROVED, 'item_status': ApplicationChecklistItem.ItemStatus.VERIFIED, 'comment': 'GSTIN active and verified.'},
                    {'req_name': 'Registration Certificate', 'status': Document.Status.APPROVED, 'item_status': ApplicationChecklistItem.ItemStatus.VERIFIED, 'comment': 'Certificate of Incorporation valid.'},
                    {'req_name': 'Bank Details', 'status': Document.Status.APPROVED, 'item_status': ApplicationChecklistItem.ItemStatus.VERIFIED, 'comment': 'Bank account details verified via Penny Drop.'},
                ],
                'final_approval': {
                    'decision': ApprovalRecord.Decision.APPROVED,
                    'approved_by': users_dict['admin'],
                    'comment': 'All mandatory corporate verification checks passed. Approved for Enterprise Vendor Status.'
                }
            },
            {
                'app_num': 'APP-2026-0002',
                'partner': users_dict['partner'],
                'blueprint': blueprints_dict['COMPANY'],
                'business_name': 'Acme Global Solutions',
                'contact_email': 'partner@onboardx.com',
                'contact_phone': '+91 98234 56789',
                'business_details': 'Enterprise software consulting and cloud infrastructure vendor.',
                'status': OnboardingApplication.Status.UNDER_REVIEW,
                'created_days_ago': 4,
                'submitted_days_ago': 3,
                'docs_config': [
                    {'req_name': 'PAN Card', 'status': Document.Status.APPROVED, 'item_status': ApplicationChecklistItem.ItemStatus.VERIFIED, 'comment': 'PAN Card verified.'},
                    {'req_name': 'GST Certificate', 'status': Document.Status.UNDER_REVIEW, 'item_status': ApplicationChecklistItem.ItemStatus.PROVIDED, 'comment': 'Reviewing tax registration filing.'},
                    {'req_name': 'Registration Certificate', 'status': Document.Status.UPLOADED, 'item_status': ApplicationChecklistItem.ItemStatus.PROVIDED, 'comment': None},
                    {'req_name': 'Bank Details', 'status': None, 'item_status': ApplicationChecklistItem.ItemStatus.NOT_PROVIDED, 'comment': None},
                ],
                'final_approval': None
            },
            {
                'app_num': 'APP-2026-0003',
                'partner': users_dict['nexus_retail'],
                'blueprint': blueprints_dict['DISTRIBUTOR'],
                'business_name': 'Nexus Retail Holdings',
                'contact_email': 'compliance@nexusretail.io',
                'contact_phone': '+91 98456 78901',
                'business_details': 'Omnichannel retail distributor operating across 35 urban markets.',
                'status': OnboardingApplication.Status.CORRECTION_REQUIRED,
                'created_days_ago': 5,
                'submitted_days_ago': 4,
                'docs_config': [
                    {'req_name': 'Trade License', 'status': Document.Status.APPROVED, 'item_status': ApplicationChecklistItem.ItemStatus.VERIFIED, 'comment': 'Trade license active until 2028.'},
                    {'req_name': 'GST Certificate', 'status': Document.Status.REJECTED, 'item_status': ApplicationChecklistItem.ItemStatus.REJECTED, 'comment': 'The GST Certificate scan is blurry and truncated. Please re-upload a clear full-page PDF.'},
                    {'req_name': 'Audited Financials', 'status': Document.Status.APPROVED, 'item_status': ApplicationChecklistItem.ItemStatus.VERIFIED, 'comment': 'Audited Balance Sheets for FY24 & FY25 accepted.'},
                    {'req_name': 'Warehouse Lease Deed', 'status': None, 'item_status': ApplicationChecklistItem.ItemStatus.NOT_PROVIDED, 'comment': None},
                ],
                'final_approval': {
                    'decision': ApprovalRecord.Decision.CORRECTION_REQUIRED,
                    'approved_by': users_dict['reviewer'],
                    'comment': 'Application halted: Clarification required on GST Certificate submission.'
                }
            },
            {
                'app_num': 'APP-2026-0004',
                'partner': users_dict['zenith_energy'],
                'blueprint': blueprints_dict['COMPANY'],
                'business_name': 'Zenith Energy Innovations',
                'contact_email': 'onboarding@zenithenergy.com',
                'contact_phone': '+91 98567 89012',
                'business_details': 'Clean energy technology developer specializing in commercial solar microgrids.',
                'status': OnboardingApplication.Status.PENDING_APPROVAL,
                'created_days_ago': 3,
                'submitted_days_ago': 2,
                'docs_config': [
                    {'req_name': 'PAN Card', 'status': Document.Status.APPROVED, 'item_status': ApplicationChecklistItem.ItemStatus.VERIFIED, 'comment': 'Verified.'},
                    {'req_name': 'GST Certificate', 'status': Document.Status.APPROVED, 'item_status': ApplicationChecklistItem.ItemStatus.VERIFIED, 'comment': 'Verified.'},
                    {'req_name': 'Registration Certificate', 'status': Document.Status.APPROVED, 'item_status': ApplicationChecklistItem.ItemStatus.VERIFIED, 'comment': 'Verified.'},
                    {'req_name': 'Bank Details', 'status': Document.Status.APPROVED, 'item_status': ApplicationChecklistItem.ItemStatus.VERIFIED, 'comment': 'Verified.'},
                ],
                'final_approval': None
            },
            {
                'app_num': 'APP-2026-0005',
                'partner': users_dict['vanguard_dist'],
                'blueprint': blueprints_dict['DISTRIBUTOR'],
                'business_name': 'Vanguard Regional Distribution',
                'contact_email': 'partner@vanguarddist.org',
                'contact_phone': '+91 98678 90123',
                'business_details': 'FMCG distribution network covering northern tier provinces.',
                'status': OnboardingApplication.Status.REJECTED,
                'created_days_ago': 10,
                'submitted_days_ago': 8,
                'docs_config': [
                    {'req_name': 'Trade License', 'status': Document.Status.REJECTED, 'item_status': ApplicationChecklistItem.ItemStatus.REJECTED, 'comment': 'Trade License expired on Dec 31, 2025.'},
                    {'req_name': 'GST Certificate', 'status': Document.Status.APPROVED, 'item_status': ApplicationChecklistItem.ItemStatus.VERIFIED, 'comment': 'GST Active.'},
                    {'req_name': 'Audited Financials', 'status': Document.Status.APPROVED, 'item_status': ApplicationChecklistItem.ItemStatus.VERIFIED, 'comment': 'Financials accepted.'},
                    {'req_name': 'Warehouse Lease Deed', 'status': None, 'item_status': ApplicationChecklistItem.ItemStatus.NOT_PROVIDED, 'comment': None},
                ],
                'final_approval': {
                    'decision': ApprovalRecord.Decision.REJECTED,
                    'approved_by': users_dict['admin'],
                    'comment': 'Mandatory trade license failed validation (expired document).'
                }
            },
            {
                'app_num': 'APP-2026-0006',
                'partner': users_dict['quantum_tech'],
                'blueprint': blueprints_dict['FRANCHISEE'],
                'business_name': 'Quantum Tech Solutions',
                'contact_email': 'ceo@quantumtech.io',
                'contact_phone': '+91 98789 01234',
                'business_details': 'Retail hardware & electronic components franchise store applicant.',
                'status': OnboardingApplication.Status.SUBMITTED,
                'created_days_ago': 1,
                'submitted_days_ago': 0,
                'docs_config': [
                    {'req_name': 'Identity Proof', 'status': Document.Status.UPLOADED, 'item_status': ApplicationChecklistItem.ItemStatus.PROVIDED, 'comment': None},
                    {'req_name': 'PAN Card', 'status': Document.Status.UPLOADED, 'item_status': ApplicationChecklistItem.ItemStatus.PROVIDED, 'comment': None},
                    {'req_name': 'Store Premises Deed', 'status': Document.Status.UPLOADED, 'item_status': ApplicationChecklistItem.ItemStatus.PROVIDED, 'comment': None},
                    {'req_name': 'Bank Account Verification', 'status': Document.Status.UPLOADED, 'item_status': ApplicationChecklistItem.ItemStatus.PROVIDED, 'comment': None},
                ],
                'final_approval': None
            }
        ]

        for app_spec in apps_to_create:
            created_dt = now - timedelta(days=app_spec['created_days_ago'])
            submitted_dt = now - timedelta(days=app_spec['submitted_days_ago']) if app_spec['submitted_days_ago'] is not None else None

            app = OnboardingApplication.objects.create(
                application_number=app_spec['app_num'],
                partner=app_spec['partner'],
                blueprint=app_spec['blueprint'],
                business_name=app_spec['business_name'],
                contact_email=app_spec['contact_email'],
                contact_phone=app_spec['contact_phone'],
                business_details=app_spec['business_details'],
                status=app_spec['status'],
                submitted_at=submitted_dt
            )
            OnboardingApplication.objects.filter(id=app.id).update(
                created_at=created_dt,
                updated_at=now - timedelta(days=app_spec['submitted_days_ago'])
            )

            # Log 1: Application Created
            log1 = ActivityLog.objects.create(
                application=app,
                actor=app_spec['partner'],
                action=ActivityLog.Action.CREATED,
                description=f"Created onboarding application for '{app.business_name}' under '{app.blueprint.title}' blueprint."
            )
            ActivityLog.objects.filter(id=log1.id).update(created_at=created_dt)

            # Create Checklist Items & Documents
            for req in app_spec['blueprint'].requirements.all():
                cfg = next((c for c in app_spec['docs_config'] if c['req_name'] == req.document_name), None)
                item_status = cfg['item_status'] if cfg else ApplicationChecklistItem.ItemStatus.NOT_PROVIDED

                item = ApplicationChecklistItem.objects.create(
                    application=app,
                    requirement_source=req,
                    document_name=req.document_name,
                    description=req.description,
                    is_mandatory=req.is_mandatory,
                    status=item_status
                )
                ApplicationChecklistItem.objects.filter(id=item.id).update(created_at=created_dt + timedelta(minutes=10))

                if cfg and cfg['status'] is not None:
                    file_rel_path, file_name, file_size = create_sample_pdf(f"{app.business_name[:5].lower()}_{req.document_name[:5].lower()}")
                    doc = Document.objects.create(
                        application=app,
                        checklist_item=item,
                        file=file_rel_path,
                        file_name=file_name,
                        file_size=file_size,
                        file_type='application/pdf',
                        status=cfg['status'],
                        reviewer_comment=cfg['comment']
                    )
                    doc_dt = created_dt + timedelta(hours=2)
                    Document.objects.filter(id=doc.id).update(uploaded_at=doc_dt, updated_at=doc_dt)

                    log_doc = ActivityLog.objects.create(
                        application=app,
                        actor=app_spec['partner'],
                        action=ActivityLog.Action.DOC_UPLOADED,
                        description=f"Uploaded document '{req.document_name}' ({file_name})."
                    )
                    ActivityLog.objects.filter(id=log_doc.id).update(created_at=doc_dt)

                    if cfg['status'] == Document.Status.APPROVED:
                        rev_dt = doc_dt + timedelta(hours=5)
                        log_appr = ActivityLog.objects.create(
                            application=app,
                            actor=users_dict['reviewer'],
                            action=ActivityLog.Action.DOC_APPROVED,
                            description=f"Reviewer verified and approved document '{req.document_name}'."
                        )
                        ActivityLog.objects.filter(id=log_appr.id).update(created_at=rev_dt)
                    elif cfg['status'] == Document.Status.REJECTED:
                        rej_dt = doc_dt + timedelta(hours=5)
                        log_rej = ActivityLog.objects.create(
                            application=app,
                            actor=users_dict['reviewer'],
                            action=ActivityLog.Action.DOC_REJECTED,
                            description=f"Reviewer rejected document '{req.document_name}': {cfg['comment']}"
                        )
                        ActivityLog.objects.filter(id=log_rej.id).update(created_at=rej_dt)

            # Log 2: Submitted
            if submitted_dt:
                log_sub = ActivityLog.objects.create(
                    application=app,
                    actor=app_spec['partner'],
                    action=ActivityLog.Action.SUBMITTED,
                    description="Submitted application package for compliance document verification."
                )
                ActivityLog.objects.filter(id=log_sub.id).update(created_at=submitted_dt)

            # Log 3: Pending Approval status
            if app_spec['status'] == OnboardingApplication.Status.PENDING_APPROVAL:
                log_p = ActivityLog.objects.create(
                    application=app,
                    actor=users_dict['reviewer'],
                    action=ActivityLog.Action.PENDING_APPROVAL,
                    description="All document checks passed. Escalated application to Admin for final sign-off."
                )
                ActivityLog.objects.filter(id=log_p.id).update(created_at=submitted_dt + timedelta(hours=12))

            # Log 4: Final Approval/Rejection Record
            if app_spec['final_approval']:
                fa = app_spec['final_approval']
                appr_rec = ApprovalRecord.objects.create(
                    application=app,
                    approved_by=fa['approved_by'],
                    decision=fa['decision'],
                    comment=fa['comment']
                )
                fa_dt = submitted_dt + timedelta(days=1)
                ApprovalRecord.objects.filter(id=appr_rec.id).update(created_at=fa_dt)

                action_type = (
                    ActivityLog.Action.FINAL_APPROVED if fa['decision'] == ApprovalRecord.Decision.APPROVED
                    else ActivityLog.Action.FINAL_REJECTED if fa['decision'] == ApprovalRecord.Decision.REJECTED
                    else ActivityLog.Action.CORRECTION_REQUESTED
                )
                log_final = ActivityLog.objects.create(
                    application=app,
                    actor=fa['approved_by'],
                    action=action_type,
                    description=f"Decision [{fa['decision']}]: {fa['comment']}"
                )
                ActivityLog.objects.filter(id=log_final.id).update(created_at=fa_dt)

            self.stdout.write(self.style.SUCCESS(f"Seeded App {app.application_number} ({app.business_name}) -> Status: {app.status}"))

        self.stdout.write(self.style.SUCCESS("ONBOARDX database seeding completed successfully!"))
