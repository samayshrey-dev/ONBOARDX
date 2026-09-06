from rest_framework import generics, permissions
from django.shortcuts import get_object_or_404
from .models import ActivityLog
from .serializers import ActivityLogSerializer
from apps.onboarding.models import OnboardingApplication
from apps.accounts.permissions import IsOwnerOrStaff

class ApplicationActivityTimelineView(generics.ListAPIView):
    """
    GET /api/v1/activity/applications/<app_id>/
    Read-only Endpoint: Retrieves chronological activity timeline for an application.
    Partners can only view history for their own application; Reviewers and Admins can view any.
    """
    serializer_class = ActivityLogSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrStaff)

    def get_queryset(self):
        app_id = self.kwargs.get('app_id')
        application = get_object_or_404(OnboardingApplication, pk=app_id)
        self.check_object_permissions(self.request, application)
        return ActivityLog.objects.filter(application=application).order_by('created_at')
