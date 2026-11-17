import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.connection import get_db
from app.models.models import User
from app.schemas.common import MessageResponse
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceDetailResponse,
    WorkspaceResponse,
    WorkspaceUpdate,
)
from app.services.workspace_service import WorkspaceService

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


@router.post(
    "",
    response_model=WorkspaceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new workspace",
    description="Creates a new workspace, assigning the authenticated user as its owner.",
)
def create_workspace(
    data: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workspace = WorkspaceService.create_workspace(db, current_user, data)
    res = WorkspaceResponse.model_validate(workspace)
    res.current_user_role = "owner"
    return res


@router.get(
    "",
    response_model=List[WorkspaceResponse],
    summary="List accessible workspaces",
    description="Returns all workspaces where the authenticated user is a member.",
)
def list_workspaces(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workspaces = WorkspaceService.list_workspaces(db, current_user)
    output = []
    for ws, role in workspaces:
        item = WorkspaceResponse.model_validate(ws)
        item.current_user_role = role
        output.append(item)
    return output


@router.get(
    "/{workspace_id}",
    response_model=WorkspaceDetailResponse,
    summary="Get workspace details",
    description="Returns workspace information and member roster for authorized members.",
)
def get_workspace(
    workspace_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ws, role = WorkspaceService.get_workspace_details(db, workspace_id, current_user)
    res = WorkspaceDetailResponse.model_validate(ws)
    res.current_user_role = role
    return res


@router.patch(
    "/{workspace_id}",
    response_model=WorkspaceResponse,
    summary="Update workspace",
    description="Updates workspace metadata. Restricted to workspace owners and admins.",
)
def update_workspace(
    workspace_id: uuid.UUID,
    data: WorkspaceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ws = WorkspaceService.update_workspace(db, workspace_id, current_user, data)
    return WorkspaceResponse.model_validate(ws)


@router.delete(
    "/{workspace_id}",
    response_model=MessageResponse,
    summary="Delete workspace",
    description="Permanently deletes a workspace and all cascaded resources. Restricted to owners.",
)
def delete_workspace(
    workspace_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    WorkspaceService.delete_workspace(db, workspace_id, current_user)
    return MessageResponse(message="Workspace deleted successfully")
