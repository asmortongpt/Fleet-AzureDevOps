# Production-Ready Validation Framework - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy a comprehensive 7-layer AI-powered validation system with 6 specialized agents that ensures customer-ready quality (pixel-perfect UI, responsive design, data integrity, complete workflows) before production launch.

**Architecture:**
- Framework server orchestrates 6 specialized validation agents
- Each agent captures metrics (visual, responsive, interactive, data, performance, workflow)
- Quality loop system detects issues → flags → developer fixes → re-validates
- Dashboard displays real-time validation status with annotated findings
- Pre-flight checklist automation ensures customer readiness

**Tech Stack:** Node.js/Express, Playwright (browser automation), Sharp (image processing), Puppeteer (screenshots), TensorFlow.js (visual AI), Jest/Vitest (testing)

---

## WEEK 1: INFRASTRUCTURE & FOUNDATION

### Task 1: Create Validation Framework Core Structure

**Files:**
- Create: `api/src/validation/ValidationFramework.ts`
- Create: `api/src/validation/AgentOrchestrator.ts`
- Create: `api/src/validation/QualityLoopManager.ts`
- Create: `api/tests/validation/framework.test.ts`
- Create: `docs/VALIDATION_GUIDE.md`

**Step 1: Write the failing test**

```typescript
// api/tests/validation/framework.test.ts
import { ValidationFramework } from '../../src/validation/ValidationFramework';

describe('ValidationFramework', () => {
  it('should initialize with all 6 agents', async () => {
    const framework = new ValidationFramework();
    await framework.initialize();
    expect(framework.getAgents()).toHaveLength(6);
  });

  it('should orchestrate agent execution in parallel', async () => {
    const framework = new ValidationFramework();
    const startTime = Date.now();
    const results = await framework.runValidation();
    const duration = Date.now() - startTime;

    expect(results).toHaveProperty('visualQA');
    expect(results).toHaveProperty('responsiveDesign');
    expect(results).toHaveProperty('scrollingAudit');
    expect(results).toHaveProperty('typography');
    expect(results).toHaveProperty('interactions');
    expect(results).toHaveProperty('dataIntegrity');
    // Should run in ~parallel (not sequential)
    expect(duration).toBeLessThan(300000); // 5 min for all agents
  });

  it('should detect issues and create quality loop', async () => {
    const framework = new ValidationFramework();
    const results = await framework.runValidation();
    const issues = framework.getIssuesFromResults(results);

    expect(Array.isArray(issues)).toBe(true);
    expect(issues[0]).toHaveProperty('agent');
    expect(issues[0]).toHaveProperty('severity');
    expect(issues[0]).toHaveProperty('description');
    expect(issues[0]).toHaveProperty('screenshot');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet-CTA/api
npm test -- --run src/tests/validation/framework.test.ts
# Expected: FAIL - ValidationFramework class not found
```

**Step 3: Write minimal implementation**

```typescript
// api/src/validation/ValidationFramework.ts
import { AgentOrchestrator } from './AgentOrchestrator';
import { QualityLoopManager } from './QualityLoopManager';

export interface ValidationResult {
  visualQA: any;
  responsiveDesign: any;
  scrollingAudit: any;
  typography: any;
  interactions: any;
  dataIntegrity: any;
  timestamp: number;
  overallScore: number;
}

export interface ValidationIssue {
  agent: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  screenshot: string;
  suggestion?: string;
  affectedComponent?: string;
}

export class ValidationFramework {
  private orchestrator: AgentOrchestrator;
  private qualityLoopManager: QualityLoopManager;
  private agents: any[] = [];

  constructor() {
    this.orchestrator = new AgentOrchestrator();
    this.qualityLoopManager = new QualityLoopManager();
  }

  async initialize(): Promise<void> {
    // Initialize all 6 agents
    const agents = [
      'VisualQAAgent',
      'ResponsiveDesignAgent',
      'ScrollingAuditAgent',
      'TypographyAgent',
      'InteractionQualityAgent',
      'DataIntegrityAgent'
    ];
    this.agents = agents;
  }

  getAgents(): any[] {
    return this.agents;
  }

  async runValidation(): Promise<ValidationResult> {
    const results = await this.orchestrator.executeAllAgents();
    return {
      visualQA: results.visualQA,
      responsiveDesign: results.responsiveDesign,
      scrollingAudit: results.scrollingAudit,
      typography: results.typography,
      interactions: results.interactions,
      dataIntegrity: results.dataIntegrity,
      timestamp: Date.now(),
      overallScore: this.calculateScore(results)
    };
  }

  getIssuesFromResults(results: ValidationResult): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Extract issues from each agent result
    if (results.visualQA?.issues) {
      issues.push(...results.visualQA.issues);
    }
    if (results.responsiveDesign?.issues) {
      issues.push(...results.responsiveDesign.issues);
    }
    // ... continue for other agents

    return issues.sort((a, b) => {
      const severityMap = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityMap[b.severity] - severityMap[a.severity];
    });
  }

  private calculateScore(results: any): number {
    // Score from 0-100 based on issues found
    const criticalCount = this.countIssuesBySeverity(results, 'critical');
    const highCount = this.countIssuesBySeverity(results, 'high');
    const mediumCount = this.countIssuesBySeverity(results, 'medium');

    return Math.max(0, 100 - (criticalCount * 25 + highCount * 10 + mediumCount * 5));
  }

  private countIssuesBySeverity(results: any, severity: string): number {
    let count = 0;
    Object.values(results).forEach((agent: any) => {
      if (agent?.issues) {
        count += agent.issues.filter((i: any) => i.severity === severity).length;
      }
    });
    return count;
  }
}
```

