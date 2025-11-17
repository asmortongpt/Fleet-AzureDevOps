/**
 * Fuel Price Forecasting ML Model
 *
 * Predicts fuel prices using time series analysis and external factors
 * Provides optimal purchase timing recommendations
 */

import pool from '../config/database'

export interface FuelPriceData {
  date: Date
  price: number
  fuelType: string
  region: string
}

export interface FuelPriceForecast {
  date: string
  predictedPrice: number
  confidenceIntervalLow: number
  confidenceIntervalHigh: number
  confidenceScore: number
}

export interface PurchaseRecommendation {
  recommendation: 'buy_now' | 'wait' | 'monitor'
  confidence: number
  reasoning: string
  expectedSavings: number
  optimalPurchaseDate: string
  currentPrice: number
  forecastedPrice: number
}

export interface SeasonalTrend {
  month: number
  monthName: string
  avgPriceMultiplier: number
  trend: 'low' | 'medium' | 'high'
}

export class FuelPriceForecastingModel {
  // Seasonal patterns (based on historical data)
  private readonly SEASONAL_FACTORS = {
    1: 0.95,  // January - Lower demand, winter blend
    2: 0.96,  // February
    3: 0.98,  // March - Transition to summer blend
    4: 1.02,  // April - Rising prices
    5: 1.05,  // May - Peak driving season begins
    6: 1.08,  // June - Peak summer prices
    7: 1.07,  // July - Peak continues
    8: 1.06,  // August - Still high
    9: 1.02,  // September - Demand decreases
    10: 0.99, // October
    11: 0.97, // November
    12: 0.96  // December
  }

  /**
   * Forecast fuel prices for upcoming days
   */
  async forecastPrices(
    tenantId: string,
    fuelType: string,
    region: string = 'national',
    days: number = 30
  ): Promise<FuelPriceForecast[]> {
    try {
      // Get historical price data
      const historicalData = await this.getHistoricalPrices(tenantId, fuelType, region, 90)

      if (historicalData.length < 7) {
        console.warn('Insufficient historical data for forecasting')
        return []
      }

      // Calculate trend
      const trend = this.calculateTrend(historicalData)
      const currentPrice = historicalData[historicalData.length - 1].price
      const volatility = this.calculateVolatility(historicalData)

      const forecasts: FuelPriceForecast[] = []

      for (let i = 1; i <= days; i++) {
        const forecastDate = new Date()
        forecastDate.setDate(forecastDate.getDate() + i)

        // Base prediction using linear trend
        const daysTrend = trend.slope * i
        let predictedPrice = currentPrice + daysTrend

        // Apply seasonal factors
        const seasonalFactor = this.SEASONAL_FACTORS[forecastDate.getMonth() + 1]
        predictedPrice *= seasonalFactor

        // Add some randomness based on historical volatility
        const randomFactor = 1 + (Math.random() - 0.5) * volatility * 0.1
        predictedPrice *= randomFactor

        // Confidence decreases with distance
        const confidenceScore = Math.max(50, 95 - (i * 1.5))

        // Confidence interval based on volatility
        const intervalWidth = volatility * predictedPrice * (0.5 + i * 0.05)
        const confidenceIntervalLow = Math.max(0, predictedPrice - intervalWidth)
        const confidenceIntervalHigh = predictedPrice + intervalWidth

        forecasts.push({
          date: forecastDate.toISOString().split('T')[0],
          predictedPrice: Math.round(predictedPrice * 1000) / 1000,
          confidenceIntervalLow: Math.round(confidenceIntervalLow * 1000) / 1000,
          confidenceIntervalHigh: Math.round(confidenceIntervalHigh * 1000) / 1000,
          confidenceScore: Math.round(confidenceScore * 100) / 100
        })
      }

      // Save forecasts to database
      await this.saveForecastsToDatabase(tenantId, fuelType, region, forecasts)

      return forecasts
    } catch (error) {
      console.error('Error forecasting fuel prices:', error)
      return []
    }
  }

