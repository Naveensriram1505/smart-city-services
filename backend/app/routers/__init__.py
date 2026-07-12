from .auth import router as auth_router
from .complaints import router as complaints_router
from .services import router as services_router
from .ai import router as ai_router

__all__ = ["auth_router", "complaints_router", "services_router", "ai_router"]
