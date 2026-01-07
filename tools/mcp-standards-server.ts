/**
 * Fleet Standards MCP Server
 * 
 * This MCP (Model Context Protocol) server provides standardized access to
 * Fleet project standards, making them accessible to any LLM that supports MCP.
 * 
 * Supported LLMs via MCP:
 * - Claude (Anthropic)
 * - GPT-4 (via MCP bridge)
 * - Gemini (via MCP bridge)
 * - Local models (via MCP bridge)
 * 
 * Usage:
 *   npx ts-node mcp-standards-server.ts
 * 
 * Or add to Claude Desktop config:
 *   {
 *     "mcpServers": {
 *       "fleet-standards": {
 *         "command": "npx",
 *         "args": ["ts-node", "/path/to/mcp-standards-server.ts"]
 *       }
 *     }
 *   }
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListResourcesRequestSchema,
    ListToolsRequestSchema,
    ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..');

// Resource definitions
const RESOURCES = {
    'fleet://standards/context': {
        name: 'LLM Context',
        description: 'Universal context for all LLMs working on Fleet project',
        file: '.llm-context.json'
    },
    'fleet://standards/certification': {
        name: 'FedRAMP Certification',
        description: 'Complete FedRAMP certification report',
        file: 'api/FEDRAMP_CERTIFICATION_FINAL.json'
    },
    'fleet://standards/poam': {
        name: 'Plan of Action & Milestones',
        description: 'POA&M for remaining security items',
        file: 'api/POAM_JAN2026.json'
    },
    'fleet://standards/ssp': {
        name: 'System Security Plan',
        description: 'SSP summary document',
        file: 'api/SSP_SUMMARY_JAN2026.json'
    },
    'fleet://standards/rbac': {
        name: 'RBAC Truth Table',
        description: 'Complete RBAC permission matrix',
        file: '.agent/rbac_truth_table.json'
    },
    'fleet://standards/progress': {
        name: 'Certification Progress',
        description: 'Current certification progress and status',
        file: '.agent/security_certification_progress.json'
    },
    'fleet://standards/deployment': {
        name: 'Deployment Checklist',
        description: 'Production deployment checklist',
        file: 'api/PRODUCTION_DEPLOYMENT_CHECKLIST.json'
    }
};

// Tool definitions
const TOOLS = [
    {
        name: 'get_mandatory_rules',
        description: 'Get the mandatory rules that all LLMs must follow',
        inputSchema: {
            type: 'object',
            properties: {
                category: {
                    type: 'string',
                    enum: ['security', 'code_quality', 'architecture', 'all'],
                    description: 'Category of rules to retrieve'
                }
            },
            required: ['category']
        }
    },
    {
        name: 'check_compliance',
        description: 'Check if a proposed change is compliant with standards',
        inputSchema: {
            type: 'object',
            properties: {
                change_description: {
                    type: 'string',
                    description: 'Description of the proposed change'
                },
                affected_areas: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Areas affected (security, rbac, database, frontend, etc.)'
                }
            },
            required: ['change_description', 'affected_areas']
        }
    },
    {
        name: 'get_current_status',
        description: 'Get current project status including test results and certification progress',
        inputSchema: {
            type: 'object',
            properties: {}
        }
    },
    {
        name: 'get_rbac_permissions',
        description: 'Get RBAC permissions for a specific role',
        inputSchema: {
            type: 'object',
            properties: {
                role: {
                    type: 'string',
                    enum: ['Admin', 'FleetManager', 'MaintenanceManager', 'Finance', 'Safety', 'Inspector', 'Auditor', 'Driver', 'Vendor'],
                    description: 'Role to get permissions for'
                }
            },
            required: ['role']
        }
    }
];

async function main() {
    const server = new Server(
        {
            name: 'fleet-standards',
            version: '1.0.0',
        },
        {
            capabilities: {
                resources: {},
                tools: {},
            },
        }
    );

    // List available resources
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
        return {
            resources: Object.entries(RESOURCES).map(([uri, info]) => ({
                uri,
                name: info.name,
                description: info.description,
                mimeType: 'application/json'
            }))
        };
    });

    // Read a resource
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        const uri = request.params.uri;
        const resource = RESOURCES[uri as keyof typeof RESOURCES];

        if (!resource) {
            throw new Error(`Unknown resource: ${uri}`);
        }

        const filePath = path.join(PROJECT_ROOT, resource.file);

        if (!fs.existsSync(filePath)) {
            throw new Error(`Resource file not found: ${resource.file}`);
        }

        const content = fs.readFileSync(filePath, 'utf-8');

        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: content
                }
            ]
        };
    });

    // List available tools
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return { tools: TOOLS };
    });

    // Handle tool calls
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;

        switch (name) {
            case 'get_mandatory_rules': {
                const contextPath = path.join(PROJECT_ROOT, '.llm-context.json');
                const context = JSON.parse(fs.readFileSync(contextPath, 'utf-8'));
                const category = (args as { category: string }).category;

                if (category === 'all') {
                    return {
                        content: [{
                            type: 'text',
                            text: JSON.stringify(context.mandatory_rules, null, 2)
                        }]
                    };
                }

                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify(context.mandatory_rules[category] || [], null, 2)
                    }]
                };
            }

            case 'check_compliance': {
                const { change_description, affected_areas } = args as {
                    change_description: string;
                    affected_areas: string[]
                };

                const contextPath = path.join(PROJECT_ROOT, '.llm-context.json');
                const context = JSON.parse(fs.readFileSync(contextPath, 'utf-8'));

                const warnings: string[] = [];
                const requirements: string[] = [];

                if (affected_areas.includes('security')) {
                    requirements.push(...context.mandatory_rules.security);
                    if (change_description.toLowerCase().includes('password') ||
                        change_description.toLowerCase().includes('auth')) {
                        warnings.push('Security-critical change: Requires extra review');
                    }
                }

                if (affected_areas.includes('rbac')) {
                    requirements.push(...context.rbac_roles.critical_rules);
                }

                if (affected_areas.includes('database')) {
                    requirements.push('Use parameterized queries only');
                    requirements.push('Include tenant_id filter for RLS');
                }

                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            change: change_description,
                            affected_areas,
                            warnings,
                            requirements_to_follow: requirements,
                            recommendation: warnings.length > 0 ? 'PROCEED WITH CAUTION' : 'OK TO PROCEED'
                        }, null, 2)
                    }]
                };
            }

            case 'get_current_status': {
                const progressPath = path.join(PROJECT_ROOT, '.agent/security_certification_progress.json');
                const progress = fs.existsSync(progressPath)
                    ? JSON.parse(fs.readFileSync(progressPath, 'utf-8'))
                    : { status: 'unknown' };

                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            overall_status: progress.overall_status || 'unknown',
                            phase: progress.phase || 'unknown',
                            test_results: progress.test_verification || {},
                            gates_passed: progress.gate_status || {}
                        }, null, 2)
                    }]
                };
            }

            case 'get_rbac_permissions': {
                const { role } = args as { role: string };
                const rbacPath = path.join(PROJECT_ROOT, '.agent/rbac_truth_table.json');

                if (!fs.existsSync(rbacPath)) {
                    return {
                        content: [{
                            type: 'text',
                            text: JSON.stringify({ error: 'RBAC truth table not found' }, null, 2)
                        }]
                    };
                }

                const rbac = JSON.parse(fs.readFileSync(rbacPath, 'utf-8'));
                const roleInfo = rbac.roles?.find((r: any) => r.id === role);

                const moduleAccess: Record<string, string> = {};
                if (rbac.modules) {
                    for (const [module, info] of Object.entries(rbac.modules as Record<string, { access: string[], denied: string[] }>)) {
                        if (info.access.includes(role)) {
                            moduleAccess[module] = 'ALLOWED';
                        } else if (info.denied.includes(role)) {
                            moduleAccess[module] = 'DENIED';
                        }
                    }
                }

                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            role,
                            level: roleInfo?.level || 'unknown',
                            description: roleInfo?.description || 'unknown',
                            module_access: moduleAccess
                        }, null, 2)
                    }]
                };
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Fleet Standards MCP Server running on stdio');
}

main().catch(console.error);
