/**
 * FuelReceiptGenerator - Generates realistic fuel transaction data from mobile app submissions
 *
 * Simulates driver fueling events with:
 * - Receipt photos with OCR-readable data
 * - GPS coordinates from actual gas stations
 * - Realistic pricing by region and fuel type
 * - Fleet card transactions
 * - Odometer readings
 */

import { EventEmitter } from 'events'
import { PhotoGenerator, GeneratedPhoto } from './PhotoGenerator'

export interface FuelStation {
  id: string
  vendor: string // Shell, BP, Chevron, etc.
  location: {
    lat: number
    lng: number
    address: string
    city: string
    state: string
    zip: string
  }
  fuel_types: string[] // 'regular', 'midgrade', 'premium', 'diesel'
  amenities: string[] // 'restrooms', 'convenience_store', 'car_wash'
}

export interface FuelTransaction {
  vehicle_id: string
  driver_id: string
  station_id: string
  vendor: string
  transaction_date: Date
  fuel_type: string
  gallons: number
  cost_per_gallon: number
  total_cost: number
  odometer: number
  tank_capacity: number
  previous_odometer?: number
  mpg_calculated?: number
  payment_method: 'fleet_card' | 'credit_card' | 'cash'
  fleet_card_number?: string
  transaction_id: string
  location: {
    lat: number
    lng: number
    address: string
  }
  receipt_photos: GeneratedPhoto[]
  market_price: number
  discount_applied: number
  savings_amount: number
  submitted_by_mobile: boolean
  device_info: {
    platform: string
    os_version: string
    app_version: string
    network_type: string
  }
}

export class FuelReceiptGenerator extends EventEmitter {
  private photoGenerator: PhotoGenerator
  private fuelStations: FuelStation[] = []
  private regionalPricing: Map<string, { regular: number; premium: number; diesel: number }> = new Map()

  constructor() {
    super()
    this.photoGenerator = new PhotoGenerator()
    this.initializeFuelStations()
    this.initializeRegionalPricing()
  }

  /**
   * Initialize fuel stations across Florida
   */
  private initializeFuelStations(): void {
    // Tallahassee area stations
    this.fuelStations.push(
      {
        id: 'shell-tallahassee-01',
        vendor: 'Shell',
        location: {
          lat: 30.4383,
          lng: -84.2807,
          address: '1234 Apalachee Parkway',
          city: 'Tallahassee',
          state: 'FL',
          zip: '32301'
        },
        fuel_types: ['regular', 'midgrade', 'premium', 'diesel'],
        amenities: ['restrooms', 'convenience_store', 'car_wash']
      },
      {
        id: 'bp-tallahassee-01',
        vendor: 'BP',
        location: {
          lat: 30.4518,
          lng: -84.2524,
          address: '2890 Capital Circle NE',
          city: 'Tallahassee',
          state: 'FL',
          zip: '32308'
        },
        fuel_types: ['regular', 'premium', 'diesel'],
        amenities: ['restrooms', 'convenience_store']
      },
      {
        id: 'chevron-tallahassee-01',
        vendor: 'Chevron',
        location: {
          lat: 30.4215,
          lng: -84.3366,
          address: '5678 West Tennessee Street',
          city: 'Tallahassee',
          state: 'FL',
          zip: '32304'
        },
        fuel_types: ['regular', 'midgrade', 'premium', 'diesel'],
        amenities: ['restrooms', 'convenience_store', 'air_pump']
      },
      {
        id: 'speedway-tallahassee-01',
        vendor: 'Speedway',
        location: {
          lat: 30.4598,
          lng: -84.2336,
          address: '3456 Mahan Drive',
          city: 'Tallahassee',
          state: 'FL',
          zip: '32308'
        },
        fuel_types: ['regular', 'premium', 'diesel'],
        amenities: ['restrooms', 'convenience_store']
      },
      {
        id: 'exxon-tallahassee-01',
        vendor: 'Exxon',
        location: {
          lat: 30.4691,
          lng: -84.2988,
          address: '7890 Thomasville Road',
          city: 'Tallahassee',
          state: 'FL',
          zip: '32312'
        },
        fuel_types: ['regular', 'midgrade', 'premium', 'diesel'],
        amenities: ['restrooms', 'convenience_store', 'car_wash', 'air_pump']
      }
    )

    console.log(`Initialized ${this.fuelStations.length} fuel stations`)
  }

  /**
   * Initialize regional pricing ($/gallon)
   */
  private initializeRegionalPricing(): void {
    this.regionalPricing.set('FL-North', {
      regular: 3.15,
      premium: 3.65,
      diesel: 3.45
    })
    this.regionalPricing.set('FL-Central', {
      regular: 3.18,
      premium: 3.68,
      diesel: 3.48
    })
    this.regionalPricing.set('FL-South', {
      regular: 3.22,
      premium: 3.72,
      diesel: 3.52
    })
  }

