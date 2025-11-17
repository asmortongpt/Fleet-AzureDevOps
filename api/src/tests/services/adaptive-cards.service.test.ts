/**
 * Adaptive Cards Service Tests
 *
 * Tests for Adaptive Card generation and handling including:
 * - Card generation
 * - Card validation
 * - Action handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Adaptive Card types
interface AdaptiveCard {
  type: 'AdaptiveCard';
  version: string;
  $schema: string;
  body: any[];
  actions?: any[];
}

interface CardAction {
  type: string;
  title: string;
  data?: any;
  url?: string;
}

// Mock Adaptive Cards Service
class AdaptiveCardsService {
  private readonly schemaUrl = 'http://adaptivecards.io/schemas/adaptive-card.json';
  private readonly version = '1.4';

  createBasicCard(title: string, text: string): AdaptiveCard {
    return {
      type: 'AdaptiveCard',
      version: this.version,
      $schema: this.schemaUrl,
      body: [
        {
          type: 'TextBlock',
          text: title,
          size: 'Large',
          weight: 'Bolder'
        },
        {
          type: 'TextBlock',
          text: text,
          wrap: true
        }
      ]
    };
  }

  createVehicleAlertCard(data: {
    vehicleId: string;
    alertType: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: string;
  }): AdaptiveCard {
    const severityColors = {
      low: 'Good',
      medium: 'Warning',
      high: 'Attention'
    };

    return {
      type: 'AdaptiveCard',
      version: this.version,
      $schema: this.schemaUrl,
      body: [
        {
          type: 'TextBlock',
          text: `🚨 Vehicle Alert: ${data.alertType}`,
          size: 'Large',
          weight: 'Bolder',
          color: severityColors[data.severity]
        },
        {
          type: 'FactSet',
          facts: [
            { title: 'Vehicle ID:', value: data.vehicleId },
            { title: 'Severity:', value: data.severity.toUpperCase() },
            { title: 'Time:', value: new Date(data.timestamp).toLocaleString() }
          ]
        },
        {
          type: 'TextBlock',
          text: data.message,
          wrap: true
        }
      ],
      actions: [
        {
          type: 'Action.OpenUrl',
          title: 'View Vehicle',
          url: `https://fleet.example.com/vehicles/${data.vehicleId}`
        },
        {
          type: 'Action.Submit',
          title: 'Acknowledge',
          data: {
            action: 'acknowledge',
            vehicleId: data.vehicleId,
            alertType: data.alertType
          }
        }
      ]
    };
  }

  createMaintenanceReminderCard(data: {
    vehicleId: string;
    vehicleName: string;
    maintenanceType: string;
    dueDate: string;
    mileage: number;
  }): AdaptiveCard {
    return {
      type: 'AdaptiveCard',
      version: this.version,
      $schema: this.schemaUrl,
      body: [
        {
          type: 'TextBlock',
          text: '🔧 Maintenance Reminder',
          size: 'Large',
          weight: 'Bolder'
        },
        {
          type: 'TextBlock',
          text: data.vehicleName,
          size: 'Medium',
          weight: 'Bolder'
        },
        {
          type: 'FactSet',
          facts: [
            { title: 'Maintenance Type:', value: data.maintenanceType },
            { title: 'Due Date:', value: new Date(data.dueDate).toLocaleDateString() },
            { title: 'Current Mileage:', value: `${data.mileage.toLocaleString()} mi` }
          ]
        }
      ],
      actions: [
        {
          type: 'Action.Submit',
          title: 'Schedule Maintenance',
          data: {
            action: 'schedule',
            vehicleId: data.vehicleId,
            maintenanceType: data.maintenanceType
          }
        },
        {
          type: 'Action.Submit',
          title: 'Snooze',
          data: {
            action: 'snooze',
            vehicleId: data.vehicleId,
            days: 7
          }
        }
      ]
    };
  }

  createRouteOptimizationCard(data: {
    routeId: string;
    originalDistance: number;
    optimizedDistance: number;
    timeSaved: number;
    fuelSaved: number;
    stops: string[];
  }): AdaptiveCard {
    const savings = data.originalDistance - data.optimizedDistance;
    const savingsPercent = ((savings / data.originalDistance) * 100).toFixed(1);

    return {
      type: 'AdaptiveCard',
      version: this.version,
      $schema: this.schemaUrl,
      body: [
        {
          type: 'TextBlock',
          text: '🗺️ Route Optimization Complete',
          size: 'Large',
          weight: 'Bolder'
        },
        {
          type: 'ColumnSet',
          columns: [
            {
              type: 'Column',
              width: 'stretch',
              items: [
                {
                  type: 'TextBlock',
                  text: 'Original Distance',
                  size: 'Small'
                },
                {
                  type: 'TextBlock',
                  text: `${data.originalDistance} mi`,
                  size: 'Large',
                  weight: 'Bolder'
                }
              ]
            },
            {
              type: 'Column',
              width: 'stretch',
              items: [
                {
                  type: 'TextBlock',
                  text: 'Optimized Distance',
                  size: 'Small'
                },
                {
                  type: 'TextBlock',
                  text: `${data.optimizedDistance} mi`,
                  size: 'Large',
                  weight: 'Bolder',
                  color: 'Good'
                }
              ]
            }
          ]
        },
        {
          type: 'FactSet',
          facts: [
            { title: 'Distance Saved:', value: `${savings} mi (${savingsPercent}%)` },
            { title: 'Time Saved:', value: `${data.timeSaved} min` },
            { title: 'Fuel Saved:', value: `${data.fuelSaved} gal` },
            { title: 'Total Stops:', value: data.stops.length.toString() }
          ]
        }
      ],
      actions: [
        {
          type: 'Action.OpenUrl',
          title: 'View Route',
          url: `https://fleet.example.com/routes/${data.routeId}`
        },
        {
          type: 'Action.Submit',
          title: 'Approve Route',
          data: {
            action: 'approve',
            routeId: data.routeId
          }
        }
      ]
    };
  }

  validateCard(card: AdaptiveCard): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (card.type !== 'AdaptiveCard') {
      errors.push('Card type must be "AdaptiveCard"');
    }

    if (!card.version) {
      errors.push('Card version is required');
    }

    if (!card.$schema) {
      errors.push('Card $schema is required');
    }

    if (!card.body || !Array.isArray(card.body) || card.body.length === 0) {
      errors.push('Card must have at least one element in body');
    }

    // Validate body elements
    if (card.body) {
      card.body.forEach((element, index) => {
        if (!element.type) {
          errors.push(`Body element at index ${index} missing type`);
        }
      });
    }

    // Validate actions
    if (card.actions) {
      if (!Array.isArray(card.actions)) {
        errors.push('Actions must be an array');
      } else {
        card.actions.forEach((action, index) => {
          if (!action.type) {
            errors.push(`Action at index ${index} missing type`);
          }
          if (!action.title) {
            errors.push(`Action at index ${index} missing title`);
          }
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  wrapCardForTeams(card: AdaptiveCard): any {
    return {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: card
        }
      ]
    };
  }

  handleCardAction(action: CardAction, userId: string): Promise<any> {
    // Mock implementation of action handling
    return Promise.resolve({
      success: true,
      action: action.type,
      userId
    });
  }
}

describe('AdaptiveCardsService', () => {
  let service: AdaptiveCardsService;

  beforeEach(() => {
    service = new AdaptiveCardsService();
  });

  describe('Basic Card Creation', () => {
    it('should create a basic card with title and text', () => {
      const card = service.createBasicCard('Test Title', 'Test message content');

      expect(card.type).toBe('AdaptiveCard');
      expect(card.version).toBe('1.4');
      expect(card.$schema).toBe('http://adaptivecards.io/schemas/adaptive-card.json');
      expect(card.body).toHaveLength(2);
      expect(card.body[0].text).toBe('Test Title');
      expect(card.body[1].text).toBe('Test message content');
    });

    it('should set correct formatting for title', () => {
      const card = service.createBasicCard('Title', 'Content');

      expect(card.body[0].size).toBe('Large');
      expect(card.body[0].weight).toBe('Bolder');
    });

    it('should enable text wrapping for content', () => {
      const card = service.createBasicCard('Title', 'Long content');

      expect(card.body[1].wrap).toBe(true);
    });
  });

  describe('Vehicle Alert Card', () => {
    const mockAlertData = {
      vehicleId: 'VEH-001',
      alertType: 'Low Fuel',
      message: 'Vehicle fuel level is below 10%',
      severity: 'high' as const,
      timestamp: '2025-01-15T10:00:00Z'
    };

    it('should create a vehicle alert card', () => {
      const card = service.createVehicleAlertCard(mockAlertData);

      expect(card.type).toBe('AdaptiveCard');
      expect(card.body[0].text).toContain('Vehicle Alert');
      expect(card.body[0].text).toContain(mockAlertData.alertType);
      expect(card.actions).toHaveLength(2);
    });

    it('should use correct color for severity', () => {
      const highCard = service.createVehicleAlertCard(mockAlertData);
      expect(highCard.body[0].color).toBe('Attention');

      const mediumCard = service.createVehicleAlertCard({
        ...mockAlertData,
        severity: 'medium'
      });
      expect(mediumCard.body[0].color).toBe('Warning');

      const lowCard = service.createVehicleAlertCard({
        ...mockAlertData,
        severity: 'low'
      });
      expect(lowCard.body[0].color).toBe('Good');
    });

    it('should include vehicle details in FactSet', () => {
      const card = service.createVehicleAlertCard(mockAlertData);

      const factSet = card.body.find(item => item.type === 'FactSet');
      expect(factSet).toBeDefined();
      expect(factSet.facts).toHaveLength(3);
      expect(factSet.facts[0].value).toBe(mockAlertData.vehicleId);
    });

    it('should include actions for viewing and acknowledging', () => {
      const card = service.createVehicleAlertCard(mockAlertData);

      expect(card.actions![0].type).toBe('Action.OpenUrl');
      expect(card.actions![0].title).toBe('View Vehicle');
      expect(card.actions![1].type).toBe('Action.Submit');
      expect(card.actions![1].title).toBe('Acknowledge');
    });
  });

  describe('Maintenance Reminder Card', () => {
    const mockMaintenanceData = {
      vehicleId: 'VEH-001',
      vehicleName: 'Truck #42',
      maintenanceType: 'Oil Change',
      dueDate: '2025-02-01T00:00:00Z',
      mileage: 45000
    };

    it('should create a maintenance reminder card', () => {
      const card = service.createMaintenanceReminderCard(mockMaintenanceData);

      expect(card.type).toBe('AdaptiveCard');
      expect(card.body[0].text).toContain('Maintenance Reminder');
      expect(card.body[1].text).toBe(mockMaintenanceData.vehicleName);
    });

    it('should include maintenance details', () => {
      const card = service.createMaintenanceReminderCard(mockMaintenanceData);

      const factSet = card.body.find(item => item.type === 'FactSet');
      expect(factSet).toBeDefined();
      expect(factSet.facts).toHaveLength(3);
      expect(factSet.facts[0].value).toBe(mockMaintenanceData.maintenanceType);
    });

    it('should format mileage with thousands separator', () => {
      const card = service.createMaintenanceReminderCard(mockMaintenanceData);

      const factSet = card.body.find(item => item.type === 'FactSet');
      const mileageFact = factSet.facts.find((f: any) => f.title.includes('Mileage'));
      expect(mileageFact.value).toContain('45,000');
    });

    it('should include schedule and snooze actions', () => {
      const card = service.createMaintenanceReminderCard(mockMaintenanceData);

      expect(card.actions).toHaveLength(2);
      expect(card.actions![0].title).toBe('Schedule Maintenance');
      expect(card.actions![1].title).toBe('Snooze');
      expect(card.actions![1].data.days).toBe(7);
    });
  });

  describe('Route Optimization Card', () => {
    const mockRouteData = {
      routeId: 'ROUTE-001',
      originalDistance: 150,
      optimizedDistance: 120,
      timeSaved: 45,
      fuelSaved: 2.5,
      stops: ['Stop A', 'Stop B', 'Stop C', 'Stop D']
    };

    it('should create a route optimization card', () => {
      const card = service.createRouteOptimizationCard(mockRouteData);

      expect(card.type).toBe('AdaptiveCard');
      expect(card.body[0].text).toContain('Route Optimization');
    });

    it('should display distance comparison in columns', () => {
      const card = service.createRouteOptimizationCard(mockRouteData);

      const columnSet = card.body.find(item => item.type === 'ColumnSet');
      expect(columnSet).toBeDefined();
      expect(columnSet.columns).toHaveLength(2);
    });

    it('should calculate and display savings percentage', () => {
      const card = service.createRouteOptimizationCard(mockRouteData);

      const factSet = card.body.find(item => item.type === 'FactSet');
      const savingsFact = factSet.facts.find((f: any) => f.title.includes('Distance Saved'));
      expect(savingsFact.value).toContain('20.0%');
    });

    it('should include all optimization metrics', () => {
      const card = service.createRouteOptimizationCard(mockRouteData);

      const factSet = card.body.find(item => item.type === 'FactSet');
      expect(factSet.facts).toHaveLength(4);
    });
  });

  describe('Card Validation', () => {
    it('should validate a correct card', () => {
      const validCard = service.createBasicCard('Title', 'Content');
      const result = service.validateCard(validCard);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject card with wrong type', () => {
      const invalidCard = {
        type: 'WrongType',
        version: '1.4',
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        body: [{ type: 'TextBlock', text: 'Test' }]
      } as any;

      const result = service.validateCard(invalidCard);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Card type must be "AdaptiveCard"');
    });

    it('should reject card without version', () => {
      const invalidCard = {
        type: 'AdaptiveCard',
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        body: [{ type: 'TextBlock', text: 'Test' }]
      } as any;

      const result = service.validateCard(invalidCard);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Card version is required');
    });

    it('should reject card with empty body', () => {
      const invalidCard = {
        type: 'AdaptiveCard',
        version: '1.4',
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        body: []
      } as any;

      const result = service.validateCard(invalidCard);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Card must have at least one element in body');
    });

    it('should reject body elements without type', () => {
      const invalidCard = {
        type: 'AdaptiveCard',
        version: '1.4',
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        body: [{ text: 'Test' }]
      } as any;

      const result = service.validateCard(invalidCard);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('missing type'))).toBe(true);
    });

    it('should reject actions without title', () => {
      const invalidCard = {
        type: 'AdaptiveCard',
        version: '1.4',
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        body: [{ type: 'TextBlock', text: 'Test' }],
        actions: [{ type: 'Action.Submit' }]
      } as any;

      const result = service.validateCard(invalidCard);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('missing title'))).toBe(true);
    });
  });

  describe('Teams Integration', () => {
    it('should wrap card for Teams messaging', () => {
      const card = service.createBasicCard('Title', 'Content');
      const wrapped = service.wrapCardForTeams(card);

      expect(wrapped.type).toBe('message');
      expect(wrapped.attachments).toHaveLength(1);
      expect(wrapped.attachments[0].contentType).toBe('application/vnd.microsoft.card.adaptive');
      expect(wrapped.attachments[0].content).toEqual(card);
    });
  });

  describe('Action Handling', () => {
    it('should handle card action', async () => {
      const action: CardAction = {
        type: 'Action.Submit',
        title: 'Approve',
        data: { action: 'approve', id: '123' }
      };

      const result = await service.handleCardAction(action, 'user_123');

      expect(result.success).toBe(true);
      expect(result.action).toBe('Action.Submit');
      expect(result.userId).toBe('user_123');
    });
  });
});
