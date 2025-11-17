/**
 * EV Charging Service
 *
 * High-level service for managing EV charging operations including:
 * - Smart charging schedules and optimization
 * - Charger reservation system
 * - Carbon footprint tracking
 * - Battery health monitoring
 * - ESG reporting
 * - Cost optimization with time-of-use rates
 */

import { Pool } from 'pg';
import OCPPService from './ocpp.service';

interface SmartChargingParams {
  vehicleId: number;
  targetSoC: number;
  completionTime: Date;
  preferOffPeak?: boolean;
  preferRenewable?: boolean;
  maxChargeRate?: number;
}

interface ChargingReservation {
  stationId: number;
  connectorId?: number;
  vehicleId: number;
  driverId: number;
  startTime: Date;
  endTime: Date;
}

interface CarbonCalculation {
  kwhConsumed: number;
  milesDriven: number;
  gridCarbonIntensity?: number; // g CO2/kWh (default: 385 g/kWh US average)
  iceVehicleMpg?: number; // Comparison ICE vehicle (default: 25 mpg)
}

interface BatteryHealthReport {
  vehicleId: number;
  stateOfHealth: number;
  capacityDegradation: number;
  recommendedActions: string[];
  estimatedRemainingYears: number;
}

class EVChargingService {
  private db: Pool;
  private ocppService: OCPPService;

  // Carbon constants
  private readonly US_GRID_CARBON_INTENSITY = 385; // g CO2/kWh (EPA 2023)
  private readonly GASOLINE_CARBON = 8887; // g CO2/gallon
  private readonly AVG_ICE_MPG = 25; // Average ICE vehicle fuel economy

  constructor(db: Pool, ocppService: OCPPService) {
    this.db = db;
    this.ocppService = ocppService;
  }

  /**
   * Get available charging stations
   */
  async getAvailableStations(latitude?: number, longitude?: number, radius?: number): Promise<any[]> {
    let query = `
      SELECT
        cs.id,
        cs.station_id,
        cs.name,
        cs.location_name,
        cs.latitude,
        cs.longitude,
        cs.address,
        cs.power_type,
        cs.max_power_kw,
        cs.status,
        cs.is_online,
        cs.num_connectors,
        cs.public_access,
        cs.price_per_kwh_off_peak,
        cs.price_per_kwh_on_peak,
        COUNT(cc.id) FILTER (WHERE cc.status = 'Available') as available_connectors
      FROM charging_stations cs
      LEFT JOIN charging_connectors cc ON cs.id = cc.station_id AND cc.is_enabled = true
      WHERE cs.is_enabled = true
    `;

    const params: any[] = [];

    // Add proximity filter if location provided
    if (latitude && longitude && radius) {
      query += ` AND ST_DWithin(
        ST_MakePoint(cs.longitude, cs.latitude)::geography,
        ST_MakePoint($1, $2)::geography,
        $3
      )`;
      params.push(longitude, latitude, radius * 1609.34); // Convert miles to meters
    }

    query += ' GROUP BY cs.id ORDER BY cs.name';

    const result = await this.db.query(query, params);
    return result.rows;
  }

  /**
   * Get charger status with real-time data
   */
  async getChargerStatus(stationId: number): Promise<any> {
    const stationResult = await this.db.query(
      `SELECT
        cs.*,
        json_agg(
          json_build_object(
            'id', cc.id,
            'connector_id', cc.connector_id,
            'connector_type', cc.connector_type,
            'power_type', cc.power_type,
            'max_power_kw', cc.max_power_kw,
            'status', cc.status,
            'current_vehicle_id', cc.current_vehicle_id,
            'current_transaction_id', cc.current_transaction_id
          )
        ) as connectors,
        (
          SELECT json_build_object(
            'transaction_id', chs.transaction_id,
            'vehicle_name', v.name,
            'start_time', chs.start_time,
            'energy_delivered_kwh', chs.energy_delivered_kwh,
            'start_soc_percent', chs.start_soc_percent,
            'end_soc_percent', chs.end_soc_percent
          )
          FROM charging_sessions chs
          JOIN vehicles v ON chs.vehicle_id = v.id
          WHERE chs.station_id = cs.id AND chs.session_status = 'Active'
          LIMIT 1
        ) as active_session
      FROM charging_stations cs
      LEFT JOIN charging_connectors cc ON cs.id = cc.station_id
      WHERE cs.id = $1
      GROUP BY cs.id`,
      [stationId]
    );

    return stationResult.rows[0];
  }

