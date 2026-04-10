"""Role-Based Access Control wrapper for FastAPI.

Secures routes based on user role embedded in JWT.
"""

from functools import wraps
from typing import Any

from fastapi import Depends, Request
from pydantic import BaseModel

from shared.constants.roles import Role
from shared.middleware.error_handler import ForbiddenError, UnauthorizedError


class CurrentUser(BaseModel):
    id: str
    email: str
    role: Role


def require_roles(*allowed_roles: Role):
    """Decorator to enforce RBAC on specific endpoints.
    
    Requires a `current_user: CurrentUser` to be provided either dynamically
    by a Depends() or injected via middleware.
    
    Usage:
        @router.post("/flights")
        @require_roles(Role.ADMIN, Role.AIRLINE_OPERATOR)
        async def create_flight(request: Request, current_user: CurrentUser = Depends(get_current_user)):
            ...
    """
    def decorator(func: Any) -> Any:
        @wraps(func)
        async def wrapper(*args: Any, current_user: CurrentUser | None = None, **kwargs: Any) -> Any:
            
            # If current_user isn't injected, we can't authorize
            if current_user is None:
                raise UnauthorizedError("Authentication required")

            if current_user.role not in allowed_roles:
                raise ForbiddenError(f"Role {current_user.role} does not have access to this resource")
                
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator
