"""
Integration tests for Calculation WebAPI endpoints.

Tests CRUD operations, error handling, permissions, and edge cases.
"""

import base64
import datetime
from dataclasses import dataclass
from typing import Any

import pytest

from api.models.enums import ContractType, RoleEnum, TerminationReason, WorkerCategory


@dataclass
class ApiTestUser:
    """Minimal authenticated user used by the API tests."""

    auth_key: str
    role: RoleEnum


def auth_headers(user: ApiTestUser) -> dict[str, str]:
    """Build the Basic auth header expected by the API."""
    token = base64.b64encode(f"{user.auth_key}:".encode("ascii")).decode("ascii")
    return {"Authorization": f"Basic {token}"}


@pytest.fixture
def admin_user() -> ApiTestUser:
    """Create a test admin user."""
    return ApiTestUser(auth_key="admin123", role=RoleEnum.ADMIN)


@pytest.fixture
def regular_user() -> ApiTestUser:
    """Create a test regular user."""
    return ApiTestUser(auth_key="user123", role=RoleEnum.PUSER)


@pytest.fixture
def valid_calculation_data() -> dict[str, Any]:
    """Valid calculation request data."""
    return {
        "employee_name": "Jean Dupont",
        "employee_email": "jean@example.com",
        "employee_id": "EMP001",
        "start_date": "2015-01-15",
        "end_date": "2023-12-31",
        "avg_salary": 150000.0,
        "daily_salary": 5769.23,
        "category": WorkerCategory.EMPLOYE.value,
        "contract_type": ContractType.CDI.value,
        "termination_reason": TerminationReason.LICENCIEMENT.value,
        "remaining_leave_days": 15.0,
        "annual_leave_entitlement": 30.0,
        "notes": "Test calculation",
    }


class TestCalculationCreate:
    """Test POST /api/v1/calculations/"""

    def test_create_success(self, client: Any, admin_user: ApiTestUser, valid_calculation_data: dict[str, Any]) -> None:
        """Test successful creation of calculation."""
        response = client.post(
            "/api/v1/calculations/",
            json=valid_calculation_data,
            headers=auth_headers(admin_user),
        )

        assert response.status_code == 201
        data = response.json()
        assert data["employee_name"] == "Jean Dupont"
        assert data["status"] == "completed"
        assert "id" in data
        assert "seniority_years" in data
        assert "severance_pay" in data

    def test_create_invalid_dates(self, client: Any, admin_user: ApiTestUser) -> None:
        """Test creation with invalid dates (end before start)."""
        invalid_data = {
            "employee_name": "Test User",
            "start_date": "2023-12-31",
            "end_date": "2015-01-15",
            "avg_salary": 150000.0,
            "category": WorkerCategory.EMPLOYE.value,
        }

        response = client.post(
            "/api/v1/calculations/",
            json=invalid_data,
            headers=auth_headers(admin_user),
        )

        assert response.status_code == 422
        assert "date" in str(response.json()["detail"]).lower()

    def test_create_missing_required_fields(self, client: Any, admin_user: ApiTestUser) -> None:
        """Test creation with missing required fields."""
        invalid_data = {
            "employee_name": "Test User",
            # Missing start_date, end_date, avg_salary, category
        }

        response = client.post(
            "/api/v1/calculations/",
            json=invalid_data,
            headers=auth_headers(admin_user),
        )

        assert response.status_code == 422  # Pydantic validation error

    def test_create_negative_salary(self, client: Any, admin_user: ApiTestUser) -> None:
        """Test creation with negative salary."""
        invalid_data = {
            "employee_name": "Test User",
            "start_date": "2015-01-15",
            "end_date": "2023-12-31",
            "avg_salary": -150000.0,  # Invalid
            "category": WorkerCategory.EMPLOYE.value,
        }

        response = client.post(
            "/api/v1/calculations/",
            json=invalid_data,
            headers=auth_headers(admin_user),
        )

        assert response.status_code == 422