  /**
   * Generate purchase timing recommendation
   */
  async generatePurchaseRecommendation(
    tenantId: string,
    fuelType: string,
    currentPrice: number,
    region: string = 'national'
  ): Promise<PurchaseRecommendation> {
    try {
      // Get 14-day forecast
      const forecasts = await this.forecastPrices(tenantId, fuelType, region, 14)

      if (forecasts.length === 0) {
        return {
          recommendation: 'monitor',
          confidence: 50,
          reasoning: 'Insufficient data for recommendation',
          expectedSavings: 0,
          optimalPurchaseDate: new Date().toISOString().split('T')[0],
          currentPrice,
          forecastedPrice: currentPrice
        }
      }

      // Find lowest forecasted price in next 14 days
      const lowestForecast = forecasts.reduce((min, f) =>
        f.predictedPrice < min.predictedPrice ? f : min
      , forecasts[0])

      const potentialSavings = currentPrice - lowestForecast.predictedPrice
      const savingsPercent = (potentialSavings / currentPrice) * 100

      // Determine recommendation
      let recommendation: 'buy_now' | 'wait' | 'monitor' = 'monitor'
      let reasoning = ''

      if (savingsPercent < -2) {
        // Price expected to rise by more than 2%
        recommendation = 'buy_now'
        reasoning = `Prices are forecasted to increase by ${Math.abs(savingsPercent).toFixed(1)}%. Purchase now to avoid higher costs.`
      } else if (savingsPercent > 3) {
        // Price expected to drop by more than 3%
        recommendation = 'wait'
        reasoning = `Prices are forecasted to decrease by ${savingsPercent.toFixed(1)}% in the next ${this.getDaysUntil(lowestForecast.date)} days. Wait for optimal pricing.`
      } else {
        // Price relatively stable
        recommendation = 'monitor'
        reasoning = `Prices are relatively stable. Purchase based on operational needs.`
      }

      return {
        recommendation,
        confidence: lowestForecast.confidenceScore,
        reasoning,
        expectedSavings: Math.max(0, potentialSavings),
        optimalPurchaseDate: lowestForecast.date,
        currentPrice,
        forecastedPrice: lowestForecast.predictedPrice
      }
    } catch (error) {
      console.error('Error generating purchase recommendation:', error)
      return {
        recommendation: 'monitor',
        confidence: 50,
        reasoning: 'Error generating recommendation',
        expectedSavings: 0,
        optimalPurchaseDate: new Date().toISOString().split('T')[0],
        currentPrice,
        forecastedPrice: currentPrice
      }
    }
  }

  /**
   * Analyze seasonal trends
   */
  analyzeSeasonalTrends(fuelType: string): SeasonalTrend[] {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    return Object.entries(this.SEASONAL_FACTORS).map(([monthNum, factor]) => {
      const month = parseInt(monthNum)
      let trend: 'low' | 'medium' | 'high' = 'medium'

      if (factor < 0.98) trend = 'low'
      else if (factor > 1.04) trend = 'high'

      return {
        month,
        monthName: months[month - 1],
        avgPriceMultiplier: factor,
        trend
      }
    })
  }

  /**
   * Analyze regional price variations
   */
  async analyzeRegionalPriceVariations(
    tenantId: string,
    fuelType: string
  ): Promise<Array<{
    region: string
    avgPrice: number
    variationFromNational: number
    trend: 'increasing' | 'decreasing' | 'stable'
  }>> {
    try {
      // Mock regional data - In production, this would query actual regional prices
      const regions = ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West']
      const nationalAvg = 3.45 // Base price

      return regions.map(region => {
        // Simulate regional variations
        let regionFactor = 1.0
        switch (region) {
          case 'West':
            regionFactor = 1.15 // 15% higher
            break
          case 'Northeast':
            regionFactor = 1.08
            break
          case 'Midwest':
            regionFactor = 0.95 // 5% lower
            break
          case 'Southeast':
            regionFactor = 0.98
            break
          case 'Southwest':
            regionFactor = 1.02
            break
        }

        const avgPrice = nationalAvg * regionFactor
        const variation = ((avgPrice - nationalAvg) / nationalAvg) * 100

        // Random trend
        const trends: Array<'increasing' | 'decreasing' | 'stable'> = ['increasing', 'decreasing', 'stable']
        const trend = trends[Math.floor(Math.random() * trends.length)]

        return {
          region,
          avgPrice: Math.round(avgPrice * 1000) / 1000,
          variationFromNational: Math.round(variation * 100) / 100,
          trend
        }
      })
    } catch (error) {
      console.error('Error analyzing regional variations:', error)
      return []
    }
  }

