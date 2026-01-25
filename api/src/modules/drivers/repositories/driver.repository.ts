import { inject, injectable } from "inversify";
import { Pool } from "pg";

import { BaseRepository } from "../../../repositories/base/BaseRepository";
import { TYPES } from "../../../types";

@injectable()
export class DriverRepository extends BaseRepository<any> {
  constructor(@inject(TYPES.DatabasePool) pool: Pool) {
    super(pool, "fleet_drivers");
  }
}
