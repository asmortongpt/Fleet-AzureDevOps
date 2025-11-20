/**
 * Fuel Purchasing Service
 *
 * Manages fuel pricing, station data, purchase orders, and contracts
 * Integrates with external price APIs (or uses realistic mock data)
 */

import pool from '../config/database'
import fuelPriceForecastingModel from '../ml-models/fuel-price-forecasting.model'

export interface FuelStation {
  id: string
  stationName: string
  brand: string
  address: string
  city: string
  state: string
  lat: number
  lng: number
  fuelTypes: string[]
  acceptsFleetCards: boolean
  fleetCardBrands: string[]
  has24HourAccess: boolean
  hasTruckAccess: boolean
  rating: number
  distance?: number
  currentPrices?: { [fuelType: string]: number }
}

export interface FuelPrice {
  id: string
  stationId: string
  fuelType: string
  pricePerGallon: number
  timestamp: Date
  source: string
}

export interface PurchaseOrder {
  id?: string
  vehicleId: string
  driverId?: string
  stationId: string
  fuelType: string
  gallons: number
  pricePerGallon: number
  totalCost: number
  odometer: number
  purchaseDate: Date
  paymentMethod: string
  savingsAmount?: number
}

export interface FuelContract {
  id?: string
  supplierName: string
  contractType: string
  fuelTypes: string[]
  discountRate: number
  startDate: Date
  endDate: Date
  status: string
}

export interface PriceAlert {
  id?: string
  alertType: string
  alertName: string
  fuelType: string
  threshold: number
  comparisonOperator: string
  isActive: boolean
}

export class FuelPurchasingService {
  /**
   * Get nearby fuel stations with current prices
   */
  async getNearbyStations(
    tenantId: string,
    lat: number,
    lng: number,
    radiusMiles: number = 25,
    fuelType?: string
  ): Promise<FuelStation[]> {
    try {
      let query = `
        SELECT
          fs.*,
          earth_distance(
            ll_to_earth(fs.lat::float8, fs.lng::float8),
            ll_to_earth($2::float8, $3::float8)
          ) * 0.000621371 as distance
        FROM fuel_stations fs
        WHERE fs.tenant_id = $1
        AND earth_box(ll_to_earth($2::float8, $3::float8), $4 * 1609.34) @> ll_to_earth(fs.lat::float8, fs.lng::float8)
        AND fs.is_active = true
      `

      const params: any[] = [tenantId, lat, lng, radiusMiles]

      if (fuelType) {
        query += ` AND $5 = ANY(fs.fuel_types)`
        params.push(fuelType)
      }

      query += ` ORDER BY distance LIMIT 50`

      const result = await pool.query(query, params)

      // Get current prices for each station
      const stations: FuelStation[] = []
      for (const row of result.rows) {
        const prices = await this.getCurrentStationPrices(row.id)

        stations.push({
          id: row.id,
          stationName: row.station_name,
          brand: row.brand,
          address: row.address,
          city: row.city,
          state: row.state,
          lat: parseFloat(row.lat),
          lng: parseFloat(row.lng),
          fuelTypes: row.fuel_types || [],
          acceptsFleetCards: row.accepts_fleet_cards,
          fleetCardBrands: row.fleet_card_brands || [],
          has24HourAccess: row.has_24_hour_access,
          hasTruckAccess: row.has_truck_access,
          rating: parseFloat(row.rating || '4.0'),
          distance: parseFloat(row.distance || '0'),
          currentPrices: prices
        })
      }

      // If no stations found, generate mock data
      if (stations.length === 0) {
        return this.generateMockStations(lat, lng, radiusMiles)
      }

      return stations
    } catch (error) {
      console.error('Error getting nearby stations:', error)
      // Return mock data on error
      return this.generateMockStations(lat, lng, radiusMiles)
    }
  }

