import os
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from .models import Document, validate_file_extension_and_size
from .serializers import DocumentSerializer
from apps.onboarding.models import ApplicationChecklistItem, OnboardingApplication
from apps.accounts.permissions import IsOwnerOrStaff, IsReviewer
from apps.activity.services import log_activity
from apps.activity.models import ActivityLog

def evaluate_application_progress(application):
    all_items = application.checklist_items.filter(is_mandatory=True)
    
    rejected_exists = Document.objects.filter(
        application=application,
        checklist_item__is_mandatory=True,
        status=Document.Status.REJECTED
    ).exists()

    if rejected_exists:
        if application.status != OnboardingApplication.Status.CORRECTION_REQUIRED:
            application.status = OnboardingApplication.Status.CORRECTION_REQUIRED
            application.save()
            log_activity(
                application=application,
                actor=None,
                action=ActivityLog.Action.CORRECTION_REQUESTED,
                description="Application marked Correction Required due to rejected mandatory document(s)."
            )
        return

    approved_count = Document.objects.filter(
        application=application,
        checklist_item__is_mandatory=True,
        status=Document.Status.APPROVED
    ).count()

    total_mandatory = all_items.count()

    if total_mandatory > 0 and approved_count == total_mandatory:
        if application.status != OnboardingApplication.Status.PENDING_APPROVAL:
            application.status = OnboardingApplication.Status.PENDING_APPROVAL
            application.save()
            log_activity(
                application=application,
                actor=None,
                action=ActivityLog.Action.PENDING_APPROVAL,
                description="All mandatory documents approved. Application moved to Pending Approval."
            )
    else:
        if application.status not in [OnboardingApplication.Status.DRAFT, OnboardingApplication.Status.UNDER_REVIEW]:
            application.status = OnboardingApplication.Status.UNDER_REVIEW
            application.save()

class DocumentUploadView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, checklist_item_id):
        item = get_object_or_404(ApplicationChecklistItem, pk=checklist_item_id)
        application = item.application

        if application.partner != request.user and not request.user.is_staff:
            return Response({"error": "Unauthorized. You can only upload documents to your own application."}, status=status.HTTP_403_FORBIDDEN)

        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file attached. Please attach a file under key 'file'."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_file_extension_and_size(file_obj)
        except ValidationError as e:
            error_msg = e.message if hasattr(e, 'message') else str(e.messages[0])
            return Response({"error": error_msg}, status=status.HTTP_400_BAD_REQUEST)

        existing_doc = Document.objects.filter(checklist_item=item).first()
        if existing_doc and not existing_doc.is_replaceable_by_partner:
            return Response({
                "error": f"Document '{existing_doc.file_name}' has already been APPROVED and cannot be replaced without admin authorization."
            }, status=status.HTTP_400_BAD_REQUEST)

        ext = os.path.splitext(file_obj.name)[1].lower()

        if existing_doc:
            existing_doc.file = file_obj
            existing_doc.file_name = file_obj.name
            existing_doc.file_size = file_obj.size
            existing_doc.file_type = ext
            existing_doc.status = Document.Status.UPLOADED
            existing_doc.save()
            doc_instance = existing_doc

            log_activity(
                application=application,
                actor=request.user,
                action=ActivityLog.Action.DOC_REPLACED,
                description=f"Replaced document for '{item.document_name}' with new file '{file_obj.name}'."
            )
        else:
            doc_instance = Document.objects.create(
                application=application,
                checklist_item=item,
                file=file_obj,
                file_name=file_obj.name,
                file_size=file_obj.size,
                file_type=ext,
                status=Document.Status.UPLOADED
            )

            log_activity(
                application=application,
                actor=request.user,
                action=ActivityLog.Action.DOC_UPLOADED,
                description=f"Uploaded document '{file_obj.name}' for requirement '{item.document_name}'."
            )

        item.status = ApplicationChecklistItem.ItemStatus.PROVIDED
        item.save()

        evaluate_application_progress(application)

        serializer = DocumentSerializer(doc_instance, context={'request': request})
        return Response({
            'message': f"Document '{file_obj.name}' uploaded successfully.",
            'document': serializer.data
        }, status=status.HTTP_201_CREATED)

class DocumentReviewView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsReviewer)

    def patch(self, request, pk):
        document = get_object_or_404(Document, pk=pk)

        if document.application.partner == request.user and not request.user.is_superuser:
            return Response({"error": "Partners cannot review or approve their own documents."}, status=status.HTTP_403_FORBIDDEN)

        review_status = request.data.get('status')
        comment = request.data.get('reviewer_comment', '').strip()

        if review_status not in [Document.Status.APPROVED, Document.Status.REJECTED]:
            return Response({"error": "Review status must be either 'APPROVED' or 'REJECTED'."}, status=status.HTTP_400_BAD_REQUEST)

        if review_status == Document.Status.REJECTED and not comment:
            return Response({"error": "A feedback comment is strictly required when rejecting a document."}, status=status.HTTP_400_BAD_REQUEST)

        document.status = review_status
        document.reviewer_comment = comment
        document.save()

        if review_status == Document.Status.APPROVED:
            document.checklist_item.status = ApplicationChecklistItem.ItemStatus.VERIFIED
            action_type = ActivityLog.Action.DOC_APPROVED
            desc = f"Approved document '{document.checklist_item.document_name}'."
            if comment:
                desc += f" Note: {comment}"
        else:
            document.checklist_item.status = ApplicationChecklistItem.ItemStatus.REJECTED
            action_type = ActivityLog.Action.DOC_REJECTED
            desc = f"Rejected document '{document.checklist_item.document_name}'. Reason: {comment}"

        document.checklist_item.save()

        log_activity(
            application=document.application,
            actor=request.user,
            action=action_type,
            description=desc
        )

        evaluate_application_progress(document.application)

        serializer = DocumentSerializer(document, context={'request': request})
        return Response({
            'message': f"Document marked as '{review_status}'.",
            'document': serializer.data,
            'application_status': document.application.status
        }, status=status.HTTP_200_OK)

class DocumentDetailView(generics.RetrieveAPIView):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrStaff)

class ApplicationDocumentListView(generics.ListAPIView):
    serializer_class = DocumentSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrStaff)

    def get_queryset(self):
        app_id = self.kwargs.get('app_id')
        application = get_object_or_404(OnboardingApplication, pk=app_id)
        self.check_object_permissions(self.request, application)
        return Document.objects.filter(application=application)
