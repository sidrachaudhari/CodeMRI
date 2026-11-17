import uuid
from typing import List, Optional, Tuple
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
)
from app.models.models import User, Workspace, WorkspaceMember
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate, generate_slug
from app.schemas.workspace_member import WorkspaceMemberCreate, WorkspaceMemberUpdate, WorkspaceRole


class WorkspaceService:
    @staticmethod
    def get_user_member(
        db: Session, workspace_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[WorkspaceMember]:
        stmt = select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
        return db.scalar(stmt)

    @classmethod
    def require_membership(
        cls, db: Session, workspace_id: uuid.UUID, user_id: uuid.UUID
    ) -> WorkspaceMember:
        member = cls.get_user_member(db, workspace_id, user_id)
        if not member:
            # Check if workspace exists
            ws = db.get(Workspace, workspace_id)
            if not ws:
                raise NotFoundException("Workspace not found")
            raise ForbiddenException("You are not a member of this workspace")
        return member

    @classmethod
    def require_role(
        cls,
        db: Session,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        allowed_roles: List[str],
    ) -> WorkspaceMember:
        member = cls.require_membership(db, workspace_id, user_id)
        if member.role not in allowed_roles:
            raise ForbiddenException(
                f"Action requires one of the following roles: {', '.join(allowed_roles)}"
            )
        return member

    @classmethod
    def create_workspace(
        cls, db: Session, current_user: User, data: WorkspaceCreate
    ) -> Workspace:
        slug = data.slug or generate_slug(data.name)
        if not slug:
            slug = f"workspace-{uuid.uuid4().hex[:8]}"

        # Ensure slug uniqueness
        existing = db.scalar(select(Workspace).where(Workspace.slug == slug))
        if existing:
            slug = f"{slug}-{uuid.uuid4().hex[:6]}"

        workspace = Workspace(
            name=data.name.strip(),
            slug=slug,
            created_by=current_user.id,
        )
        db.add(workspace)
        db.flush()  # Generate workspace.id

        # Creator automatically becomes the initial owner
        membership = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=current_user.id,
            role=WorkspaceRole.OWNER.value,
        )
        db.add(membership)

        try:
            db.commit()
            db.refresh(workspace)
        except Exception as e:
            db.rollback()
            raise BadRequestException(f"Failed to create workspace: {e}")

        return workspace

    @classmethod
    def list_workspaces(cls, db: Session, current_user: User) -> List[Tuple[Workspace, str]]:
        stmt = (
            select(Workspace, WorkspaceMember.role)
            .join(WorkspaceMember, Workspace.id == WorkspaceMember.workspace_id)
            .where(WorkspaceMember.user_id == current_user.id)
            .order_by(Workspace.created_at.desc())
        )
        results = db.execute(stmt).all()
        return [(row[0], row[1]) for row in results]

    @classmethod
    def get_workspace_details(
        cls, db: Session, workspace_id: uuid.UUID, current_user: User
    ) -> Tuple[Workspace, str]:
        member = cls.require_membership(db, workspace_id, current_user.id)
        stmt = (
            select(Workspace)
            .options(joinedload(Workspace.members).joinedload(WorkspaceMember.user))
            .where(Workspace.id == workspace_id)
        )
        workspace = db.scalar(stmt)
        if not workspace:
            raise NotFoundException("Workspace not found")
        return workspace, member.role

    @classmethod
    def update_workspace(
        cls,
        db: Session,
        workspace_id: uuid.UUID,
        current_user: User,
        data: WorkspaceUpdate,
    ) -> Workspace:
        cls.require_role(db, workspace_id, current_user.id, [WorkspaceRole.OWNER.value, WorkspaceRole.ADMIN.value])
        workspace = db.get(Workspace, workspace_id)
        if not workspace:
            raise NotFoundException("Workspace not found")

        if data.name is not None and data.name.strip():
            workspace.name = data.name.strip()

        try:
            db.commit()
            db.refresh(workspace)
        except Exception as e:
            db.rollback()
            raise BadRequestException(f"Failed to update workspace: {e}")

        return workspace

    @classmethod
    def delete_workspace(
        cls, db: Session, workspace_id: uuid.UUID, current_user: User
    ) -> None:
        cls.require_role(db, workspace_id, current_user.id, [WorkspaceRole.OWNER.value])
        workspace = db.get(Workspace, workspace_id)
        if not workspace:
            raise NotFoundException("Workspace not found")

        try:
            db.delete(workspace)
            db.commit()
        except Exception as e:
            db.rollback()
            raise BadRequestException(f"Failed to delete workspace: {e}")

    # --- Membership Management ---

    @classmethod
    def list_members(
        cls, db: Session, workspace_id: uuid.UUID, current_user: User
    ) -> List[WorkspaceMember]:
        cls.require_membership(db, workspace_id, current_user.id)
        stmt = (
            select(WorkspaceMember)
            .options(joinedload(WorkspaceMember.user))
            .where(WorkspaceMember.workspace_id == workspace_id)
            .order_by(WorkspaceMember.joined_at.asc())
        )
        return list(db.scalars(stmt).all())

    @classmethod
    def add_member(
        cls,
        db: Session,
        workspace_id: uuid.UUID,
        current_user: User,
        data: WorkspaceMemberCreate,
    ) -> WorkspaceMember:
        cls.require_role(db, workspace_id, current_user.id, [WorkspaceRole.OWNER.value, WorkspaceRole.ADMIN.value])

        target_user = db.get(User, data.user_id)
        if not target_user:
            raise NotFoundException("Target user not found")

        existing = cls.get_user_member(db, workspace_id, data.user_id)
        if existing:
            raise ConflictException("User is already a member of this workspace")

        membership = WorkspaceMember(
            workspace_id=workspace_id,
            user_id=data.user_id,
            role=data.role.value,
        )
        db.add(membership)
        try:
            db.commit()
            db.refresh(membership)
        except Exception as e:
            db.rollback()
            raise BadRequestException(f"Failed to add workspace member: {e}")

        return membership

    @classmethod
    def update_member_role(
        cls,
        db: Session,
        workspace_id: uuid.UUID,
        member_id: uuid.UUID,
        current_user: User,
        data: WorkspaceMemberUpdate,
    ) -> WorkspaceMember:
        caller_member = cls.require_role(
            db, workspace_id, current_user.id, [WorkspaceRole.OWNER.value, WorkspaceRole.ADMIN.value]
        )

        target_member = db.get(WorkspaceMember, member_id)
        if not target_member or target_member.workspace_id != workspace_id:
            raise NotFoundException("Workspace member not found")

        # Members cannot escalate their own privilege
        if target_member.user_id == current_user.id:
            raise ForbiddenException("You cannot modify your own role")

        # Admin cannot alter an owner
        if target_member.role == WorkspaceRole.OWNER.value and caller_member.role != WorkspaceRole.OWNER.value:
            raise ForbiddenException("Only workspace owners can alter another owner's role")

        # Check if demoting the only owner
        if target_member.role == WorkspaceRole.OWNER.value and data.role != WorkspaceRole.OWNER:
            owner_count = db.scalar(
                select(WorkspaceMember)
                .where(
                    WorkspaceMember.workspace_id == workspace_id,
                    WorkspaceMember.role == WorkspaceRole.OWNER.value,
                )
            )
            if owner_count == 1:
                raise BadRequestException("Cannot demote the sole owner of a workspace")

        target_member.role = data.role.value
        try:
            db.commit()
            db.refresh(target_member)
        except Exception as e:
            db.rollback()
            raise BadRequestException(f"Failed to update member role: {e}")

        return target_member

    @classmethod
    def remove_member(
        cls,
        db: Session,
        workspace_id: uuid.UUID,
        member_id: uuid.UUID,
        current_user: User,
    ) -> None:
        caller_member = cls.require_membership(db, workspace_id, current_user.id)
        target_member = db.get(WorkspaceMember, member_id)
        if not target_member or target_member.workspace_id != workspace_id:
            raise NotFoundException("Workspace member not found")

        # Allow if caller is owner/admin OR if caller is removing themselves (leaving)
        is_self = target_member.user_id == current_user.id
        is_manager = caller_member.role in [WorkspaceRole.OWNER.value, WorkspaceRole.ADMIN.value]

        if not (is_self or is_manager):
            raise ForbiddenException("You do not have permission to remove this member")

        # Prevent removing sole owner
        if target_member.role == WorkspaceRole.OWNER.value:
            owners = db.scalars(
                select(WorkspaceMember).where(
                    WorkspaceMember.workspace_id == workspace_id,
                    WorkspaceMember.role == WorkspaceRole.OWNER.value,
                )
            ).all()
            if len(owners) <= 1:
                raise BadRequestException("Cannot remove the sole owner of the workspace")

        try:
            db.delete(target_member)
            db.commit()
        except Exception as e:
            db.rollback()
            raise BadRequestException(f"Failed to remove member: {e}")
