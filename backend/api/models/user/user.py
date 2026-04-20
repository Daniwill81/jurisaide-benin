import typing

import passlib.pwd
import pydantic
import pymongo
import pymongo.collation
from beanie import Document, operators

from sap.beanie.mixins import PasswordMixin

from api.models.enums import RoleEnum, SexEnum


class User(PasswordMixin, Document):
    role: RoleEnum
    first_name: str
    last_name: str
    sex: SexEnum | None = None
    email: pydantic.EmailStr
    auth_key: str | None = None
    is_active: bool = True

    def get_name(self) -> str:
        """Get full name of th user."""
        return f"{self.first_name} {self.last_name}"

    def has_perm(self, perm: typing.Union[str, RoleEnum]) -> bool:
        """Check if the user has access to a specific role permission."""
        if perm == "*":
            return self.is_active
        return self.role == perm and self.is_active

    def has_perms(self, perms: typing.Union[list[str], list[RoleEnum]]) -> bool:
        """Check if the user has access to any of the provided permissions."""
        return any(self.has_perm(perm) for perm in perms)

    async def generate_auth_key(self) -> None:
        """Generate a random string for auth token."""
        await self.set({"auth_key": passlib.pwd.genword(length=32, charset="ascii_62")})

    @classmethod
    async def find_current(cls, email: str) -> typing.Self | None:
        """Retrieve user valid according to campaign."""
        return await User.find_one(
            operators.And(
                {User.email: email},
            )
        )

    class Settings:
        """Settings for the database collection."""

        name = "user"
        email_collation = pymongo.collation.Collation("en", strength=2)
        indexes = [
            pymongo.IndexModel(("email", pymongo.ASCENDING), unique=True),
            pymongo.IndexModel("email", name="case_insensitive_email_index", collation=email_collation),
            pymongo.IndexModel(
                [
                    ("email", pymongo.TEXT),
                    ("first_name", pymongo.TEXT),
                    ("last_name", pymongo.TEXT),
                ],
                name="search",
            ),
        ]
