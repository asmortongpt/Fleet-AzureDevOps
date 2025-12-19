```typescript
// ctafleet-agent59.integration.test.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { CTAFleetAgent59Service } from '../src/ctafleet-agent59/ctafleet-agent59.service';
import { CTAFleetAgent59Controller } from '../src/ctafleet-agent59/ctafleet-agent59.controller';

describe('CTAFleet Agent 59 (Integration Tests)', () => {
  let app: INestApplication;
  let service: CTAFleetAgent59Service;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    service = moduleFixture.get<CTAFleetAgent59Service>(CTAFleetAgent59Service);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('API Endpoints', () => {
    it('/GET agent59/status should return agent status', async () => {
      const response = await request(app.getHttpServer())
        .get('/agent59/status')
        .expect(200);

      expect(response.body).toEqual({
        status: 'operational',
        agentId: '59',
        message: 'CTAFleet Agent 59 is running',
      });
    });

    it('/POST agent59/data should process telemetry data', async () => {
      const telemetryData = {
        vehicleId: 'V123',
        speed: 65,
        location: { lat: 40.7128, lon: -74.0060 },
        timestamp: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/agent59/data')
        .send(telemetryData)
        .expect(201);

      expect(response.body).toEqual({
        status: 'success',
        message: 'Telemetry data received for vehicle V123',
        data: telemetryData,
      });
    });

    it('/POST agent59/data should return 400 for invalid data', async () => {
      const invalidData = {
        vehicleId: '',
        speed: -10,
      };

      const response = await request(app.getHttpServer())
        .post('/agent59/data')
        .send(invalidData)
        .expect(400);

      expect(response.body).toEqual({
        statusCode: 400,
        message: 'Invalid telemetry data',
        error: 'Bad Request',
      });
    });
  });

  describe('Service Methods', () => {
    it('should return agent status', () => {
      const status = service.getStatus();
      expect(status).toEqual({
        status: 'operational',
        agentId: '59',
        message: 'CTAFleet Agent 59 is running',
      });
    });

    it('should process valid telemetry data', () => {
      const telemetryData = {
        vehicleId: 'V123',
        speed: 65,
        location: { lat: 40.7128, lon: -74.0060 },
        timestamp: new Date().toISOString(),
      };

      const result = service.processTelemetry(telemetryData);
      expect(result).toEqual({
        status: 'success',
        message: 'Telemetry data received for vehicle V123',
        data: telemetryData,
      });
    });

    it('should throw error for invalid telemetry data', () => {
      const invalidData = {
        vehicleId: '',
        speed: -10,
        location: { lat: 0, lon: 0 },
        timestamp: '',
      };

      expect(() => service.processTelemetry(invalidData)).toThrow('Invalid telemetry data');
    });
  });
});

// app.module.ts
import { Module } from '@nestjs/common';
import { CTAFleetAgent59Module } from './ctafleet-agent59/ctafleet-agent59.module';

@Module({
  imports: [CTAFleetAgent59Module],
})
export class AppModule {}

// ctafleet-agent59.module.ts
import { Module } from '@nestjs/common';
import { CTAFleetAgent59Controller } from './ctafleet-agent59.controller';
import { CTAFleetAgent59Service } from './ctafleet-agent59.service';

@Module({
  controllers: [CTAFleetAgent59Controller],
  providers: [CTAFleetAgent59Service],
})
export class CTAFleetAgent59Module {}

// ctafleet-agent59.controller.ts
import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CTAFleetAgent59Service } from './ctafleet-agent59.service';
import { TelemetryDataDto } from './dto/telemetry-data.dto';

@Controller('agent59')
export class CTAFleetAgent59Controller {
  constructor(private readonly agent59Service: CTAFleetAgent59Service) {}

  @Get('status')
  getStatus() {
    return this.agent59Service.getStatus();
  }

  @Post('data')
  @HttpCode(HttpStatus.CREATED)
  processTelemetry(@Body() telemetryData: TelemetryDataDto) {
    return this.agent59Service.processTelemetry(telemetryData);
  }
}

// ctafleet-agent59.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { TelemetryDataDto } from './dto/telemetry-data.dto';

@Injectable()
export class CTAFleetAgent59Service {
  getStatus() {
    return {
      status: 'operational',
      agentId: '59',
      message: 'CTAFleet Agent 59 is running',
    };
  }

  processTelemetry(telemetryData: TelemetryDataDto) {
    if (!telemetryData.vehicleId || telemetryData.speed < 0) {
      throw new BadRequestException('Invalid telemetry data');
    }

    return {
      status: 'success',
      message: `Telemetry data received for vehicle ${telemetryData.vehicleId}`,
      data: telemetryData,
    };
  }
}

// telemetry-data.dto.ts
export class TelemetryDataDto {
  vehicleId: string;
  speed: number;
  location: {
    lat: number;
    lon: number;
  };
  timestamp: string;
}
```
