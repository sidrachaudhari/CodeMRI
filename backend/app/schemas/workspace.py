import re
from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.workspace_member import WorkspaceMemberResponse


def generate_slug(name: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", name.lower()).strip()
    slug = re.sub(r"[-\s]+", "-", slug)
    return slug[:100]


class WorkspaceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    slug: Optional[str] = Field(None, min_length=1, max_length=100)

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip().lower()
            if not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", v):
                raise ValueError("Slug must contain only lowercase alphanumeric characters and hyphens")
        return v


class WorkspaceCreate(WorkspaceBase):
    pass


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)


class WorkspaceResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    created_by: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    current_user_role: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class WorkspaceDetailResponse(WorkspaceResponse):
    members: List[WorkspaceMemberResponse] = []
