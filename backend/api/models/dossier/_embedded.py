from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class WorkHistory(BaseModel):
    """Represents a period of employment in a dossier."""
    employer: str
    position: str
    start_date: datetime
    end_date: Optional[datetime] = None
    salary: float

class DisputeDetails(BaseModel):
    """Details about a legal dispute."""
    nature: str  # e.g., 'licenciement', 'harcèlement', 'salaires_impayés'
    description: str
    demands: List[str] = Field(default_factory=list)
