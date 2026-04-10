"""Pagination helper struct. ★ Enhancement #9"""

from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class PaginationMeta(BaseModel):
    """Metadata for a paginated response."""
    page: int = Field(..., ge=1, description="Current page number")
    limit: int = Field(..., ge=1, description="Number of items per page")
    total_items: int = Field(..., ge=0, description="Total number of items across all pages")
    total_pages: int = Field(..., ge=0, description="Total number of pages")


class PaginatedResponse(BaseModel, Generic[T]):
    """Standardized generic wrapper for paginated API responses.
    
    Usage:
        @router.get("/", response_model=PaginatedResponse[FlightResponse])
    """
    data: list[T]
    pagination: PaginationMeta

    model_config = ConfigDict(extra="forbid")

    @classmethod
    def create(cls, items: list[T], total: int, page: int, limit: int) -> "PaginatedResponse[T]":
        """Helper to create a PaginatedResponse instance."""
        total_pages = (total + limit - 1) // limit if limit > 0 else 0
        return cls(
            data=items,
            pagination=PaginationMeta(
                page=page,
                limit=limit,
                total_items=total,
                total_pages=total_pages,
            ),
        )
