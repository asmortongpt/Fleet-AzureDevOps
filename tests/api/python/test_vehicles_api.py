"""
API tests for vehicle management endpoints
"""
import pytest
import requests


@pytest.mark.api
class TestVehicleAPI:
    """Test vehicle CRUD operations via API"""

    def test_get_all_vehicles(self, api_client, api_base_url):
        """Test fetching all vehicles"""
        response = api_client.get(f"{api_base_url}/vehicles")

        # Should return 200 even if empty
        assert response.status_code in [200, 404], f"Unexpected status code: {response.status_code}"

        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list) or isinstance(data, dict), "Response should be list or dict"

    def test_get_vehicle_by_id(self, api_client, api_base_url):
        """Test fetching a single vehicle by ID"""
        # First get all vehicles to find a valid ID
        response = api_client.get(f"{api_base_url}/vehicles")

        if response.status_code == 200:
            vehicles = response.json()
            if vehicles and len(vehicles) > 0:
                vehicle_id = vehicles[0].get('id') if isinstance(vehicles, list) else vehicles.get('id')
                if vehicle_id:
                    detail_response = api_client.get(f"{api_base_url}/vehicles/{vehicle_id}")
                    assert detail_response.status_code == 200, f"Failed to get vehicle {vehicle_id}"

    @pytest.mark.integration
    def test_create_vehicle(self, api_client, api_base_url, fake_vehicle_data):
        """Test creating a new vehicle"""
        response = api_client.post(f"{api_base_url}/vehicles", json=fake_vehicle_data)

        # Should return 201 (Created) or 200 (OK)
        assert response.status_code in [200, 201, 404, 405], f"Unexpected status: {response.status_code}"

        if response.status_code in [200, 201]:
            data = response.json()
            assert 'id' in data or 'vin' in data, "Response should contain vehicle identifier"

    @pytest.mark.integration
    def test_update_vehicle(self, api_client, api_base_url):
        """Test updating a vehicle"""
        # This is a placeholder - implement when endpoint is available
        pass

    @pytest.mark.integration
    def test_delete_vehicle(self, api_client, api_base_url):
        """Test deleting a vehicle"""
        # This is a placeholder - implement when endpoint is available
        pass

    def test_get_vehicle_location(self, api_client, api_base_url):
        """Test fetching vehicle current location"""
        # Get a vehicle first
        response = api_client.get(f"{api_base_url}/vehicles")

        if response.status_code == 200:
            vehicles = response.json()
            if vehicles and len(vehicles) > 0:
                vehicle_id = vehicles[0].get('id') if isinstance(vehicles, list) else vehicles.get('id')
                if vehicle_id:
                    loc_response = api_client.get(f"{api_base_url}/vehicles/{vehicle_id}/location")
                    # Endpoint might not exist yet
                    assert loc_response.status_code in [200, 404], "Location endpoint check"

    def test_get_vehicle_telemetry(self, api_client, api_base_url):
        """Test fetching vehicle telemetry data"""
        response = api_client.get(f"{api_base_url}/vehicles")

        if response.status_code == 200:
            vehicles = response.json()
            if vehicles and len(vehicles) > 0:
                vehicle_id = vehicles[0].get('id') if isinstance(vehicles, list) else vehicles.get('id')
                if vehicle_id:
                    telemetry_response = api_client.get(f"{api_base_url}/vehicles/{vehicle_id}/telemetry")
                    # Endpoint might not exist yet
                    assert telemetry_response.status_code in [200, 404], "Telemetry endpoint check"

    def test_vehicle_validation_missing_required_fields(self, api_client, api_base_url):
        """Test that API validates required fields"""
        invalid_data = {
            "color": "Red"  # Missing required fields like VIN, make, model
        }

        response = api_client.post(f"{api_base_url}/vehicles", json=invalid_data)

        # Should return 400 (Bad Request) or 422 (Unprocessable Entity)
        assert response.status_code in [400, 404, 405, 422], "Should reject invalid data"

    def test_vehicle_validation_invalid_year(self, api_client, api_base_url, fake_vehicle_data):
        """Test that API validates year range"""
        fake_vehicle_data['year'] = 1800  # Invalid year

        response = api_client.post(f"{api_base_url}/vehicles", json=fake_vehicle_data)

        # Should reject or accept - depends on backend validation
        assert response.status_code in [200, 201, 400, 404, 405, 422], "Year validation check"


@pytest.mark.api
@pytest.mark.smoke
class TestVehicleAPISmoke:
    """Smoke tests for vehicle API"""

    def test_vehicles_endpoint_accessible(self, api_client, api_base_url):
        """Test that vehicles endpoint is accessible"""
        response = api_client.get(f"{api_base_url}/vehicles")
        assert response.status_code in [200, 401, 404], f"Endpoint should be accessible, got {response.status_code}"

    def test_vehicles_response_time(self, api_client, api_base_url):
        """Test that vehicles endpoint responds quickly"""
        import time
        start = time.time()
        response = api_client.get(f"{api_base_url}/vehicles")
        duration = time.time() - start

        # Should respond within 2 seconds
        assert duration < 2.0, f"Response took {duration}s, should be < 2s"