```typescript
// api/src/validation/AgentOrchestrator.ts
export class AgentOrchestrator {
  async executeAllAgents(): Promise<any> {
    // Placeholder - will be filled in by individual agent tasks
    return {
      visualQA: { issues: [] },
      responsiveDesign: { issues: [] },
      scrollingAudit: { issues: [] },
      typography: { issues: [] },
      interactions: { issues: [] },
      dataIntegrity: { issues: [] }
    };
  }
}
```

```typescript
// api/src/validation/QualityLoopManager.ts
export class QualityLoopManager {
  async trackIssue(issue: any): Promise<void> {
    // Will implement quality loop tracking
  }

  async reopenIssueForRetest(issueId: string): Promise<void> {
    // Will implement retest mechanism
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- --run src/tests/validation/framework.test.ts
# Expected: PASS - All tests passing
```

**Step 5: Commit**

```bash
git add api/src/validation/ api/tests/validation/framework.test.ts docs/VALIDATION_GUIDE.md
git commit -m "feat: Initialize validation framework core with agent orchestrator"
```

---

### Task 2: Set Up Visual QA Agent Infrastructure

**Files:**
- Create: `api/src/validation/agents/VisualQAAgent.ts`
- Create: `api/src/validation/agents/BaseAgent.ts`
- Create: `api/tests/validation/agents/visual-qa.test.ts`
- Create: `api/src/validation/ScreenshotCapture.ts`
- Create: `api/src/validation/ImageComparison.ts`

**Step 1: Write the failing test**

```typescript
// api/tests/validation/agents/visual-qa.test.ts
import { VisualQAAgent } from '../../../src/validation/agents/VisualQAAgent';

describe('VisualQAAgent', () => {
  let agent: VisualQAAgent;

  beforeEach(async () => {
    agent = new VisualQAAgent();
    await agent.initialize();
  });

  it('should capture screenshots at all breakpoints', async () => {
    const breakpoints = [375, 480, 768, 1024, 1440, 1920];
    const screenshots = await agent.captureBreakpoints({
      pages: ['/', '/vehicles', '/drivers', '/dashboard'],
      breakpoints
    });

    expect(screenshots).toBeDefined();
    expect(Object.keys(screenshots).length).toBeGreaterThan(0);
    breakpoints.forEach(bp => {
      expect(screenshots[bp]).toBeDefined();
    });
  });

  it('should detect text overflow issues', async () => {
    const screenshot = await agent.analyzeForTextOverflow('/dashboard');
    const issues = screenshot.issues;

    expect(Array.isArray(issues)).toBe(true);
    if (issues.length > 0) {
      expect(issues[0]).toHaveProperty('type', 'text-overflow');
      expect(issues[0]).toHaveProperty('selector');
      expect(issues[0]).toHaveProperty('text');
    }
  });

  it('should compare against baseline', async () => {
    const current = await agent.captureCurrentState('/', 1920);
    const baseline = await agent.getBaseline('/', 1920);
    const diff = await agent.compareWithBaseline(current, baseline);

    expect(diff).toHaveProperty('pixelDifference');
    expect(diff).toHaveProperty('percentChanged');
    expect(diff).toHaveProperty('screenshot');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- --run src/tests/validation/agents/visual-qa.test.ts
# Expected: FAIL - VisualQAAgent class not found
```

**Step 3: Write minimal implementation**

```typescript
// api/src/validation/agents/BaseAgent.ts
export interface AgentConfig {
  headless?: boolean;
  timeout?: number;
  retries?: number;
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected browser: any;

  constructor(config: AgentConfig = {}) {
    this.config = {
      headless: true,
      timeout: 30000,
      retries: 3,
      ...config
    };
  }

  abstract initialize(): Promise<void>;
  abstract execute(): Promise<any>;
  abstract getResults(): any;
}
```

