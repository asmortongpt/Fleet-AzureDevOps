export class PreferencesRepository {
  async getPreferences(userId: string): Promise<any> { return {}; }
  async updatePreferences(userId: string, prefs: any): Promise<void> { }
  async deletePreferences(userId: string): Promise<void> { }
}
export default new PreferencesRepository();
