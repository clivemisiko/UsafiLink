from .models import SystemLog


def log_system_action(action, user=None, details=None, ip_address=None):
    """Create a SystemLog entry for admin actions."""
    if details is None:
        details = {}
    elif not isinstance(details, dict):
        details = {'details': details}

    return SystemLog.objects.create(
        action=action,
        user=user,
        details=details,
        ip_address=ip_address
    )