  /**
   * Create charging reservation
   */
  async createReservation(params: ChargingReservation): Promise<any> {
    const { stationId, connectorId, vehicleId, driverId, startTime, endTime } = params;

    // Check availability
    const conflicts = await this.db.query(
      `SELECT id FROM charging_reservations
       WHERE station_id = $1
       AND ($2 IS NULL OR connector_id = $2)
       AND status IN ('Active', 'InUse')
       AND (
         (reservation_start BETWEEN $3 AND $4)
         OR (reservation_end BETWEEN $3 AND $4)
         OR ($3 BETWEEN reservation_start AND reservation_end)
       )`,
      [stationId, connectorId, startTime, endTime]
    );

    if (conflicts.rows.length > 0) {
      throw new Error('Charger is already reserved for this time slot');
    }

    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);

    // Create reservation
    const result = await this.db.query(
      `INSERT INTO charging_reservations
       (station_id, connector_id, vehicle_id, driver_id, reservation_start, reservation_end, duration_minutes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active')
       RETURNING *`,
      [stationId, connectorId, vehicleId, driverId, startTime, endTime, durationMinutes]
    );

    const reservation = result.rows[0];

    // If using OCPP, create station reservation
    if (connectorId) {
      const stationInfo = await this.db.query(
        'SELECT station_id FROM charging_stations WHERE id = $1',
        [stationId]
      );

      if (stationInfo.rows.length > 0) {
        try {
          await this.ocppService.createReservation({
            stationId: stationInfo.rows[0].station_id,
            connectorId,
            expiryDate: endTime,
            idTag: `VEHICLE_${vehicleId}`,
            reservationId: reservation.id
          });

          await this.db.query(
            'UPDATE charging_reservations SET ocpp_reservation_id = $1 WHERE id = $2',
            [reservation.id, reservation.id]
          );
        } catch (error) {
          console.error('Failed to create OCPP reservation:', error);
          // Continue with local reservation even if OCPP fails
        }
      }
    }

