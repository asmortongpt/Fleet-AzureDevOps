
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACTS_DIR = path.join(ROOT_DIR, 'artifacts');
const WORKFLOWS_DIR = path.join(ARTIFACTS_DIR, 'workflows');

if (!fs.existsSync(WORKFLOWS_DIR)) fs.mkdirSync(WORKFLOWS_DIR, { recursive: true });

// --- State Machine Definitions ---

const WORKFLOWS = {
    "WORK_ORDER": {
        entity: "Maintenance Work Order",
        states: ["DRAFT", "OPEN", "IN_PROGRESS", "WAITING_PARTS", "REVIEW", "COMPLETED", "CANCELLED"],
        transitions: [
            { from: "DRAFT", to: "OPEN", action: "Submit", role: ["DISPATCHER", "FLEET_MANAGER"] },
            { from: "OPEN", to: "IN_PROGRESS", action: "Start Work", role: ["MECHANIC"] },
            { from: "IN_PROGRESS", to: "WAITING_PARTS", action: "Request Parts", role: ["MECHANIC"] },
            { from: "WAITING_PARTS", to: "IN_PROGRESS", action: "Parts Received", role: ["MECHANIC", "FLEET_MANAGER"] },
            { from: "IN_PROGRESS", to: "REVIEW", action: "Complete Work", role: ["MECHANIC"] },
            { from: "REVIEW", to: "COMPLETED", action: "Approve", role: ["FLEET_MANAGER"] },
            { from: "REVIEW", to: "IN_PROGRESS", action: "Reject/Rework", role: ["FLEET_MANAGER"] },
            { from: ["DRAFT", "OPEN", "WAITING_PARTS"], to: "CANCELLED", action: "Cancel", role: ["FLEET_MANAGER"] }
        ]
    },
    "INCIDENT_REPORT": {
        entity: "Safety Incident",
        states: ["REPORTED", "INVESTIGATING", "PENDING_INSURANCE", "RESOLVED", "ARCHIVED"],
        transitions: [
            { from: "REPORTED", to: "INVESTIGATING", action: "Assign Investigator", role: ["HR_MANAGER", "FLEET_MANAGER"] },
            { from: "INVESTIGATING", to: "PENDING_INSURANCE", action: "File Claim", role: ["HR_MANAGER"] },
            { from: ["INVESTIGATING", "PENDING_INSURANCE"], to: "RESOLVED", action: "Close Case", role: ["HR_MANAGER"] },
            { from: "RESOLVED", to: "ARCHIVED", action: "Archive", role: ["SUPER_ADMIN", "HR_MANAGER"] }
        ]
    },
    "ASSET_LIFECYCLE": {
        entity: "Vehicle Asset",
        states: ["PROCUREMENT", "ACTIVE", "MAINTENANCE_HOLD", "DECOMMISSIONED", "SOLD"],
        transitions: [
            { from: "PROCUREMENT", to: "ACTIVE", action: "In-Fleet", role: ["FLEET_MANAGER"] },
            { from: "ACTIVE", to: "MAINTENANCE_HOLD", action: "Flag for Repair", role: ["DISPATCHER", "MECHANIC", "DRIVER"] },
            { from: "MAINTENANCE_HOLD", to: "ACTIVE", action: "Return to Service", role: ["FLEET_MANAGER"] },
            { from: "ACTIVE", to: "DECOMMISSIONED", action: "Retire", role: ["FLEET_MANAGER"] },
            { from: "DECOMMISSIONED", to: "SOLD", action: "Record Sale", role: ["FLEET_MANAGER", "FINANCIAL_AUDITOR"] }
        ]
    },
    "EXPENSE_APPROVAL": {
        entity: "Financial Expense",
        states: ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "PAID"],
        transitions: [
            { from: "DRAFT", to: "SUBMITTED", action: "Submit Expense", role: ["DRIVER", "MECHANIC", "DISPATCHER"] },
            { from: "SUBMITTED", to: "APPROVED", action: "Approve", role: ["FLEET_MANAGER"] },
            { from: "SUBMITTED", to: "REJECTED", action: "Reject", role: ["FLEET_MANAGER"] },
            { from: "APPROVED", to: "PAID", action: "Mark Paid", role: ["FINANCIAL_AUDITOR", "FLEET_MANAGER"] }
        ]
    }
};

// --- Generator ---
function generateWorkflows() {
    console.log("Generating Workflow Models...");

    Object.entries(WORKFLOWS).forEach(([key, workflow]) => {
        const filename = `${key.toLowerCase()}.json`;
        fs.writeFileSync(path.join(WORKFLOWS_DIR, filename), JSON.stringify(workflow, null, 2));
        console.log(`Generated workflow: ${key}`);
    });
}

// --- Validation Logic (Simulation) ---
function validateWorkflows() {
    console.log("Validating State Machines...");
    // Check for Dead Ends (states with no outgoing transitions, except explicit end states)
    Object.entries(WORKFLOWS).forEach(([key, workflow]) => {
        const states = new Set(workflow.states);
        const sourceStates = new Set(workflow.transitions.map(t => Array.isArray(t.from) ? t.from : [t.from]).flat());

        // Identify Sink States
        const sinkStates = [...states].filter(s => !sourceStates.has(s));
        console.log(`${key} Sink States (End):`, sinkStates);
    });
}

function main() {
    console.log("Starting Phase 4: Workflows...");
    try {
        generateWorkflows();
        validateWorkflows();
        console.log("Phase 4 Complete.");
    } catch (e) {
        console.error("Phase 4 Failed:", e);
    }
}

main();
