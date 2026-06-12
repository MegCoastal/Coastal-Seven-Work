from fastapi.testclient import TestClient
from app2 import app

client = TestClient(app)

def test_register():

    response = client.post(
        "/register",
        json={
            "username": "john",
            "password": "1234"
        }
    )

    assert response.status_code == 200

    assert response.json() == {
        "message": "Registered successfully"
    }

def test_login():

    client.post(
        "/register",
        json={
            "username": "john",
            "password": "1234"
        }
    )

    response = client.post(
        "/login",
        data={
            "username": "john",
            "password": "1234"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"

