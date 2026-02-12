# Autonomous Agent Implementation Guide

This guide explains how the autonomous development agent orchestrates all SDLC skills to build complete applications.

## Agent Architecture

```
┌─────────────────────────────────────────────────────────┐
│           Autonomous Development Agent                   │
│  (Meta-skill orchestrating all SDLC phases)             │
└─────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌──────────────┐
    │Requirements │ │   Repo      │ │  Frontend    │
    │  Analysis   │ │ Management  │ │ Development  │
    └─────────────┘ └─────────────┘ └──────────────┘
           │               │               │
           │               ▼               ▼
           │        ┌─────────────┐ ┌──────────────┐
           │        │    Repo     │ │   Visual     │
           │        │  Hygiene    │ │   Testing    │
           │        └─────────────┘ └──────────────┘
           │                              │
           └──────────────┬───────────────┘
                          ▼
                  ┌───────────────┐
                  │  Production   │
                  │  Deployment   │
                  └───────────────┘
```

## How the Agent Invokes Skills

### Phase 1: Requirements Analysis

```typescript
// Agent internally invokes requirements-analysis skill

const requirements = await gatherRequirements({
  userInput: "Build a task management app",
  questions: [
    "Who are the target users?",
    "What are the core features?",
    "Any specific integrations needed?",
    "Expected scale (users, data)?",
    "Budget constraints?"
  ]
})

// Generates:
// - requirements.md
// - user-stories.md (prioritized by MoSCoW)
// - technical-specs.md (stack decisions)
```

### Phase 2: Repository Setup

```typescript
// Agent invokes repo-management + repo-hygiene

const repository = await setupRepository({
  projectName: "task-management-app",
  platform: "github", // or "azure"
  features: {
    branchProtection: true,
    prTemplate: true,
    cicd: "github-actions", // or "azure-pipelines"
  }
})

// Agent invokes repo-hygiene to prevent Claude files
await configureGitignore({
  templates: ["node", "react", "typescript"],
  customPatterns: [
    "*.claude.md",
    "*_analysis.md",
    "ai-generated*.md",
    "/mnt/outputs/*.md"
  ]
})

await setupPreCommitHooks({
  tools: ["husky", "lint-staged"],
  checks: ["lint", "type-check", "forbidden-files"]
})
```

### Phase 3: Frontend Development

```typescript
// Agent invokes frontend-development skill

const frontend = await buildFrontend({
  framework: "react",
  language: "typescript",
  buildTool: "vite",
  styling: "tailwind",
  stateManagement: {
    global: "zustand",
    server: "tanstack-query"
  },
  routing: "react-router",
  testing: "vitest",
  
  pages: requirements.userStories.map(story => ({
    route: story.route,
    components: story.components,
    acceptance: story.acceptanceCriteria
  })),
  
  features: {
    responsive: true,
    accessibility: "wcag2.1-aa",
    performance: {
      codeSplitting: true,
      lazyLoading: true,
      imageOptimization: true
    }
  }
})

// Generates:
// - Complete React app in src/
// - All components, pages, hooks
// - Unit tests for components
// - Docker configuration
```

### Phase 4: Backend Development (If Needed)

```typescript
// Agent uses patterns from existing tire-retail-system

const backend = await buildBackend({
  runtime: "nodejs",
  framework: "express",
  language: "typescript",
  database: {
    type: "postgresql",
    orm: "prisma"
  },
  
  authentication: {
    method: "jwt",
    refreshTokens: true
  },
  
  endpoints: requirements.userStories
    .filter(story => story.requiresAPI)
    .map(story => ({
      method: story.apiMethod,
      path: story.apiPath,
      validation: story.inputValidation,
      authorization: story.requiredRole
    })),
  
  features: {
    caching: "redis",
    fileUpload: "s3",
    email: "nodemailer",
    logging: "winston"
  }
})
```

### Phase 5: Visual Testing

