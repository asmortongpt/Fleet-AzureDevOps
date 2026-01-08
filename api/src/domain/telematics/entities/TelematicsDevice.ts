export class TelematicsDevice {
  constructor(
    public readonly id: string,
    public assetId: string,
    public providerId: string,
    public externalDeviceId: string,
    public deviceType: string,
    public status: 'active' | 'inactive' | 'maintenance',
    public lastSyncAt?: Date,
    public metadata?: Record<string, any>,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  isActive(): boolean {
    return this.status === 'active';
  }

  needsSync(intervalSeconds: number): boolean {
    if (!this.lastSyncAt) return true;
    const elapsed = (Date.now() - this.lastSyncAt.getTime()) / 1000;
    return elapsed >= intervalSeconds;
  }

  updateLastSync(): void {
    this.lastSyncAt = new Date();
    this.updatedAt = new Date();
  }
}
