"""
# Models.

Models define logical structuring of the data in the database.
"""

from .calcul import CalculationRequest
from .user import User

__all__ = [
    "User",
    "CalculationRequest",
]
