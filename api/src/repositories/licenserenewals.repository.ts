import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';

export class LicenserenewalsRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'licenserenewalss');
  }

  constructor(pool: Pool) {
    super(pool, 'LLicense_LRenewals_LRepository extends s');
  }


  async createLicenseRenewal(tenantId: string, licenseRenewalData: any): Promise<LicenseRenewal> {
    const licenseRenewal = this.create({ ...licenseRenewalData, tenantId });
    await this.save(licenseRenewal);
    return licenseRenewal;
  }

  async getLicenseRenewals(tenantId: string): Promise<LicenseRenewal[]> {
    return this.find({ where: { tenantId } });
  }

  async getLicenseRenewalById(tenantId: string, id: string): Promise<LicenseRenewal> {
    return this.findOne({ where: { id, tenantId } });
  }

  async updateLicenseRenewal(tenantId: string, id: string, licenseRenewalData: any): Promise<LicenseRenewal> {
    await this.update({ id, tenantId }, licenseRenewalData);
    return this.getLicenseRenewalById(tenantId, id);
  }

  async deleteLicenseRenewal(tenantId: string, id: string): Promise<void> {
    await this.delete({ id, tenantId });
  }
}
