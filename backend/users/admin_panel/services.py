from .models import SystemLog


def normalize_ip_address(ip_address):
    """Return a single IP address from proxy headers such as X-Forwarded-For."""
    if not ip_address:
        return None
    if isinstance(ip_address, str):
        ip_address = ip_address.split(',')[0].strip()
    return ip_address or None


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
        ip_address=normalize_ip_address(ip_address)
    )
