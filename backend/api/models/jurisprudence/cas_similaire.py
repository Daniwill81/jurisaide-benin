from datetime import datetime
from typing import List, Optional

from beanie import Document
from pydantic import Field


class LegalCase(Document):
    """
    Represents a historical legal case (jurisprudence) used for similarity matching.
    """
    case_title: str
    court_name: str
    decision_date: datetime
    summary: str
    facts: str
    legal_reasoning: str
    outcome: str
    tags: List[str] = []
    
    # Vector store ID (if indexed)
    vector_id: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "cas_similaires"
        indexes = [
            "case_title",
            "court_name",
            "decision_date",
        ]

# Alias for Step 6 requirements
CasSimilaire = LegalCase
