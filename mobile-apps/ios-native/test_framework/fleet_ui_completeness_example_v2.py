#!/usr/bin/env python3
"""
Fleet App UI Completeness Analysis Example (Enhanced Multi-Agent Version)

This script demonstrates the enhanced UI completeness orchestrator with comprehensive
multi-agent analysis including site maps, page audits, reactive components, analytics,
performance budgets, and deployment verification.

Usage:
    python fleet_ui_completeness_example_v2.py
"""

from __future__ import annotations
import json
import sys
from typing import Dict, Any
from pathlib import Path

# Add the test_framework directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from ui_completeness_orchestrator import UICompletenessOrchestrator, LLMClient
from rag_client import RAGDocument, InMemoryRAGClient
from test_models import new_id


class MockLLMClient(LLMClient):
    """
    Mock LLM client generating enhanced multi-agent spider output.

    In production, replace with real LLM (OpenAI, Anthropic, etc.)
    """

    def complete(self, prompt: str) -> str:
        """Generate comprehensive Fleet app completeness spec matching v1.0 schema"""

        spec = {
            "schema_version": "1.0",
            "system": "Fleet",

            # Complete site map with all pages discovered
            "site_map": [
                {
                    "page_key": "login",
                    "title": "Login",
                    "route": "/login",
                    "public": True,
                    "requires_auth": False,
                    "feature_flags": [],
                    "children": [],
                    "entry_points": ["/"]
                },
                {
                    "page_key": "dashboard",
                    "title": "Dashboard",
                    "route": "/dashboard",
                    "public": False,
                    "requires_auth": True,
                    "feature_flags": [],
                    "children": ["analytics", "reports"],
                    "entry_points": ["/login_success"]
                },
                {
                    "page_key": "vehicles",
                    "title": "Vehicles",
                    "route": "/vehicles",
                    "public": False,
                    "requires_auth": True,
                    "feature_flags": [],
                    "children": ["vehicles_detail", "vehicles_add", "vehicles_edit"],
                    "entry_points": ["/dashboard", "/"]
                },
                {
                    "page_key": "vehicles_detail",
                    "title": "Vehicle Detail",
                    "route": "/vehicles/:id",
                    "public": False,
                    "requires_auth": True,
                    "feature_flags": [],
                    "children": ["vehicles_telemetry", "vehicles_maintenance"],
                    "entry_points": ["/vehicles"]
                },
                {
                    "page_key": "dispatch",
                    "title": "Dispatch Board",
                    "route": "/dispatch",
                    "public": False,
                    "requires_auth": True,
                    "feature_flags": ["dispatch_v2"],
                    "children": ["dispatch_history"],
                    "entry_points": ["/dashboard"]
                },
                {
                    "page_key": "maintenance",
                    "title": "Maintenance",
                    "route": "/maintenance",
                    "public": False,
                    "requires_auth": True,
                    "feature_flags": [],
                    "children": ["maintenance_detail", "maintenance_schedule"],
                    "entry_points": ["/dashboard", "/vehicles/:id"]
                },
                {
                    "page_key": "drivers",
                    "title": "Drivers",
                    "route": "/drivers",
                    "public": False,
                    "requires_auth": True,
                    "feature_flags": [],
                    "children": ["drivers_detail"],
                    "entry_points": ["/dashboard"]
                },
                {
                    "page_key": "procurement",
                    "title": "Procurement",
                    "route": "/procurement",
                    "public": False,
                    "requires_auth": True,
                    "feature_flags": [],
                    "children": ["inventory", "purchase_orders", "vendors"],
                    "entry_points": ["/dashboard"]
                },
                {
                    "page_key": "damage_detection",
                    "title": "Damage Detection",
                    "route": "/damage-detection",
                    "public": False,
                    "requires_auth": True,
                    "feature_flags": ["ai_damage_detection"],
                    "children": ["3d_viewer"],
                    "entry_points": ["/vehicles/:id"]
                }
            ],

            # Detailed page audits with component-level analysis
            "page_audits": [
                {
                    "page_key": "vehicles",
                    "states": ["loading", "empty", "error", "ok", "permission_denied", "offline"],
                    "components": [
                        {
                            "key": "vehicle_table",
                            "type": "DataTable",
                            "props_summary": "paginated, sortable, filterable, real-time updates",
                            "actions": [
                                {
                                    "control": "btn_new_vehicle",
                                    "kind": "button",
                                    "handler": "onCreateVehicle",
                                    "api": "POST /api/vehicles",
                                    "fully_wired": True
                                },
                                {
                                    "control": "btn_bulk_delete",
                                    "kind": "button",
                                    "handler": "onBulkDelete",
                                    "api": "DELETE /api/vehicles?ids=",
                                    "fully_wired": True,
                                    "issues": []
                                },
                                {
                                    "control": "filter_status",
                                    "kind": "dropdown",
                                    "handler": "onFilterChange",
                                    "api": None,
                                    "fully_wired": True
                                }
                            ],
                            "drilldowns": [
                                {"level": 1, "from": "row_click", "to_page_key": "vehicles_detail"},
                                {"level": 2, "from": "tab:telemetry", "to_page_key": "vehicles_telemetry"},
                                {"level": 3, "from": "view_event_log", "to_page_key": "vehicles_events"}
                            ],
                            "reactivity": {
                                "mode": "ws",
                                "interval_ms": 5000,
                                "stale_after_s": 30,
                                "retry": "exp_backoff",
                                "cache": "stale_while_revalidate"
                            }
                        },
                        {
                            "key": "vehicle_map",
                            "type": "MapView",
                            "props_summary": "live location tracking, clustering enabled",
                            "actions": [
                                {
                                    "control": "marker_click",
                                    "kind": "interaction",
                                    "handler": "onMarkerClick",
                                    "api": None,
                                    "fully_wired": True
                                }
                            ],
                            "drilldowns": [
                                {"level": 1, "from": "marker_click", "to_page_key": "vehicles_detail"}
                            ],
                            "reactivity": {
                                "mode": "ws",
                                "interval_ms": 2000,
                                "stale_after_s": 15,
                                "retry": "exp_backoff",
                                "cache": "memory"
                            }
                        }
                    ],
                    "analytics": [
                        {
                            "event": "vehicles_page_viewed/v1",
                            "on": "page_load",
                            "props": {"org_id": "string", "count": "number"},
                            "pii": "none"
                        },
                        {
                            "event": "vehicle_created/v1",
                            "on": "btn_new_vehicle_success",
                            "props": {"vehicle_id": "string", "type": "string"},
                            "pii": "internal"
                        },
                        {
                            "event": "vehicle_filter_applied/v1",
                            "on": "filter_change",
                            "props": {"filter_type": "string", "value": "string"},
                            "pii": "none"
                        }
                    ],
                    "perf_budget": {
                        "LCP_ms": 2500,
                        "INP_ms": 200,
                        "CLS": 0.1,
                        "max_js_gzip_kb": 220,
                        "map_sdk_exempt": True
                    },
                    "a11y": {
                        "wcag": "2.2AA",
                        "keyboard_traps": [],
                        "contrast_failures": [],
                        "aria_issues": []
                    },
                    "i18n": {
                        "languages": ["en"],
                        "missing_keys": []
                    },
                    "responsive": {
                        "breakpoints": ["xs", "sm", "md", "lg", "xl"],
                        "issues": []
                    },
                    "incomplete": False,
                    "issues": []
                },
                {
                    "page_key": "dispatch",
                    "states": ["loading", "error", "ok", "permission_denied"],
                    "components": [
                        {
                            "key": "dispatch_board",
                            "type": "KanbanBoard",
                            "props_summary": "drag-drop enabled, real-time sync",
                            "actions": [
                                {
                                    "control": "btn_create_dispatch",
                                    "kind": "button",
                                    "handler": "onCreateDispatch",
                                    "api": "POST /api/dispatch",
                                    "fully_wired": True
                                },
                                {
                                    "control": "card_drag",
                                    "kind": "interaction",
                                    "handler": "onDispatchMove",
                                    "api": "PATCH /api/dispatch/:id",
                                    "fully_wired": True
                                }
                            ],
                            "drilldowns": [
                                {"level": 1, "from": "card_click", "to_page_key": "dispatch_detail"}
                            ],
                            "reactivity": {
                                "mode": "ws",
                                "interval_ms": 1000,
                                "stale_after_s": 10,
                                "retry": "exp_backoff",
                                "cache": "optimistic_ui"
                            }
                        },
                        {
                            "key": "radio_interface",
                            "type": "WebRTCComponent",
                            "props_summary": "live audio, p2p connection",
                            "actions": [
                                {
                                    "control": "btn_ptt",
                                    "kind": "button",
                                    "handler": "onPushToTalk",
                                    "api": "WSS /radio/stream",
                                    "fully_wired": True
                                }
                            ],
                            "drilldowns": [],
                            "reactivity": {
                                "mode": "webrtc",
                                "interval_ms": 0,
                                "stale_after_s": 5,
                                "retry": "immediate",
                                "cache": "none"
                            }
                        }
                    ],
                    "analytics": [
                        {
                            "event": "dispatch_created/v1",
                            "on": "create_dispatch_success",
                            "props": {"dispatch_id": "string", "vehicle_id": "string", "driver_id": "string"},
                            "pii": "internal"
                        },
                        {
                            "event": "radio_transmission/v1",
                            "on": "ptt_release",
                            "props": {"duration_ms": "number", "channel_id": "string"},
                            "pii": "none"
                        }
                    ],
                    "perf_budget": {
                        "LCP_ms": 2000,
                        "INP_ms": 100,
                        "CLS": 0.05,
                        "max_js_gzip_kb": 250,
                        "map_sdk_exempt": False
                    },
                    "a11y": {
                        "wcag": "2.2AA",
                        "keyboard_traps": [],
                        "contrast_failures": [],
                        "aria_issues": ["radio_ptt missing keyboard shortcut hint"]
                    },
                    "i18n": {
                        "languages": ["en"],
                        "missing_keys": []
                    },
                    "responsive": {
                        "breakpoints": ["xs", "sm", "md", "lg", "xl"],
                        "issues": ["kanban cards stack on xs - acceptable UX"]
                    },
                    "incomplete": False,
                    "issues": [
                        {
                            "severity": "low",
                            "kind": "a11y_gap",
                            "summary": "PTT button lacks keyboard shortcut hint",
                            "evidence": "ARIA label present but no hint for spacebar shortcut"
                        }
                    ]
                }
            ],

            # Reactive/real-time components inventory
            "reactive_components": [
                {
                    "component_key": "live_vehicle_map",
                    "pages": ["dashboard", "vehicles", "vehicles_detail"],
                    "channel": "ws",
                    "source": "wss://{host}/api/telemetry",
                    "heartbeat_s": 20,
                    "reconnect": "exp_backoff",
                    "stale_threshold_s": 30,
                    "fallback": "poll 15s",
                    "offline_ui": "banner + last known positions + cached tiles",
                    "perf": {"max_markers": 5000, "cluster": True},
                    "observability": {
                        "metrics": ["telemetry_update_lag_ms", "ws_reconnects", "marker_render_time_ms"],
                        "logs": ["ws_error", "ws_drop", "stale_data_warning"]
                    }
                },
                {
                    "component_key": "dispatch_board_sync",
                    "pages": ["dispatch"],
                    "channel": "ws",
                    "source": "wss://{host}/api/dispatch/updates",
                    "heartbeat_s": 10,
                    "reconnect": "immediate",
                    "stale_threshold_s": 15,
                    "fallback": "optimistic UI with conflict resolution",
                    "offline_ui": "queue actions, sync on reconnect",
                    "perf": {"batch_updates": True, "debounce_ms": 500},
                    "observability": {
                        "metrics": ["dispatch_sync_lag_ms", "conflict_count", "optimistic_rollback_count"],
                        "logs": ["sync_conflict", "merge_strategy_applied"]
                    }
                },
                {
                    "component_key": "radio_audio_stream",
                    "pages": ["dispatch", "radio"],
                    "channel": "webrtc",
                    "source": "signaling: wss://{host}/api/radio/signal",
                    "heartbeat_s": 5,
                    "reconnect": "exp_backoff_with_turn_fallback",
                    "stale_threshold_s": 3,
                    "fallback": "TURN relay if P2P fails",
                    "offline_ui": "disconnected banner, log transcript only",
                    "perf": {"codec": "opus", "bitrate": "32kbps"},
                    "observability": {
                        "metrics": ["audio_latency_ms", "packet_loss_pct", "connection_quality"],
                        "logs": ["webrtc_ice_failed", "turn_relay_activated"]
                    }
                }
            ],

            # Analytics specification
            "analytics_spec": {
                "events": [
                    {
                        "name": "page_viewed/v1",
                        "triggers": ["route_change"],
                        "properties": {"page_key": "string", "org_id": "string", "user_role": "string"},
                        "pii": "internal",
                        "ownership": "product_analytics"
                    },
                    {
                        "name": "vehicle_created/v1",
                        "triggers": ["create_vehicle_success"],
                        "properties": {"vehicle_id": "string", "type": "string", "org_id": "string"},
                        "pii": "internal",
                        "ownership": "product_analytics"
                    },
                    {
                        "name": "dispatch_created/v1",
                        "triggers": ["create_dispatch_success"],
                        "properties": {"dispatch_id": "string", "vehicle_id": "string", "driver_id": "string"},
                        "pii": "internal",
                        "ownership": "product_analytics"
                    },
                    {
                        "name": "maintenance_scheduled/v1",
                        "triggers": ["schedule_maintenance_success"],
                        "properties": {"maintenance_id": "string", "vehicle_id": "string", "scheduled_date": "iso8601"},
                        "pii": "internal",
                        "ownership": "product_analytics"
                    },
                    {
                        "name": "report_exported/v1",
                        "triggers": ["export_click_success"],
                        "properties": {"report_type": "enum", "row_count": "number", "format": "enum"},
                        "pii": "sensitive",
                        "ownership": "business_intelligence"
                    },
                    {
                        "name": "error_occurred/v1",
                        "triggers": ["api_error", "ui_error"],
                        "properties": {"error_code": "string", "error_message": "string", "context": "object"},
                        "pii": "none",
                        "ownership": "engineering"
                    }
                ],
                "funnels": [
                    {
                        "name": "Vehicle Onboarding",
                        "steps": ["vehicles_page_viewed/v1", "btn_new_vehicle_clicked", "vehicle_created/v1"]
                    },
                    {
                        "name": "Create Dispatch",
                        "steps": ["dispatch_page_viewed/v1", "btn_create_dispatch_clicked", "dispatch_created/v1"]
                    },
                    {
                        "name": "Schedule Maintenance",
                        "steps": ["maintenance_page_viewed/v1", "btn_schedule_clicked", "maintenance_scheduled/v1"]
                    }
                ],
                "governance": {
                    "pii_classes": ["none", "internal", "sensitive"],
                    "retention_days": {"sensitive": 365, "internal": 730, "none": 1095},
                    "anonymization_required": ["sensitive"],
                    "consent_required": False
                }
            },

            # Performance and accessibility report
            "perf_a11y_report": {
                "core_web_vitals": {
                    "LCP_ms": 2200,
                    "INP_ms": 150,
                    "CLS": 0.08,
                    "violations": []
                },
                "bundle": {
                    "page_js_kb_gzip": [
                        {"page": "dashboard", "size_kb": 185},
                        {"page": "vehicles", "size_kb": 215},
                        {"page": "dispatch", "size_kb": 240},
                        {"page": "maintenance", "size_kb": 175}
                    ],
                    "heavy_modules": [
                        {"name": "azure-maps-control", "size_kb": 120, "exempt": True, "reason": "Map SDK"},
                        {"name": "@react-three/fiber", "size_kb": 85, "exempt": False, "reason": "3D viewer - code split recommended"}
                    ]
                },
                "a11y_findings": [
                    {
                        "severity": "low",
                        "wcag": "2.4.7",
                        "issue": "Focus indicator could be more prominent on radio PTT button",
                        "page": "dispatch",
                        "recommendation": "Increase outline width to 3px"
                    }
                ],
                "visual_regression_risk": [
                    "map marker popups (dynamic content)",
                    "virtualized tables (scroll position)",
                    "dispatch kanban during drag"
                ]
            },

            # Deployment verification plan
            "deployment_verification": {
                "synthetics": [
                    {
                        "name": "Homepage loads",
                        "url": "{BASE_URL_OR_NONE}/",
                        "assertions": ["status 200", "LCP<2500ms", "no console errors"]
                    },
                    {
                        "name": "Login flow",
                        "url": "{BASE_URL_OR_NONE}/login",
                        "assertions": ["csrf token present", "redirect to /dashboard on success", "error shown on invalid creds"]
                    },
                    {
                        "name": "Vehicles page loads with data",
                        "url": "{BASE_URL_OR_NONE}/vehicles",
                        "assertions": ["status 200", "table renders", ">=1 vehicle shown", "map displays"]
                    },
                    {
                        "name": "WebSocket telemetry connects",
                        "url": "{BASE_URL_OR_NONE}/dashboard",
                        "assertions": ["ws connection established", "first telemetry update <5s", "no reconnects in 30s"]
                    }
                ],
                "feature_flag_matrix": [
                    {"flag": "dispatch_v2", "environments": {"staging": True, "prod": False}},
                    {"flag": "ai_damage_detection", "environments": {"staging": True, "prod": True}},
                    {"flag": "mobile_offline_sync", "environments": {"staging": True, "prod": False}}
                ],
                "smoke_endpoints": [
                    {"method": "GET", "path": "/api/health", "expect": "ok"},
                    {"method": "GET", "path": "/api/vehicles", "expect": "200 with auth"},
                    {"method": "GET", "path": "/api/dispatch/active", "expect": "200 with auth"},
                    {"method": "POST", "path": "/api/auth/login", "expect": "200 or 401"}
                ]
            },

            # CSV export for test generation
            "csv_exports": {
                "PAGE_COMPONENT_MATRIX": [
                    ["vehicles", "vehicle_table", "btn_new_vehicle", "POST /api/vehicles", "true", "admin,dispatcher", "vehicle_created/v1"],
                    ["vehicles", "vehicle_table", "btn_bulk_delete", "DELETE /api/vehicles?ids=", "true", "admin", "vehicles_bulk_deleted/v1"],
                    ["vehicles", "vehicle_map", "marker_click", "none", "true", "", "vehicle_selected/v1"],
                    ["dispatch", "dispatch_board", "btn_create_dispatch", "POST /api/dispatch", "true", "admin,dispatcher", "dispatch_created/v1"],
                    ["dispatch", "radio_interface", "btn_ptt", "WSS /radio/stream", "true", "dispatcher", "radio_transmission/v1"],
                    ["maintenance", "maintenance_list", "btn_schedule", "POST /api/maintenance", "true", "admin,mechanic", "maintenance_scheduled/v1"]
                ]
            },

            # Test plan
            "test_plan": [
                {
                    "description": "Spider all routes (static + runtime if URL available) and verify handler bindings for each control",
                    "category": "ui"
                },
                {
                    "description": "Test all API endpoints for 200/401/403/404 responses; log dead endpoints",
                    "category": "api"
                },
                {
                    "description": "Validate analytics events fire on each trigger; check schema against spec",
                    "category": "integration"
                },
                {
                    "description": "Test WebSocket reconnection, backoff, and stale threshold handling for all reactive components",
                    "category": "data"
                },
                {
                    "description": "Measure Core Web Vitals on top 10 pages; enforce budgets (LCP≤2.5s, INP≤200ms, CLS≤0.1)",
                    "category": "perf"
                },
                {
                    "description": "Run automated a11y tests (axe-core); verify keyboard nav and ARIA on all forms",
                    "category": "ui"
                },
                {
                    "description": "Document and screenshot drilldown paths L1→L4 for each major KPI/table",
                    "category": "docs"
                },
                {
                    "description": "Scan codebase for TODO, FIXME, 'coming soon' markers; fail build if found in production code",
                    "category": "security"
                },
                {
                    "description": "Analyze bundle sizes; code-split heavy modules (e.g., 3D viewer) to meet per-page budget",
                    "category": "architecture"
                },
                {
                    "description": "Test offline mode: queue actions, verify sync on reconnect, check conflict resolution",
                    "category": "data"
                },
                {
                    "description": "Verify all states (loading/empty/error/permission_denied/offline) render correctly per page",
                    "category": "ui"
                },
                {
                    "description": "Run deployment verification synthetics against staging before prod deploy",
                    "category": "integration"
                }
            ],

            # Unknown/unclear items flagged for follow-up
            "unknowns": [
                {
                    "question": "Is the /api/vehicles/trace endpoint available in production?",
                    "evidence": "Router shows guarded route but no controller found in codebase"
                },
                {
                    "question": "What is the expected behavior for radio audio when >10 users join same channel?",
                    "evidence": "No load testing data or max participant limit documented"
                },
                {
                    "question": "Are there any A/B test variations active that would affect feature availability?",
                    "evidence": "Feature flags present but no A/B test config discovered"
                }
            ],

            # Executive summary
            "summary": """
Fleet application completeness assessment: Analyzed 9 major page areas with 40+ components and 28 API endpoints.
System demonstrates 90% functional completeness with strong reactive UX (WebSocket for live updates, optimistic UI).
All critical user flows (vehicle management, dispatch, maintenance) are fully wired with proper analytics instrumentation.
Performance budgets met on 8/9 pages (dispatch slightly over at 240KB due to WebRTC - acceptable given real-time needs).
Accessibility: WCAG 2.2 AA mostly compliant; 1 minor focus indicator issue on PTT button.
Deep drilldowns present for most KPIs (L1→L3); L4 raw trace views missing for 2 areas (flagged in unknowns).
Analytics: Comprehensive event catalog with 15+ versioned events, PII governance, and 3 conversion funnels defined.
Deployment readiness: 4 synthetic tests defined, feature flag matrix clear, smoke endpoints ready.
Biggest risks: (1) WebRTC scaling under high load needs validation, (2) 3D viewer bundle size requires code splitting,
(3) Trace endpoint availability unclear for production. Overall: production-ready with minor optimizations recommended.
            """.strip()
        }

        return json.dumps(spec, indent=2)


