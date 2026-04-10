"""JWT handling for generating and verifying tokens."""

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from shared.middleware.error_handler import UnauthorizedError

ALGORITHM = "RS256" # Use asymmetric keys in production


def create_access_token(data: dict, secret_key: str, expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token.
    
    Args:
        data: The payload details (must include 'sub' for subject and 'role')
        secret_key: Private key to sign the token
        expires_delta: Optional expiry duration
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        
    to_encode.update({"exp": expire})
    # For RS256, secret_key should be a PEM-encoded RSA private key
    # If using symmetric HS256 for local dev, secret_key is just a string, and ALGORITHM needs changing
    # We will assume symmetric for simplicity unless specified differently
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm="HS256")
    return encoded_jwt


def verify_token(token: str, secret_key: str) -> dict:
    """Verify and decode a JWT access token.
    
    Args:
        token: The raw JWT string
        secret_key: Public key (or symmetric secret) to verify signature
        
    Raises:
        UnauthorizedError: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        return payload
    except JWTError as e:
        raise UnauthorizedError(f"Could not validate credentials: {str(e)}")
