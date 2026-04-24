"""
AppMain.

This package contains configuration for the project.
The `router` list routes URLS to any accessible endpoint for a app.
The router in routes.py is referred as the main router for this app.
"""

from fastapi import APIRouter

from .auth import router as router_auth
from .calcul import router as router_calcul
from .document import router as router_document
from .dossier import router as router_dossier
from .jurisprudence import router as router_jurisprudence
from .user import router as router_user

router_api = APIRouter(redirect_slashes=True)

router_api.include_router(router_auth, prefix="/auth/user_token", tags=["auth"])
router_api.include_router(router_user, prefix="/users", tags=["users"])
router_api.include_router(router_calcul, prefix="/calculations", tags=["calculations"])
router_api.include_router(router_dossier, prefix="/dossiers", tags=["dossiers"])
router_api.include_router(router_document, prefix="/documents", tags=["documents"])
router_api.include_router(router_jurisprudence, prefix="/jurisprudence", tags=["jurisprudence"])