def seed_fleet_rag_data(rag):
    """Seed RAG with Fleet app context"""
    documents = [
        RAGDocument(
            id=new_id("DOC"),
            namespace="code",
            title="Fleet App Overview",
            kind="documentation",
            content="""
            Fleet is a comprehensive vehicle fleet management system built with React 19, TypeScript, and Vite.
            Backend uses Node.js with Express. Includes real-time features via WebSocket and WebRTC.
            Modules: vehicle tracking, dispatch, maintenance, driver management, procurement, AI damage detection.
            """,
            metadata={"system": "Fleet", "type": "overview"}
        ),
        RAGDocument(
            id=new_id("DOC"),
            namespace="ui",
            title="Fleet UI Routes",
            kind="routes",
            content="""
            Routes: /login, /dashboard, /vehicles, /vehicles/:id, /drivers, /dispatch, /maintenance,
            /procurement, /inventory, /damage-detection, /3d-viewer, /maps, /analytics, /reports
            React Router v7 with protected route wrappers and feature flag guards.
            """,
            metadata={"system": "Fleet", "type": "routing"}
        ),
        RAGDocument(
            id=new_id("DOC"),
            namespace="api",
            title="Fleet API Endpoints",
            kind="api_spec",
            content="""
            REST API: /api/auth/*, /api/vehicles/*, /api/drivers/*, /api/dispatch/*, /api/maintenance/*,
            /api/procurement/*, /api/damage/detect, /api/3d/models, /api/maps/*, /api/routes/optimize
            WebSocket: /api/telemetry, /api/dispatch/updates
            WebRTC signaling: /api/radio/signal
            """,
            metadata={"system": "Fleet", "type": "api"}
        ),
        RAGDocument(
            id=new_id("DOC"),
            namespace="database",
            title="Fleet Database Schema",
            kind="schema",
            content="""
            Firestore collections: users, organizations, vehicles, drivers, dispatch_orders,
            maintenance_records, purchase_orders, inventory_items, damage_reports, telemetry_events
            Multi-tenancy via org_id field. Real-time sync via Firestore listeners.
            """,
            metadata={"system": "Fleet", "type": "database"}
        ),
        RAGDocument(
            id=new_id("DOC"),
            namespace="design_system",
            title="Fleet Design System",
            kind="design",
            content="""
            Radix UI primitives + Tailwind CSS v4. Components in /src/components/ui (shadcn/ui pattern).
            Responsive mobile-first. Dark mode via next-themes. WCAG 2.2 AA target.
            """,
            metadata={"system": "Fleet", "type": "design"}
        ),
        RAGDocument(
            id=new_id("DOC"),
            namespace="authz",
            title="Fleet Authorization",
            kind="authz",
            content="""
            Roles: admin, dispatcher, mechanic, driver, viewer. Permission-based RBAC.
            Feature flags: dispatch_v2, ai_damage_detection, mobile_offline_sync
            Environments: dev, staging, production
            """,
            metadata={"system": "Fleet", "type": "authorization"}
        ),
        RAGDocument(
            id=new_id("DOC"),
            namespace="nfr",
            title="Fleet NFRs",
            kind="nfr",
            content="""
            Performance: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1, bundle ≤ 200KB/page (map SDK exempt)
            Availability: 99.9% uptime. Security: HTTPS, CSRF, input validation.
            Accessibility: WCAG 2.2 AA. Browsers: Chrome, Firefox, Safari, Edge (last 2 versions).
            Mobile: iOS 14+, Android 10+
            """,
            metadata={"system": "Fleet", "type": "nfr"}
        ),
        RAGDocument(
            id=new_id("DOC"),
            namespace="analytics",
            title="Fleet Analytics",
            kind="analytics",
            content="""
            Azure Application Insights for telemetry. Event versioning (e.g., vehicle_created/v1).
            PII classes: none, internal, sensitive. Retention: 1-3 years based on PII class.
            Funnels tracked: vehicle onboarding, dispatch creation, maintenance scheduling.
            """,
            metadata={"system": "Fleet", "type": "analytics"}
        ),
    ]

    rag.add_documents(documents)
    return len(documents)


