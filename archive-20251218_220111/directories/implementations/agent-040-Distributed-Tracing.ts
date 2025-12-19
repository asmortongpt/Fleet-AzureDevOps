```typescript
// src/tracing.ts
import { trace, Span, Tracer } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';

export class TracingAgent {
  private tracer: Tracer;
  private provider: NodeTracerProvider;

  constructor(serviceName: string, jaegerEndpoint: string) {
    // Initialize resource with service name
    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    });

    // Initialize tracer provider
    this.provider = new NodeTracerProvider({ resource });

    // Configure Jaeger exporter
    const exporter = new JaegerExporter({
      endpoint: jaegerEndpoint,
    });

    // Add span processor with exporter
    this.provider.addSpanProcessor(new SimpleSpanProcessor(exporter));

    // Register provider
    this.provider.register();

    // Register instrumentations for Express and HTTP
    registerInstrumentations({
      instrumentations: [
        new ExpressInstrumentation(),
        new HttpInstrumentation(),
      ],
      tracerProvider: this.provider,
    });

    // Get tracer
    this.tracer = trace.getTracer(serviceName);
  }

  // Method to create a custom span
  public startSpan(spanName: string, callback: (span: Span) => void): void {
    this.tracer.startActiveSpan(spanName, (span) => {
      try {
        callback(span);
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: 2, message: (error as Error).message });
      } finally {
        span.end();
      }
    });
  }

  // Method to get the tracer for manual instrumentation
  public getTracer(): Tracer {
    return this.tracer;
  }

  // Shutdown method for graceful cleanup
  public async shutdown(): Promise<void> {
    await this.provider.shutdown();
  }
}

// src/app.ts
import express, { Request, Response } from 'express';
import { TracingAgent } from './tracing';

export class App {
  private app: express.Application;
  private tracingAgent: TracingAgent;

  constructor(serviceName: string, jaegerEndpoint: string) {
    this.app = express();
    this.tracingAgent = new TracingAgent(serviceName, jaegerEndpoint);
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'OK' });
    });

    this.app.get('/operation', (req: Request, res: Response) => {
      this.tracingAgent.startSpan('custom-operation', (span) => {
        // Simulate some work
        span.setAttribute('operation.type', 'demo');
        res.status(200).json({ result: 'Operation completed' });
      });
    });
  }

  public getApp(): express.Application {
    return this.app;
  }

  public async shutdown(): Promise<void> {
    await this.tracingAgent.shutdown();
  }
}

// src/index.ts
import { App } from './app';

const SERVICE_NAME = 'ctafleet-agent-40';
const JAEGER_ENDPOINT = 'http://localhost:14268/api/traces';
const PORT = process.env.PORT || 3000;

const app = new App(SERVICE_NAME, JAEGER_ENDPOINT);

const server = app.getApp().listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await app.shutdown();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// tests/tracing.test.ts
import { TracingAgent } from '../src/tracing';
import { trace } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { SpanExporter } from '@opentelemetry/sdk-trace-base';
import { expect } from 'chai';
import sinon from 'sinon';
import { describe, it, beforeEach, afterEach } from 'mocha';

class MockExporter extends SpanExporter {
  export(spans: any, resultCallback: any): void {
    resultCallback({ code: 0 });
  }
  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}

describe('TracingAgent', () => {
  let tracingAgent: TracingAgent;
  let providerStub: sinon.SinonStub;
  let exporterStub: sinon.SinonStub;

  beforeEach(() => {
    providerStub = sinon.stub(NodeTracerProvider.prototype, 'register');
    exporterStub = sinon.stub(MockExporter.prototype, 'export');
    tracingAgent = new TracingAgent('test-service', 'http://mock-endpoint');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should initialize tracer provider and register instrumentations', () => {
    expect(providerStub.calledOnce).to.be.true;
  });

  it('should create and end a custom span', (done) => {
    const spanName = 'test-span';
    tracingAgent.startSpan(spanName, (span) => {
      expect(span.isRecording()).to.be.true;
      done();
    });
  });

  it('should handle errors in custom span', (done) => {
    const spanName = 'error-span';
    const error = new Error('Test error');
    const recordExceptionStub = sinon.stub();
    const setStatusStub = sinon.stub();

    // Mock span methods
    sinon.stub(trace.getTracer('test-service'), 'startActiveSpan').callsFake((name, callback) => {
      const mockSpan = {
        isRecording: () => true,
        recordException: recordExceptionStub,
        setStatus: setStatusStub,
        end: () => {},
      };
      callback(mockSpan as any);
      return mockSpan as any;
    });

    tracingAgent.startSpan(spanName, () => {
      throw error;
    });

    setTimeout(() => {
      expect(recordExceptionStub.calledWith(error)).to.be.true;
      expect(setStatusStub.calledWith(sinon.match({ code: 2, message: error.message }))).to.be.true;
      done();
    }, 0);
  });

  it('should shutdown provider gracefully', async () => {
    const shutdownStub = sinon.stub(NodeTracerProvider.prototype, 'shutdown').resolves();
    await tracingAgent.shutdown();
    expect(shutdownStub.calledOnce).to.be.true;
  });
});

// tests/app.test.ts
import { App } from '../src/app';
import request from 'supertest';
import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import sinon from 'sinon';

describe('App', () => {
  let app: App;
  let server: any;
  let shutdownStub: sinon.SinonStub;

  before(() => {
    app = new App('test-service', 'http://mock-endpoint');
    server = app.getApp().listen(0);
    shutdownStub = sinon.stub(app, 'shutdown').resolves();
  });

  after(async () => {
    await server.close();
    await shutdownStub.restore();
  });

  it('should respond with 200 on health endpoint', async () => {
    const response = await request(app.getApp()).get('/health');
    expect(response.status).to.equal(200);
    expect(response.body).to.deep.equal({ status: 'OK' });
  });

  it('should respond with 200 on operation endpoint with tracing', async () => {
    const response = await request(app.getApp()).get('/operation');
    expect(response.status).to.equal(200);
    expect(response.body).to.deep.equal({ result: 'Operation completed' });
  });
});
```

