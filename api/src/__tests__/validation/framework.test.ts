import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationFramework, ValidationResult, ValidationIssue } from '../../validation/ValidationFramework';

describe('Validation Framework', () => {
  let framework: ValidationFramework;

  beforeEach(() => {
    framework = new ValidationFramework();
  });

  it('should initialize with all 6 agents', async () => {
    // Arrange & Act
    await framework.initialize();
    const agents = framework.getAgents();

    // Assert
    expect(agents).toHaveLength(6);
    expect(agents).toContain('VisualQAAgent');
    expect(agents).toContain('ResponsiveDesignAgent');
    expect(agents).toContain('ScrollingAuditAgent');
    expect(agents).toContain('TypographyAgent');
    expect(agents).toContain('InteractionQualityAgent');
    expect(agents).toContain('DataIntegrityAgent');
  });

  it('should orchestrate agent execution in parallel', async () => {
    // Arrange
    const startTime = Date.now();

    // Act
    const results = await framework.runValidation();
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Assert
    expect(results).toBeDefined();
    expect(results.visualQA).toBeDefined();
    expect(results.responsiveDesign).toBeDefined();
    expect(results.scrollingAudit).toBeDefined();
    expect(results.typography).toBeDefined();
    expect(results.interactions).toBeDefined();
    expect(results.dataIntegrity).toBeDefined();
    expect(results.timestamp).toBeDefined();
    expect(results.overallScore).toBeDefined();
    expect(executionTime).toBeLessThan(300000); // 300 seconds in ms
  });

  it('should detect issues and create quality loop', async () => {
    // Arrange
    const mockResults: ValidationResult = {
      visualQA: {
        issues: [
          {
            agent: 'VisualQAAgent',
            severity: 'high',
            description: 'Color contrast issue on button',
            screenshot: 'data:image/png;base64,...',
            suggestion: 'Increase contrast to WCAG AA',
            affectedComponent: 'PrimaryButton'
          }
        ]
      },
      responsiveDesign: {
        issues: [
          {
            agent: 'ResponsiveDesignAgent',
            severity: 'critical',
            description: 'Layout broken at 320px breakpoint',
            screenshot: 'data:image/png;base64,...',
            suggestion: 'Fix mobile layout',
            affectedComponent: 'Dashboard'
          }
        ]
      },
      scrollingAudit: { issues: [] },
      typography: { issues: [] },
      interactions: { issues: [] },
      dataIntegrity: { issues: [] },
      timestamp: Date.now(),
      overallScore: 75
    };

    // Act
    const issues = framework.getIssuesFromResults(mockResults);

    // Assert
    expect(issues).toHaveLength(2);
    expect(issues[0].severity).toBe('critical'); // Critical should come first after sorting
    expect(issues[0].agent).toBe('ResponsiveDesignAgent');
    expect(issues[0].description).toBe('Layout broken at 320px breakpoint');
    expect(issues[0].screenshot).toBeDefined();
    expect(issues[1].severity).toBe('high');
    expect(issues[1].agent).toBe('VisualQAAgent');

    // Verify all required properties exist
    issues.forEach((issue: ValidationIssue) => {
      expect(issue).toHaveProperty('agent');
      expect(issue).toHaveProperty('severity');
      expect(issue).toHaveProperty('description');
      expect(issue).toHaveProperty('screenshot');
    });
  });
});
