/**
 * AI Damage Detection Service
 * 
 * Features:
 * - Computer vision damage detection
 * - Severity classification
 * - Cost estimation
 * - Automated report generation
 * 
 * Created: 2026-01-08
 */

import type { DamageSeverity } from '@/components/garage/DamageOverlay';
import type { CapturedPhoto } from '@/components/garage/MobileCameraCapture';

// ============================================================================
// TYPES
// ============================================================================

export interface DamageDetectionResult {
  damages: DetectedDamage[];
  confidence: number;
  processingTime: number;
  modelVersion: string;
}

export interface DetectedDamage {
  id: string;
  type: DamageType;
  severity: DamageSeverity;
  location: {
    zone: string;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  confidence: number;
  estimatedCost: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  repairSuggestions: string[];
}

export type DamageType =
  | 'dent'
  | 'scratch'
  | 'crack'
  | 'rust'
  | 'paint_damage'
  | 'broken_glass'
  | 'missing_part'
  | 'tire_damage'
  | 'light_damage';

export interface AIModelConfig {
  endpoint: string;
  apiKey: string;
  modelVersion: string;
  confidenceThreshold: number;
}

// ============================================================================
// AI SERVICE CLASS
// ============================================================================

export class AIDamageDetectionService {
  private config: AIModelConfig;
  private processingQueue: Map<string, Promise<DamageDetectionResult>> = new Map();

  constructor(config: AIModelConfig) {
    this.config = config;
  }

  /**
   * Analyze a photo for damage
   */
  async analyzePhoto(photo: CapturedPhoto): Promise<DamageDetectionResult> {
    // Check if already processing
    if (this.processingQueue.has(photo.id)) {
      return this.processingQueue.get(photo.id)!;
    }

    const analysisPromise = this.performAnalysis(photo);
    this.processingQueue.set(photo.id, analysisPromise);

    try {
      const result = await analysisPromise;
      return result;
    } finally {
      this.processingQueue.delete(photo.id);
    }
  }

  /**
   * Perform damage analysis
   */
  private async performAnalysis(photo: CapturedPhoto): Promise<DamageDetectionResult> {
    const startTime = performance.now();

    try {
      // Prepare image data
      const imageData = await this.prepareImageData(photo);

      // Call AI API
      const response = await fetch(`${this.config.endpoint}/detect-damage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Model-Version': this.config.modelVersion,
        },
        body: JSON.stringify({
          image: imageData,
          vehicleZone: photo.vehicleZone,
          metadata: {
            timestamp: photo.timestamp.toISOString(),
            location: photo.location,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.statusText}`);
      }

      const rawResult = await response.json();

      // Process and normalize results
      const damages = this.processDamageResults(rawResult.detections);

      const processingTime = performance.now() - startTime;

      return {
        damages,
        confidence: rawResult.overall_confidence,
        processingTime,
        modelVersion: this.config.modelVersion,
      };
    } catch (error) {
      console.error('Damage detection failed:', error);
      throw error;
    }
  }

  /**
   * Prepare image data for API
   */
  private async prepareImageData(photo: CapturedPhoto): Promise<string> {
    // Convert to base64 if needed
    if (photo.dataUrl.startsWith('data:')) {
      return photo.dataUrl.split(',')[1];
    }
    return photo.dataUrl;
  }

