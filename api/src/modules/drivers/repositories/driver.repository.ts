import { injectable } from "inversify";
import { BaseRepository } from "../../../repositories/base.repository";

@injectable()
export class DriverRepository extends BaseRepository<any> {
  constructor() {
    super("fleet_drivers");
  }
}
