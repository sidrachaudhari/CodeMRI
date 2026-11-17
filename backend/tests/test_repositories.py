import unittest
from app.core.exceptions import ConflictException, ForbiddenException, NotFoundException
from app.models.models import Repository
from app.schemas.repository import RepositoryCreate, RepositoryUpdate
from app.schemas.workspace import WorkspaceCreate
from app.schemas.workspace_member import WorkspaceMemberCreate, WorkspaceRole
from app.services.repository_service import RepositoryService
from app.services.workspace_service import WorkspaceService
from tests.test_base import BaseTestCase


class TestRepositoryService(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.owner = self.create_test_user(display_name="Repo Owner")
        self.member = self.create_test_user(display_name="Repo Member")
        self.viewer = self.create_test_user(display_name="Repo Viewer")
        self.outsider = self.create_test_user(display_name="Outsider")

        # Create base workspace
        self.ws = WorkspaceService.create_workspace(
            self.db, self.owner, WorkspaceCreate(name="Spring Projects", slug="spring-projects")
        )

        # Add member and viewer
        WorkspaceService.add_member(
            self.db, self.ws.id, self.owner, WorkspaceMemberCreate(user_id=self.member.id, role=WorkspaceRole.MEMBER)
        )
        WorkspaceService.add_member(
            self.db, self.ws.id, self.owner, WorkspaceMemberCreate(user_id=self.viewer.id, role=WorkspaceRole.VIEWER)
        )

    def test_create_repository_success(self):
        """Verify repository creation by member sets correct attributes."""
        data = RepositoryCreate(
            name="spring-petclinic",
            description="Sample Spring Boot reference application",
            source_url="https://github.com/spring-projects/spring-petclinic.git",
            default_branch="main",
            primary_language="Java",
            build_tool="Maven",
        )
        repo = RepositoryService.create_repository(self.db, self.ws.id, self.member, data)

        self.assertIsNotNone(repo.id)
        self.assertEqual(repo.workspace_id, self.ws.id)
        self.assertEqual(repo.created_by, self.member.id)
        self.assertEqual(repo.name, "spring-petclinic")
        self.assertEqual(repo.primary_language, "Java")
        self.assertEqual(repo.build_tool, "Maven")

    def test_create_repository_duplicate_rejected(self):
        """Verify duplicate repository name in same workspace is rejected with ConflictException."""
        data = RepositoryCreate(name="unique-repo")
        RepositoryService.create_repository(self.db, self.ws.id, self.owner, data)

        with self.assertRaises(ConflictException):
            RepositoryService.create_repository(self.db, self.ws.id, self.owner, data)

    def test_viewer_cannot_create_repository(self):
        """Verify viewer role cannot register a repository in workspace."""
        data = RepositoryCreate(name="unauthorized-repo")
        with self.assertRaises(ForbiddenException):
            RepositoryService.create_repository(self.db, self.ws.id, self.viewer, data)

    def test_list_repositories(self):
        """Verify workspace members can list repositories."""
        repo1 = RepositoryService.create_repository(
            self.db, self.ws.id, self.owner, RepositoryCreate(name="repo-1")
        )
        repo2 = RepositoryService.create_repository(
            self.db, self.ws.id, self.owner, RepositoryCreate(name="repo-2")
        )

        repos = RepositoryService.list_repositories(self.db, self.ws.id, self.viewer)
        self.assertEqual(len(repos), 2)
        repo_names = {r.name for r in repos}
        self.assertEqual(repo_names, {"repo-1", "repo-2"})

    def test_cross_workspace_isolation(self):
        """Verify users outside workspace cannot access or view repositories."""
        repo = RepositoryService.create_repository(
            self.db, self.ws.id, self.owner, RepositoryCreate(name="secret-repo")
        )

        with self.assertRaises(ForbiddenException):
            RepositoryService.get_repository(self.db, repo.id, self.outsider)

        with self.assertRaises(ForbiddenException):
            RepositoryService.update_repository(
                self.db, repo.id, self.outsider, RepositoryUpdate(name="renamed")
            )

    def test_update_repository(self):
        """Verify repository update modifies permitted fields."""
        repo = RepositoryService.create_repository(
            self.db, self.ws.id, self.owner, RepositoryCreate(name="legacy-app", build_tool="Ant")
        )

        updated = RepositoryService.update_repository(
            self.db, repo.id, self.member, RepositoryUpdate(name="modern-app", build_tool="Gradle")
        )
        self.assertEqual(updated.name, "modern-app")
        self.assertEqual(updated.build_tool, "Gradle")

    def test_delete_repository_permissions(self):
        """Verify only owner/admin can delete a repository, regular member cannot."""
        repo = RepositoryService.create_repository(
            self.db, self.ws.id, self.owner, RepositoryCreate(name="to-delete")
        )

        # Member cannot delete
        with self.assertRaises(ForbiddenException):
            RepositoryService.delete_repository(self.db, repo.id, self.member)

        # Owner succeeds
        RepositoryService.delete_repository(self.db, repo.id, self.owner)
        self.assertIsNone(self.db.get(Repository, repo.id))


if __name__ == "__main__":
    unittest.main()
