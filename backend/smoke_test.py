import os
import sys

os.environ.setdefault("DATABASE_URL", "sqlite:///./backend/_smoke_test.db")
os.environ.setdefault("SECRET_KEY", "smoke-test")

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi.testclient import TestClient

from backend.main import app


def run():
    client = TestClient(app)

    r = client.get("/healthz")
    assert r.status_code == 200, r.text
    assert r.json().get("ok") is True

    payload = {
        "email": "smoke@example.com",
        "password": "test1234",
        "height": 170,
        "weight": 70,
        "age": 25,
        "gender": "male",
        "activity_level_factor": 1.2,
    }
    r = client.post("/users/", json=payload)
    if r.status_code == 400:
        r = client.post("/token", data={"username": payload["email"], "password": payload["password"]})
        assert r.status_code == 200, r.text
    else:
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["email"] == payload["email"]


if __name__ == "__main__":
    run()
