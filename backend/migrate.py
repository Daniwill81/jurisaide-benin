"""
Migration - Initialiser les collections.

Ce script initialise les collections MongoDB nécessaires pour le projet.

"""

import asyncio

from AppMain.asgi import initialize_beanie


async def run_migrations() -> None:
    """Run data migrations."""
    await initialize_beanie()


if __name__ == "__main__":
    asyncio.run(run_migrations())
