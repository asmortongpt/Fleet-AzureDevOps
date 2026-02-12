#!/usr/bin/env node
/**
 * Fleet Standards CLI - Simple tool to query project standards
 * Works with any LLM or script that can run shell commands
 * 
 * Usage:
 *   node standards-cli.js rules security
 *   node standards-cli.js status
 *   node standards-cli.js rbac Admin
 *   node standards-cli.js check "Add new API endpoint" security,rbac
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONTEXT_FILE = path.join(PROJECT_ROOT, '.llm-context.json');
const RBAC_FILE = path.join(PROJECT_ROOT, '.agent/rbac_truth_table.json');
const PROGRESS_FILE = path.join(PROJECT_ROOT, '.agent/security_certification_progress.json');

function loadJSON(filePath) {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function getRules(category) {
    const context = loadJSON(CONTEXT_FILE);
    if (!context) {
        console.error('Error: .llm-context.json not found');
        process.exit(1);
    }

    if (category === 'all') {
        console.log(JSON.stringify(context.mandatory_rules, null, 2));
    } else if (context.mandatory_rules[category]) {
        console.log(JSON.stringify(context.mandatory_rules[category], null, 2));
    } else {
        console.error(`Unknown category: ${category}`);
        console.log('Available: security, code_quality, architecture, all');
        process.exit(1);
    }
}

function getStatus() {
    const progress = loadJSON(PROGRESS_FILE);
    if (!progress) {
        console.error('Error: security_certification_progress.json not found');
        process.exit(1);
    }

    console.log(JSON.stringify({
        overall_status: progress.overall_status,
        phase: progress.phase,
        summary: progress.summary,
        test_verification: progress.test_verification,
        gates_passed: Object.entries(progress.gate_status || {})
            .filter(([k, v]) => v === 'PASSED' || v.includes('PASSED'))
            .map(([k]) => k).length + '/10'
    }, null, 2));
}

function getRBAC(role) {
    const rbac = loadJSON(RBAC_FILE);
    if (!rbac) {
        console.error('Error: rbac_truth_table.json not found');
        process.exit(1);
    }

    const roleInfo = rbac.roles?.find(r => r.id === role);
    if (!roleInfo) {
        console.log('Available roles:', rbac.roles?.map(r => r.id).join(', '));
        process.exit(1);
    }

    const moduleAccess = {};
    if (rbac.modules) {
        for (const [module, info] of Object.entries(rbac.modules)) {
            if (info.access?.includes(role)) {
                moduleAccess[module] = 'ALLOWED';
            } else if (info.denied?.includes(role)) {
                moduleAccess[module] = 'DENIED';
            }
        }
    }

    console.log(JSON.stringify({
        role,
        level: roleInfo.level,
        description: roleInfo.description,
        module_access: moduleAccess
    }, null, 2));
}

function checkCompliance(description, areas) {
    const context = loadJSON(CONTEXT_FILE);
    if (!context) {
        console.error('Error: .llm-context.json not found');
        process.exit(1);
    }

    const areaList = areas.split(',').map(a => a.trim());
    const requirements = [];
    const warnings = [];

    if (areaList.includes('security')) {
        requirements.push(...context.mandatory_rules.security);
        if (description.toLowerCase().includes('auth') ||
            description.toLowerCase().includes('password')) {
            warnings.push('Security-critical change: Requires extra review');
        }
    }

    if (areaList.includes('rbac')) {
        requirements.push(...context.rbac_roles.critical_rules);
    }

    if (areaList.includes('database')) {
        requirements.push('Use parameterized queries only');
        requirements.push('Include tenant_id filter for RLS');
    }

    console.log(JSON.stringify({
        change: description,
        affected_areas: areaList,
        warnings,
        requirements_to_follow: requirements,
        recommendation: warnings.length > 0 ? 'PROCEED WITH CAUTION' : 'OK TO PROCEED'
    }, null, 2));
}

// Main
const [, , command, ...args] = process.argv;

switch (command) {
    case 'rules':
        getRules(args[0] || 'all');
        break;
    case 'status':
        getStatus();
        break;
    case 'rbac':
        if (!args[0]) {
            console.error('Usage: standards-cli.js rbac <role>');
            process.exit(1);
        }
        getRBAC(args[0]);
        break;
    case 'check':
        if (args.length < 2) {
            console.error('Usage: standards-cli.js check "<description>" <areas>');
            process.exit(1);
        }
        checkCompliance(args[0], args[1]);
        break;
    case 'context':
        console.log(fs.readFileSync(CONTEXT_FILE, 'utf-8'));
        break;
    default:
        console.log(`
Fleet Standards CLI - Query project standards

Commands:
  rules <category>         Get mandatory rules (security|code_quality|architecture|all)
  status                   Get current certification status
  rbac <role>              Get RBAC permissions for a role
  check "<desc>" <areas>   Check if a change is compliant
  context                  Show full LLM context

Examples:
  node standards-cli.js rules security
  node standards-cli.js status
  node standards-cli.js rbac Admin
  node standards-cli.js check "Add login endpoint" security,rbac
    `);
}
