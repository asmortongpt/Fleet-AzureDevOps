```typescript
// src/agents/ctaFleet/agent42/alertingRules.ts
import { Logger } from '../../../utils/logger';
import { Alert, AlertSeverity, AlertStatus } from '../../../models/alert';
import { MetricService } from '../../../services/metricService';
import { NotificationService } from '../../../services/notificationService';

export interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: Record<string, number>) => boolean;
  severity: AlertSeverity;
  message: string;
  cooldownPeriod: number; // in seconds
}

export class AlertingRulesEngine {
  private rules: AlertRule[] = [];
  private lastTriggered: Record<string, number> = {};
  private logger: Logger;
  private metricService: MetricService;
  private notificationService: NotificationService;

  constructor(
    metricService: MetricService,
    notificationService: NotificationService,
    logger: Logger = new Logger('AlertingRulesEngine')
  ) {
    this.metricService = metricService;
    this.notificationService = notificationService;
    this.logger = logger;
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    this.rules = [
      {
        id: 'cpu_high',
        name: 'High CPU Usage',
        condition: (metrics) => metrics.cpuUsage > 85,
        severity: AlertSeverity.CRITICAL,
        message: 'CPU usage exceeded 85%',
        cooldownPeriod: 300,
      },
      {
        id: 'memory_high',
        name: 'High Memory Usage',
        condition: (metrics) => metrics.memoryUsage > 90,
        severity: AlertSeverity.WARNING,
        message: 'Memory usage exceeded 90%',
        cooldownPeriod: 300,
      },
      {
        id: 'disk_io_high',
        name: 'High Disk I/O',
        condition: (metrics) => metrics.diskIO > 75,
        severity: AlertSeverity.WARNING,
        message: 'Disk I/O exceeded 75%',
        cooldownPeriod: 300,
      },
    ];
    this.logger.info('Default alerting rules initialized');
  }

  public addRule(rule: AlertRule): void {
    this.rules.push(rule);
    this.logger.info(`Added new alerting rule: ${rule.name}`);
  }

  public async evaluateRules(): Promise<Alert[]> {
    const metrics = await this.metricService.getCurrentMetrics();
    const currentTime = Date.now() / 1000; // Convert to seconds
    const alerts: Alert[] = [];

    for (const rule of this.rules) {
      const lastTriggerTime = this.lastTriggered[rule.id] || 0;
      if (currentTime - lastTriggerTime < rule.cooldownPeriod) {
        continue; // Skip if within cooldown period
      }

      try {
        if (rule.condition(metrics)) {
          const alert = new Alert(
            rule.id,
            rule.name,
            rule.message,
            rule.severity,
            AlertStatus.ACTIVE,
            new Date()
          );
          alerts.push(alert);
          this.lastTriggered[rule.id] = currentTime;
          await this.notificationService.sendAlert(alert);
          this.logger.warn(`Alert triggered: ${rule.name} - ${rule.message}`);
        }
      } catch (error) {
        this.logger.error(`Error evaluating rule ${rule.name}:`, error);
      }
    }

    return alerts;
  }

  public getRules(): AlertRule[] {
    return [...this.rules];
  }

  public clearCooldown(ruleId: string): void {
    delete this.lastTriggered[ruleId];
    this.logger.info(`Cooldown cleared for rule: ${ruleId}`);
  }
}

// src/agents/ctaFleet/agent42/alertingRules.test.ts
import { expect } from 'chai';
import { AlertingRulesEngine } from './alertingRules';
import { MetricService } from '../../../services/metricService';
import { NotificationService } from '../../../services/notificationService';
import { Logger } from '../../../utils/logger';
import { AlertSeverity, AlertStatus } from '../../../models/alert';
import sinon from 'sinon';

describe('AlertingRulesEngine', () => {
  let metricService: MetricService;
  let notificationService: NotificationService;
  let logger: Logger;
  let engine: AlertingRulesEngine;
  let metricStub: sinon.SinonStub;

  beforeEach(() => {
    metricService = new MetricService();
    notificationService = new NotificationService();
    logger = new Logger('TestLogger');
    engine = new AlertingRulesEngine(metricService, notificationService, logger);

    metricStub = sinon.stub(metricService, 'getCurrentMetrics');
    sinon.stub(notificationService, 'sendAlert').resolves();
    sinon.stub(logger, 'info');
    sinon.stub(logger, 'warn');
    sinon.stub(logger, 'error');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should initialize with default rules', () => {
    const rules = engine.getRules();
    expect(rules.length).to.equal(3);
    expect(rules[0].name).to.equal('High CPU Usage');
    expect(rules[1].name).to.equal('High Memory Usage');
    expect(rules[2].name).to.equal('High Disk I/O');
  });

  it('should add a new rule', () => {
    const newRule = {
      id: 'test_rule',
      name: 'Test Rule',
      condition: (metrics) => metrics.testMetric > 50,
      severity: AlertSeverity.INFO,
      message: 'Test metric exceeded 50',
      cooldownPeriod: 60,
    };
    engine.addRule(newRule);
    const rules = engine.getRules();
    expect(rules.length).to.equal(4);
    expect(rules[3].name).to.equal('Test Rule');
  });

  it('should trigger alert when condition is met', async () => {
    metricStub.resolves({
      cpuUsage: 90,
      memoryUsage: 80,
      diskIO: 60,
    });

    const alerts = await engine.evaluateRules();
    expect(alerts.length).to.equal(1);
    expect(alerts[0].name).to.equal('High CPU Usage');
    expect(alerts[0].severity).to.equal(AlertSeverity.CRITICAL);
    expect(alerts[0].status).to.equal(AlertStatus.ACTIVE);
  });

  it('should not trigger alert during cooldown period', async () => {
    metricStub.resolves({
      cpuUsage: 90,
      memoryUsage: 80,
      diskIO: 60,
    });

    await engine.evaluateRules(); // First trigger
    const alerts = await engine.evaluateRules(); // Second trigger within cooldown
    expect(alerts.length).to.equal(0);
  });

  it('should clear cooldown and allow new alerts', async () => {
    metricStub.resolves({
      cpuUsage: 90,
      memoryUsage: 80,
      diskIO: 60,
    });

    await engine.evaluateRules(); // First trigger
    engine.clearCooldown('cpu_high');
    const alerts = await engine.evaluateRules(); // Should trigger again after cooldown clear
    expect(alerts.length).to.equal(1);
    expect(alerts[0].name).to.equal('High CPU Usage');
  });

  it('should handle multiple alerts when conditions are met', async () => {
    metricStub.resolves({
      cpuUsage: 90,
      memoryUsage: 95,
      diskIO: 60,
    });

    const alerts = await engine.evaluateRules();
    expect(alerts.length).to.equal(2);
    expect(alerts.some(a => a.name === 'High CPU Usage')).to.be.true;
    expect(alerts.some(a => a.name === 'High Memory Usage')).to.be.true;
  });

  it('should log error when rule evaluation fails', async () => {
    const errorRule = {
      id: 'error_rule',
      name: 'Error Rule',
      condition: () => { throw new Error('Evaluation failed'); },
      severity: AlertSeverity.ERROR,
      message: 'Error rule failed',
      cooldownPeriod: 60,
    };
    engine.addRule(errorRule);
    metricStub.resolves({});

    const alerts = await engine.evaluateRules();
    expect(alerts.length).to.equal(0);
    expect(logger.error.called).to.be.true;
  });
});
```
