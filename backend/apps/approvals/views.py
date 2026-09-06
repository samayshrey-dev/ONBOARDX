from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import ApprovalRecord
from .serializers import ApprovalRecordSerializer
from apps.onboarding.models import OnboardingApplication
from apps.documents.models import Document
from apps.accounts.permissions import IsAdminRole, IsOwnerOrStaff
from apps.activity.services import log_activity
from apps.activity.models import ActivityLog

def check_application_approval_eligibility(application):
    if application.status != OnboardingApplication.Status.PENDING_APPROVAL:
        return False, f"Application is currently in '{application.status}' status. Only applications in 'PENDING_APPROVAL' status can receive final approval."

    mandatory_items = application.checklist_items.filter(is_mandatory=True)
    for item in mandatory_items:
        doc = Document.objects.filter(checklist_item=item).first()
        if not doc or doc.status != Document.Status.APPROVED:
            return False, f"Mandatory requirement '{item.document_name}' has not been approved."

    return True, ""

class AdminApprovalDecisionView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsAdminRole)

    def post(self, request, app_id):
        application = get_object_or_404(OnboardingApplication, pk=app_id)
        decision = request.data.get('decision')
        comment = request.data.get('comment', '').strip()

        if decision not in [ApprovalRecord.Decision.APPROVED, ApprovalRecord.Decision.REJECTED, ApprovalRecord.Decision.CORRECTION_REQUIRED]:
            return Response({
                "error": "Invalid decision. Allowed values: 'APPROVED', 'REJECTED', 'CORRECTION_REQUIRED'."
            }, status=status.HTTP_400_BAD_REQUEST)

        if decision == ApprovalRecord.Decision.APPROVED:
            is_eligible, err_msg = check_application_approval_eligibility(application)
            if not is_eligible:
                return Response({"error": err_msg}, status=status.HTTP_400_BAD_REQUEST)

        if decision in [ApprovalRecord.Decision.REJECTED, ApprovalRecord.Decision.CORRECTION_REQUIRED] and not comment:
            return Response({
                "error": "A comment is strictly required when rejecting an application or requesting corrections."
            }, status=status.HTTP_400_BAD_REQUEST)

        # UPDATE APPLICATION STATUS
        if decision == ApprovalRecord.Decision.APPROVED:
            application.status = OnboardingApplication.Status.APPROVED
            action_type = ActivityLog.Action.FINAL_APPROVED
            desc = f"Granted final onboarding approval."
            if comment:
                desc += f" Note: {comment}"
        elif decision == ApprovalRecord.Decision.REJECTED:
            application.status = OnboardingApplication.Status.REJECTED
            action_type = ActivityLog.Action.FINAL_REJECTED
            desc = f"Rejected onboarding application. Reason: {comment}"
        elif decision == ApprovalRecord.Decision.CORRECTION_REQUIRED:
            application.status = OnboardingApplication.Status.CORRECTION_REQUIRED
            action_type = ActivityLog.Action.CORRECTION_REQUESTED
            desc = f"Requested application corrections. Reason: {comment}"

        application.save()

        # LOG TIMELINE ACTIVITY
        log_activity(
            application=application,
            actor=request.user,
            action=action_type,
            description=desc
        )

        record, _ = ApprovalRecord.objects.update_or_create(
            application=application,
            defaults={
                'approved_by': request.user,
                'decision': decision,
                'comment': comment
            }
        )

        serializer = ApprovalRecordSerializer(record)
        return Response({
            'message': f"Application #{application.application_number} final decision recorded as '{decision}'.",
            'application_status': application.status,
            'approval_record': serializer.data
        }, status=status.HTTP_200_OK)

class ApprovalRecordDetailView(generics.RetrieveAPIView):
    serializer_class = ApprovalRecordSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrStaff)

    def get_object(self):
        app_id = self.kwargs.get('app_id')
        application = get_object_or_404(OnboardingApplication, pk=app_id)
        self.check_object_permissions(self.request, application)
        return get_object_or_404(ApprovalRecord, application=application)
