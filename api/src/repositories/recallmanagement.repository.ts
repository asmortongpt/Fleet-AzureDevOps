export class RecallManagementRepository {
  async getRecalls(): Promise<any[]> { return []; }
  async getRecall(id: string): Promise<any> { return null; }
  async createRecall(recall: any): Promise<any> { return {}; }
  async updateRecall(id: string, recall: any): Promise<any> { return {}; }
  async deleteRecall(id: string): Promise<void> { }
}
export default new RecallManagementRepository();
