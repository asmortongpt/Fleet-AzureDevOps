
import { ServiceBusClient } from '@azure/service-bus';

export function getServiceBusClient(): ServiceBusClient {
  const conn = process.env.AZURE_SERVICE_BUS_CONNECTION_STRING;
  if (!conn) throw new Error('Missing AZURE_SERVICE_BUS_CONNECTION_STRING');
  return new ServiceBusClient(conn);
}

export async function enqueueScanProcessing(scanSessionId: string) {
  const queueName = process.env.AZURE_SERVICE_BUS_QUEUE_NAME || 'scan-processing';
  const client = getServiceBusClient();
  const sender = client.createSender(queueName);
  try {
    await sender.sendMessages({
      body: { scanSessionId },
      contentType: 'application/json',
      subject: 'scan.process',
    });
  } finally {
    await sender.close();
    await client.close();
  }
}
