from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.connection import get_db
from app.models.models import User
from app.schemas.user import UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
    description="Returns the authenticated user's internal CodeMRI identity and profile information.",
)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    return UserResponse.model_validate(current_user)
