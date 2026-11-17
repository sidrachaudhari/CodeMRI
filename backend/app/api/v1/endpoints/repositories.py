import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.connection import get_db
from app.models.models import User
from app.schemas.common import MessageResponse
from app.schemas.repository import (
    RepositoryCreate,
    RepositoryResponse,
    RepositoryUpdate,
)
from app.services.repository_service import RepositoryService

# Router for workspace-nested repository routes
workspace_repositories_router = APIRouter(
    prefix="/workspaces/{workspace_id}/repositories",
    tags=["Repositories"],
)

# Router for direct repository routes
repositories_router = APIRouter(
    prefix="/repositories",
    tags=["Repositories"],
)


@workspace_repositories_router.post(
    "",
    response_model=RepositoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register repository in workspace",
    description="Registers a new Java repository under the specified workspace. Restricted to owners, admins, and members.",
)
def create_repository(
    workspace_id: uuid.UUID,
    data: RepositoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = RepositoryService.create_repository(db, workspace_id, current_user, data)
    return RepositoryResponse.model_validate(repo)


@workspace_repositories_router.get(
    "",
    response_model=List[RepositoryResponse],
    summary="List workspace repositories",
    description="Returns all repositories registered within the workspace. Accessible to all workspace members.",
)
def list_workspace_repositories(
    workspace_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repos = RepositoryService.list_repositories(db, workspace_id, current_user)
    return [RepositoryResponse.model_validate(r) for r in repos]


@repositories_router.get(
    "/{repository_id}",
    response_model=RepositoryResponse,
    summary="Get repository details",
    description="Retrieves repository metadata. Access is restricted to members of the parent workspace.",
)
def get_repository(
    repository_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = RepositoryService.get_repository(db, repository_id, current_user)
    return RepositoryResponse.model_validate(repo)


@repositories_router.patch(
    "/{repository_id}",
    response_model=RepositoryResponse,
    summary="Update repository",
    description="Updates repository settings. Restricted to owners, admins, and members of the parent workspace.",
)
def update_repository(
    repository_id: uuid.UUID,
    data: RepositoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = RepositoryService.update_repository(db, repository_id, current_user, data)
    return RepositoryResponse.model_validate(repo)


@repositories_router.delete(
    "/{repository_id}",
    response_model=MessageResponse,
    summary="Delete repository",
    description="Permanently deletes the repository and its analyses. Restricted to workspace owners and admins.",
)
def delete_repository(
    repository_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    RepositoryService.delete_repository(db, repository_id, current_user)
    return MessageResponse(message="Repository deleted successfully")
