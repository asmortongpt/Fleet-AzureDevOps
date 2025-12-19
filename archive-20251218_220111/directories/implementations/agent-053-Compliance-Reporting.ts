// src/agents/CTAFleetAgent53.ts
import { Agent, AgentConfig } from '../core/Agent';
import { ComplianceReport, ComplianceStatus } from '../types/Compliance';
import { Logger } from '../utils/Logger';

export class CTAFleetAgent53 extends Agent {
  private complianceData: ComplianceReport[] = [];
  private logger: Logger;

  constructor(config: AgentConfig) {
    super(config);
    this.logger = new Logger('CTAFleetAgent53');
  }

  /**
   * Initialize the agent with compliance data
   */
  public async initialize(): Promise<void> {
    this.logger.info('Initializing CTAFleetAgent53 for Compliance Reporting');
    // Simulated initialization of compliance data
    this.complianceData = [
      {
        vehicleId: 'V001',
        status: ComplianceStatus.COMPLIANT,
        lastInspection: new Date('2023-10-01'),
        issues: [],
      },
      {
        vehicleId: 'V002',
        status: ComplianceStatus.NON_COMPLIANT,
        lastInspection: new Date('2023-09-15'),
        issues: ['Expired safety certificate', 'Missing documentation'],
      },
    ];
    this.logger.info('Compliance data loaded successfully');
  }

  /**
   * Generate a compliance report for a specific vehicle
   * @param vehicleId The ID of the vehicle to generate report for
   * @returns ComplianceReport or undefined if not found
   */
  public getVehicleComplianceReport(vehicleId: string): ComplianceReport | undefined {
    this.logger.info(`Generating compliance report for vehicle ${vehicleId}`);
    return this.complianceData.find((report) => report.vehicleId === vehicleId);
  }

  /**
   * Update compliance status for a vehicle
   * @param vehicleId The ID of the vehicle
   * @param status New compliance status
   * @param issues List of compliance issues if any
   * @returns boolean indicating if update was successful
   */
  public updateComplianceStatus(
    vehicleId: string,
    status: ComplianceStatus,
    issues: string[] = []
  ): boolean {
    this.logger.info(`Updating compliance status for vehicle ${vehicleId}`);
    const reportIndex = this.complianceData.findIndex((r) => r.vehicleId === vehicleId);
    if (reportIndex !== -1) {
      this.complianceData[reportIndex] = {
        ...this.complianceData[reportIndex],
        status,
        issues,
        lastInspection: new Date(),
      };
      this.logger.info(`Compliance status updated for vehicle ${vehicleId}`);
      return true;
    }
    this.logger.error(`Vehicle ${vehicleId} not found for compliance update`);
    return false;
  }

  /**
   * Get summary of compliance status for all vehicles
   * @returns Object with counts of compliant and non-compliant vehicles
   */
  public getComplianceSummary(): { compliant: number; nonCompliant: number } {
    this.logger.info('Generating compliance summary');
    const compliant = this.complianceData.filter(
      (report) => report.status === ComplianceStatus.COMPLIANT
    ).length;
    const nonCompliant = this.complianceData.length - compliant;
    return { compliant, nonCompliant };
  }
}

// src/core/Agent.ts
export interface AgentConfig {
  id: string;
  name: string;
}

export abstract class Agent {
  protected config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  public getId(): string {
    return this.config.id;
  }

  public getName(): string {
    return this.config.name;
  }

  public abstract initialize(): Promise<void>;
}

// src/types/Compliance.ts
export enum ComplianceStatus {
  COMPLIANT = 'COMPLIANT',
  NON_COMPLIANT = 'NON_COMPLIANT',
}

export interface ComplianceReport {
  vehicleId: string;
  status: ComplianceStatus;
  lastInspection: Date;
  issues: string[];
}

// src/utils/Logger.ts
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  public info(message: string): void {
    console.log(`[INFO] [${this.context}] ${message}`);
  }

  public error(message: string): void {
    console.error(`[ERROR] [${this.context}] ${message}`);
  }
}

// src/tests/CTAFleetAgent53.test.ts
import { CTAFleetAgent53 } from '../agents/CTAFleetAgent53';
import { ComplianceStatus } from '../types/Compliance';

describe('CTAFleetAgent53 - Compliance Reporting', () => {
  let agent: CTAFleetAgent53;

  beforeAll(async () => {
    agent = new CTAFleetAgent53({
      id: 'AGENT_53',
      name: 'Compliance Reporting Agent',
    });
    await agent.initialize();
  });

  test('should initialize with compliance data', () => {
    const report = agent.getVehicleComplianceReport('V001');
    expect(report).toBeDefined();
    expect(report?.vehicleId).toBe('V001');
    expect(report?.status).toBe(ComplianceStatus.COMPLIANT);
  });

  test('should return undefined for non-existent vehicle', () => {
    const report = agent.getVehicleComplianceReport('V999');
    expect(report).toBeUndefined();
  });

  test('should update compliance status successfully', () => {
    const result = agent.updateComplianceStatus(
      'V001',
      ComplianceStatus.NON_COMPLIANT,
      ['Failed inspection']
    );
    expect(result).toBe(true);
    const report = agent.getVehicleComplianceReport('V001');
    expect(report?.status).toBe(ComplianceStatus.NON_COMPLIANT);
    expect(report?.issues).toContain('Failed inspection');
  });

  test('should fail to update status for non-existent vehicle', () => {
    const result = agent.updateComplianceStatus(
      'V999',
      ComplianceStatus.NON_COMPLIANT
    );
    expect(result).toBe(false);
  });

  test('should generate correct compliance summary', () => {
    const summary = agent.getComplianceSummary();
    expect(summary).toBeDefined();
    expect(summary.compliant).toBeGreaterThanOrEqual(0);
    expect(summary.nonCompliant).toBeGreaterThanOrEqual(0);
    expect(summary.compliant + summary.nonCompliant).toBe(2);
  });
});
