
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACTS_DIR = path.join(ROOT_DIR, 'artifacts');
const BUSINESS_DIR = path.join(ARTIFACTS_DIR, 'business');

if (!fs.existsSync(BUSINESS_DIR)) fs.mkdirSync(BUSINESS_DIR, { recursive: true });

// Load Registry
const featureRegistryPath = path.join(ARTIFACTS_DIR, 'feature_registry.json');
if (!fs.existsSync(featureRegistryPath)) {
    console.error("Feature Registry not found!");
    process.exit(1);
}
const featureRegistry = JSON.parse(fs.readFileSync(featureRegistryPath, 'utf8'));

// --- Domains Definition ---
const DOMAINS = {
    "OPERATIONS": {
        keywords: ["dispatch", "gps", "tracking", "route", "trip", "geofence", "telematics", "camera", "traffic", "live"],
        description: "Real-time fleet movement, dispatching, and monitoring."
    },
    "MAINTENANCE": {
        keywords: ["maintenance", "service", "repair", "inspection", "work-order", "part", "inventory", "technician", "garage", "shop"],
        description: "Vehicle upkeep, repairs, and service scheduling."
    },
    "ASSET_MANAGEMENT": {
        keywords: ["vehicle", "asset", "acquisition", "disposal", "depreciation", "procurement", "3d", "checkout", "checkin"],
        description: "Lifecycle management of physical assets."
    },
    "HR_DRIVERS": {
        keywords: ["driver", "employee", "onboarding", "training", "license", "certification", "scorecard", "performance", "team", "calendar"],
        description: "Driver personnel management, safety scores, and HR compliance."
    },
    "FINANCIAL": {
        keywords: ["fuel", "cost", "invoice", "billing", "purchase", "order", "expense", "reimbursement", "transaction", "card"],
        description: "Cost tracking, fuel management, and financial reporting."
    },
    "COMPLIANCE_SAFETY": {
        keywords: ["compliance", "safety", "incident", "accident", "osha", "policy", "audit", "violation", "insurance", "legal"],
        description: "Regulatory compliance, accident reporting, and policy enforcement."
    },
    "IT_ADMIN": {
        keywords: ["admin", "config", "setting", "user", "role", "permission", "auth", "login", "sso", "security", "monitor", "telemetry", "health"],
        description: "System administration, RBAC, and configuration."
    },
    "INTELLIGENCE": {
        keywords: ["ai", "analytics", "dashboard", "report", "insight", "predict", "search", "chat", "bot"],
        description: "Business intelligence, reporting, and AI capabilities."
    }
};

// --- Helper Functions ---
function categorizeFeature(featureName) {
    const name = featureName.toLowerCase();
    for (const [domain, config] of Object.entries(DOMAINS)) {
        if (config.keywords.some(k => name.includes(k))) {
            return domain;
        }
    }
    return "UNCATEGORIZED";
}

// 1. Generate Process Map
function generateProcessMap() {
    console.log("Generating Business Process Map...");
    const processMap = {
        domains: {}
    };

    // Initialize Domains
    Object.keys(DOMAINS).forEach(d => {
        processMap.domains[d] = {
            description: DOMAINS[d].description,
            features: [],
            workstreams: []
        };
    });
    processMap.domains["UNCATEGORIZED"] = { description: "Features needing manual review", features: [], workstreams: [] };

    // Map Features
    Object.values(featureRegistry).forEach(feature => {
        const category = categorizeFeature(feature.name);
        processMap.domains[category].features.push(feature.name);
    });

    // Define Standard Workstreams (Heuristic)
    processMap.domains["MAINTENANCE"].workstreams = [
        "Preventative Maintenance Schedule",
        "Unplanned Repair (Breakdown)",
        "Parts Inventory Management",
        "Vendor Service integration"
    ];
    processMap.domains["OPERATIONS"].workstreams = [
        "Daily Dispatch",
        "Emergency Response",
        "Route Optimization",
        "Real-time Tracking"
    ];
    processMap.domains["HR_DRIVERS"].workstreams = [
        "Driver Onboarding",
        "License Renewal Monitoring",
        "Safety Coaching"
    ];
    processMap.domains["FINANCIAL"].workstreams = [
        "Fuel Card Reconciliation",
        "Expense Approval",
        "Asset Depreciation Calculation"
    ];

    fs.writeFileSync(path.join(BUSINESS_DIR, 'process_map.json'), JSON.stringify(processMap, null, 2));
    console.log("Process Map generated.");
    return processMap;
}

// 2. Generate Task Models
function generateTaskModels(processMap) {
    console.log("Generating Task Models...");
    const taskModels = {};

    Object.entries(processMap.domains).forEach(([domain, data]) => {
        data.features.forEach(feature => {
            // Heuristic to guess tasks based on CRUD typical patterns
            taskModels[feature] = {
                domain: domain,
                tasks: [
                    { name: `View ${feature} Dashboard`, type: "READ", complexity: "LOW" },
                    { name: `Create New ${feature} Record`, type: "CREATE", complexity: "MEDIUM", steps: ["Fill Form", "Validate Input", "Submit"] },
                    { name: `Edit ${feature} Details`, type: "UPDATE", complexity: "MEDIUM" },
                    { name: `Export ${feature} Report`, type: "EXPORT", complexity: "LOW" }
                ]
            };

            // Add specific tasks based on keywords
            if (feature.includes("approve") || domain === "FINANCIAL") {
                taskModels[feature].tasks.push({ name: `Approve ${feature} Request`, type: "APPROVAL", complexity: "HIGH", roles: ["Manager", "Admin"] });
            }
            if (domain === "INTELLIGENCE" || feature.includes("dashboard")) {
                taskModels[feature].tasks.push({ name: "Drilldown to Details", type: "DRILLDOWN", complexity: "HIGH" });
            }
        });
    });

    fs.writeFileSync(path.join(BUSINESS_DIR, 'task_models.json'), JSON.stringify(taskModels, null, 2));
    console.log("Task Models generated.");
}

// 3. Generate Sufficiency Checklists
function generateSufficiencyChecklists() {
    console.log("Generating Sufficiency Checklists...");
    const checklists = {
        "GLOBAL_STANDARDS": [
            "User can view a list of items with pagination/sorting",
            "User can search/filter the list",
            "User can click an item to view details (Drilldown)",
            "User can create a new item (if actionable)",
            "User can edit an existing item (if actionable)",
            "User receives feedback (toast/alert) on success/error",
            "Empty states are handled gracefully"
        ],
        "DOMAIN_SPECIFIC": {
            "FINANCIAL": [
                "Currency is formatted correctly",
                "Totals are calculated correctly",
                "Audit trail exists for all financial changes"
            ],
            "COMPLIANCE_SAFETY": [
                "Sensitive data is masked",
                "Digital signatures supported where required",
                "History/Versioning is visible"
            ],
            "OPERATIONS": [
                "Map data loads within 2 seconds",
                "Real-time updates occur without page refresh",
                "Mobile responsive for field view"
            ]
        }
    };

    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'sufficiency_checklists.json'), JSON.stringify(checklists, null, 2));
    console.log("Sufficiency Checklists generated.");
}

// Main
function main() {
    console.log("Starting Phase 2: Business Process Mapping...");
    try {
        const map = generateProcessMap();
        generateTaskModels(map);
        generateSufficiencyChecklists();
        console.log("Phase 2 Complete.");
    } catch (e) {
        console.error("Phase 2 Failed:", e);
    }
}

main();
