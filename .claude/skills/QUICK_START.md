# SDLC Skills Suite - Quick Start Guide

## What You Have

A complete suite of Claude skills covering the Software Development Life Cycle (SDLC), built specifically for application development with best practices and industry standards.

## Skills Included

### ✅ 1. Requirements Analysis (`requirements-analysis/`)
**Transform vague ideas into concrete, actionable requirements**

- Systematic requirements gathering process
- User story creation with acceptance criteria
- MoSCoW prioritization (Must/Should/Could/Won't Have)
- Non-functional requirements (performance, security, scalability)
- Complete document templates for specifications
- Real-world examples (E-commerce, SaaS, Internal tools)
- Domain-specific checklists

**Use when**: Starting new projects, defining features, planning scope

### ✅ 2. Frontend Development (`frontend-development/`)
**Build modern, accessible, performant React applications**

**Technology Stack**:
- React 18+ with Hooks, Suspense, Concurrent features
- TypeScript for type safety
- Vite for blazing-fast builds
- Tailwind CSS for utility-first styling
- Zustand for simple global state
- TanStack Query for server state management
- React Router for routing
- Vitest + React Testing Library for testing

**Covers**:
- Complete project setup configurations
- Component architecture patterns
- State management (local, global, server)
- Performance optimization (code splitting, memoization, virtual scrolling)
- Accessibility best practices (a11y)
- Responsive design (mobile-first)
- Error handling and boundaries
- Security best practices
- Testing strategies
- Production deployment

**Use when**: Building UIs, creating React apps, optimizing frontend performance

### ✅ 3. Testing & Deployment (`production-deployment-skill`)
**Existing skill already available in your system**

- Comprehensive testing (Playwright, security, performance)
- Code scanning and quality analysis
- Infrastructure generation (Docker, Kubernetes, Terraform)
- CI/CD pipeline automation
- Deployment orchestration with rollback
- Health checks and monitoring

**Use when**: Deploying to production, setting up CI/CD, running comprehensive tests

## Integration with Existing Skills

Your SDLC skills work seamlessly with other available skills:

- **docx**: Create formal requirements specifications and technical documentation
- **pptx**: Build executive summaries and design presentations
- **pdf**: Generate finalized documents
- **mcp-builder**: Design API integrations
- **theme-factory**: Apply consistent styling
- **brand-guidelines**: Add company branding

## Complete Workflow Example

### Building a New Application (E-Commerce Site)

**Phase 1: Requirements (Use `requirements-analysis` skill)**
```
User: "I want to build an e-commerce site for tire sales with multi-location inventory"

Claude (with requirements-analysis): 
- Asks discovery questions (users, scale, constraints)
- Creates user stories with acceptance criteria
- Prioritizes with MoSCoW
- Documents functional & non-functional requirements
- Generates requirements specification
```

**Phase 2: Frontend Development (Use `frontend-development` skill)**
```
User: "Build the product catalog page"

Claude (with frontend-development):
- Sets up React + TypeScript + Vite project
- Creates responsive ProductCatalog component
- Implements search/filter with TanStack Query
- Adds pagination and loading states
- Ensures accessibility (keyboard nav, ARIA labels)
- Writes component tests
```

**Phase 3: Testing & Deployment (Use `production-deployment-skill`)**
```
User: "Deploy to production"

Claude (with production-deployment-skill):
- Runs code scanner for security issues
- Executes comprehensive test suite
- Generates Docker configuration
- Sets up CI/CD pipeline
- Deploys with health checks
- Configures monitoring
```

## Quick Reference

### When to Use Each Skill

| Scenario | Skill to Use |
|----------|--------------|
| "I want to build..." | requirements-analysis |
| "Help me plan..." | requirements-analysis |
| "Create a React app" | frontend-development |
| "Make it responsive" | frontend-development |
| "Optimize performance" | frontend-development |
| "Deploy to production" | production-deployment-skill |
| "Set up CI/CD" | production-deployment-skill |
| "Write tests" | frontend-development + production-deployment-skill |

### Technology Stacks Covered

**Frontend**:
- React 18+ (function components, hooks)
- TypeScript (type safety)
- Vite (build tool)
- Tailwind CSS (styling)
- Zustand (global state)
- TanStack Query (server state)
- React Router (routing)
- Vitest (testing)

**Backend** (via production-deployment-skill):
- Node.js + Express
- PostgreSQL
- Redis
- Docker
- Kubernetes

**Testing**:
- Vitest (unit tests)
- React Testing Library (component tests)
- Playwright (E2E tests)
- Security scanning
- Performance testing

## File Locations

```
/sessions/nifty-eloquent-newton/mnt/outputs/sdlc-skills/
├── README.md                          # Overview of all skills
├── QUICK_START.md                     # This file
├── requirements-analysis/
│   ├── SKILL.md                       # Main skill instructions
│   └── references/
│       ├── templates.md               # Document templates
│       ├── examples.md                # Real-world examples
│       └── checklists.md              # Domain checklists
└── frontend-development/
    ├── SKILL.md                       # Main skill instructions
    └── references/
        └── project-setup.md           # Complete configurations
```

## Installation

To use these skills with Claude:

1. **Copy to skills directory**:
   ```bash
   cp -r /sessions/nifty-eloquent-newton/mnt/outputs/sdlc-skills/* ~/.claude/skills/
   ```

2. **Or use them directly**:
   The skills are already in your outputs folder and ready to use in this session.

## Examples of Using Multiple Skills Together

### Example 1: Build Invoice Management SaaS

```
1. requirements-analysis → Gather requirements, create user stories
   Output: Requirements specification document

2. frontend-development → Build invoice creation UI
   Output: React app with forms, validation, PDF generation

3. production-deployment-skill → Deploy to production
   Output: Running application with CI/CD
```

### Example 2: Add Feature to Existing App

```
1. requirements-analysis → Define new feature requirements
   Output: User stories with acceptance criteria

2. frontend-development → Implement UI components
   Output: New feature components with tests

3. production-deployment-skill → Test and deploy
   Output: Feature live in production
```

### Example 3: Optimize Performance

```
1. frontend-development → Apply performance patterns
   - Code splitting
   - Memoization
   - Virtual scrolling
   - Image optimization

2. production-deployment-skill → Run performance tests
   Output: Performance metrics and improvements verified
```

## Best Practices Included

### Requirements Analysis
✅ Progressive elaboration (broad → detailed)
✅ Conversational discovery (not interrogation)
✅ MoSCoW prioritization
✅ Jobs-to-be-Done framework
✅ Given-When-Then acceptance criteria

### Frontend Development
✅ TypeScript for type safety
✅ Component composition patterns
✅ Custom hooks for logic reuse
✅ Proper state management (local vs global vs server)
✅ Performance optimization (code splitting, memoization)
✅ Accessibility (semantic HTML, ARIA, keyboard nav)
✅ Responsive design (mobile-first)
✅ Error boundaries and graceful degradation
✅ Security best practices (XSS prevention, environment variables)
✅ Comprehensive testing (unit, component, E2E)

### Testing & Deployment
✅ Automated testing (unit, integration, E2E, security)
✅ Code quality scanning
✅ Infrastructure as code (Docker, Kubernetes)
✅ CI/CD automation
✅ Zero-downtime deployments
✅ Rollback capabilities
✅ Health checks and monitoring

## Support & Resources

### Included Documentation
- Complete project setup guides
- Real-world worked examples
- Domain-specific checklists (e-commerce, SaaS, dashboards, APIs)
- Testing patterns and strategies
- Performance optimization guides
- Accessibility guidelines
- Security best practices

### External Resources
- React: https://react.dev
- TypeScript: https://www.typescriptlang.org
- Tailwind CSS: https://tailwindcss.com
- TanStack Query: https://tanstack.com/query
- Vitest: https://vitest.dev

## What's Next?

These skills are **production-ready** and can be used immediately for:

- Starting new projects
- Adding features to existing apps
- Optimizing performance
- Deploying to production
- Setting up CI/CD pipelines

**Optional Future Additions**:
- System Design skill (architecture patterns, database design)
- Backend Development skill (Node.js, Express, Prisma patterns)
- Maintenance & Support skill (monitoring, optimization, debugging)

But with what you have now (**requirements-analysis** + **frontend-development** + **production-deployment-skill**), you can build and deploy complete, production-ready applications end-to-end.

## Getting Started

Try it now:

1. **Start a new project**: "I want to build a [describe your app]"
   → Claude uses requirements-analysis skill

2. **Build the UI**: "Create the [specific page/component]"
   → Claude uses frontend-development skill

3. **Deploy**: "Deploy this to production"
   → Claude uses production-deployment-skill

The skills work together seamlessly to guide you through the entire development lifecycle.
