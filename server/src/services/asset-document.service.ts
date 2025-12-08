import { Pool } from 'pg';

import { Logger } from '../utils/logger';
import { validateAssetDocumentInput } from '../utils/validation';

import { AuditLogService } from './audit-log.service';

interface AssetDocument {
  docType: 'WARRANTY' | 'INSURANCE' | 'INSPECTION' | 'DISPOSAL_CERT';
  fileUrl: string;
  fileName: string;
  issuer: string;
  expiresAt: Date;
}

class AssetDocumentService {
  private db: Pool;
  private logger: Logger;
  private auditLogService: AuditLogService;

  constructor(db: Pool, logger: Logger, auditLogService: AuditLogService) {
    this.db = db;
    this.logger = logger;
    this.auditLogService = auditLogService;
  }

  async add(tenantId: string, assetId: string, document: AssetDocument): Promise<void> {
    try {
      validateAssetDocumentInput(document);

      const client = await this.db.connect();
      try {
        await client.query('BEGIN');

        const queryText = `
          INSERT INTO asset_documents (tenant_id, asset_id, doc_type, file_url, file_name, issuer, expires_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `;
        const values = [tenantId, assetId, document.docType, document.fileUrl, document.fileName, document.issuer, document.expiresAt];
        const res = await client.query(queryText, values);

        await this.auditLogService.logAction(tenantId, 'ADD_DOCUMENT', `Document added with ID: ${res.rows[0].id}`, assetId);

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        this.logger.error('Error adding asset document', error);
        throw new Error('Could not add asset document');
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Validation or database error', error);
      throw error;
    }
  }

  async list(tenantId: string, assetId: string): Promise<any[]> {
    try {
      const queryText = `
        SELECT doc_type, file_url, file_name, issuer, expires_at,
          CASE WHEN expires_at < NOW() THEN 'EXPIRED' ELSE 'VALID' END AS expiration_status
        FROM asset_documents
        WHERE tenant_id = $1 AND asset_id = $2
      `;
      const values = [tenantId, assetId];
      const res = await this.db.query(queryText, values);

      return res.rows;
    } catch (error) {
      this.logger.error('Error listing asset documents', error);
      throw new Error('Could not retrieve asset documents');
    }
  }
}

export { AssetDocumentService, AssetDocument };