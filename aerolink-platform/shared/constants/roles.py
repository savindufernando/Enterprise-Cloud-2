"""Role definitions natively across the platform."""

from enum import Enum


class Role(str, Enum):
    """Platform roles for RBAC.
    
    ADMIN: Full system access
    AIRLINE_OPERATOR: Manage flights, cannot create admins or system-level config
    GROUND_STAFF: View passenger manifests, update baggage status
    PASSENGER: Manage own profile and bookings only
    """
    
    ADMIN = "admin"
    AIRLINE_OPERATOR = "airline_operator"
    GROUND_STAFF = "ground_staff"
    PASSENGER = "passenger"

