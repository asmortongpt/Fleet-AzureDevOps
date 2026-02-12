---
name: requirements-analysis
description: Expert requirements gathering for software projects. Use this skill whenever users need to analyze requirements, create user stories, define acceptance criteria, write technical specifications, or start any new software project. Trigger especially when users say things like "I want to build...", "help me plan...", "what should I include...", or "I need requirements for...". This skill helps transform vague ideas into concrete, actionable requirements documents. Works seamlessly with docx skill for creating formal specification documents.
---

# Requirements Analysis Skill

This skill helps Claude systematically gather, analyze, and document software requirements for any software project.

## When to Use This Skill

- Starting new software projects or major features
- User describes ideas but lacks detailed requirements
- Converting business needs into technical specifications  
- Creating user stories and acceptance criteria
- Planning system features and scope

**Works with**: `docx` (formal docs), `production-deployment-skill` (deployment), `mcp-builder` (APIs)

## Core Principles

### 1. Progressive Elaboration
Start broad (why/who), then narrow (what), then detail (how). Don't overwhelm with 50 questions upfront.

### 2. Conversational Discovery  
Ask questions that build on answers, uncover assumptions, reveal constraints, and validate through examples.

### 3. Show, Don't Just Ask
Propose concrete examples: "Something like this?" with sample workflows or user stories.

## Requirements Gathering Process

### Phase 1: Project Context
1. Business objective - Why build this? What problem solved?
2. Target users - Who uses it? Skill levels?
3. Success criteria - How measure success?
4. Scope boundaries - What's OUT of scope?

### Phase 2: Functional Requirements
1. Core workflows - Main user tasks?
2. Key features - Essential vs. nice-to-have?
3. Data requirements - What data stored/processed?
4. Integrations - External systems?

**User Story Format**:
```
As a [role]
I want to [action]
So that [value]

Acceptance Criteria:
- Given [context] When [action] Then [result]
```

### Phase 3: Non-Functional Requirements
1. Performance - Response time, scale
2. Security - Auth, authorization, data protection
3. Reliability - Uptime, error handling
4. Usability - Accessibility, mobile, i18n
5. Compliance - GDPR, PCI-DSS, etc.
6. Technical constraints - Tech stack, budget

### Phase 4: Documentation
Produce:
1. Requirements Document (overview, functional, non-functional, risks)
2. User Stories Backlog (prioritized by MoSCoW)
3. Acceptance Criteria (testable, specific, achievable)

**Use `docx` skill for formal output**

## Prioritization: MoSCoW

- **Must Have**: Critical for MVP
- **Should Have**: Important, can wait for Phase 2
- **Could Have**: Nice to have if time/budget
- **Won't Have**: Out of scope

## Acceptance Criteria Patterns

**Given-When-Then**:
```
Given [context]
When [action]
Then [outcome]
```

**Checklist**:
```
✅ System validates input
✅ Data saved to database
✅ User gets confirmation
```

## Common Pitfalls

❌ Vague: "System should be fast"
✅ Specific: "Search returns in <2sec for 95% queries"

❌ Solution-focused: "Need dropdown with 50 options"
✅ Problem-focused: "Users select vehicle from supported models"

❌ Missing why: "Export to CSV"
✅ With context: "Export to CSV to analyze in Excel"

## Example Workflow

**User**: "I want to build a SaaS tool for invoicing"

**Claude**: "Great! Let me understand the context:
1. Who's the target? (Freelancers? Small agencies?)
2. Core problem? (Replacing spreadsheets? Tracking payments?)
3. Main workflow?"

**User**: "Freelancers tired of Word templates. Create invoice → send → track payment."

**Claude**: "Perfect! Key stories:

**Story 1: Invoice Creation**
As a freelancer, I want to create professional invoices with line items, so I get paid.
- AC: Add multiple line items, auto-calculate totals, save client details

**Story 2: Email Delivery**
As a freelancer, I want to email invoices from the app, so I don't manually attach files.
- AC: Send via email, generate PDF, track opens

Should we include Stripe for online payments, or just track manual payments?"

## Deliverables Checklist

- [ ] Requirements Document  
- [ ] User Stories Backlog (MoSCoW prioritized)
- [ ] Acceptance Criteria (all Must Haves)
- [ ] Technical Constraints
- [ ] Non-Functional Requirements
- [ ] Assumptions & Risks
- [ ] Open Questions
- [ ] Glossary

## Integration with SDLC

Feeds into:
1. **System Design** - Architecture decisions
2. **Development** - User stories → tasks
3. **Testing** - Acceptance criteria → test cases
4. **Deployment** - NFRs → infrastructure (use `production-deployment-skill`)

## Resources

- `references/templates.md` - Document templates
- `references/examples.md` - Worked examples
- `references/checklists.md` - Domain checklists

## Related Skills

- `docx` - Formal requirements docs
- `pptx` - Executive summaries
- `production-deployment-skill` - Deployment planning
- `mcp-builder` - API integration specs
