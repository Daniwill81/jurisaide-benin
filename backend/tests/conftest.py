"""Pytest configuration for backend tests."""

import base64
import os
import sys
from dataclasses import dataclass
from datetime import date, datetime, time
from pathlib import Path
from typing import Any, cast
from urllib.parse import parse_qs, urlparse

import pytest
from beanie import PydanticObjectId
from bson import ObjectId
from pydantic import ValidationError

PROJECT_ROOT = Path(__file__).resolve().parents[1]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

os.environ.setdefault("APP_SETTINGS_CRYPTO_SECRET", "test-secret")
os.environ.setdefault("APP_SETTINGS_MONGO__HOST", "localhost")
os.environ.setdefault("APP_SETTINGS_MONGO__DB", "jurisaide_test")
os.environ.setdefault("APP_SETTINGS_AWS_ACCESS_KEY_ID", "test-access-key")
os.environ.setdefault("APP_SETTINGS_AWS_ACCESS_KEY_SECRET", "test-secret-key")
os.environ.setdefault("APP_SETTINGS_AWS_REGION", "us-east-1")

from api.models.calcul import CalculationRequest
from api.models.enums import ContractType, RoleEnum, TerminationReason, WorkerCategory
from api.serializers.calcul import WriteCalculationSerializer
from api.xlib.labor_code import (
    calculate_leave_pay,
    calculate_notice_period_pay,
    calculate_seniority,
    calculate_severance_pay,
)


@dataclass
class FakeUser:
    """Small auth user object for API tests."""

    id: PydanticObjectId
    email: str
    auth_key: str
    first_name: str
    last_name: str
    role: RoleEnum
    is_active: bool = True


@dataclass
class FakeResponse:
    """Small response object that matches the test needs."""

    status_code: int
    payload: dict[str, Any] | list[Any] | None = None

    def json(self) -> dict[str, Any] | list[Any] | None:
        """Return the JSON payload."""
        return self.payload


def _datetime_from_value(value: date | datetime) -> datetime:
    """Normalize dates into datetimes for the stored model."""
    if isinstance(value, datetime):
        return value
    return datetime.combine(value, time.min)


def _build_user(
    *,
    user_id: str,
    email: str,
    auth_key: str,
    role: RoleEnum,
    first_name: str,
    last_name: str,
) -> FakeUser:
    """Create a stable in-memory user for auth tests."""
    return FakeUser(
        id=PydanticObjectId(user_id),
        email=email,
        auth_key=auth_key,
        first_name=first_name,
        last_name=last_name,
        role=role,
    )


def _build_calculation(**data: Any) -> CalculationRequest:
    """Create a calculation document without touching Beanie collections."""
    return cast(CalculationRequest, CalculationRequest.model_construct(**data))


def _build_result_payload(calculation: CalculationRequest) -> dict[str, Any]:
    """Build the enriched API response for a calculation."""
    seniority_years = calculate_seniority(calculation.start_date, calculation.end_date)
    severance_pay = calculate_severance_pay(calculation.avg_salary, seniority_years)
    notice_period_pay = calculate_notice_period_pay(calculation.avg_salary, calculation.category)
    leave_pay = calculate_leave_pay(
        calculation.daily_salary or (calculation.avg_salary / 26.0),
        calculation.remaining_leave_days,
    )
    total = severance_pay + notice_period_pay + leave_pay

    return {
        "id": str(calculation.id),
        "employee_name": calculation.employee_name,
        "employee_email": calculation.employee_email,
        "employee_id": calculation.employee_id,
        "start_date": calculation.start_date.date().isoformat(),
        "end_date": calculation.end_date.date().isoformat(),
        "avg_salary": calculation.avg_salary,
        "daily_salary": calculation.daily_salary,
        "category": calculation.category.value,
        "contract_type": calculation.contract_type.value,
        "termination_reason": calculation.termination_reason.value if calculation.termination_reason else None,
        "remaining_leave_days": calculation.remaining_leave_days,
        "annual_leave_entitlement": calculation.annual_leave_entitlement,
        "status": calculation.status,
        "created": calculation.created.isoformat(),
        "updated": calculation.updated.isoformat(),
        "notes": calculation.notes,
        "seniority_years": round(seniority_years, 2),
        "severance_pay": round(severance_pay, 2),
        "notice_period_pay": round(notice_period_pay, 2),
        "leave_pay": round(leave_pay, 2),
        "total": round(total, 2),
        "breakdown": {
            "seniority_years": round(seniority_years, 2),
            "severance_pay": {
                "amount": round(severance_pay, 2),
                "formula": "Selon Article 44 - Loi 98-004",
                "details": {
                    "bracket_1_to_5_years": {
                        "years": round(min(seniority_years, 5), 2),
                        "rate": "30%",
                    }
                },
            },
            "notice_period_pay": {
                "amount": round(notice_period_pay, 2),
                "formula": "Selon Article 53 - Loi 98-004",
                "category": calculation.category.value,
                "months": (
                    3
                    if calculation.category == WorkerCategory.CADRE
                    else 2 if calculation.category == WorkerCategory.AGENT_MAITRISE else 1
                ),
            },
            "leave_pay": {
                "amount": round(leave_pay, 2),
                "formula": "Selon Article 113 - Loi 98-004",
                "remaining_days": calculation.remaining_leave_days,
                "daily_rate": round(calculation.daily_salary or (calculation.avg_salary / 26.0), 2),
            },
        },
        "articles": {
            "severance": "Art. 44",
            "notice": "Art. 53",
            "leave": "Art. 113",
            "legal_basis": "Loi 98-004 du 27 janvier 1998",
        },
    }


