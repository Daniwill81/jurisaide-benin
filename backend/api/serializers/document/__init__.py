"""
Document Serializers.

Handles serialization of DocumentGenere for API responses.
"""

from datetime import datetime
from typing import Optional

from beanie import PydanticObjectId

from sap.fastapi import ObjectSerializer, WriteObjectSerializer

from api.models.document.document_genere import DocumentGenere


class DocumentSerializer(ObjectSerializer[DocumentGenere]):
    """Read serializer for generated documents."""

    id: PydanticObjectId
    user_id: PydanticObjectId
    dossier_id: PydanticObjectId
    document_type: str
    title: str
    minio_key: str
    download_url: str
    generated_at: datetime


class GenerateDocumentSerializer(WriteObjectSerializer[DocumentGenere]):
    """Write serializer to request document generation."""

    dossier_id: str
    document_type: str  # 'lettre_licenciement' | 'recu_indemnites'
