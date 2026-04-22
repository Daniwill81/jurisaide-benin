"""
UserAuth.

UserAuth is a class that authenticates a user.
"""

import base64
import binascii
import logging
import typing

import jwt
from fastapi import Request, status
from fastapi.exceptions import HTTPException
from starlette.status import HTTP_401_UNAUTHORIZED as HTTP_401

from sap.beanie import Document
from sap.beanie.exceptions import Object404Error
from sap.fastapi.auth import BasicAuth

from api.models.enums import RoleEnum

from .user import User

logger_auth = logging.getLogger(__name__)


class UserAuth(BasicAuth):
    """
    BasicAuth for API request as user.

    This is used by the React Frontend.
    """

    auth_key_attribute: typing.ClassVar[str] = "auth_key"

    async def authenticate(self, request: Request) -> User:
        """Provide the authenticated user to views that require it."""
        try:
            logger_auth.debug(f"Authenticating request from {request.client}")
            
            if not (self.user_model and issubclass(self.user_model, Document)):
                logger_auth.error(f"UserAuth misconfigured: user_model={self.user_model}, Document={Document}")
                # Fallback to a more flexible check if the exact class match fails due to reloads
                from beanie import Document as BeanieDocument
                if not (self.user_model and issubclass(self.user_model, BeanieDocument)):
                    assert self.user_model and issubclass(self.user_model, Document), f"user_model {self.user_model} must be a Document"

            header_auth: str | None = request.headers.get("Authorization") or request.headers.get("X-Beans-Authorization")

            if not header_auth:
                logger_auth.warning(f"No auth header found in request from {request.client}")
                raise HTTPException(HTTP_401, detail="Authentication required")

            scheme, credentials = header_auth.split()
            if scheme.lower() != "basic":
                logger_auth.warning(f"Invalid auth scheme: {scheme}")
                raise HTTPException(HTTP_401, detail="Only basic authorization is supported")

            try:
                decoded = base64.b64decode(credentials).decode("ascii")
            except (ValueError, UnicodeDecodeError, binascii.Error) as exc:
                logger_auth.error(f"Error decoding basic auth credentials: {str(exc)}", exc_info=True)
                raise HTTPException(HTTP_401, detail="Error while decoding basic auth credentials") from exc

            username, _, pwd = decoded.partition(":")
            user_key = username or pwd
            logger_auth.debug(f"Extracted user_key from auth header: {user_key}")

            if auth_key_name := self.get_auth_key_attribute():
                auth_key = getattr(self.user_model, auth_key_name)
            else:
                auth_key = None

            if auth_key:
                try:
                    logger_auth.debug(f"Looking up user with auth_key: {user_key}")
                    user = await self.user_model.find_one_or_404(User.auth_key == user_key)
                    logger_auth.info(f"User authenticated: {user.id} ({user.email})")
                    return user
                except (Object404Error, jwt.exceptions.InvalidTokenError) as exc:
                    logger_auth.warning(f"User lookup failed for key {user_key}: {str(exc)}")
                    raise HTTPException(HTTP_401, detail="Invalid basic auth credentials") from exc

            logger_auth.debug(f"Looking up user by ID: {user_key}")
            user = await self.user_model.get_or_404(user_key)
            logger_auth.info(f"User authenticated by ID: {user.id}")
            return user
        except HTTPException:
            raise
        except Exception as e:
            logger_auth.error(f"Unexpected error during authentication: {str(e)}", exc_info=True)
            raise

    def require(
        self, perms: typing.Union[list[str], list[RoleEnum]]
    ) -> typing.Callable[[Request], typing.Awaitable[User]]:
        """Authenticate the user and check that they have enough privilege to access resource."""

        async def auth_with_perms(request: Request) -> User:
            try:
                logger_auth.debug(f"Checking permissions {perms} for request from {request.client}")
                
                user: User = await self.authenticate(request=request)

                if not user.has_perms(perms):
                    logger_auth.warning(f"User {user.id} does not have required permissions {perms}")
                    raise HTTPException(
                        status.HTTP_403_FORBIDDEN,
                        detail="Not enough permission to access resource",
                    )

                logger_auth.info(f"User {user.id} authorized with permissions {perms}")
                return user
            except HTTPException:
                raise
            except Exception as e:
                logger_auth.error(f"Error checking permissions: {str(e)}", exc_info=True)
                raise

        return auth_with_perms


user_auth = UserAuth(user_model=User)
