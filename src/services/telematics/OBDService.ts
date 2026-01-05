// OBD-II Device Integration
// Direct vehicle diagnostics via Bluetooth/WiFi OBD-II adapters

interface OBDConfig {
  protocol: 'bluetooth' | 'wifi';
  deviceAddress?: string;
  port?: number;
}

interface OBDData {
  rpm: number;
  speed: number;
  engineLoad: number;
  coolantTemp: number;
  fuelLevel: number;
  odometer: number;
  dtcCodes: string[];
  voltage: number;
}

export class OBDService {
  private config: OBDConfig;
  private socket: WebSocket | null = null;

  constructor() {
    this.config = {
      protocol: 'wifi',
      deviceAddress: process.env.OBD_DEVICE_ADDRESS || '192.168.0.10',
      port: parseInt(process.env.OBD_PORT || '35000'),
    };
  }

  async connect(): Promise<boolean> {
    try {
      const wsUrl = `ws://${this.config.deviceAddress}:${this.config.port}`;
      this.socket = new WebSocket(wsUrl);

      return new Promise((resolve, reject) => {
        this.socket!.onopen = () => {
          console.log('✅ OBD-II device connected');
          resolve(true);
        };

        this.socket!.onerror = (error) => {
          console.error('❌ OBD-II connection error:', error);
          reject(false);
        };

        this.socket!.onmessage = (event) => {
          this.handleOBDData(event.data);
        };
      });
    } catch (error) {
      console.error('OBD connection failed:', error);
      return false;
    }
  }

  private handleOBDData(rawData: string): void {
    // Parse OBD-II PID responses
    const lines = rawData.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Parse different PIDs
      if (trimmed.startsWith('410C')) {
        // Engine RPM (PID 0C)
        const rpm = this.parseRPM(trimmed);
        this.updateMetric('rpm', rpm);
      } else if (trimmed.startsWith('410D')) {
        // Vehicle Speed (PID 0D)
        const speed = this.parseSpeed(trimmed);
        this.updateMetric('speed', speed);
      } else if (trimmed.startsWith('4104')) {
        // Engine Load (PID 04)
        const load = this.parseEngineLoad(trimmed);
        this.updateMetric('engineLoad', load);
      } else if (trimmed.startsWith('4105')) {
        // Coolant Temp (PID 05)
        const temp = this.parseCoolantTemp(trimmed);
        this.updateMetric('coolantTemp', temp);
      } else if (trimmed.startsWith('412F')) {
        // Fuel Level (PID 2F)
        const fuel = this.parseFuelLevel(trimmed);
        this.updateMetric('fuelLevel', fuel);
      }
    }
  }

  private parseRPM(data: string): number {
    const bytes = data.substring(4).split(' ');
    return (parseInt(bytes[0], 16) * 256 + parseInt(bytes[1], 16)) / 4;
  }

  private parseSpeed(data: string): number {
    const bytes = data.substring(4).split(' ');
    return parseInt(bytes[0], 16); // km/h
  }

  private parseEngineLoad(data: string): number {
    const bytes = data.substring(4).split(' ');
    return (parseInt(bytes[0], 16) * 100) / 255;
  }

  private parseCoolantTemp(data: string): number {
    const bytes = data.substring(4).split(' ');
    return parseInt(bytes[0], 16) - 40; // Celsius
  }

  private parseFuelLevel(data: string): number {
    const bytes = data.substring(4).split(' ');
    return (parseInt(bytes[0], 16) * 100) / 255;
  }

  private updateMetric(metric: string, value: number): void {
    // Send to WebSocket service for real-time updates
    if (typeof window !== 'undefined' && (window as any).fleetWebSocket) {
      (window as any).fleetWebSocket.send({
        type: 'vehicle:metric',
        payload: { metric, value, timestamp: Date.now() },
      });
    }
  }

  async queryDTC(): Promise<string[]> {
    if (!this.socket) {
      throw new Error('OBD device not connected');
    }

    return new Promise((resolve) => {
      this.socket!.send('03\r'); // Request DTC codes

      const handler = (event: MessageEvent) => {
        const codes = this.parseDTCCodes(event.data);
        this.socket!.removeEventListener('message', handler);
        resolve(codes);
      };

      this.socket!.addEventListener('message', handler);
    });
  }

  private parseDTCCodes(data: string): string[] {
    const codes: string[] = [];
    const bytes = data.split(' ');

    for (let i = 0; i < bytes.length; i += 2) {
      if (bytes[i] === '00' && bytes[i + 1] === '00') break;

      const code = this.decodeDTC(bytes[i], bytes[i + 1]);
      codes.push(code);
    }

    return codes;
  }

  private decodeDTC(byte1: string, byte2: string): string {
    const b1 = parseInt(byte1, 16);
    const b2 = parseInt(byte2, 16);

    const firstChar = ['P', 'C', 'B', 'U'][(b1 >> 6) & 0x03];
    const secondChar = (b1 >> 4) & 0x03;
    const thirdChar = b1 & 0x0F;
    const fourthFifth = b2.toString(16).padStart(2, '0').toUpperCase();

    return `${firstChar}${secondChar}${thirdChar}${fourthFifth}`;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const obdService = new OBDService();
