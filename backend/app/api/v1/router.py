from fastapi import APIRouter
from app.api.v1.endpoints.members import router as members_router
from app.api.v1.endpoints.repositories import (
    repositories_router,
    workspace_repositories_router,
)
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.workspaces import router as workspaces_router

api_router = APIRouter()

# Include workspace management
api_router.include_router(workspaces_router)
# Include workspace members
api_router.include_router(members_router)
# Include workspace repositories
api_router.include_router(workspace_repositories_router)
# Include direct repositories
api_router.include_router(repositories_router)
# Include user profile
api_router.include_router(users_router)
