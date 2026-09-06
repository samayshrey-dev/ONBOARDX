from .models import ActivityLog

def log_activity(application, actor, action, description):
    """
    Utility helper to record a timeline activity log for an application.
    """
    return ActivityLog.objects.create(
        application=application,
        actor=actor,
        action=action,
        description=description
    )
