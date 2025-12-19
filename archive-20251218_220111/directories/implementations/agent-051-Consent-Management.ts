```typescript
// src/agents/CTAFleetAgent51.ts
import { Agent, AgentConfig } from '../core/Agent';
import { ConsentData, ConsentStatus } from '../types/ConsentTypes';

export class CTAFleetAgent51 extends Agent {
  private consentData: ConsentData;

  constructor(config: AgentConfig) {
    super(config);
    this.consentData = {
      userId: '',
      consentGiven: false,
      consentDate: null,
      consentType: '',
      status: ConsentStatus.PENDING,
    };
  }

  // Initialize consent data for a user
  public initializeConsent(userId: string, consentType: string): void {
    this.consentData = {
      userId,
      consentGiven: false,
      consentDate: null,
      consentType,
      status: ConsentStatus.PENDING,
    };
    this.log(`Consent initialized for user ${userId} with type ${consentType}`);
  }

  // Record user consent
  public recordConsent(consentGiven: boolean): ConsentData {
    this.consentData.consentGiven = consentGiven;
    this.consentData.consentDate = new Date();
    this.consentData.status = consentGiven ? ConsentStatus.GRANTED : ConsentStatus.DENIED;
    this.log(`Consent recorded for user ${this.consentData.userId}: ${this.consentData.status}`);
    return { ...this.consentData };
  }

  // Check current consent status
  public checkConsentStatus(): ConsentStatus {
    return this.consentData.status;
  }

  // Revoke existing consent
  public revokeConsent(): ConsentData {
    this.consentData.consentGiven = false;
    this.consentData.consentDate = new Date();
    this.consentData.status = ConsentStatus.REVOKED;
    this.log(`Consent revoked for user ${this.consentData.userId}`);
    return { ...this.consentData };
  }

  // Get full consent data
  public getConsentData(): ConsentData {
    return { ...this.consentData };
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

  protected log(message: string): void {
    console.log(`[${this.config.name} - ${this.config.id}]: ${message}`);
  }
}

// src/types/ConsentTypes.ts
export enum ConsentStatus {
  PENDING = 'PENDING',
  GRANTED = 'GRANTED',
  DENIED = 'DENIED',
  REVOKED = 'REVOKED',
}

export interface ConsentData {
  userId: string;
  consentGiven: boolean;
  consentDate: Date | null;
  consentType: string;
  status: ConsentStatus;
}

// tests/CTAFleetAgent51.test.ts
import { CTAFleetAgent51 } from '../src/agents/CTAFleetAgent51';
import { ConsentStatus } from '../src/types/ConsentTypes';

describe('CTAFleetAgent51 - Consent Management', () => {
  let agent: CTAFleetAgent51;
  const userId = 'test-user-123';
  const consentType = 'DATA_PROCESSING';

  beforeEach(() => {
    agent = new CTAFleetAgent51({
      id: 'agent-51',
      name: 'Consent Management Agent',
    });
    agent.initializeConsent(userId, consentType);
  });

  test('should initialize consent data correctly', () => {
    const consentData = agent.getConsentData();
    expect(consentData.userId).toBe(userId);
    expect(consentData.consentType).toBe(consentType);
    expect(consentData.consentGiven).toBe(false);
    expect(consentData.status).toBe(ConsentStatus.PENDING);
    expect(consentData.consentDate).toBeNull();
  });

  test('should record consent as granted', () => {
    const result = agent.recordConsent(true);
    expect(result.consentGiven).toBe(true);
    expect(result.status).toBe(ConsentStatus.GRANTED);
    expect(result.consentDate).not.toBeNull();
    expect(agent.checkConsentStatus()).toBe(ConsentStatus.GRANTED);
  });

  test('should record consent as denied', () => {
    const result = agent.recordConsent(false);
    expect(result.consentGiven).toBe(false);
    expect(result.status).toBe(ConsentStatus.DENIED);
    expect(result.consentDate).not.toBeNull();
    expect(agent.checkConsentStatus()).toBe(ConsentStatus.DENIED);
  });

  test('should revoke consent', () => {
    agent.recordConsent(true);
    const result = agent.revokeConsent();
    expect(result.consentGiven).toBe(false);
    expect(result.status).toBe(ConsentStatus.REVOKED);
    expect(result.consentDate).not.toBeNull();
    expect(agent.checkConsentStatus()).toBe(ConsentStatus.REVOKED);
  });

  test('should return correct consent data', () => {
    agent.recordConsent(true);
    const consentData = agent.getConsentData();
    expect(consentData.userId).toBe(userId);
    expect(consentData.consentType).toBe(consentType);
    expect(consentData.consentGiven).toBe(true);
    expect(consentData.status).toBe(ConsentStatus.GRANTED);
  });
});
```