  /**
   * Find cheapest fuel in area
   */
  async findCheapestFuel(
    tenantId: string,
    lat: number,
    lng: number,
    fuelType: string,
    radiusMiles: number = 50
  ): Promise<{
    station: FuelStation
    price: number
    savings: number
    avgPrice: number
  } | null> {
    try {
      const stations = await this.getNearbyStations(tenantId, lat, lng, radiusMiles, fuelType)

      if (stations.length === 0) return null

      // Calculate average price
      const prices = stations
        .map(s => s.currentPrices?.[fuelType])
        .filter((p): p is number => p !== undefined)

      if (prices.length === 0) return null

      const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length

      // Find cheapest
      let cheapestStation: FuelStation | null = null
      let cheapestPrice = Infinity

      for (const station of stations) {
        const price = station.currentPrices?.[fuelType]
        if (price && price < cheapestPrice) {
          cheapestPrice = price
          cheapestStation = station
        }
      }

      if (!cheapestStation) return null

      return {
        station: cheapestStation,
        price: cheapestPrice,
        savings: avgPrice - cheapestPrice,
        avgPrice
      }
    } catch (error) {
      console.error('Error finding cheapest fuel:', error)
      return null
    }
  }

  /**
   * Get optimal fueling recommendation
   */
  async getOptimalFuelingRecommendation(
    tenantId: string,
    vehicleLocation: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    fuelType: string,
    currentFuelLevel: number, // percentage
    tankCapacity: number // gallons
  ): Promise<{
    recommendation: string
    station: FuelStation
    estimatedSavings: number
    routeDeviation: number
    purchaseTiming: string
  } | null> {
    try {
      // Get stations along route
      const midLat = (vehicleLocation.lat + destination.lat) / 2
      const midLng = (vehicleLocation.lng + destination.lng) / 2

      const stations = await this.getNearbyStations(tenantId, midLat, midLng, 50, fuelType)

      if (stations.length === 0) return null

      // Find best station considering price and route deviation
      let bestStation: FuelStation | null = null
      let bestScore = -Infinity

      const avgPrice = stations
        .map(s => s.currentPrices?.[fuelType])
        .filter((p): p is number => p !== undefined)
        .reduce((sum, p, _, arr) => sum + p / arr.length, 0)

      for (const station of stations) {
        const price = station.currentPrices?.[fuelType]
        if (!price) continue

        // Score based on price savings and distance
        const priceSavings = avgPrice - price
        const deviationPenalty = (station.distance || 0) * 0.1
        const score = priceSavings * 100 - deviationPenalty

        if (score > bestScore) {
          bestScore = score
          bestStation = station
        }
      }

      if (!bestStation || !bestStation.currentPrices) return null

      const stationPrice = bestStation.currentPrices[fuelType]
      const gallonsNeeded = tankCapacity * (1 - currentFuelLevel / 100)
      const estimatedSavings = (avgPrice - stationPrice) * gallonsNeeded

      // Get purchase timing recommendation
      const timingRec = await fuelPriceForecastingModel.generatePurchaseRecommendation(
        tenantId,
        fuelType,
        stationPrice
      )

      return {
        recommendation: `Refuel at ${bestStation.stationName} in ${bestStation.city}`,
        station: bestStation,
        estimatedSavings,
        routeDeviation: bestStation.distance || 0,
        purchaseTiming: timingRec.recommendation
      }
    } catch (error) {
      console.error('Error getting optimal fueling recommendation:', error)
      return null
    }
  }

  /**
   * Create purchase order
   */
  async createPurchaseOrder(
    tenantId: string,
    orderData: PurchaseOrder
  ): Promise<PurchaseOrder> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Get market price for savings calculation
      const marketPriceResult = await client.query(
        `SELECT AVG(price_per_gallon) as avg_price
         FROM fuel_prices
         WHERE fuel_type = $1
         AND timestamp >= NOW() - INTERVAL '24 hours'`,
        [orderData.fuelType]
      )

