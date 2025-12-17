```typescript
// src/ctaFleetAgent.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { performance } from 'perf_hooks';

interface FleetResponse {
  status: string;
  data?: any;
  error?: string;
}

class CTAFleetAgent {
  private client: AxiosInstance;
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });
  }

  async getFleetStatus(fleetId: string): Promise<FleetResponse> {
    try {
      const startTime = performance.now();
      const response: AxiosResponse = await this.client.get(`/api/fleets/${fleetId}`);
      const duration = performance.now() - startTime;

      return {
        status: 'success',
        data: {
          ...response.data,
          responseTime: duration,
        },
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  async updateFleetStatus(fleetId: string, status: string): Promise<FleetResponse> {
    try {
      const startTime = performance.now();
      const response: AxiosResponse = await this.client.put(`/api/fleets/${fleetId}`, { status });
      const duration = performance.now() - startTime;

      return {
        status: 'success',
        data: {
          ...response.data,
          responseTime: duration,
        },
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }
}

export default CTAFleetAgent;

// src/loadTester.ts
class LoadTester {
  private agent: CTAFleetAgent;
  private concurrentRequests: number;
  private testDuration: number;

  constructor(agent: CTAFleetAgent, concurrentRequests: number, testDuration: number) {
    this.agent = agent;
    this.concurrentRequests = concurrentRequests;
    this.testDuration = testDuration;
  }

  async runLoadTest(fleetId: string): Promise<void> {
    console.log(`Starting load test with ${this.concurrentRequests} concurrent requests for ${this.testDuration}ms`);
    const startTime = performance.now();
    const promises: Promise<FleetResponse>[] = [];

    for (let i = 0; i < this.concurrentRequests; i++) {
      promises.push(this.agent.getFleetStatus(fleetId));
    }

    try {
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      const successfulRequests = results.filter(r => r.status === 'success').length;
      const failedRequests = results.filter(r => r.status === 'error').length;
      const avgResponseTime = results
        .filter(r => r.status === 'success' && r.data?.responseTime)
        .reduce((sum, r) => sum + (r.data.responseTime || 0), 0) / successfulRequests;

      console.log(`Load Test Results:`);
      console.log(`Total Time: ${totalTime.toFixed(2)}ms`);
      console.log(`Successful Requests: ${successfulRequests}`);
      console.log(`Failed Requests: ${failedRequests}`);
      console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    } catch (error: any) {
      console.error('Load test failed:', error.message);
    }
  }
}

export default LoadTester;

// tests/ctaFleetAgent.test.ts
import { expect } from 'chai';
import sinon from 'sinon';
import axios from 'axios';
import CTAFleetAgent from '../src/ctaFleetAgent';
import LoadTester from '../src/loadTester';

describe('CTAFleetAgent', () => {
  let agent: CTAFleetAgent;
  let axiosStub: sinon.SinonStub;

  beforeEach(() => {
    agent = new CTAFleetAgent('http://test-api.com', 'test-api-key');
    axiosStub = sinon.stub(axios, 'create').returns({
      get: sinon.stub().resolves({ data: { id: 'fleet1', status: 'active' } }),
      put: sinon.stub().resolves({ data: { id: 'fleet1', status: 'updated' } }),
    } as any);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should get fleet status successfully', async () => {
    const response = await agent.getFleetStatus('fleet1');
    expect(response.status).to.equal('success');
    expect(response.data).to.have.property('id', 'fleet1');
    expect(response.data).to.have.property('responseTime');
  });

  it('should update fleet status successfully', async () => {
    const response = await agent.updateFleetStatus('fleet1', 'updated');
    expect(response.status).to.equal('success');
    expect(response.data).to.have.property('status', 'updated');
    expect(response.data).to.have.property('responseTime');
  });

  it('should handle errors when getting fleet status', async () => {
    axiosStub.returns({
      get: sinon.stub().rejects(new Error('Network Error')),
      put: sinon.stub(),
    } as any);

    const response = await agent.getFleetStatus('fleet1');
    expect(response.status).to.equal('error');
    expect(response.error).to.equal('Network Error');
  });
});

describe('LoadTester', () => {
  let agent: CTAFleetAgent;
  let loadTester: LoadTester;
  let axiosStub: sinon.SinonStub;

  beforeEach(() => {
    agent = new CTAFleetAgent('http://test-api.com', 'test-api-key');
    loadTester = new LoadTester(agent, 5, 1000);
    axiosStub = sinon.stub(axios, 'create').returns({
      get: sinon.stub().resolves({ data: { id: 'fleet1', status: 'active' } }),
      put: sinon.stub().resolves({ data: { id: 'fleet1', status: 'updated' } }),
    } as any);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should run load test and return results', async () => {
    const consoleSpy = sinon.spy(console, 'log');
    await loadTester.runLoadTest('fleet1');
    expect(consoleSpy.calledWithMatch(/Load Test Results/)).to.be.true;
    expect(consoleSpy.calledWithMatch(/Successful Requests: 5/)).to.be.true;
    consoleSpy.restore();
  });

  it('should handle errors during load test', async () => {
    axiosStub.returns({
      get: sinon.stub().rejects(new Error('Network Error')),
      put: sinon.stub(),
    } as any);

    const consoleErrorSpy = sinon.spy(console, 'error');
    await loadTester.runLoadTest('fleet1');
    expect(consoleErrorSpy.calledWithMatch(/Load test failed/)).to.be.true;
    consoleErrorSpy.restore();
  });
});

// main.ts
import CTAFleetAgent from './src/ctaFleetAgent';
import LoadTester from './src/loadTester';

async function main() {
  const agent = new CTAFleetAgent('http://localhost:3000', 'your-api-key');
  const loadTester = new LoadTester(agent, 10, 5000);
  await loadTester.runLoadTest('test-fleet');
}

if (require.main === module) {
  main().catch(console.error);
}
```
