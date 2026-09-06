from django.urls import path
from .views import DocumentUploadView, DocumentReviewView, DocumentDetailView, ApplicationDocumentListView

urlpatterns = [
    path('items/<uuid:checklist_item_id>/upload/', DocumentUploadView.as_view(), name='document_upload'),
    path('<uuid:pk>/review/', DocumentReviewView.as_view(), name='document_review'),
    path('<uuid:pk>/', DocumentDetailView.as_view(), name='document_detail'),
    path('application/<uuid:app_id>/', ApplicationDocumentListView.as_view(), name='application_documents'),
]
