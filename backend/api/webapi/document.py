"""
Document WebAPI.

Endpoints:
  POST /documents/generer           — generate a new PDF document
  GET  /documents/                  — list all documents for the current user
  GET  /documents/{pk}/download/    — get a fresh presigned download URL
"""

import logging
from typing import Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from api.controllers.document import DOCUMENT_TYPES, generate_document, get_download_url, list_documents
from api.models.enums import RoleEnum
from api.models.user import User
from api.models.user.auth import user_auth
from api.serializers.document import DocumentSerializer

logger = logging.getLogger(__name__)

router = APIRouter()


# ─── Request body ─────────────────────────────────────────────────────────────


class GenerateDocumentRequest(BaseModel):
    dossier_id: str
    document_type: str


class DownloadUrlResponse(BaseModel):
    url: str


# ─── Endpoints ────────────────────────────────────────────────────────────────


@router.post("/generer", status_code=status.HTTP_201_CREATED)
async def generer(
    body: GenerateDocumentRequest,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
) -> DocumentSerializer:
    """Generate a legal PDF document for a given dossier."""
    try:
        logger.info(f"User {request_user.id} requesting '{body.document_type}' " f"for dossier {body.dossier_id}")
        doc = await generate_document(
            dossier_id=body.dossier_id,
            document_type=body.document_type,
            user_id=request_user.id,
        )
        return DocumentSerializer.read(doc)
    except ValueError as e:
        logger.warning(f"Bad request generating document: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating document: {e}", exc_info=True)
        raise


@router.get("/", status_code=status.HTTP_200_OK)
async def listing(
    dossier_id: Optional[str] = Query(None, description="Filter by dossier ID"),
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
) -> list[DocumentSerializer]:
    """List all generated documents for the current user."""
    try:
        docs = await list_documents(user_id=request_user.id, dossier_id=dossier_id)
        return [DocumentSerializer.read(d) for d in docs]
    except Exception as e:
        logger.error(f"Error listing documents: {e}", exc_info=True)
        raise


@router.get("/{pk}/download/", status_code=status.HTTP_200_OK)
async def download(
    pk: str,
    request_user: User = Depends(user_auth.require([RoleEnum.ADMIN, RoleEnum.PUSER])),
) -> DownloadUrlResponse:
    """Return a fresh 1-hour presigned URL for downloading the PDF from MinIO."""
    try:
        url = await get_download_url(document_id=pk, user_id=request_user.id)
        return DownloadUrlResponse(url=url)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching download URL for document {pk}: {e}", exc_info=True)
        raise


@router.get("/types/", status_code=status.HTTP_200_OK)
async def document_types() -> dict:
    """Return the list of available document types."""
    return {"types": [{"key": k, "label": v} for k, v in DOCUMENT_TYPES.items()]}
