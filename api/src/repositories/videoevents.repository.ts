export class VideoEventsRepository {
  async getEvents(): Promise<any[]> { return []; }
  async getEvent(id: string): Promise<any> { return null; }
  async createEvent(event: any): Promise<any> { return {}; }
  async updateEvent(id: string, event: any): Promise<any> { return {}; }
  async deleteEvent(id: string): Promise<void> { }
  async getVideoEvents(filters: any): Promise<any[]> { return []; }
}
export default new VideoEventsRepository();