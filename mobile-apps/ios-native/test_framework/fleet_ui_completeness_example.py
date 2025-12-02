#!/usr/bin/env python3
"""
Fleet App UI Completeness Analysis Example

This script demonstrates how to use the UICompletenessOrchestrator
to analyze the Fleet application's UI completeness and generate a test plan.

Usage:
    python fleet_ui_completeness_example.py
"""

from __future__ import annotations
import json
import sys
from typing import Dict, Any
from pathlib import Path

# Add the test_framework directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from ui_completeness_orchestrator import UICompletenessOrchestrator, LLMClient, MULTI_AGENT_SPIDER_PROMPT
from rag_client import RAGClient, RAGDocument, InMemoryRAGClient
from test_models import new_id


class MockLLMClient(LLMClient):
    """
    Mock LLM client for testing purposes.

    In production, replace this with a real LLM client (OpenAI, Anthropic, etc.)
    """

    def complete(self, prompt: str) -> str:
        """
        Generate a mock UI completeness specification for the Fleet app.

        In a real implementation, this would call an actual LLM API.
        """
        # Mock response based on Fleet app knowledge
        spec = {
            "system": "Fleet",
            "base_url": "https://fleet.example.com",
            "coverage_areas": [
                {
                    "area": "Authentication & Authorization",
                    "routes": ["/login", "/logout", "/forgot-password", "/reset-password"],
                    "components": ["LoginForm", "AuthProvider", "ProtectedRoute"],
                    "api_endpoints": ["/api/auth/login", "/api/auth/logout", "/api/auth/refresh"],
                    "priority": "critical",
                    "estimated_effort": "1 day"
                },
                {
                    "area": "Vehicle Management",
                    "routes": ["/vehicles", "/vehicles/:id", "/vehicles/add", "/vehicles/:id/edit"],
                    "components": ["VehicleList", "VehicleDetail", "VehicleForm", "VehicleCard"],
                    "api_endpoints": ["/api/vehicles", "/api/vehicles/:id"],
                    "priority": "critical",
                    "estimated_effort": "2 days"
                },
                {
                    "area": "Dashboard & Analytics",
                    "routes": ["/dashboard", "/analytics", "/reports"],
                    "components": ["Dashboard", "MetricsCard", "ChartWidget", "ReportBuilder"],
                    "api_endpoints": ["/api/dashboard/metrics", "/api/analytics/data"],
                    "priority": "high",
                    "estimated_effort": "1.5 days"
                },
                {
                    "area": "Dispatch & Radio Communication",
                    "routes": ["/dispatch", "/dispatch/history", "/radio"],
                    "components": ["DispatchBoard", "RadioInterface", "DispatchHistory"],
                    "api_endpoints": ["/api/dispatch/active", "/api/radio/channels"],
                    "priority": "critical",
                    "estimated_effort": "2 days"
                },
                {
                    "area": "Maintenance Management",
                    "routes": ["/maintenance", "/maintenance/:id", "/maintenance/schedule"],
                    "components": ["MaintenanceList", "MaintenanceForm", "ServiceHistory"],
                    "api_endpoints": ["/api/maintenance", "/api/maintenance/schedule"],
                    "priority": "high",
                    "estimated_effort": "1.5 days"
                },
                {
                    "area": "Driver Management",
                    "routes": ["/drivers", "/drivers/:id", "/drivers/add"],
                    "components": ["DriverList", "DriverProfile", "DriverForm"],
                    "api_endpoints": ["/api/drivers", "/api/drivers/:id"],
                    "priority": "high",
                    "estimated_effort": "1 day"
                },
                {
                    "area": "Procurement & Inventory",
                    "routes": ["/procurement", "/inventory", "/purchase-orders"],
                    "components": ["ProcurementDashboard", "InventoryList", "PurchaseOrderForm"],
                    "api_endpoints": ["/api/procurement", "/api/inventory"],
                    "priority": "medium",
                    "estimated_effort": "2 days"
                },
                {
                    "area": "Damage Detection & 3D Visualization",
                    "routes": ["/damage-detection", "/3d-viewer"],
                    "components": ["DamageDetector", "ThreeDViewer", "TriPOSRIntegration"],
                    "api_endpoints": ["/api/damage/detect", "/api/3d/models"],
                    "priority": "high",
                    "estimated_effort": "2 days"
                },
                {
                    "area": "Maps & Route Optimization",
                    "routes": ["/maps", "/routes", "/route-optimizer"],
                    "components": ["MapView", "RouteOptimizer", "LocationTracker"],
                    "api_endpoints": ["/api/maps/geocode", "/api/routes/optimize"],
                    "priority": "high",
                    "estimated_effort": "1.5 days"
                }
            ],
            "user_roles": [
                {
                    "role": "admin",
                    "permissions": ["all"],
                    "critical_flows": [
                        "User management and role assignment",
                        "System configuration and settings",
                        "Full CRUD on all entities"
                    ]
                },
                {
                    "role": "dispatcher",
                    "permissions": ["dispatch", "vehicles", "drivers", "radio"],
                    "critical_flows": [
                        "Assign vehicles to drivers",
                        "Monitor vehicle locations",
                        "Communicate via radio",
                        "Create and manage dispatch orders"
                    ]
                },
                {
                    "role": "mechanic",
                    "permissions": ["maintenance", "vehicles_read"],
                    "critical_flows": [
                        "View maintenance schedules",
                        "Update service records",
                        "Record damage assessments"
                    ]
                },
                {
                    "role": "driver",
                    "permissions": ["vehicles_read", "own_profile"],
                    "critical_flows": [
                        "View assigned vehicle",
                        "Update vehicle status",
                        "Report issues"
                    ]
                }
            ],
            "test_plan": [
                {
                    "description": "Verify authentication flow with valid credentials for all user roles",
                    "category": "ui",
                    "depends_on": [],
                    "priority": "critical",
                    "estimated_duration": "30 minutes",
                    "coverage_areas": ["Authentication & Authorization"]
                },
                {
                    "description": "Test vehicle CRUD operations with proper authorization checks",
                    "category": "ui",
                    "depends_on": ["Verify authentication flow with valid credentials for all user roles"],
                    "priority": "critical",
                    "estimated_duration": "1 hour",
                    "coverage_areas": ["Vehicle Management"]
                },
                {
                    "description": "Validate dashboard loads correctly with metrics and charts",
                    "category": "ui",
                    "depends_on": ["Verify authentication flow with valid credentials for all user roles"],
                    "priority": "high",
                    "estimated_duration": "45 minutes",
                    "coverage_areas": ["Dashboard & Analytics"]
                },
                {
                    "description": "Test dispatch board real-time updates and radio communication",
                    "category": "ui",
                    "depends_on": ["Verify authentication flow with valid credentials for all user roles"],
                    "priority": "critical",
                    "estimated_duration": "1.5 hours",
                    "coverage_areas": ["Dispatch & Radio Communication"]
                },
                {
                    "description": "Verify maintenance scheduling and service history tracking",
                    "category": "ui",
                    "depends_on": ["Test vehicle CRUD operations with proper authorization checks"],
                    "priority": "high",
                    "estimated_duration": "1 hour",
                    "coverage_areas": ["Maintenance Management"]
                },
                {
                    "description": "Test driver management with profile updates and assignments",
                    "category": "ui",
                    "depends_on": ["Verify authentication flow with valid credentials for all user roles"],
                    "priority": "high",
                    "estimated_duration": "45 minutes",
                    "coverage_areas": ["Driver Management"]
                },
                {
                    "description": "Validate procurement workflow from request to purchase order",
                    "category": "ui",
                    "depends_on": ["Verify authentication flow with valid credentials for all user roles"],
                    "priority": "medium",
                    "estimated_duration": "1 hour",
                    "coverage_areas": ["Procurement & Inventory"]
                },
                {
                    "description": "Test damage detection upload and AI processing",
                    "category": "ui",
                    "depends_on": ["Test vehicle CRUD operations with proper authorization checks"],
                    "priority": "high",
                    "estimated_duration": "1 hour",
                    "coverage_areas": ["Damage Detection & 3D Visualization"]
                },
                {
                    "description": "Verify map integration and route optimization functionality",
                    "category": "ui",
                    "depends_on": ["Test vehicle CRUD operations with proper authorization checks"],
                    "priority": "high",
                    "estimated_duration": "1 hour",
                    "coverage_areas": ["Maps & Route Optimization"]
                },
                {
                    "description": "Test responsive design across mobile, tablet, and desktop",
                    "category": "ui",
                    "depends_on": [],
                    "priority": "high",
                    "estimated_duration": "2 hours",
                    "coverage_areas": ["Authentication & Authorization", "Vehicle Management", "Dashboard & Analytics"]
                },
                {
                    "description": "Validate accessibility with screen readers and keyboard navigation",
                    "category": "ui",
                    "depends_on": [],
                    "priority": "high",
                    "estimated_duration": "2 hours",
                    "coverage_areas": ["Authentication & Authorization", "Vehicle Management", "Dashboard & Analytics"]
                },
                {
                    "description": "Performance testing for dashboard and large data lists",
                    "category": "perf",
                    "depends_on": ["Validate dashboard loads correctly with metrics and charts"],
                    "priority": "high",
                    "estimated_duration": "1 hour",
                    "coverage_areas": ["Dashboard & Analytics", "Vehicle Management"]
                },
                {
                    "description": "Security testing for authorization boundaries and CSRF protection",
                    "category": "security",
                    "depends_on": ["Verify authentication flow with valid credentials for all user roles"],
                    "priority": "critical",
                    "estimated_duration": "2 hours",
                    "coverage_areas": ["Authentication & Authorization"]
                },
                {
                    "description": "API integration testing for all critical endpoints",
                    "category": "api",
                    "depends_on": [],
                    "priority": "critical",
                    "estimated_duration": "3 hours",
                    "coverage_areas": ["Vehicle Management", "Dispatch & Radio Communication", "Maintenance Management"]
                }
            ],
            "gaps_and_risks": [
                {
                    "gap": "Mobile app testing not included in current plan",
                    "severity": "high",
                    "mitigation": "Add dedicated iOS and Android testing phases"
                },
                {
                    "gap": "WebSocket/real-time communication testing needs expansion",
                    "severity": "medium",
                    "mitigation": "Create dedicated real-time communication test suite"
                },
                {
                    "gap": "Third-party service integration mocking strategy unclear",
                    "severity": "medium",
                    "mitigation": "Implement comprehensive mocking layer for external services"
                },
                {
                    "gap": "Offline mode functionality not tested",
                    "severity": "low",
                    "mitigation": "Add offline scenario testing for mobile apps"
                }
            ],
            "metrics": {
                "total_routes": 35,
                "total_components": 45,
                "total_api_endpoints": 28,
                "estimated_total_effort": "18 days",
                "coverage_percentage": 85
            }
        }

        return json.dumps(spec, indent=2)


