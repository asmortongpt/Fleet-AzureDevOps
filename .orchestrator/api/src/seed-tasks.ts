import { pool } from './db';

async function seedTasks() {
  console.log('Seeding Fleet Architecture Remediation tasks...');

  try {
    // Create project
    const projectResult = await pool.query(`
      INSERT INTO projects (name, repo, default_branch)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, ['Fleet', 'https://github.com/asmortongpt/Fleet', 'main']);

    const projectId = projectResult.rows[0]?.id || (await pool.query('SELECT id FROM projects WHERE name = $1', ['Fleet'])).rows[0].id;

    console.log(`Project ID: ${projectId}`);

    // Epic 1: Backend Repository Layer Migration (160 hours)
    const tasks = [
      // Epic 1
      {
        epic: 1,
        issue: '1.1',
        title: 'Create Repository Base Classes & Interfaces',
        description: 'Base repository interface, generic CRUD repository, transaction management utilities',
        hours: 8,
        priority: 100,
        branch: 'epic-1/repositories',
        status: 'done' // Already completed
      },
      {
        epic: 1,
        issue: '1.2',
        title: 'Fleet Domain Repositories',
        description: 'VehiclesRepository, DriversRepository, TelemetryRepository - Move 150+ queries',
        hours: 24,
        priority: 100,
        branch: 'epic-1/repositories',
        status: 'done' // Already completed
      },
      {
        epic: 1,
        issue: '1.3',
        title: 'Maintenance Domain Repositories',
        description: 'WorkOrdersRepository, MaintenanceRepository, InspectionsRepository - Move 120+ queries',
        hours: 24,
        priority: 100,
        branch: 'epic-1/repositories'
      },
      {
        epic: 1,
        issue: '1.4',
        title: 'Facilities & Assets Repositories',
        description: 'FacilitiesRepository, AssetsRepository - Move 80+ queries',
        hours: 20,
        priority: 90,
        branch: 'agent-d/facilities-repos'
      },
      {
        epic: 1,
        issue: '1.5',
        title: 'Incidents & Compliance Repositories',
        description: 'IncidentsRepository, ComplianceRepository - Move 70+ queries',
        hours: 20,
        priority: 90,
        branch: 'agent-e/incidents-repos'
      },
      {
        epic: 1,
        issue: '1.6',
        title: 'Remaining Domain Repositories',
        description: 'Reports, Analytics, Documents repositories - Move 298 queries',
        hours: 24,
        priority: 80,
        branch: 'agent-f/remaining-repos'
      },
      {
        epic: 1,
        issue: '1.7',
        title: 'Migrate Routes to Use Repositories',
        description: 'Update all 186 route files, remove pool.query() calls from routes',
        hours: 40,
        priority: 70,
        branch: 'agent-g/routes-migration'
      },

      // Epic 2: DI Container Integration (60 hours)
      {
        epic: 2,
        issue: '2.1',
        title: 'Update DI Container Configuration',
        description: 'Register repositories and services, configure lifetimes',
        hours: 8,
        priority: 60,
        branch: 'epic-2/di-integration'
      },
      {
        epic: 2,
        issue: '2.2',
        title: 'Refactor Fleet Services to Use DI',
        description: 'Update 25+ fleet services to use container injection',
        hours: 12,
        priority: 60,
        branch: 'epic-2/di-integration'
      },
      {
        epic: 2,
        issue: '2.3',
        title: 'Refactor Maintenance Services to Use DI',
        description: 'Update 20+ maintenance services to use container injection',
        hours: 12,
        priority: 60,
        branch: 'epic-2/di-integration'
      },
      {
        epic: 2,
        issue: '2.4',
        title: 'Refactor Remaining Services to Use DI',
        description: 'Update 92+ remaining services to use container injection',
        hours: 20,
        priority: 50,
        branch: 'epic-2/di-integration'
      },
      {
        epic: 2,
        issue: '2.5',
        title: 'Integration Testing & Documentation',
        description: 'DI container usage docs, service registration guidelines, integration tests',
        hours: 8,
        priority: 50,
        branch: 'epic-2/di-integration'
      },

      // Epic 3: Frontend Component Refactoring (120 hours)
      {
        epic: 3,
        issue: '3.1',
        title: 'Create Reusable Component Library',
        description: 'DataTable, FilterPanel, PageHeader, ConfirmDialog, FileUpload, DialogForm',
        hours: 16,
        priority: 100,
        branch: 'epic-3/reusable-components',
        status: 'done' // Already completed
      },
      {
        epic: 3,
        issue: '3.2',
        title: 'Refactor VirtualGarage (1,345 lines → modules)',
        description: 'Break into 10+ components, extract hooks, target <300 lines per component',
        hours: 40,
        priority: 100,
        branch: 'epic-3/reusable-components'
      },
      {
        epic: 3,
        issue: '3.3',
        title: 'Refactor InventoryManagement (1,136 lines → modules)',
        description: 'Break into 8+ components, extract hooks, target <300 lines per component',
        hours: 32,
        priority: 80,
        branch: 'agent-h/inventory-refactor'
      },
      {
        epic: 3,
        issue: '3.4',
        title: 'Refactor EnhancedTaskManagement (1,018 lines → modules)',
        description: 'Break into 8+ components, extract hooks, target <300 lines per component',
        hours: 32,
        priority: 80,
        branch: 'agent-i/task-refactor'
      },
      {
        epic: 3,
        issue: '3.5',
        title: 'Apply Pattern to Remaining Large Components',
        description: 'Refactor 5+ components >800 lines, standardize structure, ESLint rule',
        hours: 20,
        priority: 70,
        branch: 'agent-j/remaining-components'
      },

      // Epic 4: API Type Safety & Zod Schemas (40 hours) - ALL COMPLETE
      {
        epic: 4,
        issue: '4.1',
        title: 'Define Base Zod Schemas',
        description: 'Common utilities, pagination, filters, response wrappers',
        hours: 8,
        priority: 100,
        branch: 'epic-3/reusable-components',
        status: 'done'
      },
      {
        epic: 4,
        issue: '4.2',
        title: 'Fleet Domain Schemas',
        description: 'VehicleSchema, DriverSchema, TelemetrySchema, fix field mismatches',
        hours: 8,
        priority: 100,
        branch: 'epic-3/reusable-components',
        status: 'done'
      },
      {
        epic: 4,
        issue: '4.3',
        title: 'Maintenance Domain Schemas',
        description: 'WorkOrderSchema, MaintenanceSchema, InspectionSchema',
        hours: 8,
        priority: 100,
        branch: 'epic-3/reusable-components',
        status: 'done'
      },
      {
        epic: 4,
        issue: '4.4',
        title: 'Remaining Domain Schemas',
        description: 'Facilities, Assets, Incidents, Compliance, Reports schemas',
        hours: 8,
        priority: 100,
        branch: 'epic-3/reusable-components',
        status: 'done'
      },
      {
        epic: 4,
        issue: '4.5',
        title: 'Frontend Integration',
        description: 'Validated API hooks, runtime validation, error handling',
        hours: 8,
        priority: 100,
        branch: 'epic-3/reusable-components',
        status: 'done'
      },

      // Epic 5: Testing & Quality (152 hours)
      {
        epic: 5,
        issue: '5.1',
        title: 'Fix Existing Test Errors',
        description: 'Fix 17 TypeScript errors in test files, resolve Playwright warnings',
        hours: 16,
        priority: 50,
        branch: 'agent-k/test-fixes'
      },
      {
        epic: 5,
        issue: '5.2',
        title: 'Backend Unit Tests',
        description: 'Repository and service layer tests, 80%+ coverage',
        hours: 40,
        priority: 40,
        branch: 'agent-l/backend-tests'
      },
      {
        epic: 5,
        issue: '5.3',
        title: 'Frontend Unit Tests',
        description: 'Component and hook tests, 80%+ coverage',
        hours: 40,
        priority: 40,
        branch: 'agent-m/frontend-tests'
      },
      {
        epic: 5,
        issue: '5.4',
        title: 'Complete Accessibility',
        description: 'Add aria-labels to 477 buttons, WCAG 2.1 AA compliance',
        hours: 24,
        priority: 50,
        branch: 'agent-n/accessibility'
      },
      {
        epic: 5,
        issue: '5.5',
        title: 'Performance Optimization',
        description: 'Code splitting optimization, lazy loading, bundle size reduction',
        hours: 16,
        priority: 30,
        branch: 'epic-5/optimization'
      },
      {
        epic: 5,
        issue: '5.6',
        title: 'Security Hardening',
        description: 'Security scan, dependency updates, final audit',
        hours: 16,
        priority: 80,
        branch: 'epic-5/security'
      }
    ];

    // Insert tasks
    let insertedCount = 0;
    for (const task of tasks) {
      const result = await pool.query(`
        INSERT INTO tasks (
          project_id, epic_number, issue_number, title, description,
          status, estimated_hours, priority, branch_name
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [
        projectId,
        task.epic,
        task.issue,
        task.title,
        task.description,
        task.status || 'pending',
        task.hours,
        task.priority,
        task.branch
      ]);

      if (result.rows.length > 0) {
        insertedCount++;
        console.log(`  ✓ Epic ${task.epic} Issue ${task.issue}: ${task.title}`);
      }
    }

    // Register existing agents
    const agents = [
      { name: 'agent-a', model: 'claude-sonnet-4', role: 'backend-repository', epic: 1 },
      { name: 'agent-b', model: 'claude-sonnet-4', role: 'frontend-components', epic: 3 },
      { name: 'agent-c', model: 'claude-sonnet-4', role: 'zod-schemas', epic: 4, active: false }
    ];

    for (const agent of agents) {
      await pool.query(`
        INSERT INTO agents (name, llm_model, role, active, last_heartbeat)
        VALUES ($1, $2, $3, $4, now())
        ON CONFLICT (name) DO UPDATE
        SET llm_model = EXCLUDED.llm_model,
            role = EXCLUDED.role,
            last_heartbeat = now()
      `, [agent.name, agent.model, agent.role, agent.active !== false]);

      console.log(`  ✓ Agent registered: ${agent.name} (${agent.role})`);
    }

    console.log('');
    console.log(`✓ Seeding complete: ${insertedCount} tasks inserted`);
    console.log(`✓ Total tasks: ${tasks.length}`);
    console.log(`✓ Total estimated hours: ${tasks.reduce((sum, t) => sum + t.hours, 0)}`);

  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedTasks();
