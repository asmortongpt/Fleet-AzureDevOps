
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACTS_DIR = path.join(ROOT_DIR, 'artifacts');

// Load Business Artifacts
const processMapPath = path.join(ARTIFACTS_DIR, 'business', 'process_map.json');
const taskModelsPath = path.join(ARTIFACTS_DIR, 'business', 'task_models.json');

if (!fs.existsSync(processMapPath) || !fs.existsSync(taskModelsPath)) {
    console.error("Missing Phase 2 Artifacts. Cannot proceed.");
    process.exit(1);
}

const processMap = JSON.parse(fs.readFileSync(processMapPath, 'utf8'));
const taskModels = JSON.parse(fs.readFileSync(taskModelsPath, 'utf8'));

// --- Roles Definition ---
const ROLES = {
    "SUPER_ADMIN": { description: "Full access to everything. Configuration owner.", tier: 0 },
    "FLEET_MANAGER": { description: "Operational oversight. Can manage vehicles, drivers, expenses.", tier: 1 },
    "DISPATCHER": { description: "Can view fleet, assign routes, manage incidents. No financial access.", tier: 2 },
    "MECHANIC": { description: "Can view/update maintenance records, work orders, parts. No dispatch access.", tier: 2 },
    "DRIVER": { description: "Can view own assignments, history. Can submit inspections/incidents. Minimal access.", tier: 3 },
    "FINANCIAL_AUDITOR": { description: "Read-only access to financial records and reports.", tier: 2 },
    "HR_MANAGER": { description: "Can manage driver profiles, onboarding, licensing. No vehicle operations.", tier: 2 }
};

// --- Matrix Generation ---
function generateRbacMatrix() {
    console.log("Generating RBAC Matrix...");
    const matrix = {};

    Object.entries(taskModels).forEach(([featureName, model]) => {
        matrix[featureName] = {};

        // Default Logic based on Domain
        const domain = model.domain;

        Object.keys(ROLES).forEach(role => {
            const roleConfig = ROLES[role];
            let access = "NONE";

            // Super Admin always needs FULL
            if (role === "SUPER_ADMIN") {
                access = "FULL";
            }

            // Domain Specific Logic
            else if (role === "FLEET_MANAGER") {
                if (["OPERATIONS", "MAINTENANCE", "ASSET_MANAGEMENT", "FINANCIAL"].includes(domain)) access = "FULL";
                else if (domain === "HR_DRIVERS") access = "READ_ONLY"; // Or partial?
                else if (domain === "IT_ADMIN") access = "NONE";
            }

            else if (role === "DISPATCHER") {
                if (domain === "OPERATIONS") access = "FULL";
                else if (["ASSET_MANAGEMENT", "HR_DRIVERS", "MAINTENANCE"].includes(domain)) access = "READ_ONLY";
            }

            else if (role === "MECHANIC") {
                if (domain === "MAINTENANCE") access = "FULL";
                else if (domain === "ASSET_MANAGEMENT") access = "READ_ONLY"; // Check vehicle specs
            }

            else if (role === "FINANCIAL_AUDITOR") {
                if (["FINANCIAL", "ASSET_MANAGEMENT"].includes(domain)) access = "READ_ONLY";
            }

            else if (role === "HR_MANAGER") {
                if (domain === "HR_DRIVERS") access = "FULL";
                else if (domain === "COMPLIANCE_SAFETY") access = "FULL";
            }

            else if (role === "DRIVER") {
                // Drivers are special. they interact with specific 'Mobile' endpoints or 'My' endpoints.
                // For general features, usually NONE or READ_OWN (if we supported that granularity here)
                if (featureName.includes("mobile") || featureName.includes("driver")) access = "OWN_ONLY";
            }

            matrix[featureName][role] = {
                accessLevel: access,
                canCreate: ["FULL", "OWN_ONLY"].includes(access),
                canRead: ["FULL", "READ_ONLY", "OWN_ONLY"].includes(access),
                canUpdate: ["FULL", "OWN_ONLY"].includes(access),
                canDelete: ["FULL"].includes(access),
                canApprove: (role === "FLEET_MANAGER" || role === "SUPER_ADMIN") && ["FINANCIAL", "MAINTENANCE"].includes(domain)
            };
        });
    });

    const output = {
        roles: ROLES,
        matrix: matrix
    };

    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'rbac_matrix.json'), JSON.stringify(output, null, 2));
    console.log(`RBAC Matrix generated covering ${Object.keys(matrix).length} features.`);
    return output;
}

// --- Test Generation ---
function generateRbacTests(matrixData) {
    console.log("Generating RBAC Tests...");
    const testsDir = path.join(ROOT_DIR, 'tests', 'rbac'); // Virtual path for now, we will just output JSON instructions
    // Actually, let's output a specialized test logic JSON that our 'mcp.security' would use

    const testPlan = [];

    Object.entries(matrixData.matrix).forEach(([feature, roles]) => {
        Object.entries(roles).forEach(([role, permissions]) => {
            // Negative Tests
            if (permissions.accessLevel === "NONE") {
                testPlan.push({
                    feature: feature,
                    role: role,
                    action: "READ",
                    expectedResult: 403
                });
                testPlan.push({
                    feature: feature,
                    role: role,
                    action: "WRITE",
                    expectedResult: 403
                });
            }

            // Positive Tests
            if (permissions.canRead) {
                testPlan.push({
                    feature: feature,
                    role: role,
                    action: "READ",
                    expectedResult: 200
                });
            }
            if (permissions.canCreate) {
                testPlan.push({
                    feature: feature,
                    role: role,
                    action: "CREATE",
                    expectedResult: 201
                });
            }
        });
    });

    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'rbac_test_plan.json'), JSON.stringify(testPlan, null, 2));
    console.log(`Generated ${testPlan.length} RBAC test scenarios.`);
}


function main() {
    console.log("Starting Phase 3: RBAC Truth Tables...");
    try {
        const matrix = generateRbacMatrix();
        generateRbacTests(matrix);
        console.log("Phase 3 Complete.");
    } catch (e) {
        console.error("Phase 3 Failed:", e);
    }
}

main();