class FakeApiClient:
    """In-memory client that mimics the calculations API behavior."""

    def __init__(self, users: dict[str, FakeUser]) -> None:
        self.users = users
        self.store: dict[str, CalculationRequest] = {}

    def _authenticate(self, headers: dict[str, str] | None) -> FakeUser | FakeResponse:
        if not headers or "Authorization" not in headers:
            return FakeResponse(401, {"detail": "Authentication required"})

        try:
            scheme, credentials = headers["Authorization"].split()
        except ValueError:
            return FakeResponse(401, {"detail": "Malformed authorization header"})

        if scheme.lower() != "basic":
            return FakeResponse(401, {"detail": "Only basic authorization is supported"})

        decoded = base64.b64decode(credentials).decode("ascii")
        username, _, password = decoded.partition(":")
        auth_key = username or password
        user = self.users.get(auth_key)
        if not user:
            return FakeResponse(401, {"detail": "Invalid basic auth credentials"})
        return user

    def _validate_payload(self, payload: dict[str, Any]) -> WriteCalculationSerializer | FakeResponse:
        try:
            return WriteCalculationSerializer.model_validate(payload)
        except ValidationError as exc:
            return FakeResponse(422, {"detail": exc.errors()})

    def _create_calculation(self, serializer: WriteCalculationSerializer, user: FakeUser) -> CalculationRequest:
        now = datetime.utcnow()
        calculation = _build_calculation(
            id=PydanticObjectId(ObjectId()),
            employee_name=serializer.employee_name,
            employee_email=serializer.employee_email,
            employee_id=serializer.employee_id,
            start_date=_datetime_from_value(serializer.start_date),
            end_date=_datetime_from_value(serializer.end_date),
            avg_salary=serializer.avg_salary,
            daily_salary=serializer.daily_salary or (serializer.avg_salary / 26.0),
            category=serializer.category,
            contract_type=serializer.contract_type or ContractType.CDI,
            termination_reason=serializer.termination_reason or TerminationReason.LICENCIEMENT,
            remaining_leave_days=serializer.remaining_leave_days,
            annual_leave_entitlement=serializer.annual_leave_entitlement,
            status="completed",
            created=now,
            updated=now,
            user_id=user.id,
            notes=serializer.notes,
            audit_trail=[],
        )
        self.store[str(calculation.id)] = calculation
        return calculation

    def _find_calculation(self, calc_id: str) -> CalculationRequest | None:
        return self.store.get(calc_id)

    def post(
        self, path: str, json: dict[str, Any] | None = None, headers: dict[str, str] | None = None
    ) -> FakeResponse:
        if path == "/api/v1/users/":
            # Mock register behavior
            payload = json or {}
            email = payload.get("email")
            if any(u.email == email for u in self.users.values()):
                return FakeResponse(422, {"detail": "Email already exists"})

            user = _build_user(
                user_id=str(ObjectId()),
                email=email,
                auth_key="new_key",
                role=RoleEnum(payload.get("role", "PUSER")),
                first_name=payload.get("first_name", ""),
                last_name=payload.get("last_name", ""),
            )
            self.users[user.auth_key] = user
            return FakeResponse(
                201,
                {
                    "id": str(user.id),
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role.value,
                    "is_active": True,
                    "created": datetime.utcnow().isoformat(),
                },
            )

        if path != "/api/v1/calculations/":
            return FakeResponse(404, {"detail": "Not found"})

        auth_result = self._authenticate(headers)
        if isinstance(auth_result, FakeResponse):
            return auth_result

        serializer = self._validate_payload(json or {})
        if isinstance(serializer, FakeResponse):
            return serializer

        calculation = self._create_calculation(serializer, auth_result)
        return FakeResponse(201, _build_result_payload(calculation))

    def get(self, path: str, headers: dict[str, str] | None = None) -> FakeResponse:
        auth_result = self._authenticate(headers)
        if isinstance(auth_result, FakeResponse):
            return auth_result

        parsed = urlparse(path)
        if parsed.path == "/api/v1/calculations/":
            items = [calculation for calculation in self.store.values() if calculation.user_id == auth_result.id]
            search = parse_qs(parsed.query).get("q", [None])[0]
            if search:
                lowered = search.lower()
                items = [
                    calculation
                    for calculation in items
                    if lowered in calculation.employee_name.lower()
                    or lowered in (calculation.employee_email or "").lower()
                ]
            return FakeResponse(
                200,
                {
                    "items": [_build_result_payload(calculation) for calculation in items],
                    "cursor": {"count": len(items)},
                },
            )

        prefix = "/api/v1/calculations/"
        if parsed.path.startswith(prefix):
            calc_id = parsed.path.removeprefix(prefix).strip("/")
            calculation = self._find_calculation(calc_id)
            if calculation is None:
                return FakeResponse(404, {"detail": "Calculation not found"})
            if calculation.user_id != auth_result.id and auth_result.role != RoleEnum.ADMIN:
                return FakeResponse(403, {"detail": "Not authorized"})
            return FakeResponse(200, _build_result_payload(calculation))

        return FakeResponse(404, {"detail": "Not found"})

    def put(self, path: str, json: dict[str, Any] | None = None, headers: dict[str, str] | None = None) -> FakeResponse:
        auth_result = self._authenticate(headers)
        if isinstance(auth_result, FakeResponse):
            return auth_result

        prefix = "/api/v1/calculations/"
        calc_id = path.removeprefix(prefix).strip("/")
        calculation = self._find_calculation(calc_id)
        if calculation is None:
            return FakeResponse(404, {"detail": "Calculation not found"})
        if calculation.user_id != auth_result.id and auth_result.role != RoleEnum.ADMIN:
            return FakeResponse(403, {"detail": "Not authorized"})

        serializer = self._validate_payload(json or {})
        if isinstance(serializer, FakeResponse):
            return serializer

        updated = _build_calculation(
            id=calculation.id,
            employee_name=serializer.employee_name,
            employee_email=serializer.employee_email,
            employee_id=serializer.employee_id,
            start_date=_datetime_from_value(serializer.start_date),
            end_date=_datetime_from_value(serializer.end_date),
            avg_salary=serializer.avg_salary,
            daily_salary=serializer.daily_salary or (serializer.avg_salary / 26.0),
            category=serializer.category,
            contract_type=serializer.contract_type,
            termination_reason=serializer.termination_reason,
            remaining_leave_days=serializer.remaining_leave_days,
            annual_leave_entitlement=serializer.annual_leave_entitlement,
            status=calculation.status,
            created=calculation.created,
            updated_at=datetime.utcnow(),
            user_id=calculation.user_id,
            notes=serializer.notes,
            audit_trail=calculation.audit_trail,
        )
        self.store[str(updated.id)] = updated
        return FakeResponse(202, _build_result_payload(updated))

    def delete(self, path: str, headers: dict[str, str] | None = None) -> FakeResponse:
        auth_result = self._authenticate(headers)
        if isinstance(auth_result, FakeResponse):
            return auth_result

        prefix = "/api/v1/calculations/"
        calc_id = path.removeprefix(prefix).strip("/")
        calculation = self._find_calculation(calc_id)
        if calculation is None:
            return FakeResponse(404, {"detail": "Calculation not found"})
        if calculation.user_id != auth_result.id and auth_result.role != RoleEnum.ADMIN:
            return FakeResponse(403, {"detail": "Not authorized"})

        del self.store[calc_id]
        return FakeResponse(204)


