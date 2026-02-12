"""
WebSocket authentication and authorization.
Validates JWT tokens and manages user sessions.
"""
import logging
from typing import Optional, Dict, Any
from datetime import datetime
import jwt
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError

logger = logging.getLogger(__name__)


class AuthenticationError(Exception):
    """Raised when authentication fails."""
    pass


class AuthorizationError(Exception):
    """Raised when authorization fails."""
    pass


class WebSocketAuth:
    """Handles authentication and authorization for WebSocket connections."""

    def __init__(self, jwt_secret: str, jwt_algorithm: str = "HS256"):
        """
        Initialize WebSocket authentication handler.

        Args:
            jwt_secret: Secret key for JWT verification
            jwt_algorithm: JWT algorithm (default: HS256)
        """
        self.jwt_secret = jwt_secret
        self.jwt_algorithm = jwt_algorithm
        self.active_sessions: Dict[str, Dict[str, Any]] = {}

    def validate_token(self, token: str) -> Dict[str, Any]:
        """
        Validate JWT token and extract payload.

        Args:
            token: JWT token string

        Returns:
            Dict containing user info and claims

        Raises:
            AuthenticationError: If token is invalid or expired
        """
        try:
            # Decode and verify token
            payload = jwt.decode(
                token,
                self.jwt_secret,
                algorithms=[self.jwt_algorithm]
            )

            # Verify required claims
            required_claims = ["sub", "organization_id", "exp"]
            missing_claims = [claim for claim in required_claims if claim not in payload]
            if missing_claims:
                raise AuthenticationError(f"Missing required claims: {', '.join(missing_claims)}")

            # Check expiration
            exp_timestamp = payload.get("exp")
            if datetime.utcnow().timestamp() > exp_timestamp:
                raise AuthenticationError("Token has expired")

            logger.info(f"Token validated for user {payload.get('sub')}")
            return payload

        except ExpiredSignatureError:
            logger.warning("Expired JWT token presented")
            raise AuthenticationError("Token has expired")
        except InvalidTokenError as e:
            logger.warning(f"Invalid JWT token: {str(e)}")
            raise AuthenticationError(f"Invalid token: {str(e)}")
        except Exception as e:
            logger.error(f"Error validating token: {str(e)}")
            raise AuthenticationError(f"Authentication failed: {str(e)}")

    def authorize_room_access(self, user_payload: Dict[str, Any], room: str) -> bool:
        """
        Check if user is authorized to join a specific room.

        Args:
            user_payload: Decoded JWT payload
            room: Room identifier (e.g., "org:123:channel:456")

        Returns:
            True if authorized, False otherwise
        """
        try:
            # Parse room identifier
            parts = room.split(":")
            if len(parts) < 2:
                logger.warning(f"Invalid room format: {room}")
                return False

            room_type = parts[0]

            # Check organization-level access
            if room_type == "org":
                org_id = parts[1] if len(parts) > 1 else None
                user_org_id = str(user_payload.get("organization_id"))

                if org_id != user_org_id:
                    logger.warning(
                        f"User {user_payload.get('sub')} attempted to access "
                        f"room for organization {org_id} (user org: {user_org_id})"
                    )
                    return False

            # Check channel-level access
            elif room_type == "channel":
                # Verify organization matches
                if len(parts) >= 4 and parts[2] == "org":
                    org_id = parts[3]
                    user_org_id = str(user_payload.get("organization_id"))

                    if org_id != user_org_id:
                        return False

            # Check incident-level access
            elif room_type == "incident":
                # Incidents are organization-scoped
                if len(parts) >= 4 and parts[2] == "org":
                    org_id = parts[3]
                    user_org_id = str(user_payload.get("organization_id"))

                    if org_id != user_org_id:
                        return False

            # Check role-based permissions if specified
            required_role = self._get_required_role_for_room(room_type)
            if required_role:
                user_roles = user_payload.get("roles", [])
                if required_role not in user_roles and "admin" not in user_roles:
                    logger.warning(
                        f"User {user_payload.get('sub')} lacks required role "
                        f"{required_role} for room {room}"
                    )
                    return False

            return True

        except Exception as e:
            logger.error(f"Error authorizing room access: {str(e)}")
            return False

    def _get_required_role_for_room(self, room_type: str) -> Optional[str]:
        """
        Get required role for a room type.

        Args:
            room_type: Type of room (org, channel, incident)

        Returns:
            Required role name or None
        """
        role_requirements = {
            "org": None,  # All authenticated users can join org rooms
            "channel": "operator",  # Operators can join channel rooms
            "incident": "operator",  # Operators can join incident rooms
            "admin": "admin",  # Admin-only rooms
        }
        return role_requirements.get(room_type)

    def create_session(self, sid: str, user_payload: Dict[str, Any]) -> None:
        """
        Create a session for a connected client.

        Args:
            sid: Socket.IO session ID
            user_payload: Decoded JWT payload
        """
        self.active_sessions[sid] = {
            "user_id": user_payload.get("sub"),
            "organization_id": user_payload.get("organization_id"),
            "roles": user_payload.get("roles", []),
            "connected_at": datetime.utcnow().isoformat(),
            "rooms": set()
        }
        logger.info(f"Session created for user {user_payload.get('sub')}, sid={sid}")

    def get_session(self, sid: str) -> Optional[Dict[str, Any]]:
        """
        Get session data for a socket ID.

        Args:
            sid: Socket.IO session ID

        Returns:
            Session data or None if not found
        """
        return self.active_sessions.get(sid)

    def add_room_to_session(self, sid: str, room: str) -> None:
        """
        Add a room to a user's session.

        Args:
            sid: Socket.IO session ID
            room: Room identifier
        """
        if sid in self.active_sessions:
            self.active_sessions[sid]["rooms"].add(room)
            logger.debug(f"Added room {room} to session {sid}")

    def remove_room_from_session(self, sid: str, room: str) -> None:
        """
        Remove a room from a user's session.

        Args:
            sid: Socket.IO session ID
            room: Room identifier
        """
        if sid in self.active_sessions:
            self.active_sessions[sid]["rooms"].discard(room)
            logger.debug(f"Removed room {room} from session {sid}")

    def destroy_session(self, sid: str) -> None:
        """
        Destroy a session when client disconnects.

        Args:
            sid: Socket.IO session ID
        """
        if sid in self.active_sessions:
            user_id = self.active_sessions[sid].get("user_id")
            del self.active_sessions[sid]
            logger.info(f"Session destroyed for user {user_id}, sid={sid}")

    def get_active_sessions_count(self) -> int:
        """Get count of active sessions."""
        return len(self.active_sessions)

    def get_sessions_by_organization(self, organization_id: str) -> list:
        """
        Get all active sessions for an organization.

        Args:
            organization_id: Organization ID

        Returns:
            List of session IDs
        """
        return [
            sid for sid, session in self.active_sessions.items()
            if session.get("organization_id") == organization_id
        ]