```typescript
// Agent invokes visual-testing skill

const tests = await setupVisualTesting({
  framework: "playwright",
  browsers: ["chromium", "firefox", "webkit"],
  
  spider: {
    enabled: true,
    maxDepth: 5,
    captureScreenshots: true,
    checkAccessibility: true,
    measurePerformance: true
  },
  
  e2eTests: requirements.userStories.map(story => ({
    name: story.title,
    flow: story.acceptanceCriteria,
    dataTestIds: story.testIds
  })),
  
  visualRegression: {
    tool: "backstopjs", // or "percy"
    viewports: ["mobile", "tablet", "desktop"],
    threshold: 0.1
  },
  
  accessibility: {
    standards: ["wcag2a", "wcag2aa", "wcag21aa"],
    auditAllPages: true
  },
  
  performance: {
    budgets: {
      lcp: 2500, // Largest Contentful Paint
      fid: 100,  // First Input Delay
      cls: 0.1   // Cumulative Layout Shift
    }
  }
})

// Runs spider to discover and test all pages
const spiderResults = await tests.spider.run()

console.log(`
✅ Tested ${spiderResults.pageCount} pages
✅ ${spiderResults.e2eTests} E2E tests passing
✅ ${spiderResults.a11yViolations} accessibility violations found
✅ Performance: ${spiderResults.lighthouseScore}/100
`)
```

### Phase 6: Deployment

```typescript
// Agent invokes production-deployment-skill

const deployment = await deployToProduction({
  // Security scanning
  security: {
    codeScan: true,
    dependencyScan: true,
    secretsScan: true
  },
  
  // Testing
  testing: {
    unit: true,
    integration: true,
    e2e: true,
    coverage: { minimum: 80 }
  },
  
  // Infrastructure
  infrastructure: {
    containerization: "docker",
    orchestration: "kubernetes", // optional
    iac: "terraform"
  },
  
  // CI/CD
  cicd: {
    platform: "github-actions",
    stages: [
      "test",
      "build",
      "deploy-staging",
      "deploy-production"
    ],
    rollback: true
  },
  
  // Monitoring
  monitoring: {
    healthChecks: true,
    logging: "cloudwatch",
    metrics: "prometheus",
    alerting: "pagerduty"
  }
})

console.log(`
✅ Application deployed to: ${deployment.productionUrl}
✅ Monitoring dashboard: ${deployment.monitoringUrl}
✅ CI/CD pipeline: ${deployment.pipelineUrl}
`)
```

## Decision Tree

The agent uses this decision tree to make autonomous choices:

```
User Request: "Build me X"
    │
    ├─> Phase 1: Requirements
    │   ├─> Ask 3-5 clarifying questions
    │   ├─> Generate user stories
    │   ├─> Decide tech stack based on:
    │   │   ├─> Complexity (simple → Vite, complex → Next.js)
    │   │   ├─> Scale (small → SQLite, large → PostgreSQL)
    │   │   └─> Features (real-time → WebSockets, standard → REST)
    │   └─> Present plan for approval ◄── USER CHECKPOINT
    │
    ├─> Phase 2: Repository
    │   ├─> Auto-decide: GitHub vs Azure (based on user preference)
    │   ├─> Auto-decide: Branch strategy (simple → GitHub Flow, complex → Git Flow)
    │   └─> Auto-configure: .gitignore + hooks
    │
    ├─> Phase 3: Frontend
    │   ├─> Auto-decide: Component structure (atomic design)
    │   ├─> Auto-decide: State management (Zustand for most, Redux for complex)
    │   ├─> Auto-decide: Styling approach (Tailwind for MVP, CSS modules for brand)
    │   └─> Auto-implement: All pages and components
    │
    ├─> Phase 4: Backend (if needed)
    │   ├─> Auto-decide: API structure (RESTful by default)
    │   ├─> Auto-decide: Auth strategy (JWT for stateless, sessions for admin)
    │   ├─> Auto-decide: Caching strategy (Redis if >100 concurrent users)
    │   └─> Auto-implement: All endpoints
    │
    ├─> Phase 5: Testing
    │   ├─> Auto-configure: Playwright + multi-browser
    │   ├─> Auto-generate: E2E tests from user stories
    │   ├─> Auto-run: Spider through all pages
    │   └─> Auto-audit: Accessibility + performance
    │
    ├─> Phase 6: Deployment
    │   ├─> Ask: Deployment target (AWS/Azure/Vercel) ◄── USER CHECKPOINT
    │   ├─> Auto-configure: Docker + CI/CD
    │   ├─> Auto-deploy: To staging first
    │   ├─> Auto-verify: Health checks
    │   └─> Ask: Deploy to production? ◄── USER CHECKPOINT
    │
    └─> Phase 7: Delivery
        └─> Present: URLs, repos, documentation, reports
```

