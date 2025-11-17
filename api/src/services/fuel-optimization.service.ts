/**
 * Fuel Optimization Service
 *
 * Advanced optimization algorithms for fuel purchasing decisions
 * Includes bulk vs retail analysis, fleet card optimization, and hedging recommendations
 */

import pool from '../config/database'
import fuelPurchasingService from './fuel-purchasing.service'
import fuelPriceForecastingModel from '../ml-models/fuel-price-forecasting.model'

export interface OptimalRefuelingLocation {
  vehicleId: string
  currentLocation: { lat: number; lng: number }
  recommendedStation: any
  estimatedSavings: number
  routeDeviation: number
  fuelType: string
}

export interface BulkVsRetailAnalysis {
  scenario: 'bulk' | 'retail'
  costPerGallon: number
  monthlyVolume: number
  monthlyCost: number
  setupCost?: number
  annualSavings: number
  breakEvenMonths: number
  recommendation: string
}

export interface FleetCardOptimization {
  cardProvider: string
  discountRate: number
  annualFee: number
  estimatedSavings: number
  acceptanceRate: number
  recommendation: string
}

export interface HedgingRecommendation {
  strategy: 'fixed_price' | 'volume_discount' | 'futures' | 'wait'
  confidence: number
  reasoning: string
  potentialSavings: number
  riskLevel: 'low' | 'medium' | 'high'
  implementationSteps: string[]
}

export class FuelOptimizationService {
  /**
   * Calculate optimal refueling locations for fleet
   */
  async calculateOptimalRefuelingLocations(
    tenantId: string,
    vehicleIds?: string[]
  ): Promise<OptimalRefuelingLocation[]> {
    try {
      // Get vehicles with current location and fuel level
      let query = `
        SELECT
          v.id as vehicle_id,
          v.vehicle_number,
          v.fuel_type,
          v.fuel_tank_capacity,
          vl.lat,
          vl.lng,
          vl.fuel_level
        FROM vehicles v
        LEFT JOIN LATERAL (
          SELECT lat, lng, fuel_level
          FROM telemetry
          WHERE vehicle_id = v.id
          ORDER BY timestamp DESC
          LIMIT 1
        ) vl ON true
        WHERE v.tenant_id = $1
        AND v.status = 'active'
      `

      const params: any[] = [tenantId]

      if (vehicleIds && vehicleIds.length > 0) {
        query += ` AND v.id = ANY($2)`
        params.push(vehicleIds)
      }

      const result = await pool.query(query, params)

      const recommendations: OptimalRefuelingLocation[] = []

      for (const vehicle of result.rows) {
        if (!vehicle.lat || !vehicle.lng) continue

        // Get optimal fueling recommendation
        const recommendation = await fuelPurchasingService.getOptimalFuelingRecommendation(
          tenantId,
          { lat: vehicle.lat, lng: vehicle.lng },
          { lat: vehicle.lat + 0.5, lng: vehicle.lng + 0.5 }, // Mock destination
          vehicle.fuel_type || 'regular',
          vehicle.fuel_level || 50,
          vehicle.fuel_tank_capacity || 20
        )

        if (recommendation) {
          recommendations.push({
            vehicleId: vehicle.vehicle_id,
            currentLocation: { lat: vehicle.lat, lng: vehicle.lng },
            recommendedStation: recommendation.station,
            estimatedSavings: recommendation.estimatedSavings,
            routeDeviation: recommendation.routeDeviation,
            fuelType: vehicle.fuel_type || 'regular'
          })
        }
      }

      return recommendations
    } catch (error) {
      console.error('Error calculating optimal refueling locations:', error)
      return []
    }
  }

