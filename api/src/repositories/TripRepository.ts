import { BaseRepository } from '../services/dal/BaseRepository'
import { connectionManager } from '../config/connection-manager'

export interface Trip {
  id: string
  tenant_id: string
  vehicle_id?: string
  driver_id?: string
  distance_miles?: number
  start_time?: Date
  end_time?: Date
  start_location?: string
  end_location?: string
  created_at?: Date
  updated_at?: Date
}

export class TripRepository extends BaseRepository<Trip> {
  constructor() {
    super('trips', connectionManager.getWritePool())
  }

  async findByTenantId(tenantId: string): Promise<Trip[]> {
    return this.findAll({
      where: { tenant_id: tenantId },
      orderBy: 'created_at DESC'
    })
  }

  async findByIdAndTenant(id: string, tenantId: string): Promise<Trip | null> {
    return this.findById(id, tenantId)
  }

  /**
   * Find trip with vehicle details for marking operations
   */
  async findTripWithVehicle(tripId: string, tenantId: string): Promise<any | null> {
    const query = `
      SELECT t.*, v.id as vehicle_id
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.id = $1 AND t.tenant_id = $2
    `
    const result = await this.query<any>(query, [tripId, tenantId])
    return result.rows[0] || null
  }

  async createTrip(tenantId: string, data: Partial<Trip>): Promise<Trip> {
    return this.create({
      ...data,
      tenant_id: tenantId
    })
  }

  async updateTrip(id: string, tenantId: string, data: Partial<Trip>): Promise<Trip> {
    return this.update(id, data, tenantId)
  }

  async deleteTrip(id: string, tenantId: string): Promise<boolean> {
    return this.delete(id, tenantId)
  }
}
