```typescript
// src/agents/ctaFleetAgent051.ts
import { Logger } from 'winston';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { ConsentRepository } from '../repositories/consentRepository';
import { Consent, ConsentStatus } from '../models/consent';
import { ValidationError, NotFoundError, UnauthorizedError } from '../errors/customErrors';
import { sanitizeInput } from '../utils/securityUtils';

export interface ConsentData {
  userId: string;
  policyId: string;
  status: ConsentStatus;
  version: number;
  timestamp?: Date;
}

@injectable()
export class CTAFleetAgent051 {
  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.ConsentRepository) private consentRepository: ConsentRepository
  ) {
    this.logger.info('CTAFleet Agent 051: Consent Management initialized');
  }

  /**
   * Creates or updates user consent for a specific policy
   * @param consentData Consent data to be saved
   * @returns Promise<Consent> Created or updated consent record
   */
  public async manageConsent(consentData: ConsentData): Promise<Consent> {
    try {
      // Sanitize input data
      const sanitizedData = this.sanitizeConsentData(consentData);
      
      // Validate input data
      this.validateConsentData(sanitizedData);

      // Check if consent already exists
      const existingConsent = await this.consentRepository.findByUserAndPolicy(
        sanitizedData.userId,
        sanitizedData.policyId
      );

      let consent: Consent;
      if (existingConsent) {
        // Update existing consent
        consent = await this.consentRepository.update({
          ...existingConsent,
          status: sanitizedData.status,
          version: sanitizedData.version,
          timestamp: new Date(),
        });
        this.logger.info(`Consent updated for user ${sanitizedData.userId}`);
      } else {
        // Create new consent
        consent = await this.consentRepository.create({
          userId: sanitizedData.userId,
          policyId: sanitizedData.policyId,
          status: sanitizedData.status,
          version: sanitizedData.version,
          timestamp: new Date(),
        });
        this.logger.info(`Consent created for user ${sanitizedData.userId}`);
      }

      return consent;
    } catch (error) {
      this.handleError(error, 'Error managing consent');
      throw error;
    }
  }

  /**
   * Retrieves consent status for a specific user and policy
   * @param userId User identifier
   * @param policyId Policy identifier
   * @returns Promise<Consent> Consent record
   */
  public async getConsentStatus(userId: string, policyId: string): Promise<Consent> {
    try {
      const sanitizedUserId = sanitizeInput(userId);
      const sanitizedPolicyId = sanitizeInput(policyId);

      const consent = await this.consentRepository.findByUserAndPolicy(
        sanitizedUserId,
        sanitizedPolicyId
      );

      if (!consent) {
        throw new NotFoundError(`Consent not found for user ${sanitizedUserId}`);
      }

      return consent;
    } catch (error) {
      this.handleError(error, 'Error retrieving consent status');
      throw error;
    }
  }

  /**
   * Revokes consent for a specific user and policy
   * @param userId User identifier
   * @param policyId Policy identifier
   * @returns Promise<Consent> Updated consent record
   */
  public async revokeConsent(userId: string, policyId: string): Promise<Consent> {
    try {
      const sanitizedUserId = sanitizeInput(userId);
      const sanitizedPolicyId = sanitizeInput(policyId);

      const consent = await this.consentRepository.findByUserAndPolicy(
        sanitizedUserId,
        sanitizedPolicyId
      );

      if (!consent) {
        throw new NotFoundError(`Consent not found for user ${sanitizedUserId}`);
      }

      const updatedConsent = await this.consentRepository.update({
        ...consent,
        status: ConsentStatus.REVOKED,
        timestamp: new Date(),
      });

      this.logger.info(`Consent revoked for user ${sanitizedUserId}`);
      return updatedConsent;
    } catch (error) {
      this.handleError(error, 'Error revoking consent');
      throw error;
    }
  }

  /**
   * Validates consent data
   * @param data Consent data to validate
   */
  private validateConsentData(data: ConsentData): void {
    if (!data.userId || !data.policyId) {
      throw new ValidationError('User ID and Policy ID are required');
    }
    if (!Object.values(ConsentStatus).includes(data.status)) {
      throw new ValidationError('Invalid consent status');
    }
    if (data.version < 1) {
      throw new ValidationError('Invalid policy version');
    }
  }

  /**
   * Sanitizes consent data
   * @param data Consent data to sanitize
   * @returns Sanitized consent data
   */
  private sanitizeConsentData(data: ConsentData): ConsentData {
    return {
      userId: sanitizeInput(data.userId),
      policyId: sanitizeInput(data.policyId),
      status: data.status,
      version: data.version,
      timestamp: data.timestamp,
    };
  }

  /**
   * Handles errors with appropriate logging
   * @param error Error object
   * @param context Error context message
   */
  private handleError(error: unknown, context: string): void {
    if (error instanceof ValidationError) {
      this.logger.warn(`${context}: ${error.message}`);
    } else if (error instanceof NotFoundError) {
      this.logger.warn(`${context}: ${error.message}`);
    } else if (error instanceof UnauthorizedError) {
      this.logger.error(`${context}: Unauthorized access - ${error.message}`);
    } else {
      this.logger.error(`${context}: Unexpected error - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// src/models/consent.ts
export enum ConsentStatus {
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  REVOKED = 'REVOKED',
  PENDING = 'PENDING',
}

