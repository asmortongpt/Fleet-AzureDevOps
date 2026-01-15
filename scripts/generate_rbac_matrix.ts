
interface Role {
    name: string;
    description: string;
}

interface Resource {
    name: string;
    description: string;
}

interface Action {
    name: string;
    code: string;
}

type PermissionLevel = 'FULL' | 'OWN' | 'NONE' | 'READ_ONLY';

interface MatrixEntry {
    role: string;
    resource: string;
    actions: Record<string, PermissionLevel>;
}

const roles: Role[] = [
    { name: 'Admin', description: 'Super user with full access' },
    { name: 'FleetManager', description: 'Manages fleet operations' },
    { name: 'Driver', description: 'Operates vehicles' },
    { name: 'Technician', description: 'Performs maintenance' },
    { name: 'Finance', description: 'Manages costs and invoices' },
    { name: 'SafetyOfficer', description: 'Manages safety compliance' }
];

const resources: Resource[] = [
    { name: 'Vehicle', description: 'Fleet vehicles' },
    { name: 'DriverProfile', description: 'Driver information' },
    { name: 'MaintenanceRequest', description: 'Repairs and service' },
    { name: 'FuelTransaction', description: 'Fuel logs' },
    { name: 'Inspection', description: 'DVIR inspections' },
    { name: 'Policy', description: 'Rules and compliance policies' },
    { name: 'FinancialRecord', description: 'Invoices and costs' }
];

const actions: Action[] = [
    { name: 'Create', code: 'C' },
    { name: 'Read', code: 'R' },
    { name: 'Update', code: 'U' },
    { name: 'Delete', code: 'D' },
    { name: 'Approve', code: 'A' },
    { name: 'Export', code: 'E' }
];

const matrix: MatrixEntry[] = [];

// Helper to generate matrix
roles.forEach(role => {
    resources.forEach(resource => {
        const entry: MatrixEntry = {
            role: role.name,
            resource: resource.name,
            actions: {}
        };

        // Default DENY
        actions.forEach(a => entry.actions[a.name] = 'NONE');

        // Admin Logic
        if (role.name === 'Admin') {
            actions.forEach(a => entry.actions[a.name] = 'FULL');
        }

        // Fleet Manager Logic
        else if (role.name === 'FleetManager') {
            actions.forEach(a => entry.actions[a.name] = 'FULL');
            // Except Financial strict delete
            if (resource.name === 'FinancialRecord') entry.actions['Delete'] = 'NONE';
        }

        // Driver Logic
        else if (role.name === 'Driver') {
            if (resource.name === 'Vehicle') {
                entry.actions['Read'] = 'FULL';
                entry.actions['Update'] = 'NONE'; // Can only report issues
            }
            if (resource.name === 'DriverProfile') {
                entry.actions['Read'] = 'OWN';
                entry.actions['Update'] = 'OWN';
            }
            if (resource.name === 'MaintenanceRequest') {
                entry.actions['Create'] = 'FULL';
                entry.actions['Read'] = 'OWN';
            }
            if (resource.name === 'Inspection') {
                entry.actions['Create'] = 'FULL';
                entry.actions['Read'] = 'OWN';
            }
        }

        // Technician Logic
        else if (role.name === 'Technician') {
            if (resource.name === 'MaintenanceRequest') {
                entry.actions['Read'] = 'FULL';
                entry.actions['Update'] = 'FULL';
                entry.actions['Approve'] = 'FULL'; // Complete work
            }
            if (resource.name === 'Vehicle') {
                entry.actions['Read'] = 'FULL';
            }
        }

        matrix.push(entry);
    });
});

import fs from 'fs';
import path from 'path';

const artifactsDir = path.join(process.cwd(), 'artifacts');
fs.writeFileSync(path.join(artifactsDir, 'rbac_matrix.json'), JSON.stringify({
    meta: {
        generatedAt: new Date().toISOString(),
        version: '1.0'
    },
    roles,
    resources,
    actions,
    matrix
}, null, 2));

console.log('RBAC Matrix Generated');
