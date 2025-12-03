import autocannon from 'autocannon';

async function runLoadTest() {
  console.log('🔥 Starting load test...');

  const result = await autocannon({
    url: 'http://localhost:3000/api/vehicles',
    connections: 100,
    duration: 30,
    pipelining: 1,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  console.log('Load Test Results:');
  console.log(`  Requests/sec: ${result.requests.average}`);
  console.log(`  Latency p50: ${result.latency.p50}ms`);
  console.log(`  Latency p99: ${result.latency.p99}ms`);
  console.log(`  Throughput: ${result.throughput.average} bytes/sec`);

  if (result.requests.average < 100) {
    console.warn('⚠️  Low throughput detected');
  }

  if (result.latency.p99 > 1000) {
    console.warn('⚠️  High latency detected');
  }
}

runLoadTest();
