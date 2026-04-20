"""
Migration - Initialiser les collections de calcul

Ce script initialise les collections MongoDB nécessaires pour le module de calcul.

Utilisation:
    python migrate_calculations.py

Ou dans le contexte de l'application via manage.py ou FastAPI startup.
"""

from beanie import init_beanie

from api.models import (
    User,
    CalculationRequest,
    CalculationResult,
    AuditTrail,
)
from AppMain.settings import AppSettings


async def init_calculation_models():
    """Initialize Beanie with calculation models."""
    document_models = [
        CalculationRequest,
        User,
    ]

    await init_beanie(
        database=AppSettings.MONGO,
        models=document_models,
    )

    print("✓ Collection 'calculation_request' initialized")
    print("✓ Indexes created for calculation_request")


if __name__ == "__main__":
    import asyncio

    asyncio.run(init_calculation_models())
    print("\n✓ Migration complète!")
    print("\nCollections disponibles:")
    print("  - calculation_request (pour les demandes de calcul)")
    print("  - user (existant)")
