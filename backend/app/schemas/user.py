from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class UserBase(BaseModel):
    email: Optional[str] = Field(None, max_length=320)
    display_name: Optional[str] = Field(None, max_length=150)
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    auth_provider: str = Field(..., max_length=50)
    auth_subject: str = Field(..., max_length=255)


class UserUpdate(BaseModel):
    email: Optional[str] = Field(None, max_length=320)
    display_name: Optional[str] = Field(None, max_length=150)
    avatar_url: Optional[str] = None


class UserResponse(UserBase):
    id: UUID
    auth_provider: str
    auth_subject: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
