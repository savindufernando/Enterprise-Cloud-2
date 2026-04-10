"""Feature flag system for dynamic configuration. ★ Enhancement #12"""

import os
from typing import Any

import structlog

logger = structlog.get_logger()


class FeatureFlags:
    """Manages feature flags via environment variables.

    Allows features to be enabled/disabled without deploying code.
    In a real massive system, this would be backed by LaunchDarkly or Redis.
    For this assignment, reading from ENV is sufficient and proves the concept.
    """

    # Add flags here as they are needed
    DYNAMIC_PRICING = os.getenv("FF_DYNAMIC_PRICING", "false").lower() == "true"
    NEW_BOOKING_FLOW = os.getenv("FF_NEW_BOOKING_FLOW", "false").lower() == "true"
    ENHANCED_BAGGAGE_TRACKING = os.getenv("FF_ENHANCED_BAGGAGE", "false").lower() == "true"
    EXPERIMENTAL_RECOMMENDATIONS = os.getenv("FF_EXPERIMENTAL_RECOMMENDATIONS", "false").lower() == "true"

    @classmethod
    def is_enabled(cls, flag_name: str) -> bool:
        """Check if a specific feature flag is enabled.

        Args:
            flag_name: The name of the flag attribute (e.g., 'DYNAMIC_PRICING')
        """
        if not hasattr(cls, flag_name):
            logger.warning("Unknown feature flag requested", flag_name=flag_name)
            return False
            
        is_enabled = getattr(cls, flag_name)
        return is_enabled