class TestCalculationList:
    """Test GET /api/v1/calculations/"""

    def test_list_success(self, client: Any, admin_user: ApiTestUser) -> None:
        """Test listing calculations."""
        client.post(
            "/api/v1/calculations/",
            json={
                "employee_name": "Jean Dupont",
                "start_date": "2015-01-15",
                "end_date": "2023-12-31",
                "avg_salary": 150000.0,
                "category": WorkerCategory.EMPLOYE.value,
            },
            headers=auth_headers(admin_user),
        )

        response = client.get(
            "/api/v1/calculations/",
            headers=auth_headers(admin_user),
        )

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "cursor" in data
        assert len(data["items"]) == 1

    def test_list_with_search(self, client: Any, admin_user: ApiTestUser) -> None:
        """Test listing with search query."""
        client.post(
            "/api/v1/calculations/",
            json={
                "employee_name": "Jean Dupont",
                "start_date": "2015-01-15",
                "end_date": "2023-12-31",
                "avg_salary": 150000.0,
                "category": WorkerCategory.EMPLOYE.value,
            },
            headers=auth_headers(admin_user),
        )

        response = client.get(
            "/api/v1/calculations/?q=Jean",
            headers=auth_headers(admin_user),
        )

        assert response.status_code == 200
        assert len(response.json()["items"]) == 1

    def test_list_unauthorized(self, client: Any) -> None:
        """Test listing without authentication."""
        response = client.get("/api/v1/calculations/")

        assert response.status_code == 401


