// src/agents/CTAFleetAgent57.ts
import { Agent, AgentConfig } from '../core/Agent';
import { Vendor, VendorRiskProfile, ComplianceStatus } from '../types/VendorTypes';
import { RiskAssessmentService } from '../services/RiskAssessmentService';
import { ComplianceService } from '../services/ComplianceService';
import { Logger } from '../utils/Logger';

export class CTAFleetAgent57 extends Agent {
  private riskAssessmentService: RiskAssessmentService;
  private complianceService: ComplianceService;
  private logger: Logger;

  constructor(config: AgentConfig) {
    super(config);
    this.riskAssessmentService = new RiskAssessmentService();
    this.complianceService = new ComplianceService();
    this.logger = new Logger('CTAFleetAgent57');
  }

  public async assessVendorRisk(vendor: Vendor): Promise<VendorRiskProfile> {
    try {
      this.logger.info(`Starting risk assessment for vendor: ${vendor.name}`);
      
      // Perform risk assessment
      const riskScore = await this.riskAssessmentService.calculateRiskScore(vendor);
      const complianceStatus = await this.complianceService.checkCompliance(vendor);
      
      const riskProfile: VendorRiskProfile = {
        vendorId: vendor.id,
        name: vendor.name,
        riskScore,
        complianceStatus,
        assessmentDate: new Date(),
        riskFactors: this.riskAssessmentService.getRiskFactors(vendor),
        recommendations: this.generateRecommendations(riskScore, complianceStatus)
      };

      this.logger.info(`Risk assessment completed for vendor: ${vendor.name}, Score: ${riskScore}`);
      return riskProfile;
    } catch (error) {
      this.logger.error(`Error assessing vendor risk for ${vendor.name}: ${error.message}`);
      throw error;
    }
  }

  private generateRecommendations(riskScore: number, complianceStatus: ComplianceStatus): string[] {
    const recommendations: string[] = [];
    
    if (riskScore > 75) {
      recommendations.push('Implement immediate risk mitigation strategies');
      recommendations.push('Conduct thorough vendor audit');
    } else if (riskScore > 50) {
      recommendations.push('Monitor vendor activities closely');
      recommendations.push('Review vendor security policies');
    }

    if (complianceStatus !== ComplianceStatus.COMPLIANT) {
      recommendations.push('Address compliance violations');
      recommendations.push('Schedule compliance review meeting');
    }

    return recommendations;
  }

  public async batchAssessVendors(vendors: Vendor[]): Promise<VendorRiskProfile[]> {
    this.logger.info(`Starting batch risk assessment for ${vendors.length} vendors`);
    const promises = vendors.map(vendor => this.assessVendorRisk(vendor));
    return Promise.all(promises);
  }
}

// src/types/VendorTypes.ts
export interface Vendor {
  id: string;
  name: string;
  industry: string;
  location: string;
  contractValue: number;
  securityScore: number;
  complianceData: Record<string, boolean>;
}

export enum ComplianceStatus {
  COMPLIANT = 'COMPLIANT',
  PARTIALLY_COMPLIANT = 'PARTIALLY_COMPLIANT',
  NON_COMPLIANT = 'NON_COMPLIANT'
}

export interface VendorRiskProfile {
  vendorId: string;
  name: string;
  riskScore: number;
  complianceStatus: ComplianceStatus;
  assessmentDate: Date;
  riskFactors: string[];
  recommendations: string[];
}

// src/services/RiskAssessmentService.ts
export class RiskAssessmentService {
  public async calculateRiskScore(vendor: Vendor): Promise<number> {
    // Simplified risk score calculation
    let score = 100 - vendor.securityScore;
    
    if (vendor.contractValue > 1000000) {
      score += 20;
    }
    
    if (vendor.industry === 'Finance') {
      score += 15;
    }
    
    return Math.min(100, Math.max(0, score));
  }

  public getRiskFactors(vendor: Vendor): string[] {
    const factors: string[] = [];
    
    if (vendor.securityScore < 70) {
      factors.push('Low security score');
    }
    if (vendor.contractValue > 1000000) {
      factors.push('High contract value');
    }
    if (vendor.industry === 'Finance') {
      factors.push('High-risk industry');
    }
    
    return factors;
  }
}

