from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import Blueprint, ChecklistRequirement, OnboardingApplication, ApplicationChecklistItem
from .serializers import (
    BlueprintSerializer,
    ChecklistRequirementSerializer,
    OnboardingApplicationSerializer,
    ApplicationChecklistItemSerializer
)
from apps.accounts.permissions import IsAdminRole, IsReviewer, IsOwnerOrStaff
from apps.activity.services import log_activity
from apps.activity.models import ActivityLog

class ReviewerQueueView(generics.ListAPIView):
    serializer_class = OnboardingApplicationSerializer
    permission_classes = (permissions.IsAuthenticated, IsReviewer)

    def get_queryset(self):
        return OnboardingApplication.objects.filter(
            status__in=[
                OnboardingApplication.Status.SUBMITTED,
                OnboardingApplication.Status.UNDER_REVIEW,
                OnboardingApplication.Status.CORRECTION_REQUIRED,
                OnboardingApplication.Status.PENDING_APPROVAL,
            ]
        ).order_by('-updated_at')

class BlueprintListCreateView(generics.ListCreateAPIView):
    serializer_class = BlueprintSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsAdminRole()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN' or user.is_superuser:
            return Blueprint.objects.all().order_by('-created_at')
        return Blueprint.objects.filter(is_active=True).order_by('-created_at')

class BlueprintDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Blueprint.objects.all()
    serializer_class = BlueprintSerializer

    def get_permissions(self):
        if self.request.method in ['PATCH', 'PUT', 'DELETE']:
            return [permissions.IsAuthenticated(), IsAdminRole()]
        return [permissions.IsAuthenticated()]

class ChecklistRequirementCreateView(generics.CreateAPIView):
    serializer_class = ChecklistRequirementSerializer
    permission_classes = (permissions.IsAuthenticated, IsAdminRole)

    def perform_create(self, serializer):
        blueprint_id = self.kwargs.get('pk')
        blueprint = get_object_or_404(Blueprint, pk=blueprint_id)
        serializer.save(blueprint=blueprint)

class ChecklistRequirementDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ChecklistRequirement.objects.all()
    serializer_class = ChecklistRequirementSerializer
    permission_classes = (permissions.IsAuthenticated, IsAdminRole)

class ApplicationListCreateView(generics.ListCreateAPIView):
    serializer_class = OnboardingApplicationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role in ['REVIEWER', 'ADMIN'] or user.is_staff:
            return OnboardingApplication.objects.all().order_by('-updated_at')
        return OnboardingApplication.objects.filter(partner=user).order_by('-updated_at')

    def perform_create(self, serializer):
        blueprint_id = self.request.data.get('blueprint')
        blueprint = get_object_or_404(Blueprint, pk=blueprint_id)

        application = serializer.save(
            partner=self.request.user,
            blueprint=blueprint,
            status=OnboardingApplication.Status.DRAFT
        )

        for req in blueprint.requirements.all():
            ApplicationChecklistItem.objects.create(
                application=application,
                requirement_source=req,
                document_name=req.document_name,
                description=req.description,
                is_mandatory=req.is_mandatory,
                status=ApplicationChecklistItem.ItemStatus.NOT_PROVIDED
            )

        # LOG TIMELINE ACTIVITY
        log_activity(
            application=application,
            actor=self.request.user,
            action=ActivityLog.Action.CREATED,
            description=f"Created draft onboarding application for '{application.business_name}' under blueprint '{blueprint.title}'."
        )

class ApplicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = OnboardingApplicationSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrStaff)

    def get_queryset(self):
        user = self.request.user
        if user.role in ['REVIEWER', 'ADMIN'] or user.is_staff:
            return OnboardingApplication.objects.all()
        return OnboardingApplication.objects.filter(partner=user)

class ApplicationChecklistView(generics.ListAPIView):
    serializer_class = ApplicationChecklistItemSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrStaff)

    def get_queryset(self):
        app_id = self.kwargs.get('pk')
        application = get_object_or_404(OnboardingApplication, pk=app_id)
        self.check_object_permissions(self.request, application)
        return application.checklist_items.all()

class ApplicationSubmitView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        application = get_object_or_404(OnboardingApplication, pk=pk, partner=request.user)

        if not application.is_editable_by_partner:
            return Response(
                {"error": f"Application '{application.application_number}' is in status '{application.status}' and cannot be submitted."},
                status=status.HTTP_400_BAD_REQUEST
            )

        application.status = OnboardingApplication.Status.SUBMITTED
        application.submitted_at = timezone.now()
        application.save()

        # LOG TIMELINE ACTIVITY
        log_activity(
            application=application,
            actor=request.user,
            action=ActivityLog.Action.SUBMITTED,
            description="Submitted application for compliance document verification."
        )

        return Response({
            'message': 'Application submitted successfully for review.',
            'application': OnboardingApplicationSerializer(application).data
        }, status=status.HTTP_200_OK)
