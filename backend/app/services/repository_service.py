import uuid
from typing import List
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
)
from app.models.models import Repository, User, Workspace
from app.schemas.repository import RepositoryCreate, RepositoryUpdate
from app.schemas.workspace_member import WorkspaceRole
from app.services.workspace_service import WorkspaceService


class RepositoryService:
    @classmethod
    def create_repository(
        cls,
        db: Session,
        workspace_id: uuid.UUID,
        current_user: User,
        data: RepositoryCreate,
    ) -> Repository:
        # Require member, admin, or owner role in the workspace
        WorkspaceService.require_role(
            db,
            workspace_id,
            current_user.id,
            [WorkspaceRole.OWNER.value, WorkspaceRole.ADMIN.value, WorkspaceRole.MEMBER.value],
        )

        # Check duplicate name within the workspace
        existing = db.scalar(
            select(Repository).where(
                Repository.workspace_id == workspace_id,
                Repository.name == data.name.strip(),
            )
        )
        if existing:
            raise ConflictException(
                f"A repository named '{data.name}' already exists in this workspace"
            )

        repository = Repository(
            workspace_id=workspace_id,
            created_by=current_user.id,
            name=data.name.strip(),
            description=data.description,
            source_type=data.source_type,
            source_url=data.source_url,
            default_branch=data.default_branch,
            primary_language=data.primary_language,
            build_tool=data.build_tool,
            status=data.status,
        )
        db.add(repository)
        try:
            db.commit()
            db.refresh(repository)
        except Exception as e:
            db.rollback()
            raise BadRequestException(f"Failed to register repository: {e}")

        return repository

    @classmethod
    def list_repositories(
        cls, db: Session, workspace_id: uuid.UUID, current_user: User
    ) -> List[Repository]:
        # Any workspace member can list repositories
        WorkspaceService.require_membership(db, workspace_id, current_user.id)
        stmt = (
            select(Repository)
            .where(Repository.workspace_id == workspace_id)
            .order_by(Repository.created_at.desc())
        )
        return list(db.scalars(stmt).all())

    @classmethod
    def get_repository(
        cls, db: Session, repository_id: uuid.UUID, current_user: User
    ) -> Repository:
        repository = db.get(Repository, repository_id)
        if not repository:
            raise NotFoundException("Repository not found")

        # Verify caller is a member of the repository's workspace
        WorkspaceService.require_membership(db, repository.workspace_id, current_user.id)
        return repository

    @classmethod
    def update_repository(
        cls,
        db: Session,
        repository_id: uuid.UUID,
        current_user: User,
        data: RepositoryUpdate,
    ) -> Repository:
        repository = db.get(Repository, repository_id)
        if not repository:
            raise NotFoundException("Repository not found")

        # Only owners, admins, or members can update repository settings
        WorkspaceService.require_role(
            db,
            repository.workspace_id,
            current_user.id,
            [WorkspaceRole.OWNER.value, WorkspaceRole.ADMIN.value, WorkspaceRole.MEMBER.value],
        )

        update_dict = data.model_dump(exclude_unset=True)
        if "name" in update_dict and update_dict["name"]:
            new_name = update_dict["name"].strip()
            # Check duplicate name in workspace
            existing = db.scalar(
                select(Repository).where(
                    Repository.workspace_id == repository.workspace_id,
                    Repository.name == new_name,
                    Repository.id != repository_id,
                )
            )
            if existing:
                raise ConflictException(
                    f"A repository named '{new_name}' already exists in this workspace"
                )
            repository.name = new_name

        for field, value in update_dict.items():
            if field != "name":
                setattr(repository, field, value)

        try:
            db.commit()
            db.refresh(repository)
        except Exception as e:
            db.rollback()
            raise BadRequestException(f"Failed to update repository: {e}")

        return repository

    @classmethod
    def delete_repository(
        cls, db: Session, repository_id: uuid.UUID, current_user: User
    ) -> None:
        repository = db.get(Repository, repository_id)
        if not repository:
            raise NotFoundException("Repository not found")

        # Only owners or admins can delete repositories
        WorkspaceService.require_role(
            db,
            repository.workspace_id,
            current_user.id,
            [WorkspaceRole.OWNER.value, WorkspaceRole.ADMIN.value],
        )

        try:
            db.delete(repository)
            db.commit()
        except Exception as e:
            db.rollback()
            raise BadRequestException(f"Failed to delete repository: {e}")