class TestCalculationRetrieve:
    """Test GET /api/v1/calculations/{pk}/"""

    def test_retrieve_success(
        self, client: Any, admin_user: ApiTestUser, valid_calculation_data: dict[str, Any]
    ) -> None:
        """Test retrieving a specific calculation."""
        # Create first
        create_response = client.post(
            "/api/v1/calculations/",
            json=valid_calculation_data,
            headers=auth_headers(admin_user),
        )
        calc_id = create_response.json()["id"]

        # Retrieve
        response = client.get(
            f"/api/v1/calculations/{calc_id}/",
            headers=auth_headers(admin_user),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == calc_id
        assert "breakdown" in data
        assert "articles" in data

    def test_retrieve_not_found(self, client: Any, admin_user: ApiTestUser) -> None:
        """Test retrieving non-existent calculation."""
        response = client.get(
            "/api/v1/calculations/invalid_id/",
            headers=auth_headers(admin_user),
        )

        assert response.status_code == 404

    def test_retrieve_unauthorized_user(
        self,
        client: Any,
        admin_user: ApiTestUser,
        regular_user: ApiTestUser,
        valid_calculation_data: dict[str, Any],
    ) -> None:
        """Test regular user cannot access another user's calculation."""
        # Admin creates
        create_response = client.post(
            "/api/v1/calculations/",
            json=valid_calculation_data,
            headers=auth_headers(admin_user),
        )
        calc_id = create_response.json()["id"]

        # Regular user tries to access
        response = client.get(
            f"/api/v1/calculations/{calc_id}/",
            headers=auth_headers(regular_user),
        )

        assert response.status_code == 403


class TestCalculationUpdate:
    """Test PUT /api/v1/calculations/{pk}/"""

    def test_update_success(self, client: Any, admin_user: ApiTestUser, valid_calculation_data: dict[str, Any]) -> None:
        """Test successful update of calculation."""
        # Create first
        create_response = client.post(
            "/api/v1/calculations/",
            json=valid_calculation_data,
            headers=auth_headers(admin_user),
        )
        calc_id = create_response.json()["id"]

        # Update
        update_data = valid_calculation_data.copy()
        update_data["employee_name"] = "Jean Dupont Modifié"

        response = client.put(
            f"/api/v1/calculations/{calc_id}/",
            json=update_data,
            headers=auth_headers(admin_user),
        )

        assert response.status_code == 202
        data = response.json()
        assert data["employee_name"] == "Jean Dupont Modifié"

    def test_update_not_found(
        self, client: Any, admin_user: ApiTestUser, valid_calculation_data: dict[str, Any]
    ) -> None:
        """Test updating non-existent calculation."""
        response = client.put(
            "/api/v1/calculations/invalid_id/",
            json=valid_calculation_data,
            headers=auth_headers(admin_user),
        )

        assert response.status_code == 404

    def test_update_invalid_data(
        self, client: Any, admin_user: ApiTestUser, valid_calculation_data: dict[str, Any]
    ) -> None:
        """Test updating with invalid data."""
        # Create first
        create_response = client.post(
            "/api/v1/calculations/",
            json=valid_calculation_data,
            headers=auth_headers(admin_user),
        )
        calc_id = create_response.json()["id"]

        # Invalid update (end before start)
        update_data = valid_calculation_data.copy()
        update_data["start_date"] = "2023-12-31"
        update_data["end_date"] = "2015-01-15"

        response = client.put(
            f"/api/v1/calculations/{calc_id}/",
            json=update_data,
            headers=auth_headers(admin_user),
        )

        assert response.status_code == 422


class TestCalculationDelete:
    """Test DELETE /api/v1/calculations/{pk}/"""

    def test_delete_success(self, client: Any, admin_user: ApiTestUser, valid_calculation_data: dict[str, Any]) -> None:
        """Test successful deletion of calculation."""
        # Create first
        create_response = client.post(
            "/api/v1/calculations/",
            json=valid_calculation_data,
            headers=auth_headers(admin_user),
        )
        calc_id = create_response.json()["id"]

        # Delete
        response = client.delete(
            f"/api/v1/calculations/{calc_id}/",
            headers=auth_headers(admin_user),
        )

        assert response.status_code == 204

        # Verify deleted
        get_response = client.get(
            f"/api/v1/calculations/{calc_id}/",
            headers=auth_headers(admin_user),
        )
        assert get_response.status_code == 404

    def test_delete_not_found(self, client: Any, admin_user: ApiTestUser) -> None:
        """Test deleting non-existent calculation."""
        response = client.delete(
            "/api/v1/calculations/invalid_id/",
            headers=auth_headers(admin_user),
        )

        assert response.status_code == 404


class TestCalculationResults:
    """Test that calculated fields are properly populated."""

    def test_result_fields_present(
        self, client: Any, admin_user: ApiTestUser, valid_calculation_data: dict[str, Any]
    ) -> None:
        """Test that all calculated fields are present in response."""
        response = client.post(
            "/api/v1/calculations/",
            json=valid_calculation_data,
            headers=auth_headers(admin_user),
        )

        assert response.status_code == 201
        data = response.json()

        # Check all calculated fields
        assert data["seniority_years"] is not None
        assert data["severance_pay"] is not None
        assert data["notice_period_pay"] is not None
        assert data["leave_pay"] is not None
        assert data["total"] is not None
        assert data["breakdown"] is not None
        assert data["articles"] is not None

        # Verify total is sum of components
        expected_total = data["severance_pay"] + data["notice_period_pay"] + data["leave_pay"]
        assert abs(data["total"] - expected_total) < 1.0  # Allow small rounding

    def test_breakdown_structure(
        self, client: Any, admin_user: ApiTestUser, valid_calculation_data: dict[str, Any]
    ) -> None:
        """Test breakdown has proper structure."""
        response = client.post(
            "/api/v1/calculations/",
            json=valid_calculation_data,
            headers=auth_headers(admin_user),
        )

        assert response.status_code == 201
        breakdown = response.json()["breakdown"]

        # Check breakdown structure
        assert "seniority_years" in breakdown
        assert "severance_pay" in breakdown
        assert "notice_period_pay" in breakdown
        assert "leave_pay" in breakdown

        # Check severance_pay sub-structure
        assert "amount" in breakdown["severance_pay"]
        assert "formula" in breakdown["severance_pay"]
        assert "details" in breakdown["severance_pay"]