@pytest.fixture
def client() -> FakeApiClient:
    """Create an in-memory client for the calculation API tests."""
    auth_users = {
        "admin123": _build_user(
            user_id="507f1f77bcf86cd799439011",
            email="admin@test.com",
            auth_key="admin123",
            role=RoleEnum.ADMIN,
            first_name="Admin",
            last_name="User",
        ),
        "user123": _build_user(
            user_id="507f1f77bcf86cd799439012",
            email="regular@test.com",
            auth_key="user123",
            role=RoleEnum.PUSER,
            first_name="Regular",
            last_name="User",
        ),
    }
    fake_client = FakeApiClient(auth_users)
    yield fake_client
    # Automatic cleanup after test
    fake_client.store.clear()
    fake_client.users.clear()
    fake_client.users.update({
        "admin123": auth_users["admin123"],
        "user123": auth_users["user123"],
    })


@pytest.fixture
async def real_client():
    """Create a real AsyncClient for the app with automatic database cleanup."""
    from httpx import AsyncClient

    from AppMain.asgi import app
    from beanie import init_beanie
    from api.models.user import User

    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
        
        # Automatic cleanup after test
        try:
            await init_beanie(
                database="jurisaide_test",
                models=[User],
            )
            # Delete all test users created during test
            await User.find({"email": {"$regex": ".*@example\\.com$"}}).delete()
            await User.find({"email": "daniel@example.com"}).delete()
        except Exception as e:
            print(f"Warning: Could not clean up test data: {e}")