## Error Recovery Patterns

### Build Errors

```typescript
async function handleBuildError(error: BuildError) {
  console.log(`❌ Build failed: ${error.message}`)
  
  // Attempt 1: Analyze and fix common issues
  if (error.type === 'type-error') {
    await fixTypeScriptErrors(error)
  } else if (error.type === 'import-error') {
    await resolveImportIssues(error)
  }
  
  // Retry build
  const retryResult = await build()
  if (retryResult.success) {
    console.log('✅ Build succeeded after fix')
    return
  }
  
  // Attempt 2: Regenerate problematic file
  if (error.file) {
    console.log(`Regenerating ${error.file}...`)
    await regenerateFile(error.file)
    const retry2 = await build()
    if (retry2.success) return
  }
  
  // Attempt 3: Ask user for help
  console.log('⚠️ Unable to fix automatically')
  await askUserForHelp({
    error: error.message,
    context: error.stack,
    suggestedFixes: error.possibleFixes
  })
}
```

### Test Failures

```typescript
async function handleTestFailure(test: FailedTest) {
  console.log(`❌ Test failed: ${test.name}`)
  
  // Analyze failure
  const analysis = await analyzeTestFailure(test)
  
  if (analysis.type === 'implementation-bug') {
    // Fix the implementation
    await fixImplementation(analysis.fix)
    await rerunTest(test)
  } else if (analysis.type === 'test-issue') {
    // Update the test
    await updateTest(test, analysis.correction)
    await rerunTest(test)
  } else {
    // Report to user
    await reportTestFailure({
      test: test.name,
      expected: test.expected,
      actual: test.actual,
      analysis: analysis.explanation
    })
  }
}
```

## Quality Gates

The agent enforces quality gates at each phase:

```typescript
const qualityGates = {
  phase1: {
    name: "Requirements",
    checks: [
      { name: "All user stories have acceptance criteria", required: true },
      { name: "Tech stack defined", required: true },
      { name: "Non-functional requirements documented", required: true }
    ]
  },
  
  phase2: {
    name: "Repository",
    checks: [
      { name: ".gitignore configured", required: true },
      { name: "Pre-commit hooks working", required: true },
      { name: "CI/CD pipeline configured", required: true }
    ]
  },
  
  phase3: {
    name: "Frontend",
    checks: [
      { name: "All pages implemented", required: true },
      { name: "Build succeeds", required: true },
      { name: "No TypeScript errors", required: true },
      { name: "No ESLint errors", required: true },
      { name: "Unit test coverage > 80%", required: false, warn: true }
    ]
  },
  
  phase5: {
    name: "Testing",
    checks: [
      { name: "All E2E tests passing", required: true },
      { name: "No critical accessibility violations", required: true },
      { name: "Performance score > 90", required: false, warn: true },
      { name: "Spider found all pages", required: true }
    ]
  },
  
  phase6: {
    name: "Deployment",
    checks: [
      { name: "Security scan passed", required: true },
      { name: "All tests passed", required: true },
      { name: "Docker build succeeded", required: true },
      { name: "Health checks passing", required: true }
    ]
  }
}
```

## Performance Optimizations

The agent optimizes development time:

```typescript
const optimizations = {
  // Parallel execution where possible
  parallel: {
    phase3: [
      "Install dependencies",
      "Configure TypeScript",
      "Set up ESLint/Prettier"
    ],
    phase5: [
      "Run unit tests",
      "Run E2E tests",
      "Run accessibility audits",
      "Run performance tests"
    ]
  },
  
  // Caching
  cache: {
    dependencies: true, // Cache node_modules
    builds: true,       // Cache build artifacts
    testResults: true   // Cache passing tests
  },
  
  // Incremental development
  incremental: {
    components: true,   // Build components incrementally
    tests: true,        // Write tests as features complete
    documentation: true // Update docs as code changes
  }
}
```

## Agent Learning & Improvement

The agent improves over time by tracking:

