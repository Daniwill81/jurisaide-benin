"""
# Serializers.

Handle data validation.
"""

import datetime

import pydantic

from sap.fastapi import ObjectSerializer

from api.models import User
from api.models.enums import RoleEnum


class UserSerializer(ObjectSerializer[User]):
    """Serialize the `user` object for retrieve and listing."""

    id: str
    first_name: str
    last_name: str
    email: pydantic.EmailStr
    is_active: bool
    roles: RoleEnum
    created: datetime.datetime
