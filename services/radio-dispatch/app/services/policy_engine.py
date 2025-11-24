"""Policy automation engine for dispatch actions."""

from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.policy import DispatchPolicy, PolicyExecution
from app.models.radio import RadioTransmission
from app.core.logging import get_logger

logger = get_logger(__name__)


class PolicyEngine:
    """Engine for evaluating and executing dispatch policies."""

    def __init__(self, db_session: AsyncSession, fleet_api_client):
        """
        Initialize policy engine.

        Args:
            db_session: Database session
            fleet_api_client: Fleet API client for creating incidents/tasks
        """
        self.db = db_session
        self.fleet_api = fleet_api_client

    async def evaluate_transmission(
        self,
        transmission: RadioTransmission
    ) -> List[PolicyExecution]:
        """
        Evaluate transmission against all active policies.

        Args:
            transmission: Radio transmission to evaluate

        Returns:
            List of policy executions (may be pending approval)
        """
        try:
            logger.info("Evaluating transmission against policies",
                        transmission_id=str(transmission.id))

            # Get active policies for this org, ordered by priority
            result = await self.db.execute(
                select(DispatchPolicy)
                .where(
                    DispatchPolicy.org_id == transmission.org_id,
                    DispatchPolicy.is_active == True
                )
                .order_by(DispatchPolicy.priority.desc())
            )
            policies = result.scalars().all()

            logger.info(f"Found {len(policies)} active policies to evaluate")

            executions = []
            for policy in policies:
                execution = await self._evaluate_policy(policy, transmission)
                if execution:
                    executions.append(execution)

            return executions

        except Exception as e:
            logger.error("Policy evaluation failed",
                         error=str(e),
                         transmission_id=str(transmission.id))
            raise

    async def _evaluate_policy(
        self,
        policy: DispatchPolicy,
        transmission: RadioTransmission
    ) -> Optional[PolicyExecution]:
        """
        Evaluate a single policy against transmission.

        Args:
            policy: Policy to evaluate
            transmission: Transmission to check

        Returns:
            PolicyExecution if conditions matched, None otherwise
        """
        try:
            # Check if conditions match
            matched = await self._check_conditions(policy.conditions, transmission)

            if not matched:
                return None

            logger.info("Policy conditions matched",
                        policy_id=str(policy.id),
                        policy_name=policy.name,
                        operating_mode=policy.operating_mode)

            # Create execution record
            execution = PolicyExecution(
                id=uuid.uuid4(),
                policy_id=policy.id,
                transmission_id=transmission.id,
                conditions_matched=policy.conditions,
                actions_executed=[],
                execution_status="pending_approval" if policy.operating_mode == "hitl" else "pending",
                requires_approval=(policy.operating_mode == "hitl"),
                executed_at=datetime.utcnow()
            )

            # Execute actions based on operating mode
            if policy.operating_mode == "monitor_only":
                execution.execution_status = "monitored"
                logger.info("Monitor-only mode: no actions taken")

            elif policy.operating_mode == "autonomous":
                # Execute immediately
                await self._execute_actions(policy.actions, transmission, execution)
                execution.execution_status = "executed"

            elif policy.operating_mode == "hitl":
                # Hold for human approval
                execution.execution_status = "pending_approval"
                logger.info("HITL mode: awaiting approval")

            # Save execution
            self.db.add(execution)
            await self.db.commit()

            # Update policy last triggered
            policy.last_triggered_at = datetime.utcnow()
            await self.db.commit()

            return execution

        except Exception as e:
            logger.error("Policy evaluation error",
                         error=str(e),
                         policy_id=str(policy.id))
            return None

    async def _check_conditions(
        self,
        conditions: Dict[str, Any],
        transmission: RadioTransmission
    ) -> bool:
        """
        Check if transmission matches policy conditions.

        Condition format:
        {
            "all": [
                {"field": "priority", "operator": "equals", "value": "CRITICAL"},
                {"field": "intent", "operator": "in", "value": ["medical_emergency", "fire"]}
            ]
        }
        or
        {
            "any": [
                {"field": "tags", "operator": "contains", "value": "emergency"},
                {"field": "entities.unit_ids", "operator": "not_empty"}
            ]
        }
        """
        try:
            # Handle "all" conditions (AND logic)
            if "all" in conditions:
                return all(
                    self._check_single_condition(cond, transmission)
                    for cond in conditions["all"]
                )

            # Handle "any" conditions (OR logic)
            if "any" in conditions:
                return any(
                    self._check_single_condition(cond, transmission)
                    for cond in conditions["any"]
                )

            # Single condition
            return self._check_single_condition(conditions, transmission)

        except Exception as e:
            logger.error("Condition check failed", error=str(e))
            return False

    def _check_single_condition(
        self,
        condition: Dict[str, Any],
        transmission: RadioTransmission
    ) -> bool:
        """Check a single condition against transmission."""
        field = condition["field"]
        operator = condition["operator"]
        expected_value = condition["value"]

        # Get actual value from transmission
        actual_value = self._get_field_value(field, transmission)

        # Apply operator
        if operator == "equals":
            return actual_value == expected_value
        elif operator == "not_equals":
            return actual_value != expected_value
        elif operator == "in":
            return actual_value in expected_value
        elif operator == "not_in":
            return actual_value not in expected_value
        elif operator == "contains":
            return expected_value in (actual_value or [])
        elif operator == "not_empty":
            return bool(actual_value)
        elif operator == "empty":
            return not bool(actual_value)
        elif operator == "greater_than":
            return float(actual_value or 0) > float(expected_value)
        elif operator == "less_than":
            return float(actual_value or 0) < float(expected_value)
        else:
            logger.warning(f"Unknown operator: {operator}")
            return False

    def _get_field_value(self, field: str, transmission: RadioTransmission) -> Any:
        """Get field value from transmission, supporting nested fields."""
        parts = field.split(".")
        value = transmission

        for part in parts:
            if hasattr(value, part):
                value = getattr(value, part)
            elif isinstance(value, dict) and part in value:
                value = value[part]
            else:
                return None

        return value

    async def _execute_actions(
        self,
        actions: List[Dict[str, Any]],
        transmission: RadioTransmission,
        execution: PolicyExecution
    ) -> None:
        """
        Execute policy actions.

        Action format:
        [
            {
                "action": "create_incident",
                "priority": "CRITICAL",
                "type": "emergency_response"
            },
            {
                "action": "create_task",
                "title": "Dispatch unit to {location}",
                "assigned_to": "dispatch_team"
            }
        ]
        """
        executed_actions = []

        for action in actions:
            action_type = action.get("action")

            try:
                if action_type == "create_incident":
                    incident_id = await self._create_incident(action, transmission)
                    execution.created_incident_id = incident_id
                    executed_actions.append({
                        "action": "create_incident",
                        "incident_id": str(incident_id)
                    })
                    logger.info("Created incident", incident_id=str(incident_id))

                elif action_type == "create_task":
                    task_id = await self._create_task(action, transmission)
                    if not execution.created_task_ids:
                        execution.created_task_ids = []
                    execution.created_task_ids.append(task_id)
                    executed_actions.append({
                        "action": "create_task",
                        "task_id": str(task_id)
                    })
                    logger.info("Created task", task_id=str(task_id))

                elif action_type == "notify":
                    await self._send_notification(action, transmission)
                    executed_actions.append({"action": "notify"})
                    logger.info("Sent notification")

                else:
                    logger.warning(f"Unknown action type: {action_type}")

            except Exception as e:
                logger.error("Action execution failed",
                             action=action_type,
                             error=str(e))
                executed_actions.append({
                    "action": action_type,
                    "error": str(e)
                })

        execution.actions_executed = executed_actions

    async def _create_incident(
        self,
        action: Dict[str, Any],
        transmission: RadioTransmission
    ) -> uuid.UUID:
        """Create incident via Fleet API."""
        # Extract location from entities
        location = ""
        if transmission.entities and "locations" in transmission.entities:
            locations = transmission.entities["locations"]
            if locations:
                location = locations[0]

        incident_data = {
            "title": f"Radio Dispatch: {transmission.intent or 'Incident'}",
            "description": transmission.transcript,
            "priority": action.get("priority", transmission.priority),
            "type": action.get("type", "radio_dispatch"),
            "location": location,
            "source_type": "radio",
            "source_transmission_id": str(transmission.id),
            "auto_created": True,
            "org_id": str(transmission.org_id)
        }

        return await self.fleet_api.create_incident(incident_data)

    async def _create_task(
        self,
        action: Dict[str, Any],
        transmission: RadioTransmission
    ) -> uuid.UUID:
        """Create task via Fleet API."""
        # Template substitution for title/description
        title = action.get("title", "Radio Dispatch Task")
        title = title.replace("{location}", self._extract_location(transmission))

        task_data = {
            "title": title,
            "description": transmission.transcript,
            "priority": transmission.priority,
            "assigned_to": action.get("assigned_to"),
            "source_type": "radio",
            "source_transmission_id": str(transmission.id),
            "auto_created": True,
            "org_id": str(transmission.org_id)
        }

        return await self.fleet_api.create_task(task_data)

    async def _send_notification(
        self,
        action: Dict[str, Any],
        transmission: RadioTransmission
    ) -> None:
        """Send notification (email, SMS, push, etc.)."""
        # TODO: Implement notification service
        logger.info("Notification action",
                    recipients=action.get("recipients"),
                    message=action.get("message"))

    def _extract_location(self, transmission: RadioTransmission) -> str:
        """Extract first location from entities."""
        if transmission.entities and "locations" in transmission.entities:
            locations = transmission.entities["locations"]
            if locations:
                return locations[0]
        return "Unknown"

    async def approve_execution(
        self,
        execution_id: uuid.UUID,
        approved_by: uuid.UUID,
        approval_notes: Optional[str] = None
    ) -> PolicyExecution:
        """Approve pending policy execution (HITL mode)."""
        # Get execution
        result = await self.db.execute(
            select(PolicyExecution).where(PolicyExecution.id == execution_id)
        )
        execution = result.scalar_one()

        if execution.execution_status != "pending_approval":
            raise ValueError(f"Execution not pending approval: {execution.execution_status}")

        # Get associated policy and transmission
        result = await self.db.execute(
            select(DispatchPolicy).where(DispatchPolicy.id == execution.policy_id)
        )
        policy = result.scalar_one()

        result = await self.db.execute(
            select(RadioTransmission).where(RadioTransmission.id == execution.transmission_id)
        )
        transmission = result.scalar_one()

        # Execute actions
        await self._execute_actions(policy.actions, transmission, execution)

        # Update execution
        execution.execution_status = "executed"
        execution.approved_by = approved_by
        execution.approved_at = datetime.utcnow()
        execution.approval_notes = approval_notes

        await self.db.commit()

        logger.info("Policy execution approved",
                    execution_id=str(execution_id),
                    approved_by=str(approved_by))

        return execution

    async def reject_execution(
        self,
        execution_id: uuid.UUID,
        rejected_by: uuid.UUID,
        rejection_reason: Optional[str] = None
    ) -> PolicyExecution:
        """Reject pending policy execution."""
        result = await self.db.execute(
            select(PolicyExecution).where(PolicyExecution.id == execution_id)
        )
        execution = result.scalar_one()

        execution.execution_status = "rejected"
        execution.approved_by = rejected_by
        execution.approved_at = datetime.utcnow()
        execution.approval_notes = rejection_reason

        await self.db.commit()

        logger.info("Policy execution rejected",
                    execution_id=str(execution_id),
                    rejected_by=str(rejected_by))

        return execution
