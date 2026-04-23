from datetime import datetime
from typing import Optional

from beanie import Document
from pydantic import Field


class LegalArticle(Document):
    """
    Represents a legal article from the labor code.
    """

    law_name: str = "Loi 98-004"
    article_number: str
    content: str
    category: Optional[str] = None
    tags: list[str] = []

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "legal_articles"
        indexes = [
            "article_number",
            "law_name",
        ]
