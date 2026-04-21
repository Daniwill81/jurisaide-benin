import pytest
from fastapi import status


def test_register_user_fake(client):
    """Test user registration with fake client."""
    user_data = {
        "first_name": "Test",
        "last_name": "User",
        "email": "test-register-fake@example.com",
        "password": "Password123!",
        "role": "PUSER",
        "sex": "M",
    }
    response = client.post("/api/v1/users/", json=user_data)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == user_data["email"]
    assert data["first_name"] == user_data["first_name"]
    assert "id" in data


def test_register_user_duplicate_email_fake(client):
    """Test user registration with duplicate email with fake client."""
    user_data = {
        "first_name": "Test",
        "last_name": "User",
        "email": "duplicate@example.com",
        "password": "Password123!",
        "role": "PUSER",
    }
    # First registration
    client.post("/api/v1/users/", json=user_data)

    # Second registration with same email
    response = client.post("/api/v1/users/", json=user_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.asyncio
async def test_register_user_real(real_client):
    """Test user registration with REAL client (reproduces 500 if error exists)."""
    user_data = {
        "first_name": "Real",
        "last_name": "User",
        "email": "daniel@example.com",
        "password": "Password123!",
        "role": "PUSER",
        "sex": "M",
    }
    response = await real_client.post("/api/v1/users/", json=user_data)
    data = response.json()
    assert response.status_code == status.HTTP_201_CREATED
