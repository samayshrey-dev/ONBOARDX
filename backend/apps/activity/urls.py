from django.urls import path
from .views import ApplicationActivityTimelineView

urlpatterns = [
    path('applications/<uuid:app_id>/', ApplicationActivityTimelineView.as_view(), name='application_activity_timeline'),
]
