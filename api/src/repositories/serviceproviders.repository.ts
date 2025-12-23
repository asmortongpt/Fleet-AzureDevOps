export class ServiceProvidersRepository {
  async getProviders(): Promise<any[]> { return []; }
  async getProvider(id: string): Promise<any> { return null; }
  async createProvider(provider: any): Promise<any> { return {}; }
  async updateProvider(id: string, provider: any): Promise<any> { return {}; }
  async deleteProvider(id: string): Promise<void> { }
}
export default new ServiceProvidersRepository();