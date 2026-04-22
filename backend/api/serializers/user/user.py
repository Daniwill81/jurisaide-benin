"""
# Serializers.

Handle data validation.
"""

import datetime
import re
import typing

import pydantic

from sap.fastapi import ObjectSerializer, WriteObjectSerializer

from api.models import User
from api.models.enums import RoleEnum, SexEnum


class UserSerializer(ObjectSerializer[User]):
    """Serialize the `user` object for retrieve and listing."""

    id: str
    first_name: str
    last_name: str
    sex: SexEnum | None = None
    email: pydantic.EmailStr
    is_active: bool
    role: RoleEnum
    created: datetime.datetime
    updated: datetime.datetime

    @classmethod
    def get_id(cls, instance: User) -> str:
        """Extract the ID from the User instance."""
        return str(instance.id)


class WriteUserSerializer(WriteObjectSerializer[User]):
    """Serialize the `user` object for create and update."""

    first_name: str
    last_name: str
    email: pydantic.EmailStr
    birthdate: datetime.date | None = None
    sex: SexEnum | None = None
    password: str = pydantic.Field(min_length=8)
    role: RoleEnum

    # The fields bellow are not serialized
    instance: User | None = None

    @pydantic.field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        """Verify that the password fit security criteria"""
        if not re.findall(r"[a-zA-Z]+", value):
            raise AssertionError("Votre mot de passe doit contenir au moins une lettre.")
        if not re.findall(r"[0-9]+", value):
            raise AssertionError("Votre mot de passe doit contenir au moins 1 chiffre.")
        if re.match(r"^\w+$", value):
            raise AssertionError("Votre mot de passe doit contenir au moins 1 caractère spécial.")
        return value

    async def run_async_validators(self, **kwargs: typing.Any) -> None:
        """Check that data pass DB validation."""
        await self.validate_email_uniqueness()
        await self.validate_role()

    async def validate_email_uniqueness(self) -> None:
        """Check that the email is not used by another user."""
        if self.instance and self.instance.email == self.email:
            return

        is_duplicate = await User.find_current(email=self.email)
        if is_duplicate:
            raise AssertionError("Cet email est déjà rattaché à un compte administrateur existant.")

    async def validate_role(self) -> None:
        """Set user role."""
        if self.instance and self.role == self.instance.role:
            return

    async def create(self, **kwargs: typing.Any) -> User:
        """Create a new user."""
        user = User(
            first_name=self.first_name,
            last_name=self.last_name,
            email=self.email,
            sex=self.sex,
            role=self.role,
            is_active=True,
        )
        user.set_password(self.password)
        await user.insert()
        return user

    async def update(self, **kwargs: typing.Any) -> User:
        """Update the object in the database using the data extracted by the serializer."""
        assert self.instance
        self.instance.first_name = self.first_name
        self.instance.last_name = self.last_name
        self.instance.sex = self.sex
        self.instance.email = self.email
        self.instance.role = self.role
        self.instance.updated_at = datetime.datetime.utcnow()
        await self.instance.save()
        return self.instance
