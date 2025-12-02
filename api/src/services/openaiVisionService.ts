import OpenAI from 'openai';
import { logger } from '../utils/logger';

export interface DamageDetectionResult {
  vehicleDetected: boolean;
  vehicleInfo: {
    make: string | null;
    model: string | null;
    year: number | null;
    color: string;
  };
  cameraAngle: 'front' | 'rear' | 'left_side' | 'right_side' | 'front_left_45' | 'front_right_45' | 'rear_left_45' | 'rear_right_45';
  damages: Array<{
    type: 'scratch' | 'dent' | 'crack' | 'broken' | 'rust' | 'paint_chip' | 'collision' | 'hail' | 'vandalism' | 'other';
    severity: 'minor' | 'moderate' | 'severe' | 'critical';
    part: string;
    description: string;
    estimatedSize: string;
    boundingBox: {
      x: number; // percentage from left (0-100)
      y: number; // percentage from top (0-100)
      width: number; // percentage of image width (0-100)
      height: number; // percentage of image height (0-100)
    };
    confidence: number; // 0.0-1.0
  }>;
  overallAssessment: string;
}

export interface CostEstimate {
  totalEstimate: number;
  currency: string;
  breakdown: Array<{
    damageType: string;
    partName: string;
    severity: string;
    laborCost: number;
    partsCost: number;
    estimatedHours: number;
  }>;
  urgency: 'immediate' | 'high' | 'medium' | 'low';
}

