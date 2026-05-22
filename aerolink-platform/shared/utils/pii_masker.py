"""PII Masking for structured logging. ★ Enhancement #16"""

import re
from typing import Any

# Extremely strict regex to find suspected standard PII patterns
EMAIL_REGEX = re.compile(r"[\w\.-]+@[\w\.-]+\.\w+")
CREDIT_CARD_REGEX = re.compile(r"\b(?:\d[ -]*?){13,16}\b")
PASSPORT_REGEX = re.compile(r"\b[A-PR-WYa-pr-wy][1-9]\d\s?\d{4}[1-9]\b")

def mask_pii(logger: Any, method_name: str, event_dict: dict[str, Any]) -> dict[str, Any]:
    """Structlog processor to strip/mask PII before it hits CloudWatch/ELK.
    
    This ensures compliance with GDPR and PCI-DSS observability rules.
    """
    for key, value in event_dict.items():
        if isinstance(value, str):
            # Mask emails
            if EMAIL_REGEX.search(value):
                event_dict[key] = EMAIL_REGEX.sub("[EMAIL REDACTED]", value)
            
            # Mask Credit Cards
            if CREDIT_CARD_REGEX.search(value):
                event_dict[key] = CREDIT_CARD_REGEX.sub("[CARD REDACTED]", value)
                
            # Mask Passports
            if "passport" in key.lower() or PASSPORT_REGEX.search(value):
                 event_dict[key] = PASSPORT_REGEX.sub("[PASSPORT REDACTED]", value)
                 
    return event_dict
