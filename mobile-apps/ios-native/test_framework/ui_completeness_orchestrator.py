# ui_completeness_orchestrator.py
from __future__ import annotations
from typing import Dict, Any, List
import json
from rag_client import RAGClient, RAGDocument
from test_models import TestTask, TestPlan, new_id

# Multi-Agent Spider Prompt for comprehensive UI/Product completeness analysis
MULTI_AGENT_SPIDER_PROMPT = """
You are orchestrating TEN specialized agents to perform a page-by-page PRODUCT COMPLETENESS review of a fleet management application. The review must spider through the app and verify that every page, button, function, and feature is fully implemented and deployed, with multi-layer drilldowns for every data element, reactive components, and deep analytics.

### Targets & Inputs (evidence from RAG and/or runtime)
- System: {SYSTEM_NAME}
- Deployed base URL (if available): {BASE_URL_OR_NONE}
- Repo / code location: {REPO_PATH_OR_URL}
- Auth and test users/creds (non-secret descriptions or fixture names): {TEST_USERS_FIXTURES}
- Feature flags / envs: {FEATURE_FLAGS_AND_ENVS}
- UI route maps / router files: {UI_ROUTER_CONTEXT}
- Component library / design system: {DESIGN_SYSTEM_CONTEXT}
- API routes + controllers/resolvers: {API_CONTEXT}
- DB schema / ERD (tenancy fields like org_id, depot_id): {DB_CONTEXT}
- Analytics config (GA4/Segment/Amplitude/etc), event catalogs: {ANALYTICS_CONTEXT}
- Non-functional requirements (perf/a11y/i18n/responsive): {NFR_CONTEXT}

### Review mandate
Deliver a **best‑in‑class** app and design:
- Every page and subpage present with **complete functionality** (no stubs/TODOs/"coming soon").
- **Deep, multi-layer drilldowns** for every KPI and data element:
  - L1: Summary/KPI ⇒ L2: Detailed table/chart ⇒ L3: Row-level/record and related entities ⇒ L4: Trace/event/raw if applicable.
- **Reactive** UX: live updates (SSE/WebSocket/poll), optimistic UI, offline states, conflict resolution.
- **Deep analytics**: consistent event model, properties, PII handling, funnels, retention, cohorting, and governance.
- **Page-by-page UI/UX** polish: error/empty/loading/skeleton states, accessibility (WCAG 2.2 AA), responsive design, dark mode readiness.
- **Performance budgets** (Core Web Vitals): LCP ≤ 2.5s (4G), INP ≤ 200ms, CLS ≤ 0.1, JS ≤ 200KB gz per page (excluding map SDKs if justified).

### Agents (internal—do NOT reveal transcripts)
1) Agent U — **UX & Information Architecture**
   - Build a complete site map and page taxonomy. Identify missing flows, dead ends, confusing IA, and drilldown depth gaps.
2) Agent F — **Frontend/Component Engineer**
   - Inventory pages, routes, components, widgets, and all interactive controls (buttons, menus, forms). Verify state handling: loading/empty/error/permission/slow network/offline. Map each control to a concrete handler and backend endpoint.
3) Agent A — **Analytics & Instrumentation**
   - Define/verify analytics events for each user action, screen view, and error. Ensure event schemas, property types, PII taxonomy, and sampling. Propose funnels and dashboards.
4) Agent R — **Realtime/Reactive & Data**
   - Confirm real-time behavior for data feeds (telemetry/maps/assignments). Specify update channels (SSE/WebSocket/poll), cache invalidation, backpressure, and retry logic. Define data drilldowns (L1→L4).
5) Agent Q — **Quality/Perf/A11y**
   - Produce spider coverage plan (Playwright). Check Core Web Vitals budgets, bundle size, lazy loading, code splitting, visual regression risks, accessibility (keyboard nav, focus, ARIA, contrast, captions), i18n/l10n, and responsiveness across breakpoints.
6) Agent S — **Security & Authorization**
   - Audit authentication flows, session management, CSRF protection, XSS/injection vulnerabilities, API authorization checks, role-based access control, secrets management, and security headers. Verify all protected routes enforce auth.
7) Agent D — **Data & Database Integrity**
   - Validate data models, schema migrations, referential integrity, cascade deletes, data validation, uniqueness constraints, indexes for performance, and backup/recovery procedures. Check for orphaned records and data consistency.
8) Agent M — **Mobile & Cross-Platform**
   - Verify mobile responsiveness, touch interactions, offline-first capabilities, mobile-specific features (camera, geolocation, push notifications), app store compliance, and cross-browser/cross-device compatibility.
9) Agent I — **Integration & Third-Party Services**
   - Audit external service integrations (Azure Maps, Samsara, payment gateways, email/SMS), API versioning, webhook handlers, rate limiting, circuit breakers, fallback strategies, and vendor SLA compliance.
10) Agent T — **Testing & Test Coverage**
    - Assess unit test coverage, integration tests, E2E tests, test data management, CI/CD pipeline quality gates, regression test suites, and identify untested critical paths or edge cases.

### Spidering strategy (choose based on inputs)
- If {BASE_URL_OR_NONE} is a real URL: plan a **runtime spider** with Playwright to crawl internal links and interact with visible controls (safe, read-only). Collect network calls, console errors, HTTP statuses, screenshots, and performance timings.
- Always also perform a **static spider** via router and component code to discover gated or hidden routes (auth‑only, feature‑flagged, mobile‑only).
- For every discovered page/route, enumerate controls and **verify wiring** to handlers/API. If unknown, mark as an issue with evidence and file/line hints.

### Modeling rules
- Deny incomplete functionality: if a control has no implemented handler, mark page **incomplete** with severity.
- Drilldowns: each KPI/table/chart must have a deeper view to row-level and then to trace/event/raw when sensible; if not applicable, justify with domain rationale.
- Analytics: every significant action must emit a named event with a version, properties, and PII class; opt-out paths noted.
- Reactive: live data widgets must specify channel, heartbeat, reconnect, stale thresholds, and failure UI.
- Performance & a11y budgets are **hard** acceptance criteria; propose concrete fixes where budgets are exceeded.
- Internal deliberation only; output just the final spec as JSON.

### REQUIRED OUTPUT — STRICT JSON (no extra text)
{{
  "schema_version": "1.0",
  "system": "{SYSTEM_NAME}",
  "site_map": [
    {{
      "page_key": "vehicles",
      "title": "Vehicles",
      "route": "/vehicles",
      "public": false,
      "requires_auth": true,
      "feature_flags": ["vehicles_v2?"],
      "children": ["vehicles_detail","vehicles_bulk"],
      "entry_points": ["/", "/dashboard"]
    }}
  ],
  "page_audits": [
    {{
      "page_key": "vehicles",
      "states": ["loading","empty","error","ok","permission_denied","offline"],
      "components": [
        {{
          "key": "vehicle_table",
          "type": "DataTable",
          "props_summary": "paginated, sortable, filterable",
          "actions": [
            {{"control": "btn_new_vehicle", "kind": "button", "handler": "onCreateVehicle", "api": "POST /api/vehicles", "fully_wired": true}},
            {{"control": "btn_bulk_delete", "kind": "button", "handler": "onBulkDelete", "api": "DELETE /api/vehicles?ids=", "fully_wired": false, "issues": ["no confirm dialog","endpoint not found"]}}
          ],
          "drilldowns": [
            {{"level": 1, "from": "row_click", "to_page_key": "vehicles_detail"}},
            {{"level": 2, "from": "tab:telemetry", "to_page_key": "vehicles_detail_telemetry"}},
            {{"level": 3, "from": "view_raw", "to_page_key": "vehicles_trace_raw"}}
          ],
          "reactivity": {{"mode": "poll|sse|ws", "interval_ms": 10000, "stale_after_s": 45, "retry": "exp_backoff", "cache": "stale_while_revalidate"}}
        }}
      ],
      "analytics": [
        {{"event": "vehicles_viewed/v1", "on": "page_load", "props": {{"org_id":"string","count":"number"}}, "pii": "none"}},
        {{"event": "vehicle_created/v1", "on": "btn_new_vehicle_click_success", "props": {{"vehicle_id":"string"}}, "pii": "internal"}}
      ],
      "perf_budget": {{"LCP_ms": 2500, "INP_ms": 200, "CLS": 0.1, "max_js_gzip_kb": 200, "map_sdk_exempt": true}},
      "a11y": {{"wcag": "2.2AA", "keyboard_traps": [], "contrast_failures": [], "aria_issues": []}},
      "i18n": {{"languages": ["en"], "missing_keys": ["vehicles.header.total"]}},
      "responsive": {{"breakpoints": ["xs","sm","md","lg","xl"], "issues": ["table overflow on xs"]}},
      "incomplete": true,
      "issues": [
        {{"severity": "high", "kind": "dead_control", "summary": "Bulk delete not wired", "evidence": "onBulkDelete undefined"}},
        {{"severity": "medium", "kind": "drilldown_gap", "summary": "No raw trace view", "evidence": "no /vehicles/trace route"}},
        {{"severity": "low", "kind": "analytics_gap", "summary": "Missing filter change event", "evidence": "no event on table filter"}}
      ]
    }}
  ],
  "reactive_components": [
    {{
      "component_key": "live_map",
      "pages": ["dashboard","vehicles_detail"],
      "channel": "ws",
      "source": "wss://{{host}}/telemetry",
      "heartbeat_s": 20,
      "reconnect": "exp_backoff",
      "stale_threshold_s": 30,
      "fallback": "poll 15s",
      "offline_ui": "banner + cached tiles",
      "perf": {{"max_markers": 5000, "cluster": true}},
      "observability": {{"metrics": ["telemetry_update_lag_ms","ws_reconnects"], "logs": ["ws_error","ws_drop"]}}
    }}
  ],
  "analytics_spec": {{
    "events": [
      {{"name":"dispatch_created/v1","triggers":["create_dispatch_success"],"properties":{{"dispatch_id":"string","vehicle_id":"string","driver_id":"string"}},"pii":"internal","ownership":"product_analytics"}},
      {{"name":"report_exported/v1","triggers":["export_click_success"],"properties":{{"report_type":"enum","row_count":"number"}},"pii":"sensitive"}}
    ],
    "funnels": [
      {{"name":"Create Dispatch","steps":["dispatch_board_view","create_dispatch_click","dispatch_created/v1"]}}
    ],
    "governance": {{"pii_classes":["none","internal","sensitive"],"retention_days":{{"sensitive":365,"internal":730}}}}
  }},
  "perf_a11y_report": {{
    "core_web_vitals": {{"LCP_ms": 0, "INP_ms": 0, "CLS": 0.0, "violations": []}},
    "bundle": {{"page_js_kb_gzip": [], "heavy_modules": []}},
    "a11y_findings": [],
    "visual_regression_risk": ["map popovers", "virtualized tables"]
  }},
  "security_audit": {{
    "auth_flows": {{"login":"complete","logout":"complete","password_reset":"complete","mfa":"missing"}},
    "csrf_protection": "enabled",
    "xss_vulnerabilities": [],
    "sql_injection_risks": [],
    "api_authorization": {{"checked_routes": 28, "unprotected": 0, "issues": []}},
    "secrets_management": {{"env_vars":"secure","hardcoded_secrets":0,"key_rotation":"not_configured"}},
    "security_headers": {{"csp":"enabled","hsts":"enabled","x_frame_options":"enabled"}},
    "rbac_coverage": {{"roles":4,"permissions_checked":true,"bypass_attempts_blocked":true}}
  }},
  "data_integrity_report": {{
    "schema_validation": {{"models_validated":12,"migration_history":"clean","schema_drift":"none"}},
    "referential_integrity": {{"foreign_keys_enforced":true,"orphaned_records":0}},
    "constraints": {{"unique_constraints":8,"check_constraints":5,"not_null_enforced":true}},
    "indexes": {{"total":24,"missing_recommended":["vehicles.org_id_status","maintenance.scheduled_date"],"unused":1}},
    "data_consistency": {{"validation_rules":"present","duplicate_detection":"enabled","cleanup_jobs":"scheduled"}},
    "backup_recovery": {{"backup_frequency":"daily","last_test_restore":"2025-11-10","rpo_hours":24}}
  }},
  "mobile_compatibility": {{
    "responsive_design": {{"breakpoints":["xs","sm","md","lg","xl"],"issues":[]}},
    "touch_interactions": {{"gestures_supported":["tap","swipe","pinch"],"issues":["long_press_missing_on_dispatch_cards"]}},
    "offline_capabilities": {{"mode":"queue_and_sync","storage":"IndexedDB","max_offline_actions":100}},
    "native_features": {{"camera":"enabled","geolocation":"enabled","push_notifications":"enabled","biometric_auth":"planned"}},
    "app_stores": {{"ios":"not_submitted","android":"not_submitted","pwa":"ready"}},
    "cross_browser": {{"chrome":"tested","firefox":"tested","safari":"tested","edge":"tested"}}
  }},
  "integration_audit": {{
    "external_services": [
      {{"name":"Azure Maps","status":"integrated","fallback":"OpenStreetMap","circuit_breaker":"enabled"}},
      {{"name":"Azure Storage","status":"integrated","fallback":"local_cache","circuit_breaker":"enabled"}},
      {{"name":"Samsara","status":"integrated","fallback":"queue_webhooks","circuit_breaker":"enabled"}},
      {{"name":"Stripe","status":"planned","fallback":"manual_invoicing","circuit_breaker":"n_a"}},
      {{"name":"SendGrid","status":"integrated","fallback":"SMTP","circuit_breaker":"enabled"}}
    ],
    "api_versioning": {{"strategy":"url_path","current_version":"v1","deprecated_versions":[]}},
    "rate_limiting": {{"enabled":true,"per_user":"100_req_min","per_org":"1000_req_min"}},
    "webhook_handlers": {{"total":3,"retry_logic":"exp_backoff","dead_letter_queue":"enabled"}},
    "sla_compliance": {{"azure_maps":"99.9%","samsara":"99.5%","sendgrid":"99.95%"}}
  }},
  "testing_coverage": {{
    "unit_tests": {{"files_covered":142,"coverage_pct":78,"critical_paths_covered":true}},
    "integration_tests": {{"api_endpoints_tested":24,"db_integration_tested":true}},
    "e2e_tests": {{"playwright_scenarios":18,"critical_flows_covered":["login","vehicle_crud","dispatch_create"]}},
    "test_data": {{"fixtures":"present","factories":"implemented","seed_scripts":"available"}},
    "ci_cd_quality_gates": {{"tests_required":true,"min_coverage":70,"lint_required":true,"build_required":true}},
    "regression_suite": {{"automated":true,"visual_regression":false,"smoke_tests":4}},
    "untested_paths": [
      {{"path":"admin_panel","reason":"new_feature","severity":"medium"}},
      {{"path":"bulk_import","reason":"edge_case_incomplete","severity":"low"}}
    ]
  }},
  "deployment_verification": {{
    "synthetics": [
      {{"name":"Homepage loads","url":"{BASE_URL_OR_NONE}/","assertions":["status 200","LCP<2500ms"]}},
      {{"name":"Login flow","url":"{BASE_URL_OR_NONE}/login","assertions":["csrf present","redirect to /dashboard"]}}
    ],
    "feature_flag_matrix": [{{"flag":"dispatch_v2","environments":{{"staging":true,"prod":false}}}}],
    "smoke_endpoints": [{{"method":"GET","path":"/api/health","expect":"ok"}}]
  }},
  "csv_exports": {{
    "PAGE_COMPONENT_MATRIX": [
      ["vehicles","vehicle_table","btn_new_vehicle","POST /api/vehicles","true","","vehicle_created/v1"]
    ]
  }},
  "test_plan": [
    {{"description": "Spider all routes and click-first controls to confirm handler bindings", "category": "ui"}},
    {{"description": "Assert 403/404 for dead endpoints and log to console if missing", "category": "api"}},
    {{"description": "Emit analytics on page view and success paths; validate schema against catalog", "category": "integration"}},
    {{"description": "WebSocket reconnect/backoff and stale thresholds for live map", "category": "data"}},
    {{"description": "Enforce LCP≤2.5s, INP≤200ms on top 10 pages; lazy load map SDK", "category": "perf"}},
    {{"description": "Keyboard nav and ARIA roles on all forms; fix color contrast", "category": "ui"}},
    {{"description": "Document drilldown L1→L4 for each KPI with screenshots", "category": "docs"}},
    {{"description": "Detect TODO/'coming soon' markers and fail build if present", "category": "security"}},
    {{"description": "Refactor oversized routes into code-split chunks", "category": "architecture"}}
  ],
  "unknowns": [
    {{"question":"Is /reports/:id/raw available in prod?","evidence":"router shows guarded route but no controller"}}
  ],
  "summary": "≤ 200 words summarizing completeness, drilldowns, reactivity, analytics, and biggest risks."
}}

### Output constraints
- Return ONLY the JSON above and nothing else. If unsure, mark as incomplete with issues and fill `unknowns`.
- Be exhaustive: every page and control you can infer from inputs must appear in `site_map` and `page_audits`.
- Internal agent collaboration must not be included in the output.
"""