  /**
   * Analyze bulk purchasing vs retail
   */
  async analyzeBulkVsRetail(
    tenantId: string,
    monthlyGallons: number
  ): Promise<{
    bulkOption: BulkVsRetailAnalysis
    retailOption: BulkVsRetailAnalysis
    recommendation: 'bulk' | 'retail'
  }> {
    try {
      // Get current retail prices
      const retailPriceResult = await pool.query(
        `SELECT AVG(price_per_gallon) as avg_price
         FROM fuel_purchase_orders
         WHERE tenant_id = $1
         AND purchase_date >= CURRENT_DATE - INTERVAL '30 days'`,
        [tenantId]
      )

      const retailPrice = parseFloat(retailPriceResult.rows[0]?.avg_price || '3.50')

      // Bulk pricing typically 10-15% lower but requires infrastructure
      const bulkPrice = retailPrice * 0.88 // 12% discount
      const bulkSetupCost = 50000 // Storage tank and infrastructure
      const bulkMonthlyCost = monthlyGallons * bulkPrice
      const retailMonthlyCost = monthlyGallons * retailPrice

      const monthlyBulkSavings = retailMonthlyCost - bulkMonthlyCost
      const annualBulkSavings = monthlyBulkSavings * 12
      const breakEvenMonths = Math.ceil(bulkSetupCost / monthlyBulkSavings)

      const bulkOption: BulkVsRetailAnalysis = {
        scenario: 'bulk',
        costPerGallon: bulkPrice,
        monthlyVolume: monthlyGallons,
        monthlyCost: bulkMonthlyCost,
        setupCost: bulkSetupCost,
        annualSavings: annualBulkSavings,
        breakEvenMonths,
        recommendation: breakEvenMonths <= 24
          ? `Bulk purchasing recommended. Break-even in ${breakEvenMonths} months.`
          : `Bulk purchasing not recommended. Break-even period too long (${breakEvenMonths} months).`
      }

      const retailOption: BulkVsRetailAnalysis = {
        scenario: 'retail',
        costPerGallon: retailPrice,
        monthlyVolume: monthlyGallons,
        monthlyCost: retailMonthlyCost,
        annualSavings: 0,
        breakEvenMonths: 0,
        recommendation: 'Continue with retail purchases. No infrastructure investment required.'
      }

      return {
        bulkOption,
        retailOption,
        recommendation: breakEvenMonths <= 24 ? 'bulk' : 'retail'
      }
    } catch (error) {
      console.error('Error analyzing bulk vs retail:', error)
      throw error
    }
  }

  /**
   * Optimize fleet card usage
   */
  async optimizeFleetCardUsage(
    tenantId: string,
    annualGallons: number
  ): Promise<FleetCardOptimization[]> {
    try {
      const fleetCards = [
        {
          cardProvider: 'WEX',
          discountRate: 0.05, // 5 cents per gallon
          annualFee: 25,
          acceptanceRate: 95
        },
        {
          cardProvider: 'Fuelman',
          discountRate: 0.04,
          annualFee: 20,
          acceptanceRate: 90
        },
        {
          cardProvider: 'FleetCor',
          discountRate: 0.06,
          annualFee: 30,
          acceptanceRate: 85
        },
        {
          cardProvider: 'EFS',
          discountRate: 0.045,
          annualFee: 22,
          acceptanceRate: 88
        }
      ]

      // Get number of vehicles
      const vehicleResult = await pool.query(
        `SELECT COUNT(*) as count FROM vehicles WHERE tenant_id = $1 AND status = 'active'`,
        [tenantId]
      )

      const vehicleCount = parseInt(vehicleResult.rows[0]?.count || '10')

      const optimizations: FleetCardOptimization[] = fleetCards.map(card => {
        const annualSavings = (annualGallons * card.discountRate) - (card.annualFee * vehicleCount)
        const savingsPerVehicle = annualSavings / vehicleCount

        let recommendation = ''
        if (savingsPerVehicle > 500) {
          recommendation = `Highly recommended. Estimated savings of $${savingsPerVehicle.toFixed(0)} per vehicle annually.`
        } else if (savingsPerVehicle > 200) {
          recommendation = `Recommended. Good savings potential of $${savingsPerVehicle.toFixed(0)} per vehicle.`
        } else if (savingsPerVehicle > 0) {
          recommendation = `Consider. Modest savings of $${savingsPerVehicle.toFixed(0)} per vehicle.`
        } else {
          recommendation = `Not recommended. Annual fees exceed savings.`
        }

        return {
          cardProvider: card.cardProvider,
          discountRate: card.discountRate,
          annualFee: card.annualFee,
          estimatedSavings: annualSavings,
          acceptanceRate: card.acceptanceRate,
          recommendation
        }
      })

      return optimizations.sort((a, b) => b.estimatedSavings - a.estimatedSavings)
    } catch (error) {
      console.error('Error optimizing fleet card usage:', error)
      return []
    }
  }

