import { Pool } from 'pg';

import { BaseRepository } from '../../../repositories/base/BaseRepository';

export class TelemetryRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'telemetry');
  }

  // TODO: Implement telemetry repository methods
}