class LLMClient:
    """Abstract base class for LLM interactions"""
    def complete(self, prompt: str) -> str:
        raise NotImplementedError


class UICompletenessOrchestrator:
    """
    Orchestrates UI completeness analysis for a system using RAG and LLM.

    This class generates comprehensive UI test specifications by:
    1. Gathering context from multiple RAG sources (code, UI, API, DB, etc.)
    2. Using an LLM to analyze the context and generate a completeness spec
    3. Converting the spec into an executable test plan
    4. Storing results back to RAG for future reference
    """

    def __init__(self, llm: LLMClient, rag: RAGClient) -> None:
        """
        Initialize the orchestrator with LLM and RAG clients.

        Args:
            llm: Client for LLM completions
            rag: Client for RAG document storage and retrieval
        """
        self.llm = llm
        self.rag = rag

    def build_completeness_spec(self, system_name: str, base_url: str|None = None) -> Dict[str, Any]:
        """
        Build a comprehensive UI completeness specification for a system.

        This method:
        1. Retrieves relevant documents from RAG across multiple namespaces
        2. Constructs a detailed prompt with all context
        3. Uses LLM to generate a structured completeness specification
        4. Stores the specification back to RAG for future use

        Args:
            system_name: Name of the system to analyze (e.g., "Fleet")
            base_url: Optional base URL for the system

        Returns:
            Dictionary containing the completeness specification with:
            - coverage_areas: Areas of the UI to test
            - user_roles: Different user roles and their permissions
            - test_plan: Ordered list of test tasks
            - gaps_and_risks: Identified gaps and mitigation strategies
            - metrics: Quantitative assessment of coverage
        """
        def join(docs):
            """Helper to format RAG documents into a readable string"""
            return "\n\n".join([f"# {d.title}\n{d.content}" for d in docs])

        # Gather context from multiple RAG namespaces
        repo   = self.rag.search("code", system_name, k=25)
        ui     = self.rag.search("ui", system_name, k=25)
        api    = self.rag.search("api", system_name, k=25)
        auth   = self.rag.search("authz", system_name, k=10)
        db     = self.rag.search("database", system_name, k=10)
        design = self.rag.search("design_system", system_name, k=10)
        nfr    = self.rag.search("nfr", system_name, k=10)
        analytics = self.rag.search("analytics", system_name, k=10)

        # Build the prompt with all gathered context
        prompt = MULTI_AGENT_SPIDER_PROMPT \
          .replace("{SYSTEM_NAME}", system_name) \
          .replace("{BASE_URL_OR_NONE}", base_url or "NONE") \
          .replace("{REPO_PATH_OR_URL}", join(repo)) \
          .replace("{TEST_USERS_FIXTURES}", "see repo fixtures/users.jsonl") \
          .replace("{FEATURE_FLAGS_AND_ENVS}", join(auth)) \
          .replace("{UI_ROUTER_CONTEXT}", join(ui)) \
          .replace("{DESIGN_SYSTEM_CONTEXT}", join(design)) \
          .replace("{API_CONTEXT}", join(api)) \
          .replace("{DB_CONTEXT}", join(db)) \
          .replace("{ANALYTICS_CONTEXT}", join(analytics)) \
          .replace("{NFR_CONTEXT}", join(nfr))

        # Get LLM analysis (prompt enforces JSON-only output)
        raw = self.llm.complete(prompt)
        spec = json.loads(raw)

        # Store the specification in RAG for future reference
        self.rag.add_documents([
            RAGDocument(
                id=new_id("UIAUD"),
                namespace="ui_completeness",
                title=f"UI completeness spec for {system_name}",
                kind="ui_audit",
                content=json.dumps(spec),
                metadata={"system": system_name, "has_base_url": bool(base_url)},
            )
        ])

        return spec

    def plan_from_spec(self, spec: Dict[str, Any]) -> TestPlan:
        """
        Convert a completeness specification into an executable test plan.

        Args:
            spec: Completeness specification from build_completeness_spec()

        Returns:
            TestPlan object with ordered test tasks ready for execution
        """
        tasks: List[TestTask] = []

        for t in spec.get("test_plan", []):
            tasks.append(TestTask(
                id=new_id("TT"),
                description=t["description"],
                category=t["category"],
                depends_on=t.get("depends_on", [])
            ))

        return TestPlan(
            id=new_id("TPL"),
            feature_or_system=f"UI Completeness for {spec.get('system','<unknown>')}",
            tasks=tasks,
        )