  /**
   * Process raw API results
   */
  private processDamageResults(detections: any[]): DetectedDamage[] {
    return detections
      .filter(d => d.confidence >= this.config.confidenceThreshold)
      .map(detection => ({
        id: `damage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: detection.type,
        severity: this.classifySeverity(detection),
        location: {
          zone: detection.zone || 'unknown',
          boundingBox: detection.bounding_box,
        },
        confidence: detection.confidence,
        estimatedCost: this.estimateCost(detection),
        description: this.generateDescription(detection),
        repairSuggestions: this.generateRepairSuggestions(detection),
      }));
  }

  /**
   * Classify damage severity
   */
  private classifySeverity(detection: any): DamageSeverity {
    const { type, size, depth } = detection;

    // Critical damages
    if (
      type === 'broken_glass' ||
      type === 'missing_part' ||
      (type === 'crack' && size > 0.5)
    ) {
      return 'critical';
    }

    // Severe damages
    if (
      type === 'dent' && depth > 5 ||
      type === 'rust' && size > 0.3 ||
      type === 'crack'
    ) {
      return 'severe';
    }

    // Moderate damages
    if (
      type === 'dent' && depth > 2 ||
      type === 'scratch' && depth > 1 ||
      type === 'paint_damage' && size > 0.2
    ) {
      return 'moderate';
    }

    // Minor damages
    return 'minor';
  }

  /**
   * Estimate repair cost
   */
  private estimateCost(detection: any): { min: number; max: number; currency: string } {
    const baseCosts: Record<DamageType, { min: number; max: number }> = {
      dent: { min: 150, max: 500 },
      scratch: { min: 100, max: 400 },
      crack: { min: 300, max: 1500 },
      rust: { min: 200, max: 1000 },
      paint_damage: { min: 150, max: 600 },
      broken_glass: { min: 200, max: 800 },
      missing_part: { min: 100, max: 2000 },
      tire_damage: { min: 150, max: 400 },
      light_damage: { min: 50, max: 300 },
    };

    const base = baseCosts[detection.type as DamageType] || { min: 100, max: 500 };

    // Adjust based on size and severity
    const sizeMultiplier = 1 + (detection.size || 0.2);
    const severityMultiplier = detection.severity === 'critical' ? 2 : detection.severity === 'severe' ? 1.5 : 1;

    return {
      min: Math.round(base.min * sizeMultiplier * severityMultiplier),
      max: Math.round(base.max * sizeMultiplier * severityMultiplier),
      currency: 'USD',
    };
  }

  /**
   * Generate damage description
   */
  private generateDescription(detection: any): string {
    const { type, size, location } = detection;

    const sizeDesc = size > 0.5 ? 'large' : size > 0.2 ? 'medium' : 'small';
    const typeDesc = type.replace(/_/g, ' ');

    return `${sizeDesc} ${typeDesc} detected on ${location || 'vehicle'}`;
  }

  /**
   * Generate repair suggestions
   */
  private generateRepairSuggestions(detection: any): string[] {
    const suggestions: Record<DamageType, string[]> = {
      dent: [
        'Paintless dent repair (PDR) may be possible',
        'Traditional body work if paint is damaged',
        'Inspect for underlying structural damage',
      ],
      scratch: [
        'Polish and compound for surface scratches',
        'Touch-up paint for deeper scratches',
        'Full panel repaint for extensive damage',
      ],
      crack: [
        'Professional assessment required',
        'May need part replacement',
        'Check structural integrity',
      ],
      rust: [
        'Remove rust and treat surface',
        'Repaint affected area',
        'Check for spread to other areas',
      ],
      paint_damage: [
        'Touch-up paint for small areas',
        'Panel repaint for larger areas',
        'Color matching required',
      ],
      broken_glass: [
        'Replace damaged glass',
        'Check for frame damage',
        'Inspect seals and weather stripping',
      ],
      missing_part: [
        'Identify and order replacement part',
        'Check for compatible used parts',
        'Professional installation recommended',
      ],
      tire_damage: [
        'Inspect for punctures or sidewall damage',
        'Check tire pressure and alignment',
        'Replace if damage is severe',
      ],
      light_damage: [
        'Replace damaged light assembly',
        'Check electrical connections',
        'Test all lighting functions',
      ],
    };

    return suggestions[detection.type as DamageType] || ['Professional inspection recommended'];
  }

  /**
   * Batch analyze multiple photos
   */
  async analyzeBatch(photos: CapturedPhoto[]): Promise<Map<string, DamageDetectionResult>> {
    const results = new Map<string, DamageDetectionResult>();

    // Process in parallel with concurrency limit
    const concurrencyLimit = 3;
    const chunks: CapturedPhoto[][] = [];

    for (let i = 0; i < photos.length; i += concurrencyLimit) {
      chunks.push(photos.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(async photo => {
          try {
            const result = await this.analyzePhoto(photo);
            return { photoId: photo.id, result };
          } catch (error) {
            console.error(`Analysis failed for photo ${photo.id}:`, error);
            return null;
          }
        })
      );

      chunkResults.forEach(item => {
        if (item) {
          results.set(item.photoId, item.result);
        }
      });
    }

    return results;
  }

  /**
   * Generate comprehensive damage report
   */
  generateReport(
    analysisResults: Map<string, DamageDetectionResult>,
    vehicleInfo: { make: string; model: string; year: number; vin: string }
  ): DamageReport {
    const allDamages: DetectedDamage[] = [];
    let totalConfidence = 0;
    let totalProcessingTime = 0;

    analysisResults.forEach(result => {
      allDamages.push(...result.damages);
      totalConfidence += result.confidence;
      totalProcessingTime += result.processingTime;
    });

    // Calculate totals
    const totalCostMin = allDamages.reduce((sum, d) => sum + d.estimatedCost.min, 0);
    const totalCostMax = allDamages.reduce((sum, d) => sum + d.estimatedCost.max, 0);

    // Group by severity
    const bySeverity = {
      critical: allDamages.filter(d => d.severity === 'critical').length,
      severe: allDamages.filter(d => d.severity === 'severe').length,
      moderate: allDamages.filter(d => d.severity === 'moderate').length,
      minor: allDamages.filter(d => d.severity === 'minor').length,
    };

    return {
      id: `report-${Date.now()}`,
      generatedAt: new Date(),
      vehicleInfo,
      summary: {
        totalDamages: allDamages.length,
        bySeverity,
        estimatedCost: {
          min: totalCostMin,
          max: totalCostMax,
          currency: 'USD',
        },
        averageConfidence: totalConfidence / analysisResults.size,
      },
      damages: allDamages,
      recommendations: this.generateRecommendations(allDamages, bySeverity),
      metadata: {
        photosAnalyzed: analysisResults.size,
        processingTime: totalProcessingTime,
        modelVersion: this.config.modelVersion,
      },
    };
  }

  /**
   * Generate recommendations based on damages
   */
  private generateRecommendations(
    damages: DetectedDamage[],
    bySeverity: Record<DamageSeverity, number>
  ): string[] {
    const recommendations: string[] = [];

    if (bySeverity.critical > 0) {
      recommendations.push('⚠️ Critical damage detected - immediate repair required');
      recommendations.push('Vehicle safety inspection recommended');
    }

    if (bySeverity.severe > 0) {
      recommendations.push('Schedule repair appointment within 1-2 weeks');
    }

    if (damages.some(d => d.type === 'rust')) {
      recommendations.push('Address rust damage to prevent spreading');
    }

    if (damages.some(d => d.type === 'broken_glass')) {
      recommendations.push('Replace broken glass immediately for safety');
    }

    if (damages.length > 5) {
      recommendations.push('Consider comprehensive body shop estimate');
    }

    if (recommendations.length === 0) {
      recommendations.push('Vehicle is in good condition');
      recommendations.push('Continue regular maintenance schedule');
    }

    return recommendations;
  }
}

// ============================================================================
// REPORT INTERFACE
// ============================================================================

export interface DamageReport {
  id: string;
  generatedAt: Date;
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    vin: string;
  };
  summary: {
    totalDamages: number;
    bySeverity: Record<DamageSeverity, number>;
    estimatedCost: {
      min: number;
      max: number;
      currency: string;
    };
    averageConfidence: number;
  };
  damages: DetectedDamage[];
  recommendations: string[];
  metadata: {
    photosAnalyzed: number;
    processingTime: number;
    modelVersion: string;
  };
}

// Singleton instance
let damageDetectionService: AIDamageDetectionService | null = null;

export function initializeDamageDetection(config: AIModelConfig): void {
  damageDetectionService = new AIDamageDetectionService(config);
}

export function getDamageDetectionService(): AIDamageDetectionService {
  if (!damageDetectionService) {
    throw new Error('Damage detection service not initialized');
  }
  return damageDetectionService;
}

export default AIDamageDetectionService;
