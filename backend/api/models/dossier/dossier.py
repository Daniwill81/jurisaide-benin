from datetime import datetime
from typing import Optional, List
from beanie import Document, Link, PydanticObjectId
from pydantic import Field
from api.models.calcul import CalculationRequest
from ._embedded import WorkHistory, DisputeDetails

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
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "dossiers"
        indexes = [
            "user_id",
            "status",
            "created_at",
        ]