  /**
   * Analyze cross-border fuel arbitrage opportunities
   */
  async analyzeCrossBorderArbitrage(
    tenantId: string,
    currentState: string
  ): Promise<{
    nearbyStates: Array<{
      state: string
      avgPriceDiff: number
      distanceFromBorder: number
      worthwhile: boolean
    }>
    recommendation: string
  }> {
    try {
      // Mock cross-border analysis
      // In production, this would query actual price data by state
      const stateData: { [key: string]: { neighbors: string[]; avgPrice: number } } = {
        CA: { neighbors: ['NV', 'AZ', 'OR'], avgPrice: 4.25 },
        TX: { neighbors: ['NM', 'OK', 'LA', 'AR'], avgPrice: 3.15 },
        NY: { neighbors: ['NJ', 'CT', 'PA', 'VT', 'MA'], avgPrice: 3.85 },
        FL: { neighbors: ['GA', 'AL'], avgPrice: 3.45 }
      }

      const currentStateData = stateData[currentState] || { neighbors: [], avgPrice: 3.50 }
      const currentPrice = currentStateData.avgPrice

      const neighborPrices: { [key: string]: number } = {
        NV: 3.75, AZ: 3.65, OR: 3.95,
        NM: 3.25, OK: 3.10, LA: 3.20, AR: 3.15,
        NJ: 3.70, CT: 3.80, PA: 3.75, VT: 3.90, MA: 3.85,
        GA: 3.35, AL: 3.30
      }

      const nearbyStates = currentStateData.neighbors.map(state => {
        const neighborPrice = neighborPrices[state] || currentPrice
        const priceDiff = currentPrice - neighborPrice
        const distanceFromBorder = 50 + Math.random() * 50 // Mock distance

        // Worthwhile if savings > $0.20/gal and within 75 miles
        const worthwhile = priceDiff > 0.20 && distanceFromBorder < 75

        return {
          state,
          avgPriceDiff: Math.round(priceDiff * 100) / 100,
          distanceFromBorder: Math.round(distanceFromBorder),
          worthwhile
        }
      })

      const worthwhileStates = nearbyStates.filter(s => s.worthwhile)

      const recommendation = worthwhileStates.length > 0
        ? `Consider cross-border refueling in ${worthwhileStates.map(s => s.state).join(', ')}. Potential savings of $${worthwhileStates[0].avgPriceDiff}/gallon.`
        : 'Current state offers competitive pricing. Cross-border refueling not recommended.'

      return {
        nearbyStates: nearbyStates.sort((a, b) => b.avgPriceDiff - a.avgPriceDiff),
        recommendation
      }
    } catch (error) {
      console.error('Error analyzing cross-border arbitrage:', error)
      return {
        nearbyStates: [],
        recommendation: 'Unable to analyze cross-border opportunities'
      }
    }
  }

  /**
   * Generate hedging recommendations for large fleets
   */
  async generateHedgingRecommendations(
    tenantId: string,
    annualGallons: number,
    fuelType: string
  ): Promise<HedgingRecommendation[]> {
    try {
      // Get price forecast
      const forecasts = await fuelPriceForecastingModel.forecastPrices(
        tenantId,
        fuelType,
        'national',
        180 // 6 months
      )

      if (forecasts.length === 0) {
        return []
      }

      const currentPrice = 3.45 // Mock current price
      const avgForecastPrice = forecasts.reduce((sum, f) => sum + f.predictedPrice, 0) / forecasts.length
      const priceVolatility = this.calculateForecastVolatility(forecasts)

      const recommendations: HedgingRecommendation[] = []

      // Fixed price contract recommendation
      if (avgForecastPrice > currentPrice * 1.05) {
        recommendations.push({
          strategy: 'fixed_price',
          confidence: 80,
          reasoning: `Forecasts indicate ${((avgForecastPrice - currentPrice) / currentPrice * 100).toFixed(1)}% price increase over next 6 months. Lock in current prices with fixed-price contract.`,
          potentialSavings: (avgForecastPrice - currentPrice) * annualGallons / 2,
          riskLevel: 'low',
          implementationSteps: [
            'Request fixed-price quotes from 3+ suppliers',
            'Negotiate contract terms for 6-12 months',
            'Include force majeure and early termination clauses',
            'Monitor market prices monthly'
          ]
        })
      }

      // Volume discount recommendation
      if (annualGallons > 50000) {
        recommendations.push({
          strategy: 'volume_discount',
          confidence: 75,
          reasoning: `Annual consumption of ${annualGallons.toLocaleString()} gallons qualifies for volume discounts. Negotiate tiered pricing.`,
          potentialSavings: annualGallons * 0.08, // 8 cents per gallon
          riskLevel: 'low',
          implementationSteps: [
            'Consolidate purchases with 1-2 primary suppliers',
            'Negotiate volume-based pricing tiers',
            'Commit to minimum monthly volumes',
            'Track usage to meet volume thresholds'
          ]
        })
      }

      // Futures hedging for very large fleets
      if (annualGallons > 500000 && priceVolatility > 0.05) {
        recommendations.push({
          strategy: 'futures',
          confidence: 60,
          reasoning: `High volume and price volatility make futures hedging viable. Hedge 30-50% of projected consumption.`,
          potentialSavings: annualGallons * 0.10 * 0.4, // Hedge 40% of volume, potential 10 cent savings
          riskLevel: 'medium',
          implementationSteps: [
            'Consult with energy broker or financial advisor',
            'Start with 30% hedging ratio',
            'Use NYMEX RBOB or heating oil futures',
            'Monitor basis risk and roll costs',
            'Review hedging effectiveness quarterly'
          ]
        })
      }

      // Wait recommendation if prices expected to fall
      if (avgForecastPrice < currentPrice * 0.97) {
        recommendations.push({
          strategy: 'wait',
          confidence: 70,
          reasoning: `Forecasts indicate ${((currentPrice - avgForecastPrice) / currentPrice * 100).toFixed(1)}% price decrease. Delay major purchases or contract commitments.`,
          potentialSavings: (currentPrice - avgForecastPrice) * annualGallons / 2,
          riskLevel: 'medium',
          implementationSteps: [
            'Maintain 30-60 day spot purchasing',
            'Avoid long-term fixed-price contracts',
            'Monitor forecasts weekly',
            'Prepare to lock in prices when bottom is reached'
          ]
        })
      }

      return recommendations.sort((a, b) => b.potentialSavings - a.potentialSavings)
    } catch (error) {
      console.error('Error generating hedging recommendations:', error)
      return []
    }
  }

