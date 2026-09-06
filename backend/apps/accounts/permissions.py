from rest_framework import permissions

class IsPartner(permissions.BasePermission):
    """
    Allows access only to authenticated users with the 'PARTNER' role.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'PARTNER'
        )

class IsReviewer(permissions.BasePermission):
    """
    Allows access to Reviewers or Admins.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role in ['REVIEWER', 'ADMIN'] or request.user.is_superuser)
        )

class IsAdminRole(permissions.BasePermission):
    """
    Allows access only to Admins or Superusers.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'ADMIN' or request.user.is_superuser)
        )

class IsOwnerOrStaff(permissions.BasePermission):
    """
    Object-level permission allowing users to access their own object,
    while allowing Reviewers and Admins to inspect any object.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        # Reviewers and Admins can view any object
        if request.user.role in ['REVIEWER', 'ADMIN'] or request.user.is_superuser:
            return True

        # Partners can only view/modify their own object
        if hasattr(obj, 'partner'):
            return obj.partner == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return obj == request.user