def main():
    """Main execution"""
    print("=" * 80)
    print("Fleet App UI Completeness Analysis (Enhanced Multi-Agent Spider)")
    print("=" * 80)
    print()

    # Initialize
    print("1. Initializing RAG and LLM clients...")
    rag = InMemoryRAGClient()
    llm = MockLLMClient()
    print("   ✓ Clients initialized")
    print()

    # Seed RAG
    print("2. Seeding RAG with Fleet app context...")
    doc_count = seed_fleet_rag_data(rag)
    print(f"   ✓ Seeded {doc_count} documents")
    print()

    # Create orchestrator
    print("3. Creating UI Completeness Orchestrator...")
    orchestrator = UICompletenessOrchestrator(llm=llm, rag=rag)
    print("   ✓ Orchestrator created")
    print()

    # Build spec
    print("4. Building comprehensive UI completeness specification...")
    spec = orchestrator.build_completeness_spec(
        system_name="Fleet",
        base_url="https://fleet.example.com"
    )
    print("   ✓ Specification generated (schema v1.0)")
    print()

    # Display summary
    print("5. Specification Summary:")
    print(f"   Schema Version: {spec.get('schema_version', 'N/A')}")
    print(f"   System: {spec.get('system', 'N/A')}")
    print(f"   Site Map Pages: {len(spec.get('site_map', []))}")
    print(f"   Page Audits: {len(spec.get('page_audits', []))}")
    print(f"   Reactive Components: {len(spec.get('reactive_components', []))}")

    analytics = spec.get('analytics_spec', {})
    print(f"   Analytics Events: {len(analytics.get('events', []))}")
    print(f"   Conversion Funnels: {len(analytics.get('funnels', []))}")

    perf = spec.get('perf_a11y_report', {})
    vitals = perf.get('core_web_vitals', {})
    print(f"   Core Web Vitals: LCP={vitals.get('LCP_ms', 0)}ms, INP={vitals.get('INP_ms', 0)}ms, CLS={vitals.get('CLS', 0)}")

    deployment = spec.get('deployment_verification', {})
    print(f"   Deployment Checks: {len(deployment.get('synthetics', []))} synthetic tests")

    print(f"   Test Plan Tasks: {len(spec.get('test_plan', []))}")
    print(f"   Unknowns/Risks: {len(spec.get('unknowns', []))}")
    print()

    # Show page audits detail
    print("6. Page Audit Details:")
    for audit in spec.get('page_audits', []):
        page_key = audit.get('page_key', 'unknown')
        states = len(audit.get('states', []))
        components = len(audit.get('components', []))
        analytics_events = len(audit.get('analytics', []))
        incomplete = "⚠️ INCOMPLETE" if audit.get('incomplete') else "✓ Complete"
        issues = len(audit.get('issues', []))

        print(f"   [{incomplete}] {page_key}: {components} components, {states} states, "
              f"{analytics_events} events, {issues} issues")
    print()

    # Show reactive components
    print("7. Reactive Components:")
    for comp in spec.get('reactive_components', []):
        key = comp.get('component_key', 'unknown')
        channel = comp.get('channel', 'unknown')
        pages = ', '.join(comp.get('pages', []))
        print(f"   • {key} ({channel}) - used in: {pages}")
    print()

    # Generate test plan
    print("8. Generating executable test plan...")
    test_plan = orchestrator.plan_from_spec(spec)
    print(f"   ✓ Test plan created with {len(test_plan.tasks)} tasks")
    print()

    # Display test tasks
    print("9. Test Plan Tasks:")
    for i, task in enumerate(test_plan.tasks, 1):
        print(f"   {i}. [{task.category}] {task.description[:90]}...")
    print()

    # Show unknowns
    unknowns = spec.get('unknowns', [])
    if unknowns:
        print("10. Unknowns / Follow-up Required:")
        for unknown in unknowns:
            print(f"    Q: {unknown.get('question', 'N/A')}")
            print(f"       Evidence: {unknown.get('evidence', 'N/A')}")
        print()

    # Save specification
    output_file = Path(__file__).parent / "fleet_ui_completeness_spec_v2.json"
    print(f"11. Saving specification to {output_file.name}...")
    with open(output_file, 'w') as f:
        json.dump(spec, f, indent=2)
    print(f"    ✓ Specification saved")
    print()

    # Summary
    print("=" * 80)
    print("Analysis Complete!")
    print("=" * 80)
    print()
    print("Summary:")
    summary = spec.get('summary', 'No summary available')
    for line in summary.split('\n'):
        print(f"  {line}")
    print()
    print("Next steps:")
    print("  1. Review fleet_ui_completeness_spec_v2.json for full details")
    print("  2. Address any unknowns flagged in the specification")
    print("  3. Replace MockLLMClient with real LLM for production analysis")
    print("  4. Use CSV exports to generate automated test cases")
    print("  5. Run deployment verification synthetics before prod deploy")
    print()


if __name__ == "__main__":
    main()
