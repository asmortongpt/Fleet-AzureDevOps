"""
Pytest configuration and fixtures for API testing
"""
import pytest
import requests
from faker import Faker
from typing import Generator
import os
from dotenv import load_dotenv

load_dotenv()

# Base URL for API tests
BASE_URL = os.getenv("API_BASE_URL", "http://localhost:5000")
API_URL = f"{BASE_URL}/api"

fake = Faker()


@pytest.fixture(scope="session")
def api_base_url():
    """Provide the base API URL"""
    return API_URL


@pytest.fixture(scope="session")
def auth_token():
    """
    Authenticate and return a valid auth token
    For now, returns a mock token. Implement actual auth when ready.
    """
    # TODO: Implement actual authentication
    return "mock_token_for_testing"


@pytest.fixture
def api_client(auth_token):
    """
    Provide an authenticated API client session
    """
    session = requests.Session()
    session.headers.update({
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    })
    session.base_url = API_URL
    return session


@pytest.fixture
def fake_vehicle_data():
    """Generate fake vehicle data for testing"""
    return {
        "vin": fake.bothify(text="?????????????????", letters="ABCDEFGHJKLMNPRSTUVWXYZ0123456789"),
        "make": fake.random_element(elements=("Ford", "Chevrolet", "Toyota", "Honda", "Ram")),
        "model": fake.random_element(elements=("F-150", "Silverado", "Tacoma", "Civic", "1500")),
        "year": fake.random_int(min=2015, max=2024),
        "license_plate": fake.license_plate(),
        "vehicle_type": fake.random_element(elements=("Sedan", "SUV", "Truck", "Van")),
        "color": fake.color_name(),
        "status": "Active"
    }


@pytest.fixture
def fake_driver_data():
    """Generate fake driver data for testing"""
    return {
        "first_name": fake.first_name(),
        "last_name": fake.last_name(),
        "email": fake.email(),
        "phone": fake.phone_number(),
        "license_number": fake.bothify(text="??########", letters="ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
        "license_expiry": fake.future_date(end_date="+2y").isoformat(),
        "hire_date": fake.past_date(start_date="-2y").isoformat()
    }


@pytest.fixture
def fake_work_order_data():
    """Generate fake work order data for testing"""
    return {
        "title": f"{fake.random_element(elements=('Oil Change', 'Tire Rotation', 'Brake Service', 'Engine Repair'))}",
        "description": fake.text(max_nb_chars=200),
        "priority": fake.random_element(elements=("Low", "Medium", "High", "Critical")),
        "estimated_cost": fake.random_int(min=100, max=5000),
        "scheduled_date": fake.future_date(end_date="+30d").isoformat()
    }


@pytest.fixture
def fake_geofence_data():
    """Generate fake geofence data for testing"""
    return {
        "name": f"{fake.city()} Geofence",
        "type": "circular",
        "center": {
            "latitude": float(fake.latitude()),
            "longitude": float(fake.longitude())
        },
        "radius": fake.random_int(min=100, max=5000),
        "alert_on_entry": True,
        "alert_on_exit": True
    }


@pytest.fixture(autouse=True)
def setup_and_teardown():
    """
    Setup and teardown for each test
    """
    # Setup
    yield
    # Teardown
    # Add cleanup logic here if needed


def pytest_configure(config):
    """
    Configure pytest with custom markers
    """
    config.addinivalue_line("markers", "integration: mark test as integration test")
    config.addinivalue_line("markers", "api: mark test as API test")
    config.addinivalue_line("markers", "smoke: mark test as smoke test")
    config.addinivalue_line("markers", "slow: mark test as slow running")
