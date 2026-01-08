
import { connectionManager } from '../config/database';
import { randomUUID } from 'crypto';
import { ScanSession, CaptureType, ScanStatus, ScanAsset, QualityMetrics, EvidenceManifest } from '../types/scan-session';

export interface CreateScanSessionInput {
  vehicleId: string;
  captureType: CaptureType;
}

export interface UpdateScanSessionInput {
  status?: ScanStatus;
  rawAssets?: ScanAsset[];
  processedAssets?: ScanAsset[];
  quality?: QualityMetrics;
  evidence?: EvidenceManifest;
}

class ScanSessionRepository {
  async create(input: CreateScanSessionInput): Promise<ScanSession> {
    const pool = await connectionManager.getPool();
    const id = randomUUID();
    const now = new Date().toISOString();
    const result = await pool.query(
      `INSERT INTO scan_sessions (id, vehicle_id, capture_type, status, raw_assets, processed_assets, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [id, input.vehicleId, input.captureType, 'created', JSON.stringify([]), JSON.stringify([]), now, now]
    );
    return this.mapRow(result.rows[0]);
  }

  async getById(id: string): Promise<ScanSession | null> {
    const pool = await connectionManager.getPool();
    const result = await pool.query(`SELECT * FROM scan_sessions WHERE id=$1`, [id]);
    if (result.rows.length === 0) return null;
    return this.mapRow(result.rows[0]);
  }

  async listByVehicle(vehicleId: string): Promise<ScanSession[]> {
    const pool = await connectionManager.getPool();
    const result = await pool.query(`SELECT * FROM scan_sessions WHERE vehicle_id=$1 ORDER BY created_at DESC`, [vehicleId]);
    return result.rows.map(r=>this.mapRow(r));
  }

  async update(id: string, patch: UpdateScanSessionInput): Promise<ScanSession | null> {
    const pool = await connectionManager.getPool();
    const current = await this.getById(id);
    if (!current) return null;
    const merged = {
      ...current,
      ...patch,
      rawAssets: patch.rawAssets ?? current.rawAssets,
      processedAssets: patch.processedAssets ?? current.processedAssets,
      quality: patch.quality ?? current.quality,
      evidence: patch.evidence ?? current.evidence,
      updatedAt: new Date().toISOString()
    };
    const result = await pool.query(
      `UPDATE scan_sessions SET status=$2, raw_assets=$3, processed_assets=$4, quality=$5, evidence=$6, updated_at=$7 WHERE id=$1 RETURNING *`,
      [id, merged.status, JSON.stringify(merged.rawAssets), JSON.stringify(merged.processedAssets), JSON.stringify(merged.quality||{}), JSON.stringify(merged.evidence||{}), merged.updatedAt]
    );
    return this.mapRow(result.rows[0]);
  }

  private mapRow(row: any): ScanSession {
    return {
      id: row.id,
      vehicleId: row.vehicle_id,
      captureType: row.capture_type,
      status: row.status,
      rawAssets: row.raw_assets ?? [],
      processedAssets: row.processed_assets ?? [],
      quality: row.quality && Object.keys(row.quality).length? row.quality: undefined,
      evidence: row.evidence && Object.keys(row.evidence).length? row.evidence: undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export const scanSessionRepository = new ScanSessionRepository();