This code provides a complete implementation of distributed tracing for CTAFleet Agent 40 using OpenTelemetry. It includes:

1. **TracingAgent Class**: Handles initialization of OpenTelemetry tracing with Jaeger exporter, custom span creation, and instrumentation for Express and HTTP.
2. **App Class**: Implements a simple Express application with traced endpoints.
3. **Main Application**: Sets up the server with proper shutdown handling.
4. **Comprehensive Tests**: Includes unit tests for both TracingAgent and App classes using Mocha, Chai, and Sinon for mocking.

**Dependencies Required** (add to package.json):
```json
{
  "dependencies": {
    "@opentelemetry/api": "^1.4.1",
    "@opentelemetry/sdk-trace-node": "^1.13.0",
    "@opentelemetry/resources": "^1.13.0",
    "@opentelemetry/semantic-conventions": "^1.13.0",
    "@opentelemetry/sdk-trace-base": "^1.13.0",
    "@opentelemetry/exporter-jaeger": "^1.13.0",
    "@opentelemetry/instrumentation-express": "^0.32.0",
    "@opentelemetry/instrumentation-http": "^0.39.0",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@types/chai": "^4.3.4",
    "@types/express": "^4.17.17",
    "@types/mocha": "^10.0.1",
    "@types/node": "^18.15.11",
    "@types/sinon": "^10.0.14",
    "chai": "^4.3.7",
    "mocha": "^10.2.0",
    "sinon": "^15.0.3",
    "supertest": "^6.3.3",
    "typescript": "^5.0.4"
  }
}
```

**Running the Application**:
1. Ensure Jaeger is running locally or update the endpoint in `index.ts`.
2. Run `npm install` to install dependencies.
3. Compile TypeScript with `tsc`.
4. Start the application with `node dist/index.js`.
5. Run tests with `npm test` after setting up a test script in package.json.

This implementation provides production-ready distributed tracing with proper error handling, instrumentation, and testing coverage.
