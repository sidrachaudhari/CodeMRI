import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.connection import get_db
from app.models.models import User
from app.schemas.common import MessageResponse
from app.schemas.workspace_member import (
    WorkspaceMemberCreate,
    WorkspaceMemberResponse,
    WorkspaceMemberUpdate,
)
from app.services.workspace_service import WorkspaceService

router = APIRouter(prefix="/workspaces/{workspace_id}/members", tags=["Workspace Members"])


@router.get(
    "",
    response_model=List[WorkspaceMemberResponse],
    summary="List workspace members",
    description="Returns all registered members of the specified workspace.",
)
def list_workspace_members(
    workspace_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    members = WorkspaceService.list_members(db, workspace_id, current_user)
    return [WorkspaceMemberResponse.model_validate(m) for m in members]


@router.post(
    "",
    response_model=WorkspaceMemberResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add member to workspace",
    description="Adds an existing user to the workspace with the designated role. Restricted to owners and admins.",
)
def add_workspace_member(
    workspace_id: uuid.UUID,
    data: WorkspaceMemberCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = WorkspaceService.add_member(db, workspace_id, current_user, data)
    return WorkspaceMemberResponse.model_validate(member)


@router.patch(
    "/{member_id}",
    response_model=WorkspaceMemberResponse,
    summary="Update member role",
    description="Updates a member's role within the workspace. Restricted to owners and admins.",
)
def update_workspace_member_role(
    workspace_id: uuid.UUID,
    member_id: uuid.UUID,
    data: WorkspaceMemberUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = WorkspaceService.update_member_role(
        db, workspace_id, member_id, current_user, data
    )
    return WorkspaceMemberResponse.model_validate(member)


@router.delete(
    "/{member_id}",
    response_model=MessageResponse,
    summary="Remove workspace member",
    description="Removes a member from the workspace or allows a member to voluntarily leave.",
)
def remove_workspace_member(
    workspace_id: uuid.UUID,
    member_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    WorkspaceService.remove_member(db, workspace_id, member_id, current_user)
    return MessageResponse(message="Workspace member removed successfully")
