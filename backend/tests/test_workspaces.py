import unittest
import uuid
from app.core.exceptions import ConflictException, ForbiddenException, NotFoundException, BadRequestException
from app.models.models import Workspace, WorkspaceMember
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate
from app.schemas.workspace_member import WorkspaceMemberCreate, WorkspaceMemberUpdate, WorkspaceRole
from app.services.workspace_service import WorkspaceService
from tests.test_base import BaseTestCase


class TestWorkspaceService(BaseTestCase):
    def test_create_workspace(self):
        """Verify workspace creation sets user as owner and creates membership."""
        user = self.create_test_user(display_name="Owner User")
        data = WorkspaceCreate(name="Core Java Engine", slug="core-java-engine")
        ws = WorkspaceService.create_workspace(self.db, user, data)

        self.assertIsNotNone(ws.id)
        self.assertEqual(ws.name, "Core Java Engine")
        self.assertEqual(ws.slug, "core-java-engine")
        self.assertEqual(ws.created_by, user.id)

        # Check membership
        member = WorkspaceService.get_user_member(self.db, ws.id, user.id)
        self.assertIsNotNone(member)
        self.assertEqual(member.role, WorkspaceRole.OWNER.value)

    def test_list_workspaces(self):
        """Verify workspace listing returns only workspaces where user is member."""
        user1 = self.create_test_user(display_name="User 1")
        user2 = self.create_test_user(display_name="User 2")

        ws1 = WorkspaceService.create_workspace(self.db, user1, WorkspaceCreate(name="WS 1"))
        ws2 = WorkspaceService.create_workspace(self.db, user2, WorkspaceCreate(name="WS 2"))

        workspaces_u1 = WorkspaceService.list_workspaces(self.db, user1)
        self.assertEqual(len(workspaces_u1), 1)
        self.assertEqual(workspaces_u1[0][0].id, ws1.id)
        self.assertEqual(workspaces_u1[0][1], "owner")

    def test_workspace_access_restrictions(self):
        """Verify non-members are forbidden from accessing or updating workspaces."""
        owner = self.create_test_user(display_name="Owner")
        outsider = self.create_test_user(display_name="Outsider")
        ws = WorkspaceService.create_workspace(self.db, owner, WorkspaceCreate(name="Private WS"))

        with self.assertRaises(ForbiddenException):
            WorkspaceService.get_workspace_details(self.db, ws.id, outsider)

        with self.assertRaises(ForbiddenException):
            WorkspaceService.update_workspace(
                self.db, ws.id, outsider, WorkspaceUpdate(name="Hacked Name")
            )

    def test_update_workspace(self):
        """Verify owners can update workspace metadata."""
        owner = self.create_test_user(display_name="Owner")
        ws = WorkspaceService.create_workspace(self.db, owner, WorkspaceCreate(name="Old Name"))

        updated = WorkspaceService.update_workspace(
            self.db, ws.id, owner, WorkspaceUpdate(name="New Name")
        )
        self.assertEqual(updated.name, "New Name")

    def test_delete_workspace_only_by_owner(self):
        """Verify only owner can delete workspace, admin cannot."""
        owner = self.create_test_user(display_name="Owner")
        admin = self.create_test_user(display_name="Admin")
        ws = WorkspaceService.create_workspace(self.db, owner, WorkspaceCreate(name="Delete Test"))

        # Add admin
        WorkspaceService.add_member(
            self.db, ws.id, owner, WorkspaceMemberCreate(user_id=admin.id, role=WorkspaceRole.ADMIN)
        )

        with self.assertRaises(ForbiddenException):
            WorkspaceService.delete_workspace(self.db, ws.id, admin)

        # Owner succeeds
        WorkspaceService.delete_workspace(self.db, ws.id, owner)
        self.assertIsNone(self.db.get(Workspace, ws.id))

    def test_membership_management(self):
        """Verify member addition, role update, and self-escalation restrictions."""
        owner = self.create_test_user(display_name="Owner")
        member_user = self.create_test_user(display_name="Member")
        ws = WorkspaceService.create_workspace(self.db, owner, WorkspaceCreate(name="Team WS"))

        # Add member
        member = WorkspaceService.add_member(
            self.db, ws.id, owner, WorkspaceMemberCreate(user_id=member_user.id, role=WorkspaceRole.MEMBER)
        )
        self.assertEqual(member.role, "member")

        # Duplicate addition raises ConflictException
        with self.assertRaises(ConflictException):
            WorkspaceService.add_member(
                self.db, ws.id, owner, WorkspaceMemberCreate(user_id=member_user.id, role=WorkspaceRole.MEMBER)
            )

        # Member cannot escalate their own role
        with self.assertRaises(ForbiddenException):
            WorkspaceService.update_member_role(
                self.db, ws.id, member.id, member_user, WorkspaceMemberUpdate(role=WorkspaceRole.OWNER)
            )

        # Owner can promote member to admin
        promoted = WorkspaceService.update_member_role(
            self.db, ws.id, member.id, owner, WorkspaceMemberUpdate(role=WorkspaceRole.ADMIN)
        )
        self.assertEqual(promoted.role, "admin")

        # Cannot remove sole owner
        owner_member = WorkspaceService.get_user_member(self.db, ws.id, owner.id)
        with self.assertRaises(BadRequestException):
            WorkspaceService.remove_member(self.db, ws.id, owner_member.id, owner)


if __name__ == "__main__":
    unittest.main()
