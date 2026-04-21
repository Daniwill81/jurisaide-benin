"""
ASGI.

This is MAIN entrypoint to the application.
It exposes the ASGI callable as a module-level variable named ``app``.

"""

import logging
import typing
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_redoc_html, get_swagger_ui_html
from fastapi.responses import RedirectResponse, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import HTMLResponse, JSONResponse
from starlette.routing import Mount
from starlette.staticfiles import StaticFiles

from sap.beanie.client import BeanieClient
from sap.fastapi.middleware import InitBeanieMiddleware  # , LogServerErrorMiddleware

from api import models
from api.webapi import router_api

from .settings import AppSettings, logger


@asynccontextmanager
async def lifespan(current_app: FastAPI) -> typing.AsyncGenerator[None, None]:
    """Initialize beanie for main and audit databases on startup."""
    assert current_app

    # Init main DB
    await initialize_beanie()
    yield


# Initialize application
app = FastAPI(
    docs_url=None,
    redoc_url=None,
    title=AppSettings.PROJ_NAME,
    description="Engine for Beninese Labor Law",
    version="0.1.0",
    lifespan=lifespan,
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add header to enhance security."""

    async def dispatch(
        self,
        request: Request,
        call_next: typing.Callable[[Request], typing.Awaitable[Response]],
    ) -> Response:
        """Add security headers to the response."""
        response = await call_next(request)

        # Content Security Policy - Strict pour API REST
        response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"

        # X-Frame-Options - Empêche l'intégration dans des iframes
        response.headers["X-Frame-Options"] = "DENY"

        # X-Content-Type-Options - Empêche le MIME sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Referrer-Policy - Contrôle les informations du referrer
        response.headers["Referrer-Policy"] = "no-referrer"

        # Permissions-Policy - Désactive les fonctionnalités du navigateur
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=(), "
            "payment=(), usb=(), magnetometer=(), gyroscope=(), "
            "accelerometer=(), ambient-light-sensor=(), autoplay=(), "
            "encrypted-media=(), picture-in-picture=()"
        )

        # En-têtes de sécurité supplémentaires recommandés
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response


# Security middleware
app.add_middleware(SecurityHeadersMiddleware)


# List of allowed origins (replace with your actual domains)
origins = [
    "http://localhost:3000",
]

# Enable cors
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static folder
app.routes.append(
    Mount(
        path="/static",
        app=StaticFiles(directory=AppSettings.APP_DIR / "static"),
        name="static",
    )
)

# Mount sub-apps routes

# Mount RESTFul API
app_api = FastAPI(
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
    title=AppSettings.PROJ_NAME,
    description="JurisAide Benin project API",
)


@app.get("/")
async def root() -> dict[str, str]:
    """Return a welcome message for the API root endpoint."""
    return {"message": "Welcome to JurisAide Bénin API"}


@app_api.get("/doc", include_in_schema=False)
async def custom_swagger_ui_html(request: Request) -> HTMLResponse:
    """Protect swagger doc endpoint."""
    return get_swagger_ui_html(
        openapi_url="/api/v1/openapi.json",
        title=f"{AppSettings.PROJ_NAME} - Documentation",
    )


@app_api.get("/docs", include_in_schema=False)
async def custom_redoc_html(request: Request) -> HTMLResponse:
    """Protect redoc doc endpoint."""
    return get_redoc_html(
        openapi_url="/api/v1/openapi.json",
        title=f"{AppSettings.PROJ_NAME} - Documentation",
    )


app_api.include_router(router_api)
app.routes.append(Mount(path="/api/v1", app=app_api, name="api"))

# Mount Web App
app_pages = FastAPI(title=AppSettings.PROJ_NAME, description="eHadj web application")

# Load sub-apps routes and documents
document_models = []

# Retrieve the lists of documents for beanie initialization
for model_name in models.__all__:
    document_models.append(getattr(models, model_name))


# Register middleware
app.add_middleware(
    InitBeanieMiddleware,
    mongo_params=AppSettings.MONGO,
    document_models=document_models,
)
app_pages.add_middleware(SessionMiddleware, session_cookie="starlette", secret_key=AppSettings.CRYPTO_SECRET)


# Events to run on startups
async def initialize_beanie() -> None:
    """Initialize beanie on startup."""
    await BeanieClient.init(mongo_params=AppSettings.MONGO, document_models=document_models)


@app.exception_handler(AssertionError)
async def assertion_exception_handler(request: Request, exc: AssertionError) -> JSONResponse:
    """Convert assertion errors (validation) to 422 responses."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": [{"msg": str(exc), "type": "assertion_error"}]},
    )


# Always log exception
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Log all request validation errors to a file."""
    logger.exception(exc.errors())
    return await request_validation_exception_handler(request=request, exc=exc)


async def update_uvicorn_logger() -> None:
    """Log all uvicorn errors."""
    logger_uvicorn = logging.getLogger("uvicorn.access")
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
    logger_uvicorn.addHandler(handler)


@app.get("/doc")
async def api_doc_redirect(request: Request) -> Response:
    """Home page."""
    return RedirectResponse("/api/v1/doc")


class UvicornAccessLogFilter(logging.Filter):
    """Prevent health check to pollute access logs."""

    def filter(self, record: logging.LogRecord) -> bool:
        """Exclude /health/ from access logging."""
        if record.name == "uvicorn.access" and record.args:
            _, verb, path, _, response_status = record.args
            if verb == "GET" and path == "/health/" and response_status == 200:
                return False
        return True


# Filter out /health
logging.getLogger("uvicorn.access").addFilter(UvicornAccessLogFilter())
