import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ROICalculatorService } from '../../services/roi-calculator.service';

/**
 * Unit tests for ROICalculatorService
 */

const validROIData = {
  assetId: 1,
  purchasePrice: 50000,
  maintenanceCost: 5000,
  fuelCost: 8000,
  insuranceCost: 3000,
  totalMiles: 100000,
  annualRevenue: 40000,
  annualCosts: 25000,
};

describe('ROICalculatorService', () => {
  let service: ROICalculatorService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = { query: vi.fn() };
    service = new ROICalculatorService(mockDb);
  });

  describe('calculateTCO', () => {
    it('should calculate total cost of ownership', async () => {
      const result = await service.calculateTCO(validROIData);
      // purchasePrice + maintenanceCost + fuelCost + insuranceCost = 50000 + 5000 + 8000 + 3000
      expect(result).toBe(66000);
    });

    it('should reject invalid input', async () => {
      await expect(service.calculateTCO(null as any)).rejects.toThrow();
    });

    it('should reject missing fields', async () => {
      await expect(service.calculateTCO({} as any)).rejects.toThrow();
    });
  });

  describe('calculateCostPerMile', () => {
    it('should calculate cost per mile', async () => {
      const result = await service.calculateCostPerMile(validROIData);
      // (50000 + 5000 + 8000 + 3000) / 100000 = 0.66
      expect(result).toBeCloseTo(0.66);
    });

    it('should return 0 when totalMiles is 0', async () => {
      const data = { ...validROIData, totalMiles: 0 };
      const result = await service.calculateCostPerMile(data);
      expect(result).toBe(0);
    });

    it('should reject invalid input', async () => {
      await expect(service.calculateCostPerMile(null as any)).rejects.toThrow();
    });
  });

  describe('calculatePaybackPeriod', () => {
    it('should calculate payback period in years', async () => {
      const result = await service.calculatePaybackPeriod(validROIData);
      // purchasePrice / (annualRevenue - annualCosts) = 50000 / (40000 - 25000) = 3.333...
      expect(result).toBeCloseTo(3.333, 2);
    });

    it('should return 0 when net profit is 0 or negative', async () => {
      const data = { ...validROIData, annualRevenue: 20000, annualCosts: 30000 };
      const result = await service.calculatePaybackPeriod(data);
      expect(result).toBe(0);
    });

    it('should reject invalid input', async () => {
      await expect(service.calculatePaybackPeriod(null as any)).rejects.toThrow();
    });
  });

  describe('calculateDepreciation', () => {
    it('should calculate annual depreciation', async () => {
      const result = await service.calculateDepreciation(50000, 5);
      expect(result).toBe(10000);
    });

    it('should handle single year', async () => {
      const result = await service.calculateDepreciation(30000, 1);
      expect(result).toBe(30000);
    });
  });
});