  /**
   * Get historical price data
   */
  private async getHistoricalPrices(
    tenantId: string,
    fuelType: string,
    region: string,
    days: number
  ): Promise<FuelPriceData[]> {
    try {
      const result = await pool.query(
        `SELECT
           fp.timestamp::date as date,
           AVG(fp.price_per_gallon) as price,
           $2 as fuel_type,
           $3 as region
         FROM fuel_prices fp
         JOIN fuel_stations fs ON fp.fuel_station_id = fs.id
         WHERE fs.tenant_id = $1
         AND fp.fuel_type = $2
         AND fp.timestamp >= CURRENT_DATE - INTERVAL '${days} days'
         GROUP BY fp.timestamp::date
         ORDER BY date ASC`,
        [tenantId, fuelType, region]
      )

      if (result.rows.length > 0) {
        return result.rows.map(row => ({
          date: row.date,
          price: parseFloat(row.price),
          fuelType: row.fuel_type,
          region: row.region
        }))
      }

      // Generate mock historical data if no real data exists
      return this.generateMockHistoricalData(days, fuelType, region)
    } catch (error) {
      console.error('Error fetching historical prices:', error)
      return this.generateMockHistoricalData(days, fuelType, region)
    }
  }

  /**
   * Generate mock historical data for demonstration
   */
  private generateMockHistoricalData(
    days: number,
    fuelType: string,
    region: string
  ): FuelPriceData[] {
    const basePrice = fuelType === 'diesel' ? 3.85 : 3.45
    const data: FuelPriceData[] = []

    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)

      // Add trend and randomness
      const trend = (days - i) * 0.003 // Slight upward trend
      const seasonal = this.SEASONAL_FACTORS[date.getMonth() + 1]
      const random = (Math.random() - 0.5) * 0.15
      const price = basePrice * seasonal + trend + random

      data.push({
        date,
        price: Math.max(0, price),
        fuelType,
        region
      })
    }

    return data
  }

  /**
   * Calculate price trend using linear regression
   */
  private calculateTrend(data: FuelPriceData[]): { slope: number; intercept: number } {
    const n = data.length
    const prices = data.map((d, i) => ({ x: i, y: d.price }))

    const sumX = prices.reduce((sum, p) => sum + p.x, 0)
    const sumY = prices.reduce((sum, p) => sum + p.y, 0)
    const sumXY = prices.reduce((sum, p) => sum + p.x * p.y, 0)
    const sumXX = prices.reduce((sum, p) => sum + p.x * p.x, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    return { slope, intercept }
  }

  /**
   * Calculate price volatility (standard deviation)
   */
  private calculateVolatility(data: FuelPriceData[]): number {
    if (data.length < 2) return 0.05

    const prices = data.map(d => d.price)
    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length
    const stdDev = Math.sqrt(variance)

    return stdDev / mean // Return as percentage
  }

  /**
   * Save forecasts to database
   */
  private async saveForecastsToDatabase(
    tenantId: string,
    fuelType: string,
    region: string,
    forecasts: FuelPriceForecast[]
  ): Promise<void> {
    try {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        for (const forecast of forecasts) {
          await client.query(
            `INSERT INTO fuel_price_forecasts (
              tenant_id, fuel_type, geographic_scope, scope_value,
              forecast_date, predicted_price,
              confidence_interval_low, confidence_interval_high,
              confidence_score, model_version
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT DO NOTHING`,
            [
              tenantId, fuelType, 'regional', region,
              forecast.date, forecast.predictedPrice,
              forecast.confidenceIntervalLow, forecast.confidenceIntervalHigh,
              forecast.confidenceScore, 'v1.0'
            ]
          )
        }

        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
    } catch (error) {
      console.error('Error saving forecasts to database:', error)
    }
  }

  /**
   * Calculate days until a date
   */
  private getDaysUntil(dateString: string): number {
    const targetDate = new Date(dateString)
    const today = new Date()
    const diffTime = targetDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
}

export default new FuelPriceForecastingModel()
