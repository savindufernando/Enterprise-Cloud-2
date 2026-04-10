"""Liveness probe logic for Kubernetes. ★ Enhancement #15"""

from datetime import datetime, timezone
from typing import Any


async def check_liveness() -> dict[str, Any]:
    """Execute liveness checks.
    
    Liveness indicates if the container is alive. If this fails, K8s will RESTART the pod.
    Therefore, this should only check internal state (is the event loop blocked?), 
    NOT external dependencies like the database.
    """
    return {
        "status": "alive",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