```typescript
interface AgentMetrics {
  projectsCompleted: number
  averageTime: Record<Phase, number>
  errorRate: Record<Phase, number>
  userSatisfaction: number
  commonIssues: Array<{
    phase: Phase
    error: string
    frequency: number
    resolutionTime: number
  }>
}

// Agent adjusts behavior based on metrics
if (metrics.errorRate.testing > 0.2) {
  // Increase test generation thoroughness
  config.testing.e2eCoverage = "exhaustive"
}

if (metrics.averageTime.frontend > 60 * 60) {
  // Optimize component generation
  config.frontend.parallelization = true
}
```

## Example: Complete Execution Log

```
🚀 Starting autonomous development...

[00:00] Phase 1: Requirements Analysis
[00:02] → Asking 4 clarifying questions...
[02:15] → User answered all questions
[02:18] → Generated 12 user stories (8 Must Have, 4 Should Have)
[02:22] → Created technical specifications
[02:25] → Requirements phase complete ✓

[02:25] → Presenting plan to user for approval...
[05:30] → User approved plan

[05:30] Phase 2: Repository Setup
[05:32] → Initialized Git repository
[05:35] → Configured .gitignore (including Claude patterns)
[05:37] → Set up pre-commit hooks (Husky + lint-staged)
[05:42] → Created GitHub Actions workflow
[05:45] → Initial commit complete
[05:45] → Repository phase complete ✓

[05:45] Phase 3: Frontend Development
[05:48] → Installing dependencies...
[07:22] → Dependencies installed (134 packages)
[07:25] → Configured TypeScript, ESLint, Prettier, Tailwind
[07:30] → Creating project structure...
[08:15] → Implementing pages (8 pages)...
[15:42] → Implementing components (24 components)...
[22:18] → Setting up state management (3 stores)...
[25:30] → Implementing API services (6 services)...
[28:45] → Writing unit tests (32 tests)...
[32:15] → Build successful, no errors
[32:15] → Frontend phase complete ✓

[32:15] Phase 4: Testing Setup
[32:20] → Configuring Playwright...
[33:45] → Creating spider test...
[35:12] → Running spider (discovered 8 pages)...
[37:30] → Taking screenshots (8 pages × 3 viewports = 24 screenshots)
[38:45] → Running accessibility audits...
[40:15] → 0 critical violations found ✓
[40:20] → Implementing E2E tests (15 tests)...
[48:30] → All E2E tests passing ✓
[48:35] → Setting up visual regression...
[50:15] → Created baselines for 8 pages
[50:15] → Testing phase complete ✓

[50:15] Phase 5: Deployment
[50:20] → Running security scan...
[52:30] → No vulnerabilities found ✓
[52:35] → Running full test suite...
[58:45] → All 47 tests passing ✓
[58:50] → Building Docker image...
[62:15] → Docker build successful
[62:20] → Deploying to staging...
[68:30] → Staging deployment complete
[68:35] → Running smoke tests...
[70:15] → All smoke tests passing ✓
[70:15] → Deployment phase complete ✓

[70:15] → Asking user for production deployment approval...
[72:45] → User approved production deployment
[72:50] → Deploying to production...
[78:30] → Production deployment complete ✓
[78:35] → Verifying health checks...
[79:15] → All health checks passing ✓

[79:15] Phase 6: Final Verification
[79:20] → Running spider on production...
[81:45] → All pages accessible ✓
[81:50] → Verifying user stories implementation...
[83:15] → All 12 user stories implemented ✓
[83:20] → Generating final report...
[84:00] → Final verification complete ✓

✅ Application successfully deployed!

📊 Summary:
   Total time: 84 minutes
   Pages: 8
   Components: 24
   Tests: 47 (all passing)
   Accessibility: WCAG 2.1 AA compliant
   Performance: 96/100 Lighthouse score
   
🔗 URLs:
   Production: https://your-app.vercel.app
   Repository: https://github.com/user/your-app
   CI/CD: https://github.com/user/your-app/actions
   
📚 Documentation:
   README: /docs/README.md
   Architecture: /docs/ARCHITECTURE.md
   API: /docs/API.md
   Deployment: /docs/DEPLOYMENT.md
```

## Conclusion

The autonomous development agent is a sophisticated orchestrator that coordinates all SDLC skills to deliver complete, production-ready applications. It makes intelligent decisions, enforces quality standards, and handles errors gracefully while allowing user oversight at critical checkpoints.