  /**
   * Calculate forecast volatility
   */
  private calculateForecastVolatility(forecasts: any[]): number {
    if (forecasts.length < 2) return 0

    const prices = forecasts.map(f => f.predictedPrice)
    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length
    const stdDev = Math.sqrt(variance)

    return stdDev / mean // Coefficient of variation
  }

  /**
   * Generate comprehensive optimization report
   */
  async generateOptimizationReport(
    tenantId: string
  ): Promise<{
    refuelingOptimization: OptimalRefuelingLocation[]
    bulkAnalysis: { bulkOption: BulkVsRetailAnalysis; retailOption: BulkVsRetailAnalysis; recommendation: string }
    fleetCardOptimization: FleetCardOptimization[]
    hedgingRecommendations: HedgingRecommendation[]
    totalPotentialSavings: number
  }> {
    try {
      // Calculate monthly gallons from purchase history
      const purchaseResult = await pool.query(
        `SELECT AVG(monthly_gallons) as avg_monthly
         FROM (
           SELECT
             DATE_TRUNC('month', purchase_date) as month,
             SUM(gallons) as monthly_gallons
           FROM fuel_purchase_orders
           WHERE tenant_id = $1
           AND purchase_date >= CURRENT_DATE - INTERVAL '6 months'
           GROUP BY DATE_TRUNC('month', purchase_date)
         ) monthly_data`,
        [tenantId]
      )

      const monthlyGallons = parseFloat(purchaseResult.rows[0]?.avg_monthly || '5000')
      const annualGallons = monthlyGallons * 12

      const [
        refuelingOptimization,
        bulkAnalysis,
        fleetCardOptimization,
        hedgingRecommendations
      ] = await Promise.all([
        this.calculateOptimalRefuelingLocations(tenantId),
        this.analyzeBulkVsRetail(tenantId, monthlyGallons),
        this.optimizeFleetCardUsage(tenantId, annualGallons),
        this.generateHedgingRecommendations(tenantId, annualGallons, 'regular')
      ])

      const totalPotentialSavings =
        refuelingOptimization.reduce((sum, r) => sum + r.estimatedSavings, 0) +
        (bulkAnalysis.recommendation === 'bulk' ? bulkAnalysis.bulkOption.annualSavings : 0) +
        (fleetCardOptimization[0]?.estimatedSavings || 0) +
        (hedgingRecommendations[0]?.potentialSavings || 0)

      return {
        refuelingOptimization,
        bulkAnalysis,
        fleetCardOptimization,
        hedgingRecommendations,
        totalPotentialSavings
      }
    } catch (error) {
      console.error('Error generating optimization report:', error)
      throw error
    }
  }
}

export default new FuelOptimizationService()
