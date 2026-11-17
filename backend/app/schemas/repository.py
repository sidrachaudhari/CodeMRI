from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


class RepositoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    source_type: str = Field(default="github", max_length=30)
    source_url: Optional[str] = None
    default_branch: str = Field(default="main", max_length=255)
    primary_language: str = Field(default="Java", max_length=50)
    build_tool: Optional[str] = Field(None, max_length=30)
    status: str = Field(default="active", max_length=30)

    @field_validator("source_url")
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        if v:
            v = v.strip()
            if not (v.startswith("http://") or v.startswith("https://") or v.startswith("git@")):
                raise ValueError("source_url must be a valid HTTP, HTTPS, or SSH git URL")
        return v


class RepositoryCreate(RepositoryBase):
    pass


class RepositoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    source_type: Optional[str] = Field(None, max_length=30)
    source_url: Optional[str] = None
    default_branch: Optional[str] = Field(None, max_length=255)
    primary_language: Optional[str] = Field(None, max_length=50)
    build_tool: Optional[str] = Field(None, max_length=30)
    status: Optional[str] = Field(None, max_length=30)


class RepositoryResponse(RepositoryBase):
    id: UUID
    workspace_id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