export class OpenAIVisionService {
  private openai: OpenAI | null;
  private model: string = 'gpt-4-vision-preview';
  private enabled: boolean = false;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      logger.warn('⚠️  OPENAI_API_KEY not configured - AI damage detection disabled, will return stub responses');
      this.openai = null;
      this.enabled = false;
      return;
    }

    this.openai = new OpenAI({ apiKey });
    this.enabled = true;
    logger.info('✅ OpenAI Vision Service initialized with AI capabilities');
  }

  /**
   * Analyze a vehicle photo for damage using GPT-4 Vision
   * @param imageUrl - Public URL or base64 data URL of the image
   * @returns Structured damage detection results
   */
  async detectDamage(imageUrl: string): Promise<DamageDetectionResult> {
    // Return stub response if AI is not enabled
    if (!this.enabled || !this.openai) {
      logger.info('OpenAI not configured, returning stub damage detection response');
      return {
        vehicleDetected: true,
        vehicleInfo: {
          make: 'Unknown',
          model: 'Unknown',
          year: null,
          color: 'Unknown'
        },
        cameraAngle: 'front',
        damages: [
          {
            type: 'other',
            severity: 'minor',
            part: 'unknown',
            description: 'AI analysis not available - OpenAI API key not configured. Configure OPENAI_API_KEY environment variable to enable AI-powered damage detection.',
            estimatedSize: 'unknown',
            boundingBox: { x: 0, y: 0, width: 0, height: 0 },
            confidence: 0
          }
        ],
        overallAssessment: 'AI analysis unavailable. Please configure OpenAI API key for automated damage detection.'
      };
    }

    try {
      logger.info('Starting damage detection analysis', { imageUrl: imageUrl.substring(0, 50) + '...' });

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are an expert vehicle damage assessor with 20 years of experience. Analyze this vehicle photo and provide a detailed damage assessment in JSON format.

Your task:
1. Identify if a vehicle is present in the image
2. Determine the vehicle's make, model, year (if possible), and color
3. Identify the camera angle (front, rear, side, or 45-degree angle)
4. Detect ALL visible damage on the vehicle
5. For each damage, provide:
   - Type (scratch, dent, crack, broken, rust, paint_chip, collision, hail, vandalism, other)
   - Severity (minor, moderate, severe, critical)
   - Affected part (hood, bumper, door, fender, windshield, etc.)
   - Detailed description
   - Estimated size (e.g., "3 inches", "1 foot diameter")
   - Bounding box coordinates (percentage of image, x/y from top-left, width/height)
   - Confidence level (0.0-1.0)
6. Provide an overall assessment

Return ONLY a valid JSON object with this EXACT structure (no markdown, no code blocks):
{
  "vehicleDetected": true,
  "vehicleInfo": {
    "make": "Ford",
    "model": "F-150",
    "year": 2024,
    "color": "Blue"
  },
  "cameraAngle": "front_left_45",
  "damages": [
    {
      "type": "dent",
      "severity": "moderate",
      "part": "front_bumper",
      "description": "Moderate dent on front bumper, approximately 4 inches in diameter. Paint is intact but metal is deformed.",
      "estimatedSize": "4 inches diameter",
      "boundingBox": {
        "x": 45.5,
        "y": 62.3,
        "width": 8.2,
        "height": 6.5
      },
      "confidence": 0.92
    }
  ],
  "overallAssessment": "Vehicle has moderate damage to front bumper. Repair recommended within 2 weeks to prevent further deterioration."
}

If no vehicle is detected, return:
{
  "vehicleDetected": false,
  "vehicleInfo": { "make": null, "model": null, "year": null, "color": "unknown" },
  "cameraAngle": "front",
  "damages": [],
  "overallAssessment": "No vehicle detected in image."
}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high' // Request high-detail analysis
                }
              }
            ]
          }
        ],
        max_tokens: 2500,
        temperature: 0.2 // Lower temperature for more consistent, factual responses
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI Vision API');
      }

      logger.debug('Raw OpenAI response', { content: content.substring(0, 200) + '...' });

      // Parse JSON response (handle potential markdown code blocks)
      let parsedResult: DamageDetectionResult;
      try {
        // Try to extract JSON from markdown code block
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
        const jsonString = jsonMatch ? jsonMatch[1] : content;
        parsedResult = JSON.parse(jsonString.trim());
      } catch (parseError) {
        logger.error('Failed to parse OpenAI response as JSON', { content, parseError });
        throw new Error('Invalid JSON response from OpenAI Vision API');
      }

      // Validate response structure
      if (typeof parsedResult.vehicleDetected !== 'boolean') {
        throw new Error('Invalid response structure: missing vehicleDetected');
      }

      logger.info('Damage detection completed successfully', {
        vehicleDetected: parsedResult.vehicleDetected,
        damageCount: parsedResult.damages.length
      });

      return parsedResult;
    } catch (error) {
      logger.error('Error during damage detection', { error });
      throw error;
    }
  }

  /**
   * Estimate repair costs based on detected damage
   * @param damageData - Detection results from detectDamage()
   * @returns Cost estimate with breakdown
   */
  estimateCost(damageData: DamageDetectionResult): CostEstimate {
    if (!damageData.vehicleDetected || damageData.damages.length === 0) {
      return {
        totalEstimate: 0,
        currency: 'USD',
        breakdown: [],
        urgency: 'low'
      };
    }

    // Cost estimation rules (industry averages in USD)
    const laborRatePerHour = 100; // $100/hour average body shop rate
    const costRules: Record<string, Record<string, { labor: number; parts: number }>> = {
      scratch: {
        minor: { labor: 0.5, parts: 50 },
        moderate: { labor: 1.5, parts: 150 },
        severe: { labor: 3, parts: 300 },
        critical: { labor: 5, parts: 500 }
      },
      dent: {
        minor: { labor: 1, parts: 0 }, // PDR (Paintless Dent Repair)
        moderate: { labor: 3, parts: 100 },
        severe: { labor: 6, parts: 300 },
        critical: { labor: 10, parts: 800 }
      },
      crack: {
        minor: { labor: 2, parts: 200 },
        moderate: { labor: 4, parts: 400 },
        severe: { labor: 6, parts: 800 },
        critical: { labor: 8, parts: 1500 }
      },
      broken: {
        minor: { labor: 2, parts: 300 },
        moderate: { labor: 4, parts: 600 },
        severe: { labor: 6, parts: 1200 },
        critical: { labor: 10, parts: 2500 }
      },
      rust: {
        minor: { labor: 2, parts: 100 },
        moderate: { labor: 5, parts: 300 },
        severe: { labor: 10, parts: 800 },
        critical: { labor: 20, parts: 2000 }
      },
      paint_chip: {
        minor: { labor: 0.5, parts: 30 },
        moderate: { labor: 1, parts: 80 },
        severe: { labor: 2, parts: 200 },
        critical: { labor: 4, parts: 500 }
      },
      collision: {
        minor: { labor: 8, parts: 1000 },
        moderate: { labor: 15, parts: 2500 },
        severe: { labor: 30, parts: 5000 },
        critical: { labor: 60, parts: 12000 }
      },
      hail: {
        minor: { labor: 1, parts: 0 }, // PDR
        moderate: { labor: 3, parts: 200 },
        severe: { labor: 8, parts: 800 },
        critical: { labor: 15, parts: 2000 }
      },
      vandalism: {
        minor: { labor: 2, parts: 200 },
        moderate: { labor: 5, parts: 500 },
        severe: { labor: 10, parts: 1500 },
        critical: { labor: 20, parts: 3000 }
      },
      other: {
        minor: { labor: 2, parts: 100 },
        moderate: { labor: 4, parts: 300 },
        severe: { labor: 8, parts: 800 },
        critical: { labor: 15, parts: 2000 }
      }
    };

    // Part multipliers (some parts are more expensive)
    const partMultipliers: Record<string, number> = {
      windshield: 2.0,
      rear_window: 1.8,
      hood: 1.5,
      trunk: 1.5,
      roof: 2.5,
      driver_door: 1.3,
      passenger_door: 1.3,
      front_bumper: 1.2,
      rear_bumper: 1.2,
      headlight: 1.5,
      taillight: 1.3
    };

    const breakdown = damageData.damages.map((damage) => {
      const rule = costRules[damage.type]?.[damage.severity] || costRules.other[damage.severity];
      const partMultiplier = partMultipliers[damage.part] || 1.0;

      const laborCost = rule.labor * laborRatePerHour;
      const partsCost = rule.parts * partMultiplier;

      return {
        damageType: damage.type,
        partName: damage.part,
        severity: damage.severity,
        laborCost,
        partsCost,
        estimatedHours: rule.labor
      };
    });

    const totalEstimate = breakdown.reduce((sum, item) => sum + item.laborCost + item.partsCost, 0);

    // Determine urgency based on severity
    const hasCritical = damageData.damages.some((d) => d.severity === 'critical');
    const hasSevere = damageData.damages.some((d) => d.severity === 'severe');
    const urgency = hasCritical ? 'immediate' : hasSevere ? 'high' : damageData.damages.length > 3 ? 'medium' : 'low';

    logger.info('Cost estimation completed', {
      totalEstimate,
      itemCount: breakdown.length,
      urgency
    });

    return {
      totalEstimate: Math.round(totalEstimate * 100) / 100, // Round to 2 decimal places
      currency: 'USD',
      breakdown,
      urgency
    };
  }
}