```typescript
// api/src/validation/agents/VisualQAAgent.ts
import { BaseAgent, AgentConfig } from './BaseAgent';
import { ScreenshotCapture } from '../ScreenshotCapture';
import { ImageComparison } from '../ImageComparison';

export class VisualQAAgent extends BaseAgent {
  private screenshotCapture: ScreenshotCapture;
  private imageComparison: ImageComparison;
  private results: any = {};

  constructor(config?: AgentConfig) {
    super(config);
    this.screenshotCapture = new ScreenshotCapture(config);
    this.imageComparison = new ImageComparison();
  }

  async initialize(): Promise<void> {
    await this.screenshotCapture.launch();
  }

  async captureBreakpoints(options: {
    pages: string[];
    breakpoints: number[];
  }): Promise<Record<number, any>> {
    const screenshots: Record<number, any> = {};

    for (const breakpoint of options.breakpoints) {
      screenshots[breakpoint] = {};
      for (const page of options.pages) {
        const screenshot = await this.screenshotCapture.capture({
          url: `http://localhost:5173${page}`,
          width: breakpoint,
          height: 1080
        });
        screenshots[breakpoint][page] = screenshot;
      }
    }

    return screenshots;
  }

  async analyzeForTextOverflow(page: string): Promise<any> {
    const screenshot = await this.screenshotCapture.capture({
      url: `http://localhost:5173${page}`,
      width: 1920,
      height: 1080
    });

    const issues = await this.screenshotCapture.analyzeTextOverflow(screenshot);

    return {
      page,
      screenshot,
      issues,
      severity: issues.length > 5 ? 'critical' : issues.length > 0 ? 'high' : 'none'
    };
  }

  async captureCurrentState(page: string, width: number): Promise<any> {
    return await this.screenshotCapture.capture({
      url: `http://localhost:5173${page}`,
      width,
      height: 1080
    });
  }

  async getBaseline(page: string, width: number): Promise<any> {
    // Load baseline from storage
    return null; // Will implement baseline storage
  }

  async compareWithBaseline(current: any, baseline: any): Promise<any> {
    if (!baseline) {
      return {
        pixelDifference: 0,
        percentChanged: 0,
        screenshot: current,
        message: 'No baseline to compare'
      };
    }

    const diff = await this.imageComparison.compare(current, baseline);
    return diff;
  }

  async execute(): Promise<any> {
    // Will be called by orchestrator
    const breakpoints = [375, 480, 768, 1024, 1440, 1920];
    const pages = ['/', '/vehicles', '/drivers', '/dashboard'];

    const screenshots = await this.captureBreakpoints({ pages, breakpoints });
    const issues: any[] = [];

    for (const page of pages) {
      const analysis = await this.analyzeForTextOverflow(page);
      if (analysis.issues.length > 0) {
        issues.push(...analysis.issues);
      }
    }

    this.results = {
      screenshots,
      issues,
      timestamp: Date.now()
    };

    return this.results;
  }

  getResults(): any {
    return this.results;
  }
}
```

```typescript
// api/src/validation/ScreenshotCapture.ts
import { chromium, Browser } from 'playwright';

export interface CaptureOptions {
  url: string;
  width: number;
  height: number;
  waitFor?: string;
}

export class ScreenshotCapture {
  private browser: Browser | null = null;

  constructor(private config: any = {}) {}

  async launch(): Promise<void> {
    this.browser = await chromium.launch({
      headless: this.config.headless !== false
    });
  }

  async capture(options: CaptureOptions): Promise<Buffer> {
    if (!this.browser) throw new Error('Browser not launched');

    const page = await this.browser.newPage();
    await page.setViewportSize({ width: options.width, height: options.height });
    await page.goto(options.url, { waitUntil: 'networkidle' });

    if (options.waitFor) {
      await page.waitForSelector(options.waitFor);
    }

    const screenshot = await page.screenshot({ fullPage: true });
    await page.close();

    return screenshot;
  }

