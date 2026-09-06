from django.urls import path
from .views import (
    BlueprintListCreateView,
    BlueprintDetailView,
    ChecklistRequirementCreateView,
    ChecklistRequirementDetailView,
    ApplicationListCreateView,
    ApplicationDetailView,
    ApplicationChecklistView,
    ApplicationSubmitView,
    ReviewerQueueView
)

urlpatterns = [
    # Reviewer Queue Endpoint
    path('reviewer/queue/', ReviewerQueueView.as_view(), name='reviewer_queue'),

    # Blueprint Master Template Endpoints
    path('blueprints/', BlueprintListCreateView.as_view(), name='blueprint_list_create'),
    path('blueprints/<uuid:pk>/', BlueprintDetailView.as_view(), name='blueprint_detail'),
    path('blueprints/<uuid:pk>/requirements/', ChecklistRequirementCreateView.as_view(), name='requirement_create'),
    path('requirements/<uuid:pk>/', ChecklistRequirementDetailView.as_view(), name='requirement_detail'),

    # Application Instance Endpoints
    path('applications/', ApplicationListCreateView.as_view(), name='application_list_create'),
    path('applications/<uuid:pk>/', ApplicationDetailView.as_view(), name='application_detail'),
    path('applications/<uuid:pk>/checklist/', ApplicationChecklistView.as_view(), name='application_checklist'),
    path('applications/<uuid:pk>/submit/', ApplicationSubmitView.as_view(), name='application_submit'),
]
