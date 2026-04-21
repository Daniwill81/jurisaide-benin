"""
Register metadata to run the Application.

Data is loading from metadata.yaml
"""

import asyncio
import typing
import os
import yaml

from api.models import User
from api.models.enums import RoleEnum
from AppMain.asgi import initialize_beanie
from AppMain.settings import AppSettings, logger


async def register() -> None:
    """Initialize the database with default data."""
    await initialize_beanie()

    filename = "metadata.yaml"
    if not os.path.exists(filename):
        filename = "metadata.yml"
        
    if not os.path.exists(filename):
        print(f"Error: Neither metadata.yaml nor metadata.yml found.")
        return

    with open(filename, "r", encoding="utf-8") as stream:
        metadata: dict[str, typing.Any] = yaml.safe_load(stream)

    if "superusers" in metadata:
        await register_superusers(data_list=metadata["superusers"])


async def register_superusers(data_list: list[dict[str, typing.Any]]) -> None:
    """Create the super admin account."""
    for data_row in data_list:
        email = data_row["email"].replace(",", ".") # Fix common typo
        user = await User.find_one(User.email == email)
        if user:
            print(f"Super admin {email} already exists.")
            continue

        user = User(
            first_name=data_row["first_name"],
            last_name=data_row["last_name"],
            email=email,
            role=RoleEnum.ADMIN,
            is_active=True,
        )

        # Set default password
        user.set_password("admin123")
        
        await user.insert()
        await user.generate_auth_key()

        assert user.id
        print(f"Super admin {user.email} was successfully created with password 'admin123'.")

if __name__ == "__main__":
    asyncio.run(register())
