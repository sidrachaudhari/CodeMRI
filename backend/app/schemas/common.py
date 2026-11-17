from typing import Any, Optional
from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseSchema):
    message: str
    detail: Optional[str] = None


class ErrorDetail(BaseSchema):
    code: str
    message: str
    details: Optional[Any] = None


class ErrorResponse(BaseSchema):
    error: ErrorDetail