export interface Consent {
  id?: string;
  userId: string;
  policyId: string;
  status: ConsentStatus;
  version: number;
  timestamp: Date;
}

// src/repositories/consentRepository.ts
import { injectable } from 'inversify';
import { Consent } from '../models/consent';

@injectable()
export class ConsentRepository {
  private consents: Consent[] = []; // Mock database for demonstration

  public async create(consent: Consent): Promise<Consent> {
    const newConsent = { ...consent, id: Math.random().toString(36).substr(2, 9) };
    this.consents.push(newConsent);
    return newConsent;
  }

  public async update(consent: Consent): Promise<Consent> {
    const index = this.consents.findIndex(c => c.id === consent.id);
    if (index !== -1) {
      this.consents[index] = consent;
    }
    return consent;
  }

  public async findByUserAndPolicy(userId: string, policyId: string): Promise<Consent | null> {
    return this.consents.find(c => c.userId === userId && c.policyId === policyId) || null;
  }
}

// src/errors/customErrors.ts
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

// src/utils/securityUtils.ts
export function sanitizeInput(input: string): string {
  // Basic sanitization - remove potentially dangerous characters
  return input.replace(/[<>{}|;]/g, '');
}

// src/config/types.ts
export const TYPES = {
  Logger: Symbol.for('Logger'),
  ConsentRepository: Symbol.for('ConsentRepository'),
};

// tests/ctaFleetAgent051.test.ts
import { Container } from 'inversify';
import { createMock } from 'ts-auto-mock';
import { CTAFleetAgent051, ConsentData } from '../src/agents/ctaFleetAgent051';
import { ConsentRepository } from '../src/repositories/consentRepository';
import { Logger } from 'winston';
import { TYPES } from '../src/config/types';
import { ConsentStatus } from '../src/models/consent';
import { ValidationError, NotFoundError } from '../src/errors/customErrors';

describe('CTAFleetAgent051 - Consent Management', () => {
  let container: Container;
  let agent: CTAFleetAgent051;
  let mockConsentRepository: ConsentRepository;
  let mockLogger: Logger;

  beforeEach(() => {
    container = new Container();
    mockConsentRepository = createMock<ConsentRepository>();
    mockLogger = createMock<Logger>();

    container.bind<ConsentRepository>(TYPES.ConsentRepository).toConstantValue(mockConsentRepository);
    container.bind<Logger>(TYPES.Logger).toConstantValue(mockLogger);
    container.bind<CTAFleetAgent051>(CTAFleetAgent051).to(CTAFleetAgent051);

    agent = container.get(CTAFleetAgent051);
  });

  describe('manageConsent', () => {
    it('should create new consent successfully', async () => {
      const consentData: ConsentData = {
        userId: 'user123',
        policyId: 'policy456',
        status: ConsentStatus.ACCEPTED,
        version: 1,
      };

      jest.spyOn(mockConsentRepository, 'findByUserAndPolicy').mockResolvedValue(null);
      jest.spyOn(mockConsentRepository, 'create').mockResolvedValue({
        id: 'consent789',
        ...consentData,
        timestamp: new Date(),
      });

      const result = await agent.manageConsent(consentData);
      expect(result).toBeDefined();
      expect(result.userId).toBe(consentData.userId);
      expect(mockConsentRepository.create).toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid data', async () => {
      const consentData: ConsentData = {
        userId: '',
        policyId: 'policy456',
        status: ConsentStatus.ACCEPTED,
        version: 1,
      };

      await expect(agent.manageConsent(consentData)).rejects.toThrow(ValidationError);
    });
  });

  describe('getConsentStatus', () => {
    it('should return consent status successfully', async () => {
      const consent = {
        id: 'consent789',
        userId: 'user123',
        policyId: 'policy456',
        status: ConsentStatus.ACCEPTED,
        version: 1,
        timestamp: new Date(),
      };

      jest.spyOn(mockConsentRepository, 'findByUserAndPolicy').mockResolvedValue(consent);

      const result = await agent.getConsentStatus('user123', 'policy456');
      expect(result).toBeDefined();
      expect(result.userId).toBe('user123');
    });

    it('should throw NotFoundError when consent not found', async () => {
      jest.spyOn(mockConsentRepository, 'findByUserAndPolicy').mockResolvedValue(null);

      await expect(agent.getConsentStatus('user123', 'policy456')).rejects.toThrow(NotFoundError);
    });
  });

  describe('revokeConsent', () => {
    it('should revoke consent successfully', async () => {
      const consent = {
        id: 'consent789',
        userId: 'user123',
        policyId: 'policy456',
        status: ConsentStatus.ACCEPTED,
        version: 1,
        timestamp: new Date(),
      };

      jest.spyOn(mockConsentRepository, 'findByUserAndPolicy').mockResolvedValue(consent);
      jest.spyOn(mockConsentRepository, 'update').mockResolvedValue({
        ...consent,
        status: ConsentStatus.REVOKED,
      });

      const result = await agent.revokeConsent('user123', 'policy456');
      expect(result.status).toBe(ConsentStatus.REVOKED);
    });

    it('should throw NotFoundError when consent not found', async () => {
      jest.spyOn(mockConsentRepository, 'findByUserAndPolicy').mockResolvedValue(null);

      await expect(agent.revokeConsent('user123', 'policy456')).rejects.toThrow(NotFoundError);
    });
  });
});
```
