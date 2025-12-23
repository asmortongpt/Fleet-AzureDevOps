export class MapboxService {
  async getDirections(start: [number, number], end: [number, number]): Promise<any> { return {}; }
  async getMatrix(coordinates: [number, number][]): Promise<any> { return {}; }
  async geocode(address: string): Promise<any> { return {}; }
  async reverseGeocode(longitude: number, latitude: number): Promise<any> { return {}; }
  async getOptimizedRoute(coordinates: [number, number][]): Promise<any> { return {}; }
}
export default new MapboxService();