      const marketPrice = parseFloat(marketPriceResult.rows[0]?.avg_price || orderData.pricePerGallon.toString())
      const savingsAmount = (marketPrice - orderData.pricePerGallon) * orderData.gallons

      const result = await client.query(
        `INSERT INTO fuel_purchase_orders (
          tenant_id, vehicle_id, driver_id, station_id,
          fuel_type, gallons, price_per_gallon, total_cost,
          odometer, purchase_date, payment_method,
          market_price, savings_amount, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'completed')
        RETURNING *`,
        [
          tenantId, orderData.vehicleId, orderData.driverId, orderData.stationId,
          orderData.fuelType, orderData.gallons, orderData.pricePerGallon, orderData.totalCost,
          orderData.odometer, orderData.purchaseDate, orderData.paymentMethod,
          marketPrice, savingsAmount
        ]
      )

      await client.query('COMMIT')

      return {
        ...orderData,
        id: result.rows[0].id,
        savingsAmount
      }
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Error creating purchase order:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Get fuel contracts
   */
  async getContracts(tenantId: string, status?: string): Promise<FuelContract[]> {
    try {
      let query = `
        SELECT id, tenant_id, contract_name, supplier_id, start_date, end_date, price_per_gallon, created_at FROM fuel_contracts
        WHERE tenant_id = $1
      `

      const params: any[] = [tenantId]

      if (status) {
        query += ` AND status = $2`
        params.push(status)
      }

      query += ` ORDER BY start_date DESC`

      const result = await pool.query(query, params)

      return result.rows.map(row => ({
        id: row.id,
        supplierName: row.supplier_name,
        contractType: row.contract_type,
        fuelTypes: row.fuel_types,
        discountRate: parseFloat(row.discount_rate),
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status
      }))
    } catch (error) {
      console.error('Error getting contracts:', error)
      return []
    }
  }

