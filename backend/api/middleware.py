# pylint: disable=protected-access, no-self-use
"""
# Middleware.

This module contains generic middleware to perform repetitive actions on each request.
Learn more: https://fastapi.tiangolo.com/tutorial/middleware/
"""

import typing

from fastapi import Request
from fastapi.exceptions import HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from starlette.types import Message

from sap.fastapi import Flash
from sap.fastapi.auth import JWTAuth

from app.models import Campaign, Preference, User
from AppMain.settings import AppSettings, logger_access, templates

jwt_auth = JWTAuth(user_model=User)


class InitGlobalParamsMiddleware(BaseHTTPMiddleware):
    """Load global variables in cache to avoid repetitive DB calls."""

    async def set_body(self, request: Request) -> None:
        """Allow reading the request body multiple times."""
        receive_ = await request._receive()

        async def receive() -> Message:
            return receive_

        request._receive = receive

    async def dispatch(
        self, request: Request, call_next: typing.Callable[[Request], typing.Awaitable[Response]]
    ) -> Response:
        """Load vars and launch call_next."""

        if (
            "/pages/auth/login" not in str(request.url)
            and request.method not in ["GET", "HEAD", "OPTIONS"]
            and request.headers.get("Content-Type") in ["application/x-www-form-urlencoded", "application/json"]
        ):
            await self.set_body(request)
            user_email = request.cookies.get("user_email")
            body = (await request.body()).decode()
            logger_access.info(
                '%s %s user="%s" body="%s"',
                request.method,
                request.url,
                user_email,
                body,
            )

        return await call_next(request)