// src/services/ComplianceService.ts
import { Vendor, ComplianceStatus } from '../types/VendorTypes';

export class ComplianceService {
  public async checkCompliance(vendor: Vendor): Promise<ComplianceStatus> {
    const complianceEntries = Object.values(vendor.complianceData);
    const totalChecks = complianceEntries.length;
    const passedChecks = complianceEntries.filter(Boolean).length;
    
    if (passedChecks === totalChecks) {
      return ComplianceStatus.COMPLIANT;
    } else if (passedChecks > totalChecks * 0.7) {
      return ComplianceStatus.PARTIALLY_COMPLIANT;
    } else {
      return ComplianceStatus.NON_COMPLIANT;
    }
  }
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

// src/core/Agent.ts
export interface AgentConfig {
  id: string;
  name: string;
  version: string;
}

export abstract class Agent {
  protected config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  public getConfig(): AgentConfig {
    return this.config;
  }
}

// tests/CTAFleetAgent57.test.ts
import { CTAFleetAgent57 } from '../src/agents/CTAFleetAgent57';
import { Vendor, ComplianceStatus } from '../src/types/VendorTypes';

describe('CTAFleetAgent57 - Vendor Risk Management', () => {
  let agent: CTAFleetAgent57;
  let testVendor: Vendor;

  beforeEach(() => {
    agent = new CTAFleetAgent57({
      id: 'agent57',
      name: 'Vendor Risk Management Agent',
      version: '1.0.0'
    });

    testVendor = {
      id: 'V001',
      name: 'Test Vendor',
      industry: 'Finance',
      location: 'USA',
      contractValue: 1500000,
      securityScore: 65,
      complianceData: {
        gdpr: true,
        hipaa: false,
        soc2: true
      }
    };
  });

  test('should assess vendor risk correctly', async () => {
    const riskProfile = await agent.assessVendorRisk(testVendor);
    
    expect(riskProfile.vendorId).toBe(testVendor.id);
    expect(riskProfile.name).toBe(testVendor.name);
    expect(riskProfile.riskScore).toBeGreaterThan(0);
    expect(riskProfile.riskScore).toBeLessThanOrEqual(100);
    expect(riskProfile.complianceStatus).toBeDefined();
    expect(riskProfile.riskFactors).toBeInstanceOf(Array);
    expect(riskProfile.recommendations).toBeInstanceOf(Array);
  });

  test('should handle batch vendor assessment', async () => {
    const vendors = [testVendor, { ...testVendor, id: 'V002', name: 'Test Vendor 2' }];
    const riskProfiles = await agent.batchAssessVendors(vendors);
    
    expect(riskProfiles).toHaveLength(2);
    expect(riskProfiles[0].vendorId).toBe('V001');
    expect(riskProfiles[1].vendorId).toBe('V002');
  });

  test('should generate appropriate recommendations for high risk', async () => {
    const highRiskVendor = { ...testVendor, securityScore: 20 };
    const riskProfile = await agent.assessVendorRisk(highRiskVendor);
    
    expect(riskProfile.recommendations).toContain('Implement immediate risk mitigation strategies');
    expect(riskProfile.recommendations).toContain('Conduct thorough vendor audit');
  });

  test('should handle compliance status correctly', async () => {
    const nonCompliantVendor = {
      ...testVendor,
      complianceData: {
        gdpr: false,
        hipaa: false,
        soc2: false
      }
    };
    
    const riskProfile = await agent.assessVendorRisk(nonCompliantVendor);
    expect(riskProfile.complianceStatus).toBe(ComplianceStatus.NON_COMPLIANT);
    expect(riskProfile.recommendations).toContain('Address compliance violations');
  });

  test('should throw error on assessment failure', async () => {
    const invalidVendor = { ...testVendor, securityScore: -1 };
    await expect(agent.assessVendorRisk(invalidVendor)).rejects.toThrow();
  });
});
