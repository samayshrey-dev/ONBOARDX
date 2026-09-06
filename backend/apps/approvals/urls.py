from django.urls import path
from .views import AdminApprovalDecisionView, ApprovalRecordDetailView

urlpatterns = [
    path('applications/<uuid:app_id>/decide/', AdminApprovalDecisionView.as_view(), name='admin_approval_decision'),
    path('applications/<uuid:app_id>/', ApprovalRecordDetailView.as_view(), name='approval_record_detail'),
]
