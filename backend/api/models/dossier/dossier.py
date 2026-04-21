from datetime import datetime
from typing import List, Optional

from beanie import Document, Link, PydanticObjectId
from pydantic import Field

from api.models.calcul import CalculationRequest

from ._embedded import DisputeDetails, WorkHistory


class Dossier(Document):
    """
    Lawyer/User Case file (Dossier).

    A dossier groups calculation requests, work history and dispute details
    related to a specific case.
    """

    title: str
    description: Optional[str] = None
    status: str = Field(default="ouvert")  # ouvert, fermé, archivé
    user_id: PydanticObjectId

    # Relationships
    calculation_requests: List[Link[CalculationRequest]] = Field(default_factory=list)

    # Embedded data
    work_history: List[WorkHistory] = Field(default_factory=list)
    dispute_details: Optional[DisputeDetails] = None

    class Settings:
        name = "dossiers"
        indexes = [
            "user_id",
            "status",
            "created_at",
        ]