def seed_fleet_rag_data(rag: RAGClient) -> None:
    """
    Seed the RAG client with Fleet app documentation and context.

    In a real scenario, this would be populated from actual codebase analysis,
    API documentation, database schemas, etc.
    """

    documents = [
        # Code/Repository context
        RAGDocument(
            id=new_id("DOC"),
            namespace="code",
            title="Fleet App Overview",
            kind="documentation",
            content="""
            Fleet is a comprehensive vehicle fleet management system built with React, TypeScript, and Vite.
            It includes modules for vehicle tracking, dispatch, maintenance, driver management, procurement,
            and AI-powered damage detection with 3D visualization.
            """,
            metadata={"system": "Fleet", "type": "overview"}
        ),

        # UI/Router context
        RAGDocument(
            id=new_id("DOC"),
            namespace="ui",
            title="Fleet UI Routes",
            kind="routes",
            content="""
            Main routes:
            - /login, /dashboard, /vehicles, /drivers, /dispatch, /maintenance
            - /procurement, /inventory, /damage-detection, /3d-viewer
            - /maps, /routes, /analytics, /reports, /settings

            Uses React Router v7 with nested routes and protected route wrappers.
            """,
            metadata={"system": "Fleet", "type": "routing"}
        ),

        # API context
        RAGDocument(
            id=new_id("DOC"),
            namespace="api",
            title="Fleet API Endpoints",
            kind="api_spec",
            content="""
            REST API endpoints:
            - /api/auth/* - Authentication and authorization
            - /api/vehicles/* - Vehicle CRUD operations
            - /api/drivers/* - Driver management
            - /api/dispatch/* - Dispatch operations
            - /api/maintenance/* - Maintenance scheduling and tracking
            - /api/procurement/* - Procurement and inventory
            - /api/damage/detect - AI damage detection
            - /api/3d/models - 3D model generation (TriPOSR)
            - /api/maps/* - Geocoding and mapping
            - /api/routes/optimize - Route optimization
            """,
            metadata={"system": "Fleet", "type": "api"}
        ),

        # Database context
        RAGDocument(
            id=new_id("DOC"),
            namespace="database",
            title="Fleet Database Schema",
            kind="schema",
            content="""
            Main tables: users, vehicles, drivers, dispatch_orders, maintenance_records,
            purchase_orders, inventory_items, damage_reports, service_history

            Uses Firestore for primary data storage with real-time sync capabilities.
            """,
            metadata={"system": "Fleet", "type": "database"}
        ),

        # Design system context
        RAGDocument(
            id=new_id("DOC"),
            namespace="design_system",
            title="Fleet Design System",
            kind="design",
            content="""
            Built with Radix UI primitives and Tailwind CSS.
            Components in /src/components/ui following shadcn/ui patterns.
            Responsive design with mobile-first approach.
            Dark mode support via next-themes.
            """,
            metadata={"system": "Fleet", "type": "design"}
        ),

        # Authorization context
        RAGDocument(
            id=new_id("DOC"),
            namespace="authz",
            title="Fleet Authorization Model",
            kind="authz",
            content="""
            Roles: admin, dispatcher, mechanic, driver, viewer
            Permission-based access control with role hierarchies.
            Feature flags for gradual rollouts and A/B testing.
            Environment-specific configurations in .env files.
            """,
            metadata={"system": "Fleet", "type": "authorization"}
        ),

        # NFR context
        RAGDocument(
            id=new_id("DOC"),
            namespace="nfr",
            title="Fleet Non-Functional Requirements",
            kind="nfr",
            content="""
            Performance: Pages should load in <2s, API responses <500ms
            Availability: 99.9% uptime SLA
            Security: HTTPS only, CSRF protection, input validation
            Accessibility: WCAG 2.1 AA compliance
            Browser support: Chrome, Firefox, Safari, Edge (last 2 versions)
            Mobile: iOS 14+, Android 10+
            """,
            metadata={"system": "Fleet", "type": "nfr"}
        ),

        # Analytics context
        RAGDocument(
            id=new_id("DOC"),
            namespace="analytics",
            title="Fleet Analytics Requirements",
            kind="analytics",
            content="""
            Track user interactions, page views, feature usage
            Monitor performance metrics (Core Web Vitals)
            Track business metrics: vehicles active, dispatch efficiency, maintenance costs
            Error tracking and monitoring with sentry-like integration
            """,
            metadata={"system": "Fleet", "type": "analytics"}
        ),
    ]

    rag.add_documents(documents)
    print(f"✓ Seeded {len(documents)} documents into RAG")


