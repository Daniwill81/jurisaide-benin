"""
DocumentGenere model.

Tracks PDF documents generated for a dossier (lettre de licenciement,
reçu d'indemnités, etc.), including the MinIO storage key and download URL.
"""

from datetime import datetime
from typing import Optional

from beanie import PydanticObjectId
from pydantic import Field

from sap.beanie import Document


class DocumentGenere(Document):
    """
    A generated legal document (PDF) associated with a dossier.

    Stored in MongoDB so users can retrieve and re-download their documents
    without regenerating them.
    """

    # ─── Ownership ────────────────────────────────────────────────
    user_id: PydanticObjectId
    dossier_id: PydanticObjectId

    # ─── Document metadata ────────────────────────────────────────
    document_type: str  # 'lettre_licenciement' | 'recu_indemnites'
    title: str

    # ─── MinIO storage ────────────────────────────────────────────
    minio_key: str  # e.g. documents/<user_id>/<dossier_id>/lettre.pdf
    download_url: str  # Full MinIO/presigned URL

    # ─── Timestamps ───────────────────────────────────────────────
    generated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "documents_generes"
        indexes = [
            "user_id",
            "dossier_id",
        ]