    return reservation;
  }

  /**
   * Cancel reservation
   */
  async cancelReservation(reservationId: number): Promise<void> {
    const reservation = await this.db.query(
      'SELECT * FROM charging_reservations WHERE id = $1',
      [reservationId]
    );

    if (reservation.rows.length === 0) {
      throw new Error('Reservation not found');
    }

    const res = reservation.rows[0];

    // Cancel OCPP reservation if exists
    if (res.ocpp_reservation_id) {
      const stationInfo = await this.db.query(
        'SELECT station_id FROM charging_stations WHERE id = $1',
        [res.station_id]
      );

      if (stationInfo.rows.length > 0) {
        try {
          await this.ocppService.cancelReservation(
            stationInfo.rows[0].station_id,
            res.ocpp_reservation_id
          );
        } catch (error) {
          console.error('Failed to cancel OCPP reservation:', error);
        }
      }
    }

    // Update reservation status
    await this.db.query(
      'UPDATE charging_reservations SET status = $1 WHERE id = $2',
      ['Cancelled', reservationId]
    );
  }

  /**
   * Create smart charging schedule
   */
  async createChargingSchedule(params: SmartChargingParams): Promise<any> {
    const { vehicleId, targetSoC, completionTime, preferOffPeak, preferRenewable, maxChargeRate } = params;

    // Get vehicle EV specs
    const evSpec = await this.db.query(
      `SELECT * FROM ev_specifications WHERE vehicle_id = $1`,
      [vehicleId]
    );

    if (evSpec.rows.length === 0) {
      throw new Error('Vehicle EV specifications not found');
    }

    const spec = evSpec.rows[0];

    // TODO: Get real-time battery level from vehicle telemetry
    // Implementation options:
    // 1. Query latest telemetry: SELECT battery_level FROM telemetry WHERE vehicle_id = $1 ORDER BY timestamp DESC LIMIT 1
    // 2. Use Smartcar API: await smartcarService.getBatteryLevel(vehicleId)
    // 3. Use Samsara API: await samsar aService.getEVBattery(vehicleId)
    const currentSoC = 20; // Fallback - assumes 20% if telemetry unavailable
    const requiredKwh = (spec.usable_capacity_kwh || spec.battery_capacity_kwh) * ((targetSoC - currentSoC) / 100);

    // Calculate charging time needed
    const chargeRateKw = Math.min(
      maxChargeRate || spec.max_ac_charge_rate_kw || 11.5,
      spec.max_ac_charge_rate_kw || 11.5
    );
    const hoursNeeded = requiredKwh / chargeRateKw;

    // Determine optimal start time
    let startTime: Date;
    const now = new Date();
    const hoursUntilCompletion = (completionTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (preferOffPeak) {
      // Schedule during off-peak hours (10 PM - 6 AM)
      const offPeakStart = new Date(completionTime);
      offPeakStart.setHours(22, 0, 0, 0);

      if (offPeakStart > completionTime) {
        offPeakStart.setDate(offPeakStart.getDate() - 1);
      }

      // Start as late as possible while still completing in time
      startTime = new Date(completionTime.getTime() - (hoursNeeded * 60 * 60 * 1000));

      if (startTime < offPeakStart) {
        startTime = offPeakStart;
      }
    } else {
      // Start immediately or calculate based on completion time
      if (hoursUntilCompletion < hoursNeeded) {
        startTime = now; // Start immediately
      } else {
        startTime = new Date(completionTime.getTime() - (hoursNeeded * 60 * 60 * 1000));
      }
    }

    // Determine charging priority
    let priority = 'Balanced';
    if (hoursUntilCompletion < hoursNeeded * 1.2) {
      priority = 'Fast';
    } else if (preferRenewable) {
      priority = 'Solar';
    } else if (preferOffPeak) {
      priority = 'Economy';
    }

    // Create schedule
    const result = await this.db.query(
      `INSERT INTO charging_schedules
       (vehicle_id, schedule_name, schedule_type, specific_date, start_time, end_time,
        target_soc_percent, charging_priority, max_charge_rate_kw, prefer_off_peak,
        prefer_renewable, is_active)
       VALUES ($1, $2, 'OneTime', $3::date, $4::time, $5::time, $6, $7, $8, $9, $10, true)
       RETURNING *`,
      [
        vehicleId,
        `Auto Schedule ${completionTime.toLocaleDateString()}`,
        startTime,
        startTime,
        completionTime,
        targetSoC,
        priority,
        chargeRateKw,
        preferOffPeak || false,
        preferRenewable || false
      ]
    );

    return {
      schedule: result.rows[0],
      estimatedChargingTime: hoursNeeded,
      estimatedCost: this.estimateChargingCost(requiredKwh, preferOffPeak || false),
      startTime,
      completionTime
    };
  }

  /**
   * Calculate carbon footprint
   */
  async calculateCarbonFootprint(params: CarbonCalculation): Promise<any> {
    const { kwhConsumed, milesDriven, gridCarbonIntensity, iceVehicleMpg } = params;

    const carbonIntensity = gridCarbonIntensity || this.US_GRID_CARBON_INTENSITY;
    const iceMpg = iceVehicleMpg || this.AVG_ICE_MPG;

    // EV carbon emissions (kg CO2)
    const evCarbonKg = (kwhConsumed * carbonIntensity) / 1000;

    // Equivalent ICE vehicle emissions
    const gallonsUsed = milesDriven / iceMpg;
    const iceCarbonKg = (gallonsUsed * this.GASOLINE_CARBON) / 1000;

    // Savings
    const carbonSavedKg = iceCarbonKg - evCarbonKg;
    const carbonSavedPercent = (carbonSavedKg / iceCarbonKg) * 100;

    // Calculate efficiency
    const efficiencyKwhPerMile = milesDriven > 0 ? kwhConsumed / milesDriven : 0;

    return {
      kwhConsumed,
      milesDriven,
      efficiencyKwhPerMile,
      gridCarbonIntensity: carbonIntensity,
      carbonEmittedKg: evCarbonKg,
      iceEquivalentGallons: gallonsUsed,
      iceCarbonKg,
      carbonSavedKg,
      carbonSavedPercent,
      equivalentTreesSaved: Math.round(carbonSavedKg / 21.8) // Average tree absorbs 21.8 kg CO2/year
    };
  }

  /**
   * Log daily carbon footprint
   */
  async logCarbonFootprint(vehicleId: number, date: Date): Promise<void> {
    // Get charging data for the day
    const chargingResult = await this.db.query(
      `SELECT SUM(energy_delivered_kwh) as kwh_consumed
       FROM charging_sessions
       WHERE vehicle_id = $1
       AND DATE(start_time) = $2
       AND session_status = 'Completed'`,
      [vehicleId, date]
    );

    // Get miles driven for the day
    const milesResult = await this.db.query(
      `SELECT
         MAX(odometer_miles) - MIN(odometer_miles) as miles_driven
       FROM vehicle_telemetry
       WHERE vehicle_id = $1
       AND DATE(timestamp) = $2`,
      [vehicleId, date]
    );

    const kwhConsumed = chargingResult.rows[0]?.kwh_consumed || 0;
    const milesDriven = milesResult.rows[0]?.miles_driven || 0;

    if (kwhConsumed === 0 && milesDriven === 0) {
      return; // No activity
    }

    const carbon = await this.calculateCarbonFootprint({ kwhConsumed, milesDriven });

    // Insert or update carbon log
    await this.db.query(
      `INSERT INTO carbon_footprint_log
       (vehicle_id, log_date, kwh_consumed, miles_driven, efficiency_kwh_per_mile,
        grid_carbon_intensity_g_per_kwh, carbon_emitted_kg, ice_equivalent_gallons,
        ice_carbon_kg, carbon_saved_kg, carbon_saved_percent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (vehicle_id, log_date)
       DO UPDATE SET
         kwh_consumed = EXCLUDED.kwh_consumed,
         miles_driven = EXCLUDED.miles_driven,
         efficiency_kwh_per_mile = EXCLUDED.efficiency_kwh_per_mile,
         carbon_emitted_kg = EXCLUDED.carbon_emitted_kg,
         carbon_saved_kg = EXCLUDED.carbon_saved_kg`,
      [
        vehicleId,
        date,
        kwhConsumed,
        milesDriven,
        carbon.efficiencyKwhPerMile,
        carbon.gridCarbonIntensity,
        carbon.carbonEmittedKg,
        carbon.iceEquivalentGallons,
        carbon.iceCarbonKg,
        carbon.carbonSavedKg,
        carbon.carbonSavedPercent
      ]
    );
  }

  /**
   * Generate ESG report
   */
  async generateESGReport(period: 'monthly' | 'quarterly' | 'annual', year: number, month?: number): Promise<any> {
    let dateFilter = '';
    let quarter: number | null = null;

    if (period === 'monthly' && month) {
      dateFilter = `AND EXTRACT(YEAR FROM log_date) = ${year} AND EXTRACT(MONTH FROM log_date) = ${month}`;
    } else if (period === 'quarterly' && month) {
      quarter = Math.ceil(month / 3);
      dateFilter = `AND EXTRACT(YEAR FROM log_date) = ${year} AND EXTRACT(QUARTER FROM log_date) = ${quarter}`;
    } else if (period === 'annual') {
      dateFilter = `AND EXTRACT(YEAR FROM log_date) = ${year}`;
    }

    // Aggregate carbon data
    const carbonResult = await this.db.query(
      `SELECT
         COUNT(DISTINCT vehicle_id) as ev_count,
         SUM(kwh_consumed) as total_kwh,
         SUM(miles_driven) as total_miles,
         AVG(efficiency_kwh_per_mile) as avg_efficiency,
         SUM(carbon_emitted_kg) as total_carbon_emitted,
         SUM(carbon_saved_kg) as total_carbon_saved,
         AVG(carbon_saved_percent) as avg_carbon_reduction,
         SUM(renewable_energy_kwh) as total_renewable_kwh,
         AVG(renewable_percent) as avg_renewable_percent
       FROM carbon_footprint_log
       WHERE 1=1 ${dateFilter}`
    );

    const carbon = carbonResult.rows[0];

    // Get charging session count
    const sessionResult = await this.db.query(
      `SELECT COUNT(*) as session_count
       FROM charging_sessions
       WHERE session_status = 'Completed' ${dateFilter.replace('log_date', 'DATE(start_time)')}`
    );

    // Get total fleet count
    const fleetResult = await this.db.query(
      `SELECT COUNT(*) as total_count FROM vehicles WHERE status = 'active'`
    );

    const totalFleet = fleetResult.rows[0].total_count;
    const evAdoptionPercent = (carbon.ev_count / totalFleet) * 100;

    // Calculate environmental score (0-100)
    const environmentalScore = Math.min(
      100,
      (carbon.avg_carbon_reduction || 0) * 0.6 +
      (carbon.avg_renewable_percent || 0) * 0.3 +
      evAdoptionPercent * 0.1
    );

    // Determine sustainability rating
    let sustainabilityRating = 'C';
    if (environmentalScore >= 90) sustainabilityRating = 'A+';
    else if (environmentalScore >= 80) sustainabilityRating = 'A';
    else if (environmentalScore >= 70) sustainabilityRating = 'B+';
    else if (environmentalScore >= 60) sustainabilityRating = 'B';
    else if (environmentalScore >= 50) sustainabilityRating = 'C+';

    const reportData = {
      report_period: period,
      report_year: year,
      report_month: month,
      report_quarter: quarter,
      total_ev_count: carbon.ev_count,
      total_fleet_count: totalFleet,
      ev_adoption_percent: evAdoptionPercent,
      total_kwh_consumed: carbon.total_kwh,
      total_miles_driven: carbon.total_miles,
      avg_efficiency_kwh_per_mile: carbon.avg_efficiency,
      total_charging_sessions: sessionResult.rows[0].session_count,
      total_carbon_emitted_kg: carbon.total_carbon_emitted,
      total_carbon_saved_kg: carbon.total_carbon_saved,
      carbon_reduction_percent: carbon.avg_carbon_reduction,
      total_renewable_kwh: carbon.total_renewable_kwh,
      renewable_percent: carbon.avg_renewable_percent,
      environmental_score: environmentalScore,
      sustainability_rating: sustainabilityRating,
      meets_esg_targets: environmentalScore >= 70
    };

    // Save report
    const result = await this.db.query(
      `INSERT INTO esg_reports
       (report_period, report_year, report_month, report_quarter, total_ev_count, total_fleet_count,
        ev_adoption_percent, total_kwh_consumed, total_miles_driven, avg_efficiency_kwh_per_mile,
        total_charging_sessions, total_carbon_emitted_kg, total_carbon_saved_kg, carbon_reduction_percent,
        total_renewable_kwh, renewable_percent, environmental_score, sustainability_rating, meets_esg_targets)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       ON CONFLICT (report_period, report_year, report_month, report_quarter)
       DO UPDATE SET
         total_ev_count = EXCLUDED.total_ev_count,
         total_fleet_count = EXCLUDED.total_fleet_count,
         ev_adoption_percent = EXCLUDED.ev_adoption_percent,
         total_kwh_consumed = EXCLUDED.total_kwh_consumed,
         total_miles_driven = EXCLUDED.total_miles_driven,
         avg_efficiency_kwh_per_mile = EXCLUDED.avg_efficiency_kwh_per_mile,
         total_charging_sessions = EXCLUDED.total_charging_sessions,
         total_carbon_emitted_kg = EXCLUDED.total_carbon_emitted_kg,
         total_carbon_saved_kg = EXCLUDED.total_carbon_saved_kg,
         carbon_reduction_percent = EXCLUDED.carbon_reduction_percent,
         total_renewable_kwh = EXCLUDED.total_renewable_kwh,
         renewable_percent = EXCLUDED.renewable_percent,
         environmental_score = EXCLUDED.environmental_score,
         sustainability_rating = EXCLUDED.sustainability_rating,
         meets_esg_targets = EXCLUDED.meets_esg_targets,
         generated_at = NOW()
       RETURNING *`,
      Object.values(reportData)
    );

    return result.rows[0];
  }

  /**
   * Monitor battery health
   */
  async monitorBatteryHealth(vehicleId: number): Promise<BatteryHealthReport> {
    // Get EV specs
    const specResult = await this.db.query(
      'SELECT * FROM ev_specifications WHERE vehicle_id = $1',
      [vehicleId]
    );

    if (specResult.rows.length === 0) {
      throw new Error('EV specifications not found');
    }

    const spec = specResult.rows[0];

    // Get latest battery health log
    const healthResult = await this.db.query(
      `SELECT * FROM battery_health_logs
       WHERE vehicle_id = $1
       ORDER BY timestamp DESC
       LIMIT 1`,
      [vehicleId]
    );

    const stateOfHealth = healthResult.rows[0]?.state_of_health_percent || spec.current_battery_health_percent || 100;
    const capacityDegradation = 100 - stateOfHealth;

    // Calculate recommendations
    const recommendations: string[] = [];

    if (stateOfHealth < 80) {
      recommendations.push('Battery health below 80% - consider warranty inspection');
    }

    if (spec.fast_charge_cycles > 1000) {
      recommendations.push('High fast charging usage detected - consider more Level 2 charging to extend battery life');
    }

    if (capacityDegradation > 2 * (spec.degradation_rate_percent_per_year || 2)) {
      recommendations.push('Accelerated degradation detected - review charging patterns and temperature exposure');
    }

    // Estimate remaining useful life
    const degradationRatePerYear = spec.degradation_rate_percent_per_year || 2;
    const yearsToEndOfLife = (stateOfHealth - 70) / degradationRatePerYear; // 70% is typical end-of-life

    return {
      vehicleId,
      stateOfHealth,
      capacityDegradation,
      recommendedActions: recommendations,
      estimatedRemainingYears: Math.max(0, Math.round(yearsToEndOfLife * 10) / 10)
    };
  }

  /**
   * Estimate charging cost
   */
  private estimateChargingCost(kwhRequired: number, offPeak: boolean): number {
    const ratePerKwh = offPeak ? 0.15 : 0.30; // $/kWh
    return kwhRequired * ratePerKwh;
  }

  /**
   * Get fleet carbon summary
   */
  async getFleetCarbonSummary(startDate: Date, endDate: Date): Promise<any> {
    const result = await this.db.query(
      `SELECT
         COUNT(DISTINCT vehicle_id) as vehicle_count,
         SUM(kwh_consumed) as total_kwh,
         SUM(miles_driven) as total_miles,
         SUM(carbon_emitted_kg) as total_carbon_kg,
         SUM(carbon_saved_kg) as total_saved_kg,
         AVG(carbon_saved_percent) as avg_reduction_percent,
         SUM(ice_equivalent_gallons) as gasoline_avoided_gallons
       FROM carbon_footprint_log
       WHERE log_date BETWEEN $1 AND $2`,
      [startDate, endDate]
    );

    return result.rows[0];
  }
}

export default EVChargingService;
