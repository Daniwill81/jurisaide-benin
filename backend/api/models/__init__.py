"""
# Models.

Models define logical structuring of the data in the database.
"""

from .calcul import CalculationRequest
from .dossier.dossier import Dossier
from .jurisprudence import LegalArticle, LegalCase
from .user import User

__all__ = [
    "User",
    "CalculationRequest",
    "Dossier",
    "LegalArticle",
    "LegalCase",
]
