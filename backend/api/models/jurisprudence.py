from datetime import datetime
from typing import Any, List, Optional

from beanie import Document, Indexed
from pydantic import Field


class LegalArticle(Document):
    """
    Represents an article from a law or collective agreement.
    """
    law_name: str = Indexed()  # e.g., "Loi 98-004"
    article_number: str = Indexed()  # e.g., "Art. 44"
    content: str
    summary: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "legal_articles"


class LegalCase(Document):
    """
    Represents a historical legal case or jurisprudence.
    """
    title: str = Indexed()
    court: Optional[str] = None
    date: Optional[datetime] = None
    facts: str
    ruling: str
    legal_basis: List[str] = Field(default_factory=list)  # Articles cited
    outcome: str  # e.g., "Worker won", "Employer won"
    
    # Vector metadata
    vector_id: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "legal_cases"
