import { Database } from '../services/database';

export interface Vehicle {
  id: number;
  vehicle_number: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  license_plate: string;
  status: string;
  mileage: number;
  fuel_type: string;
  last_service_date?: Date;
  next_service_date?: Date;
  assigned_driver_id?: number;
  facility_id?: number;
  tenant_id?: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

export interface VehicleWithRelations extends Vehicle {
  driver_name?: string;
  facility_name?: string;
}

export class VehiclesRepository {
  constructor(private db: Database) {}

  async findAll(): Promise<VehicleWithRelations[]> {
    return await this.db.query<VehicleWithRelations>(
      `SELECT
        v.id, v.vehicle_number, v.make, v.model, v.year,
        v.vin, v.license_plate, v.status, v.mileage,
        v.fuel_type, v.last_service_date, v.next_service_date,
        v.assigned_driver_id, v.facility_id,
        d.name as driver_name,
        f.name as facility_name
      FROM vehicles v
      LEFT JOIN drivers d ON v.assigned_driver_id = d.id
      LEFT JOIN facilities f ON v.facility_id = f.id
      ORDER BY v.vehicle_number`
    );
  }

  async count(): Promise<number> {
    const result = await this.db.query<{ count: string }>('SELECT COUNT(*) as count FROM vehicles');
    return parseInt(result[0]?.count || '0');
  }

  async findById(id: string): Promise<VehicleWithRelations | null> {
    const result = await this.db.query<VehicleWithRelations>(
      `SELECT
        v.*,
        d.name as driver_name,
        f.name as facility_name
      FROM vehicles v
      LEFT JOIN drivers d ON v.assigned_driver_id = d.id
      LEFT JOIN facilities f ON v.facility_id = f.id
      WHERE v.id = $1`,
      [id]
    );
    return result.length > 0 ? result[0] : null;
  }

  async findByVin(vin: string): Promise<Vehicle | null> {
    const result = await this.db.query<Vehicle>(
      'SELECT * FROM vehicles WHERE vin = $1',
      [vin]
    );
    return result.length > 0 ? result[0] : null;
  }

  async create(vehicle: Partial<Vehicle>): Promise<Vehicle> {
    const {
      vehicle_number,
      make,
      model,
      year,
      vin,
      license_plate,
      status,
      mileage,
      fuel_type,
      assigned_driver_id,
      facility_id
    } = vehicle;

    const result = await this.db.query<Vehicle>(
      `INSERT INTO vehicles (
        vehicle_number, make, model, year, vin, license_plate,
        status, mileage, fuel_type, assigned_driver_id, facility_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        vehicle_number,
        make,
        model,
        year,
        vin,
        license_plate,
        status || 'active',
        mileage || 0,
        fuel_type,
        assigned_driver_id,
        facility_id
      ]
    );
    return result[0];
  }

  async update(id: string, updates: Partial<Vehicle>): Promise<Vehicle | null> {
    const fields = Object.keys(updates);
    const values = Object.values(updates);

    if (fields.length === 0) {
      return null;
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    const result = await this.db.query<Vehicle>(
      `UPDATE vehicles
       SET ${setClause}, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, ...values]
    );

    return result.length > 0 ? result[0] : null;
  }

  async delete(id: string): Promise<void> {
    await this.db.query('DELETE FROM vehicles WHERE id = $1', [id]);
  }
}