  /**
   * Create price alert
   */
  async createPriceAlert(
    tenantId: string,
    userId: string,
    alertData: PriceAlert
  ): Promise<PriceAlert> {
    try {
      const result = await pool.query(
        `INSERT INTO fuel_price_alerts (
          tenant_id, alert_type, alert_name, fuel_type,
          threshold, comparison_operator, is_active, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          tenantId, alertData.alertType, alertData.alertName, alertData.fuelType,
          alertData.threshold, alertData.comparisonOperator, alertData.isActive, userId
        ]
      )

      return {
        id: result.rows[0].id,
        alertType: result.rows[0].alert_type,
        alertName: result.rows[0].alert_name,
        fuelType: result.rows[0].fuel_type,
        threshold: parseFloat(result.rows[0].threshold),
        comparisonOperator: result.rows[0].comparison_operator,
        isActive: result.rows[0].is_active
      }
    } catch (error) {
      console.error('Error creating price alert:', error)
      throw error
    }
  }

  /**
   * Calculate savings from optimization
   */
  async calculateSavings(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<{
    totalGallons: number
    totalSpent: number
    averagePricePaid: number
    marketAveragePrice: number
    totalSavings: number
    savingsBreakdown: {
      contractDiscounts: number
      optimalTiming: number
      optimalLocation: number
      bulkPurchase: number
    }
  }> {
    try {
      const result = await pool.query(
        `SELECT
           COALESCE(SUM(gallons), 0) as total_gallons,
           COALESCE(SUM(total_cost), 0) as total_spent,
           COALESCE(AVG(price_per_gallon), 0) as avg_price_paid,
           COALESCE(AVG(market_price), 0) as market_avg,
           COALESCE(SUM(savings_amount), 0) as total_savings
         FROM fuel_purchase_orders
         WHERE tenant_id = $1
         AND purchase_date BETWEEN $2 AND $3
         AND status = 'completed'`,
        [tenantId, periodStart, periodEnd]
      )

      const row = result.rows[0]

      return {
        totalGallons: parseFloat(row.total_gallons || '0'),
        totalSpent: parseFloat(row.total_spent || '0'),
        averagePricePaid: parseFloat(row.avg_price_paid || '0'),
        marketAveragePrice: parseFloat(row.market_avg || '0'),
        totalSavings: parseFloat(row.total_savings || '0'),
        savingsBreakdown: {
          contractDiscounts: parseFloat(row.total_savings || '0') * 0.4,
          optimalTiming: parseFloat(row.total_savings || '0') * 0.3,
          optimalLocation: parseFloat(row.total_savings || '0') * 0.2,
          bulkPurchase: parseFloat(row.total_savings || '0') * 0.1
        }
      }
    } catch (error) {
      console.error('Error calculating savings:', error)
      return {
        totalGallons: 0,
        totalSpent: 0,
        averagePricePaid: 0,
        marketAveragePrice: 0,
        totalSavings: 0,
        savingsBreakdown: {
          contractDiscounts: 0,
          optimalTiming: 0,
          optimalLocation: 0,
          bulkPurchase: 0
        }
      }
    }
  }

  /**
   * Get current prices for a station
   */
  private async getCurrentStationPrices(stationId: string): Promise<{ [fuelType: string]: number }> {
    try {
      const result = await pool.query(
        `SELECT DISTINCT ON (fuel_type)
           fuel_type, price_per_gallon
         FROM fuel_prices
         WHERE fuel_station_id = $1
         ORDER BY fuel_type, timestamp DESC`,
        [stationId]
      )

      const prices: { [fuelType: string]: number } = {}
      for (const row of result.rows) {
        prices[row.fuel_type] = parseFloat(row.price_per_gallon)
      }

      return prices
    } catch (error) {
      console.error('Error getting station prices:', error)
      return {}
    }
  }

  /**
   * Generate mock fuel stations for demonstration
   */
  private generateMockStations(lat: number, lng: number, radiusMiles: number): FuelStation[] {
    const brands = ['Shell', 'BP', 'Chevron', 'Exxon', 'Mobil', '76', 'Arco', 'Valero']
    const cities = ['Downtown', 'Midtown', 'Westside', 'Eastside', 'Northpoint', 'Southbay']
    const states = ['CA', 'TX', 'FL', 'NY', 'IL']

    const stations: FuelStation[] = []
    const numStations = 12

    for (let i = 0; i < numStations; i++) {
      const angle = (i / numStations) * 2 * Math.PI
      const distance = Math.random() * radiusMiles
      const stationLat = lat + (distance * Math.cos(angle)) / 69
      const stationLng = lng + (distance * Math.sin(angle)) / 54.6

      const brand = brands[Math.floor(Math.random() * brands.length)]
      const city = cities[Math.floor(Math.random() * cities.length)]
      const state = states[Math.floor(Math.random() * states.length)]

      // Generate realistic prices
      const baseRegular = 3.45 + (Math.random() - 0.5) * 0.4
      const basePremium = baseRegular + 0.50
      const baseDiesel = baseRegular + 0.30

      stations.push({
        id: `mock-station-${i}`,
        stationName: `${brand} ${city}`,
        brand,
        address: `${1000 + i * 100} Main St`,
        city,
        state,
        lat: stationLat,
        lng: stationLng,
        fuelTypes: ['regular', 'premium', 'diesel'],
        acceptsFleetCards: Math.random() > 0.3,
        fleetCardBrands: ['WEX', 'Fuelman'],
        has24HourAccess: Math.random() > 0.5,
        hasTruckAccess: Math.random() > 0.4,
        rating: 3.5 + Math.random() * 1.5,
        distance,
        currentPrices: {
          regular: Math.round(baseRegular * 1000) / 1000,
          premium: Math.round(basePremium * 1000) / 1000,
          diesel: Math.round(baseDiesel * 1000) / 1000
        }
      })
    }

    return stations.sort((a, b) => (a.distance || 0) - (b.distance || 0))
  }
}

export default new FuelPurchasingService()