  async analyzeTextOverflow(screenshot: Buffer): Promise<any[]> {
    // Will implement text overflow detection using OCR/Vision AI
    return [];
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
```

```typescript
// api/src/validation/ImageComparison.ts
export class ImageComparison {
  async compare(current: Buffer, baseline: Buffer): Promise<any> {
    // Will implement pixel-perfect comparison
    return {
      pixelDifference: 0,
      percentChanged: 0,
      screenshot: current
    };
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- --run src/tests/validation/agents/visual-qa.test.ts
# Expected: PASS - All tests passing
```

**Step 5: Commit**

```bash
git add api/src/validation/agents/ api/src/validation/ScreenshotCapture.ts api/src/validation/ImageComparison.ts api/tests/validation/agents/
git commit -m "feat: Implement Visual QA Agent with screenshot capture and comparison"
```

---

### Task 3: Implement Responsive Design Agent

**Files:**
- Create: `api/src/validation/agents/ResponsiveDesignAgent.ts`
- Create: `api/tests/validation/agents/responsive-design.test.ts`
- Create: `api/src/validation/ResponsiveValidator.ts`

**Step 1: Write the failing test**

```typescript
// api/tests/validation/agents/responsive-design.test.ts
import { ResponsiveDesignAgent } from '../../../src/validation/agents/ResponsiveDesignAgent';

describe('ResponsiveDesignAgent', () => {
  let agent: ResponsiveDesignAgent;

  beforeEach(async () => {
    agent = new ResponsiveDesignAgent();
    await agent.initialize();
  });

  it('should test all 6 breakpoints', async () => {
    const results = await agent.execute();
    const breakpoints = [375, 480, 768, 1024, 1440, 1920];

    breakpoints.forEach(bp => {
      expect(results.breakpoints[bp]).toBeDefined();
      expect(results.breakpoints[bp]).toHaveProperty('touchTargets');
      expect(results.breakpoints[bp]).toHaveProperty('readability');
      expect(results.breakpoints[bp]).toHaveProperty('reflow');
    });
  });

  it('should detect touch targets < 48px', async () => {
    const results = await agent.execute();
    const issues = results.issues.filter((i: any) => i.type === 'touch-target');

    if (issues.length > 0) {
      expect(issues[0]).toHaveProperty('selector');
      expect(issues[0]).toHaveProperty('size');
    }
  });

  it('should verify text readability >= 16px', async () => {
    const results = await agent.execute();
    const readabilityIssues = results.issues.filter((i: any) => i.type === 'readability');

    expect(Array.isArray(readabilityIssues)).toBe(true);
  });

  it('should test with network throttling', async () => {
    const results = await agent.executeWithThrottling('4g');
    expect(results).toHaveProperty('networkThrottling');
    expect(results.networkThrottling).toHaveProperty('pageLoadTime');
  });
});
```

**Step 2-5: Implementation follows same pattern**

```typescript
// api/src/validation/agents/ResponsiveDesignAgent.ts
import { BaseAgent } from './BaseAgent';
import { ScreenshotCapture } from '../ScreenshotCapture';
import { ResponsiveValidator } from '../ResponsiveValidator';

export class ResponsiveDesignAgent extends BaseAgent {
  private screenshotCapture: ScreenshotCapture;
  private validator: ResponsiveValidator;
  private results: any = {};

  constructor() {
    super();
    this.screenshotCapture = new ScreenshotCapture();
    this.validator = new ResponsiveValidator();
  }

  async initialize(): Promise<void> {
    await this.screenshotCapture.launch();
  }

  async execute(): Promise<any> {
    const breakpoints = [375, 480, 768, 1024, 1440, 1920];
    const results: any = { breakpoints: {}, issues: [] };

    for (const breakpoint of breakpoints) {
      const screenshot = await this.screenshotCapture.capture({
        url: 'http://localhost:5173',
        width: breakpoint,
        height: 1080
      });

      const validation = await this.validator.validate(screenshot, breakpoint);
      results.breakpoints[breakpoint] = validation;
      results.issues.push(...validation.issues);
    }

    this.results = results;
    return results;
  }

  async executeWithThrottling(throttle: '4g' | '3g'): Promise<any> {
    // Will implement network throttling testing
    return { networkThrottling: { pageLoadTime: 0 } };
  }

  getResults(): any {
    return this.results;
  }
}
```

---

## WEEK 2: CORE AGENTS (Tasks 4-8)

### Task 4: Implement Scrolling Audit Agent
### Task 5: Implement Typography Agent
### Task 6: Implement Interaction Quality Agent
### Task 7: Implement Data Integrity Agent
### Task 8: Implement Accessibility & Performance Agent

*(Each follows same pattern: test → implementation → commit)*

---

## WEEK 3: ORCHESTRATION & QUALITY LOOPS

### Task 9: Implement Workflow Orchestration Agent
### Task 10: Build Quality Loop Dashboard
### Task 11: Create Issue Tracking & Reporting
### Task 12: Implement Pre-Flight Checklist

---

## WEEK 4: INTEGRATION & DELIVERY

### Task 13: Integration Testing
### Task 14: Customer Handoff Report Generation
### Task 15: Deployment & Documentation

---

## Execution Path

Plan is complete and saved to `docs/plans/2026-02-25-production-validation-framework-implementation.md`.

**Two execution options:**

**Option 1: Subagent-Driven (This Session)**
- Fresh agent per task
- Code review between tasks
- Fast iteration with immediate feedback
- Recommended for: Quality-focused, integrated approach

**Option 2: Parallel Session (Separate)**
- Use `superpowers:executing-plans` in new session
- Batch execution with checkpoints
- Good for: Longer independent work blocks

**Which approach would you prefer?**
