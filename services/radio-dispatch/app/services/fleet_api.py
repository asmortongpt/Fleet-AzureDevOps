"""Fleet API client for creating incidents and tasks."""

import uuid
from typing import Dict, Any, Optional
import httpx

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class FleetAPIClient:
    """Client for interacting with Fleet Management API."""

    def __init__(self):
        """Initialize Fleet API client."""
        self.base_url = settings.FLEET_API_BASE_URL
        self.api_key = settings.FLEET_API_KEY
        self.timeout = httpx.Timeout(30.0)

    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with authentication."""
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def create_incident(self, incident_data: Dict[str, Any]) -> uuid.UUID:
        """
        Create incident in Fleet system.

        Args:
            incident_data: Incident details

        Returns:
            UUID of created incident

        Raises:
            Exception: If API call fails
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/incidents",
                    json=incident_data,
                    headers=self._get_headers()
                )
                response.raise_for_status()

                data = response.json()
                incident_id = uuid.UUID(data["id"])

                logger.info("Incident created via Fleet API",
                            incident_id=str(incident_id),
                            title=incident_data.get("title"))

                return incident_id

        except Exception as e:
            logger.error("Failed to create incident",
                         error=str(e),
                         incident_data=incident_data)
            raise

    async def create_task(self, task_data: Dict[str, Any]) -> uuid.UUID:
        """
        Create task in Fleet system.

        Args:
            task_data: Task details

        Returns:
            UUID of created task

        Raises:
            Exception: If API call fails
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/tasks",
                    json=task_data,
                    headers=self._get_headers()
                )
                response.raise_for_status()

                data = response.json()
                task_id = uuid.UUID(data["id"])

                logger.info("Task created via Fleet API",
                            task_id=str(task_id),
                            title=task_data.get("title"))

                return task_id

        except Exception as e:
            logger.error("Failed to create task",
                         error=str(e),
                         task_data=task_data)
            raise

    async def get_incident(self, incident_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        """Get incident details."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/incidents/{incident_id}",
                    headers=self._get_headers()
                )
                response.raise_for_status()
                return response.json()

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None
            raise

    async def get_task(self, task_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        """Get task details."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/tasks/{task_id}",
                    headers=self._get_headers()
                )
                response.raise_for_status()
                return response.json()

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None
            raise

    async def health_check(self) -> bool:
        """Check if Fleet API is accessible."""
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
                response = await client.get(
                    f"{self.base_url}/health",
                    headers=self._get_headers()
                )
                return response.status_code == 200

        except Exception as e:
            logger.warning("Fleet API health check failed", error=str(e))
            return False