  /**
   * Generate a realistic fuel transaction from mobile app
   */
  public generateFuelTransaction(
    vehicleId: string,
    driverId: string,
    currentOdometer: number,
    tankCapacity: number,
    fuelType: string = 'diesel',
    previousOdometer?: number
  ): FuelTransaction {
    // Select random station
    const station = this.fuelStations[Math.floor(Math.random() * this.fuelStations.length)]

    // Get pricing for region
    const pricing = this.regionalPricing.get('FL-North')!

    // Price variation ±$0.10
    const priceVariation = (Math.random() - 0.5) * 0.20
    let costPerGallon: number

    switch (fuelType.toLowerCase()) {
      case 'premium':
        costPerGallon = pricing.premium + priceVariation
        break
      case 'diesel':
        costPerGallon = pricing.diesel + priceVariation
        break
      default:
        costPerGallon = pricing.regular + priceVariation
    }

    // Gallons (typically 15-80% of tank capacity)
    const fillPercentage = Math.random() * 0.65 + 0.15 // 15-80%
    const gallons = tankCapacity * fillPercentage

    // Calculate costs
    const totalCost = gallons * costPerGallon
    const marketPrice = costPerGallon + 0.05 // Fleet discount of $0.05/gal
    const discountApplied = 0.05
    const savingsAmount = gallons * discountApplied

    // Transaction timestamp (realistic: 6am-10pm)
    const now = new Date()
    const transactionDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      Math.floor(Math.random() * 16) + 6, // 6am-10pm
      Math.floor(Math.random() * 60)
    )

    // Payment method (90% fleet card, 10% credit card)
    const paymentMethod: 'fleet_card' | 'credit_card' | 'cash' =
      Math.random() < 0.9 ? 'fleet_card' : 'credit_card'

    // Fleet card number (simulated)
    const fleetCardNumber = paymentMethod === 'fleet_card'
      ? `**** **** **** ${Math.floor(Math.random() * 9000) + 1000}`
      : undefined

    // Generate receipt photo
    const receiptPhoto = this.photoGenerator.generateFuelReceipt(
      station.vendor,
      gallons,
      costPerGallon,
      totalCost,
      {
        lat: station.location.lat,
        lng: station.location.lng
      },
      transactionDate
    )

    // Calculate MPG if previous odometer available
    let mpgCalculated: number | undefined
    if (previousOdometer) {
      const milesDriven = currentOdometer - previousOdometer
      mpgCalculated = milesDriven / gallons
    }

    // Device info
    const deviceInfo = {
      platform: Math.random() > 0.6 ? 'iOS' : 'Android',
      os_version: Math.random() > 0.6 ? '17.2' : '14',
      app_version: '2.5.1',
      network_type: Math.random() > 0.3 ? 'WiFi' : '4G'
    }

    return {
      vehicle_id: vehicleId,
      driver_id: driverId,
      station_id: station.id,
      vendor: station.vendor,
      transaction_date: transactionDate,
      fuel_type: fuelType,
      gallons: Math.round(gallons * 100) / 100,
      cost_per_gallon: Math.round(costPerGallon * 1000) / 1000,
      total_cost: Math.round(totalCost * 100) / 100,
      odometer: currentOdometer,
      tank_capacity: tankCapacity,
      previous_odometer: previousOdometer,
      mpg_calculated: mpgCalculated ? Math.round(mpgCalculated * 10) / 10 : undefined,
      payment_method: paymentMethod,
      fleet_card_number: fleetCardNumber,
      transaction_id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      location: {
        lat: station.location.lat,
        lng: station.location.lng,
        address: `${station.location.address}, ${station.location.city}, ${station.location.state} ${station.location.zip}`
      },
      receipt_photos: [receiptPhoto],
      market_price: Math.round(marketPrice * 1000) / 1000,
      discount_applied: discountApplied,
      savings_amount: Math.round(savingsAmount * 100) / 100,
      submitted_by_mobile: true,
      device_info: deviceInfo
    }
  }

  /**
   * Get all fuel stations
   */
  public getFuelStations(): FuelStation[] {
    return this.fuelStations
  }

  /**
   * Get stations near a location
   */
  public getNearbyStations(lat: number, lng: number, radiusMiles: number = 10): FuelStation[] {
    return this.fuelStations.filter(station => {
      const distance = this.calculateDistance(
        lat,
        lng,
        station.location.lat,
        station.location.lng
      )
      return distance <= radiusMiles
    })
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959 // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1)
    const dLng = this.toRadians(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}