def main():
    """Main execution function"""
    print("=" * 70)
    print("Fleet App UI Completeness Analysis")
    print("=" * 70)
    print()

    # Initialize clients
    print("1. Initializing RAG and LLM clients...")
    rag = InMemoryRAGClient()
    llm = MockLLMClient()
    print("   ✓ Clients initialized")
    print()

    # Seed RAG with Fleet app context
    print("2. Seeding RAG with Fleet app context...")
    seed_fleet_rag_data(rag)
    print()

    # Create orchestrator
    print("3. Creating UI Completeness Orchestrator...")
    orchestrator = UICompletenessOrchestrator(llm=llm, rag=rag)
    print("   ✓ Orchestrator created")
    print()

    # Build completeness specification
    print("4. Building UI completeness specification...")
    spec = orchestrator.build_completeness_spec(
        system_name="Fleet",
        base_url="https://fleet.example.com"
    )
    print("   ✓ Specification generated")
    print()

    # Display key metrics
    print("5. Specification Summary:")
    print(f"   - System: {spec.get('system', 'N/A')}")
    print(f"   - Coverage Areas: {len(spec.get('coverage_areas', []))}")
    print(f"   - User Roles: {len(spec.get('user_roles', []))}")
    print(f"   - Test Tasks: {len(spec.get('test_plan', []))}")
    print(f"   - Identified Gaps: {len(spec.get('gaps_and_risks', []))}")

    metrics = spec.get('metrics', {})
    print(f"   - Total Routes: {metrics.get('total_routes', 0)}")
    print(f"   - Total Components: {metrics.get('total_components', 0)}")
    print(f"   - Total API Endpoints: {metrics.get('total_api_endpoints', 0)}")
    print(f"   - Estimated Effort: {metrics.get('estimated_total_effort', 'N/A')}")
    print(f"   - Coverage %: {metrics.get('coverage_percentage', 0)}%")
    print()

    # Generate test plan
    print("6. Generating executable test plan...")
    test_plan = orchestrator.plan_from_spec(spec)
    print(f"   ✓ Test plan created with {len(test_plan.tasks)} tasks")
    print()

    # Display test plan summary
    print("7. Test Plan Summary:")
    for i, task in enumerate(test_plan.tasks, 1):
        status_icon = "○" if task.status.value == "pending" else "●"
        print(f"   {status_icon} [{task.category}] {task.description[:80]}...")
    print()

    # Save specification to file
    output_file = Path(__file__).parent / "fleet_ui_completeness_spec.json"
    print(f"8. Saving specification to {output_file.name}...")
    with open(output_file, 'w') as f:
        json.dump(spec, f, indent=2)
    print(f"   ✓ Specification saved")
    print()

    print("=" * 70)
    print("Analysis complete!")
    print("=" * 70)
    print()
    print("Next steps:")
    print("  1. Review the generated specification in fleet_ui_completeness_spec.json")
    print("  2. Customize the test plan based on your priorities")
    print("  3. Replace MockLLMClient with a real LLM integration")
    print("  4. Expand RAG seeding with actual codebase analysis")
    print("  5. Execute the test plan using your preferred test runner")
    print()


if __name__ == "__main__":
    main()
