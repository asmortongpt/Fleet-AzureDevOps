
import * as signalR from '@microsoft/signalr';

export function createSignalRConnection() {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(process.env.AZURE_SIGNALR_CONNECTION_STRING, {
      transport: signalR.HttpTransportType.WebSockets,
      skipNegotiation: true
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: retryContext => {
        // Exponential backoff: 0, 2, 10, 30 seconds
        if (retryContext.previousRetryCount === 0) return 0;
        if (retryContext.previousRetryCount === 1) return 2000;
        if (retryContext.previousRetryCount === 2) return 10000;
        return 30000;
      }
    })
    .configureLogging(signalR.LogLevel.Information)
    .build();

  // Connection state monitoring
  connection.onreconnecting(error => {
    logger.warn('SignalR reconnecting', { error });
  });

  connection.onreconnected(connectionId => {
    logger.info('SignalR reconnected', { connectionId });
  });

  connection.onclose(error => {
    logger.error('SignalR connection closed', { error });
  });

  return connection;
}

// In Bicep template - Azure SignalR Service
resource signalRService 'Microsoft.SignalRService/SignalR@2022-02-01' = {
  name: 'fleet-signalr'
  location: location
  sku: {
    name: 'Premium_P1'  // Supports 100K concurrent connections per unit
    tier: 'Premium'
    capacity: 8  // 8 units = 800K concurrent connections
  }
  properties: {
    features: [
      {
        flag: 'ServiceMode'
        value: 'Default'
      }
    ]
    cors: {
      allowedOrigins: ['https://fleet.com']
    }
  }
}
