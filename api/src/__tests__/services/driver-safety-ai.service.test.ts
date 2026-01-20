/**
 * Driver Safety AI Service Integration Tests
 * Tests all 16+ safety behavior detections
 */

import { Pool } from 'pg';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import DriverSafetyAIService from '../../services/driver-safety-ai.service';

// Mock dependencies
vi.mock('../../config/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

describe('DriverSafetyAIService - Integration Tests', () => {
  let service: DriverSafetyAIService;
  let mockDb: Pool;

  beforeEach(() => {
    mockDb = {
      query: vi.fn().mockResolvedValue({ rows: [] })
    } as any;

    service = new DriverSafetyAIService(mockDb);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Safety Behavior Detection', () => {
    describe('1. Phone Use Detection', () => {
      it('should detect phone use with high confidence', async () => {
        const mockAnalysis = {
          objects: [
            { object: 'cell phone', confidence: 0.85, rectangle: { x: 100, y: 100, width: 50, height: 100 } }
          ]
        };

        vi.spyOn(service as any, 'computerVisionClient', 'get').mockReturnValue({
          analyzeImage: vi.fn().mockResolvedValue(mockAnalysis)
        });

        const result = await service.analyzeVideoFrame('test-image-url');

        const phoneUse = result.detectedBehaviors.find(b => b.behavior === 'phone_use');
        expect(phoneUse).toBeDefined();
        expect(phoneUse?.severity).toBe('severe');
        expect(phoneUse?.confidence).toBeGreaterThan(0.75);
      });

      it('should handle mobile device variants', async () => {
        const mockAnalysis = {
          objects: [
            { object: 'mobile device', confidence: 0.82, rectangle: {} }
          ]
        };

        vi.spyOn(service as any, 'computerVisionClient', 'get').mockReturnValue({
          analyzeImage: vi.fn().mockResolvedValue(mockAnalysis)
        });

        const result = await service.analyzeVideoFrame('test-image-url');

        const phoneUse = result.detectedBehaviors.find(b => b.behavior === 'phone_use');
        expect(phoneUse).toBeDefined();
      });
    });

    describe('2. Smoking Detection', () => {
      it('should detect smoking behavior', async () => {
        const mockAnalysis = {
          objects: [
            { object: 'cigarette', confidence: 0.78, rectangle: {} }
          ]
        };

        vi.spyOn(service as any, 'computerVisionClient', 'get').mockReturnValue({
          analyzeImage: vi.fn().mockResolvedValue(mockAnalysis)
        });

        const result = await service.analyzeVideoFrame('test-image-url');

        const smoking = result.detectedBehaviors.find(b => b.behavior === 'smoking');
        expect(smoking).toBeDefined();
        expect(smoking?.severity).toBe('moderate');
      });

      it('should detect vaping', async () => {
        const mockAnalysis = {
          objects: [
            { object: 'vape', confidence: 0.75, rectangle: {} }
          ]
        };

        vi.spyOn(service as any, 'computerVisionClient', 'get').mockReturnValue({
          analyzeImage: vi.fn().mockResolvedValue(mockAnalysis)
        });

        const result = await service.analyzeVideoFrame('test-image-url');

        const smoking = result.detectedBehaviors.find(b => b.behavior === 'smoking');
        expect(smoking).toBeDefined();
      });
    });

    describe('3. Eating/Drinking Detection', () => {
      it('should detect eating while driving', async () => {
        const mockAnalysis = {
          objects: [
            { object: 'food', confidence: 0.72, rectangle: {} }
          ]
        };

        vi.spyOn(service as any, 'computerVisionClient', 'get').mockReturnValue({
          analyzeImage: vi.fn().mockResolvedValue(mockAnalysis)
        });

        const result = await service.analyzeVideoFrame('test-image-url');

        const eating = result.detectedBehaviors.find(b => b.behavior === 'eating_drinking');
        expect(eating).toBeDefined();
        expect(eating?.severity).toBe('minor');
      });

      it('should detect drinking beverages', async () => {
        const mockAnalysis = {
          objects: [
            { object: 'cup', confidence: 0.80, rectangle: {} },
            { object: 'bottle', confidence: 0.75, rectangle: {} }
          ]
        };

        vi.spyOn(service as any, 'computerVisionClient', 'get').mockReturnValue({
          analyzeImage: vi.fn().mockResolvedValue(mockAnalysis)
        });

        const result = await service.analyzeVideoFrame('test-image-url');

        const drinking = result.detectedBehaviors.filter(b => b.behavior === 'eating_drinking');
        expect(drinking.length).toBeGreaterThan(0);
      });
    });

    describe('4. Headphones Detection', () => {
      it('should detect headphone usage', async () => {
        const mockAnalysis = {
          objects: [
            { object: 'headphones', confidence: 0.88, rectangle: {} }
          ]
        };

        vi.spyOn(service as any, 'computerVisionClient', 'get').mockReturnValue({
          analyzeImage: vi.fn().mockResolvedValue(mockAnalysis)
        });

        const result = await service.analyzeVideoFrame('test-image-url');

        const headphones = result.detectedBehaviors.find(b => b.behavior === 'wearing_headphones');
        expect(headphones).toBeDefined();
        expect(headphones?.severity).toBe('moderate');
      });
    });

    describe('5. Pet Distraction Detection', () => {
      it('should detect pets in vehicle', async () => {
        const mockAnalysis = {
          objects: [
            { object: 'dog', confidence: 0.92, rectangle: {} }
          ]
        };

        vi.spyOn(service as any, 'computerVisionClient', 'get').mockReturnValue({
          analyzeImage: vi.fn().mockResolvedValue(mockAnalysis)
        });

        const result = await service.analyzeVideoFrame('test-image-url');

        const pet = result.detectedBehaviors.find(b => b.behavior === 'pet_distraction');
        expect(pet).toBeDefined();
        expect(pet?.severity).toBe('moderate');
      });
    });

    describe('6. Reading While Driving Detection', () => {
      it('should detect reading materials', async () => {
        const mockAnalysis = {
          objects: [
            { object: 'book', confidence: 0.83, rectangle: {} }
          ]
        };

        vi.spyOn(service as any, 'computerVisionClient', 'get').mockReturnValue({
          analyzeImage: vi.fn().mockResolvedValue(mockAnalysis)
        });

        const result = await service.analyzeVideoFrame('test-image-url');

        const reading = result.detectedBehaviors.find(b => b.behavior === 'reading_while_driving');
        expect(reading).toBeDefined();
        expect(reading?.severity).toBe('severe');
      });
    });

    describe('7. Device Use Detection', () => {
      it('should detect laptop/tablet use', async () => {
        const mockAnalysis = {
          objects: [
            { object: 'laptop', confidence: 0.87, rectangle: {} }
          ]
        };

        vi.spyOn(service as any, 'computerVisionClient', 'get').mockReturnValue({
          analyzeImage: vi.fn().mockResolvedValue(mockAnalysis)
        });

        const result = await service.analyzeVideoFrame('test-image-url');

        const device = result.detectedBehaviors.find(b => b.behavior === 'device_use');
        expect(device).toBeDefined();
        expect(device?.severity).toBe('critical');
      });
    });

    describe('8-10. Face Analysis (Drowsiness, Yawning, Distraction)', () => {
      it('should detect drowsiness from closed eyes', async () => {
        const mockAnalysis = { objects: [] };

        vi.spyOn(service as any, 'computerVisionClient', 'get').mockReturnValue({
          analyzeImage: vi.fn().mockResolvedValue(mockAnalysis)
        });

        vi.spyOn(service as any, 'analyzeFace').mockResolvedValue({
          eyesClosed: true,
          yawning: false,
          lookingAway: false,
          drowsinessScore: 0.85,
          distractionScore: 0.3
        });

        const result = await service.analyzeVideoFrame('test-image-url');

        const drowsiness = result.detectedBehaviors.find(b => b.behavior === 'drowsiness');
        expect(drowsiness).toBeDefined();
        expect(drowsiness?.severity).toBe('critical');
        expect(drowsiness?.confidence).toBeGreaterThan(0.7);
      });

      it('should detect yawning', async () => {
        const mockAnalysis = { objects: [] };

        vi.spyOn(service as any, 'computerVisionClient', 'get').mockReturnValue({
          analyzeImage: vi.fn().mockResolvedValue(mockAnalysis)
        });

        vi.spyOn(service as any, 'analyzeFace').mockResolvedValue({
          eyesClosed: false,
          yawning: true,
          lookingAway: false,
          drowsinessScore: 0.4,
          distractionScore: 0.2
        });

        const result = await service.analyzeVideoFrame('test-image-url');

        const yawning = result.detectedBehaviors.find(b => b.behavior === 'yawning');
        expect(yawning).toBeDefined();
        expect(yawning?.severity).toBe('moderate');
      });

      it('should detect driver looking away from road', async () => {
        const mockAnalysis = { objects: [] };

        vi.spyOn(service as any, 'computerVisionClient', 'get').mockReturnValue({
          analyzeImage: vi.fn().mockResolvedValue(mockAnalysis)
        });

        vi.spyOn(service as any, 'analyzeFace').mockResolvedValue({
          eyesClosed: false,
          yawning: false,
          lookingAway: true,
          drowsinessScore: 0.3,
          distractionScore: 0.88
        });

        const result = await service.analyzeVideoFrame('test-image-url');

        const distraction = result.detectedBehaviors.find(b => b.behavior === 'distracted_driving');
        expect(distraction).toBeDefined();
        expect(distraction?.severity).toBe('severe');
      });
    });

    describe('11. Seatbelt Detection', () => {
      it('should detect missing seatbelt with driver present', async () => {
        const mockAnalysis = {
          objects: [
            { object: 'person', confidence: 0.95, rectangle: {} }
          ]
        };

        vi.spyOn(service as any, 'computerVisionClient', 'get').mockReturnValue({
          analyzeImage: vi.fn().mockResolvedValue(mockAnalysis)
        });

        vi.spyOn(service as any, 'analyzeFace').mockResolvedValue(null);

        const result = await service.analyzeVideoFrame('test-image-url');

        const noSeatbelt = result.detectedBehaviors.find(b => b.behavior === 'no_seatbelt');
        expect(noSeatbelt).toBeDefined();
        expect(noSeatbelt?.severity).toBe('critical');
      });

      it('should not flag when seatbelt is detected', async () => {
        const mockAnalysis = {
          objects: [
            { object: 'person', confidence: 0.95, rectangle: {} },
            { object: 'seatbelt', confidence: 0.88, rectangle: {} }
          ]
        };

        vi.spyOn(service as any, 'computerVisionClient', 'get').mockReturnValue({
          analyzeImage: vi.fn().mockResolvedValue(mockAnalysis)
        });

        vi.spyOn(service as any, 'analyzeFace').mockResolvedValue(null);

        const result = await service.analyzeVideoFrame('test-image-url');

        const noSeatbelt = result.detectedBehaviors.find(b => b.behavior === 'no_seatbelt');
        expect(noSeatbelt).toBeUndefined();
      });
    });

    describe('12. Grooming While Driving', () => {
      it('should detect grooming activities', async () => {
        const mockAnalysis = {
          objects: [
            { object: 'mirror', confidence: 0.76, rectangle: {} }
          ]
        };

        vi.spyOn(service as any, 'computerVisionClient', 'get').mockReturnValue({
          analyzeImage: vi.fn().mockResolvedValue(mockAnalysis)
        });

        vi.spyOn(service as any, 'analyzeFace').mockResolvedValue(null);

        const result = await service.analyzeVideoFrame('test-image-url');

        const grooming = result.detectedBehaviors.find(b => b.behavior === 'grooming_while_driving');
        expect(grooming).toBeDefined();
        expect(grooming?.severity).toBe('moderate');
      });
    });

    describe('13. Camera Use Detection', () => {
      it('should detect secondary camera usage', async () => {
        const mockAnalysis = {
          objects: [
            { object: 'camera', confidence: 0.81, rectangle: {} }
          ]
        };

        vi.spyOn(service as any, 'computerVisionClient', 'get').mockReturnValue({
          analyzeImage: vi.fn().mockResolvedValue(mockAnalysis)
        });

        vi.spyOn(service as any, 'analyzeFace').mockResolvedValue(null);

        const result = await service.analyzeVideoFrame('test-image-url');

        const camera = result.detectedBehaviors.find(b => b.behavior === 'camera_use');
        expect(camera).toBeDefined();
        expect(camera?.severity).toBe('moderate');
      });
    });

    describe('14. Hands Off Wheel Detection', () => {
      it('should detect hands not on steering wheel', async () => {
        const mockAnalysis = {
          objects: [
            { object: 'hand', confidence: 0.90, rectangle: { x: 100, y: 200, width: 50, height: 50 } }
          ]
        };

        vi.spyOn(service as any, 'computerVisionClient', 'get').mockReturnValue({
          analyzeImage: vi.fn().mockResolvedValue(mockAnalysis)
        });

        vi.spyOn(service as any, 'analyzeFace').mockResolvedValue(null);

        const result = await service.analyzeVideoFrame('test-image-url');

        const handsOff = result.detectedBehaviors.find(b => b.behavior === 'hands_off_wheel');
        expect(handsOff).toBeDefined();
        expect(handsOff?.severity).toBe('severe');
      });
    });

    describe('15. Passenger Distraction Detection', () => {
      it('should detect multiple people in vehicle', async () => {
        const mockAnalysis = {
          objects: [
            { object: 'person', confidence: 0.95, rectangle: { x: 200, y: 300 } },
            { object: 'person', confidence: 0.88, rectangle: { x: 600, y: 300 } }
          ]
        };

        vi.spyOn(service as any, 'computerVisionClient', 'get').mockReturnValue({
          analyzeImage: vi.fn().mockResolvedValue(mockAnalysis)
        });

        vi.spyOn(service as any, 'analyzeFace').mockResolvedValue(null);

        const result = await service.analyzeVideoFrame('test-image-url');

        const passenger = result.detectedBehaviors.find(b => b.behavior === 'passenger_distraction');
        expect(passenger).toBeDefined();
        expect(passenger?.severity).toBe('minor');
      });
    });

    describe('16. Obstructed View Detection', () => {
      it('should detect windshield obstructions', async () => {
        const mockAnalysis = {
          objects: [
            { object: 'sticker', confidence: 0.79, rectangle: { x: 400, y: 100, width: 50, height: 50 } }
          ],
          adult: { isAdultContent: true }
        };

        vi.spyOn(service as any, 'computerVisionClient', 'get').mockReturnValue({
          analyzeImage: vi.fn().mockResolvedValue(mockAnalysis)
        });

        vi.spyOn(service as any, 'analyzeFace').mockResolvedValue(null);

        const result = await service.analyzeVideoFrame('test-image-url');

        const obstructed = result.detectedBehaviors.find(b => b.behavior === 'obstructed_view');
        expect(obstructed).toBeDefined();
        expect(obstructed?.severity).toBe('moderate');
      });
    });
  });

  describe('Risk Score Calculation', () => {
    it('should calculate risk score correctly for single behavior', () => {
      const behaviors = [
        { behavior: 'phone_use', confidence: 0.85, timestamp: Date.now(), severity: 'severe' as const }
      ];

      const riskScore = (service as any).calculateRiskScore(behaviors);

      expect(riskScore).toBeGreaterThan(0);
      expect(riskScore).toBeLessThanOrEqual(100);
    });

    it('should weight critical behaviors higher', () => {
      const criticalBehaviors = [
        { behavior: 'drowsiness', confidence: 0.90, timestamp: Date.now(), severity: 'critical' as const }
      ];

      const moderateBehaviors = [
        { behavior: 'smoking', confidence: 0.90, timestamp: Date.now(), severity: 'moderate' as const }
      ];

      const criticalScore = (service as any).calculateRiskScore(criticalBehaviors);
      const moderateScore = (service as any).calculateRiskScore(moderateBehaviors);

      expect(criticalScore).toBeGreaterThan(moderateScore);
    });

    it('should aggregate multiple behaviors correctly', () => {
      const behaviors = [
        { behavior: 'phone_use', confidence: 0.85, timestamp: Date.now(), severity: 'severe' as const },
        { behavior: 'drowsiness', confidence: 0.75, timestamp: Date.now(), severity: 'critical' as const },
        { behavior: 'eating_drinking', confidence: 0.80, timestamp: Date.now(), severity: 'minor' as const }
      ];

      const riskScore = (service as any).calculateRiskScore(behaviors);

      expect(riskScore).toBeGreaterThan(40);
      expect(riskScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Event Processing', () => {
    it('should process video event and store AI results', async () => {
      const eventId = 1;

      mockDb.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: eventId,
            video_thumbnail_url: 'https://example.com/thumbnail.jpg',
            camera_type: 'driver_facing',
            event_type: 'distracted_driving'
          }]
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      vi.spyOn(service, 'analyzeVideoFrame').mockResolvedValue({
        detectedBehaviors: [
          { behavior: 'phone_use', confidence: 0.88, timestamp: Date.now(), severity: 'severe' }
        ],
        objectDetections: [],
        faceAnalysis: null,
        vehicleAnalysis: null,
        overallRiskScore: 55,
        confidenceScore: 0.88
      });

      await service.processVideoEvent(eventId);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE video_safety_events'),
        expect.arrayContaining([
          expect.stringContaining('phone_use'),
          expect.any(Number)
        ])
      );
    });

    it('should escalate critical events automatically', async () => {
      const eventId = 2;

      mockDb.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: eventId,
            video_thumbnail_url: 'https://example.com/thumbnail.jpg',
            camera_type: 'driver_facing'
          }]
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      vi.spyOn(service, 'analyzeVideoFrame').mockResolvedValue({
        detectedBehaviors: [
          { behavior: 'drowsiness', confidence: 0.92, timestamp: Date.now(), severity: 'critical' }
        ],
        objectDetections: [],
        faceAnalysis: null,
        vehicleAnalysis: null,
        overallRiskScore: 92,
        confidenceScore: 0.92
      });

      await service.processVideoEvent(eventId);

      // Should update event to critical and mark as evidence
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('severity ='),
        expect.arrayContaining([eventId])
      );
    });

    it('should flag high-risk events for coaching', async () => {
      const eventId = 3;

      mockDb.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: eventId,
            video_thumbnail_url: 'https://example.com/thumbnail.jpg',
            camera_type: 'driver_facing'
          }]
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      vi.spyOn(service, 'analyzeVideoFrame').mockResolvedValue({
        detectedBehaviors: [
          { behavior: 'phone_use', confidence: 0.88, timestamp: Date.now(), severity: 'severe' },
          { behavior: 'distracted_driving', confidence: 0.82, timestamp: Date.now(), severity: 'severe' }
        ],
        objectDetections: [],
        faceAnalysis: null,
        vehicleAnalysis: null,
        overallRiskScore: 78,
        confidenceScore: 0.85
      });

      await service.processVideoEvent(eventId);

      // Should flag for coaching when risk > 70
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('coaching_required'),
        expect.arrayContaining([eventId])
      );
    });
  });

  describe('Driver Safety Insights', () => {
    it('should generate comprehensive driver insights', async () => {
      const driverId = 123;
      const days = 30;

      mockDb.query = vi.fn().mockResolvedValue({
        rows: [{
          total_events: 15,
          critical_count: 2,
          severe_count: 5,
          false_positive_count: 1,
          avg_confidence: 0.82,
          common_behaviors: ['phone_use', 'distracted_driving', 'yawning']
        }]
      });

      const insights = await service.getDriverSafetyInsights(driverId, days);

      expect(insights.total_events).toBe(15);
      expect(insights.critical_count).toBe(2);
      expect(insights.severe_count).toBe(5);
      expect(insights.avg_confidence).toBe(0.82);
      expect(insights.common_behaviors).toContain('phone_use');
    });
  });

  describe('Error Handling', () => {
    it('should handle AI analysis failures gracefully', async () => {
      vi.spyOn(service as any, 'computerVisionClient', 'get').mockReturnValue({
        analyzeImage: vi.fn().mockRejectedValue(new Error('AI service unavailable'))
      });

      await expect(service.analyzeVideoFrame('test-url')).rejects.toThrow('AI service unavailable');
    });

    it('should handle database errors during event processing', async () => {
      const eventId = 1;

      mockDb.query = vi.fn().mockRejectedValue(new Error('Database connection failed'));

      await expect(service.processVideoEvent(eventId)).rejects.toThrow();
    });

    it('should continue processing on face analysis failure', async () => {
      const mockAnalysis = {
        objects: [
          { object: 'phone', confidence: 0.85, rectangle: {} }
        ]
      };

      vi.spyOn(service as any, 'computerVisionClient', 'get').mockReturnValue({
        analyzeImage: vi.fn().mockResolvedValue(mockAnalysis)
      });

      vi.spyOn(service as any, 'analyzeFace').mockResolvedValue(null);
      vi.spyOn(service as any, 'detectSeatbelt').mockResolvedValue({ notWearing: false, confidence: 0 });
      vi.spyOn(service as any, 'detectAdditionalBehaviors').mockResolvedValue(undefined);

      const result = await service.analyzeVideoFrame('test-url');

      // Should still detect phone use even if face analysis fails
      const phoneUse = result.detectedBehaviors.find(b => b.behavior === 'phone_use');
      expect(phoneUse).toBeDefined();
      expect(result.faceAnalysis).toBeNull();
    });
  });

  describe('Performance', () => {
    it('should process frame analysis efficiently', async () => {
      const mockAnalysis = {
        objects: [
          { object: 'phone', confidence: 0.85, rectangle: {} }
        ]
      };

      vi.spyOn(service as any, 'computerVisionClient', 'get').mockReturnValue({
        analyzeImage: vi.fn().mockResolvedValue(mockAnalysis)
      });

      vi.spyOn(service as any, 'analyzeFace').mockResolvedValue(null);

      const startTime = Date.now();
      await service.analyzeVideoFrame('test-url');
      const duration = Date.now() - startTime;

      // Should complete in reasonable time (< 5 seconds in test)
      expect(duration).toBeLessThan(5000);
    });

    it('should batch process multiple events', async () => {
      mockDb.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [
            { id: 1 },
            { id: 2 },
            { id: 3 }
          ]
        });

      vi.spyOn(service, 'processVideoEvent').mockResolvedValue();

      const processed = await service.processPendingEvents(10);

      expect(processed).toBe(3);
      expect(service.processVideoEvent).toHaveBeenCalledTimes(3);
    });
  });
});
