import { asFunction, asClass, createContainer } from 'awilix';

import { TelematicsIngestionService } from '../application/telematics/services/TelematicsIngestionService';
import { SamsaraTelematicsAdapter } from '../infrastructure/telematics/adapters/SamsaraTelematicsAdapter';
import { TelematicsIngestionWorker } from '../infrastructure/telematics/jobs/TelematicsIngestionWorker';
// import { DriverSafetyScoreService } from '../application/safety/services/DriverSafetyScoreService';
// import { DriverBehaviorEventService } from '../application/safety/services/DriverBehaviorEventService';
// import { DriverSafetyScoreAggregationJob } from '../infrastructure/safety/jobs/DriverSafetyScoreAggregationJob';
// import { CostAnalyticsService } from '../application/analytics/services/CostAnalyticsService';
import { WebhookDeliveryWorker } from '../infrastructure/webhooks/WebhookDeliveryWorker';

export function setupContainer() {
  const container = createContainer();

  container.register({
    // Telematics
    samsaraAdapter: asFunction(({ logger }) => {
      return new SamsaraTelematicsAdapter(
        {
          apiKey: process.env.SAMSARA_API_KEY!,
          baseUrl: process.env.SAMSARA_BASE_URL
        },
        logger
      );
    }).singleton(),

    telematicsIngestionService: asFunction(({ telematicsRepository, samsaraAdapter, logger }) => {
      return new TelematicsIngestionService(telematicsRepository, logger, [samsaraAdapter]);
    }).singleton(),

    telematicsIngestionWorker: asFunction(({ telematicsIngestionService, logger }) => {
      const intervalSeconds = parseInt(process.env.TELEMATICS_REFRESH_INTERVAL || '60', 10);
      return new TelematicsIngestionWorker(telematicsIngestionService, logger, intervalSeconds);
    }).singleton(),

    // Safety
    // driverBehaviorEventService: asClass(DriverBehaviorEventService).singleton(),
    // driverSafetyScoreService: asClass(DriverSafetyScoreService).singleton(),
    // driverSafetyScoreAggregationJob: asClass(DriverSafetyScoreAggregationJob).singleton(),

    // Analytics
    // costAnalyticsService: asClass(CostAnalyticsService).singleton(),

    // Webhooks
    webhookDeliveryWorker: asClass(WebhookDeliveryWorker).singleton()
  });

  return container;
}

export function startBackgroundJobs(container: any) {
  if (process.env.ENABLE_BACKGROUND_JOBS === 'true') {
    const telematicsWorker = container.resolve('telematicsIngestionWorker');
    telematicsWorker.start();

    // const safetyScoreJob = container.resolve('driverSafetyScoreAggregationJob');
    // safetyScoreJob.start();

    console.log('✅ Background jobs started');
  }
}
