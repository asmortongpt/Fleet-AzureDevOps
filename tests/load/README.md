# Fleet Management System - Load Testing Suite

## Overview

This directory contains comprehensive load testing infrastructure using k6 to measure and verify the performance of the Fleet Management API.

## Test Scenarios

### 1. Baseline Performance Test (`baseline-test.js`)
**Purpose**: Establish performance baseline metrics under normal load

**Metrics Collected**:
- Response time (min, avg, p95, p99, max)
- Request rate (requests/second)
- Success rate
- Login success rate
- API error count

**Load Profile**:
- Ramp up: 10 users over 30s
- Sustain: 10 users for 1min
- Ramp up: 25 users over 30s
- Sustain: 25 users for 2min
- Ramp down: 0 users over 30s

**Success Criteria**:
- 95th percentile response time < 500ms
- Error rate < 1%
- Login success rate > 95%

**Endpoints Tested**:
- `POST /api/auth/login` - Authentication
- `GET /api/vehicles` - List vehicles with pagination
- `GET /api/vehicles/:id` - Single vehicle retrieval
- `GET /api/drivers` - List drivers
- `GET /api/work-orders` - List work orders

### 2. Stress Test (`stress-test.js`)
**Purpose**: Find system breaking points by gradually increasing load

**Load Profile**:
- Ramp to 50 users over 1min
- Ramp to 100 users over 2min
- Ramp to 200 users over 2min (stress level)
- Ramp to 300 users over 2min (breaking point)
- Ramp down over 1min

**Success Criteria**:
- 99th percentile < 2000ms
- Success rate > 90%

### 3. Spike Test (`spike-test.js`)
**Purpose**: Test system behavior under sudden traffic spikes

**Load Profile**:
- Normal: 10 users for 30s
- **SPIKE**: Jump to 500 users in 10s (50x increase!)
- Sustain spike: 500 users for 1min
- Drop back: 10 users over 30s
- Ramp down: 0 users over 30s

**Success Criteria**:
- 95th percentile < 3000ms (higher latency acceptable during spike)
- Error rate < 5%
- System recovers after spike

## Running Tests

### Local Execution (Requires Port Forward)

1. **Setup port forward to API**:
   \`\`\`bash
   kubectl port-forward -n fleet-management svc/fleet-api-service 3000:3000
   \`\`\`

2. **Run baseline test**:
   \`\`\`bash
   k6 run tests/load/baseline-test.js
   \`\`\`

3. **Run with custom parameters**:
   \`\`\`bash
   k6 run --vus 50 --duration 2m tests/load/baseline-test.js
   \`\`\`

### In-Cluster Execution (Recommended)

1. **Create ConfigMap with test script**:
   \`\`\`bash
   kubectl create configmap k6-baseline-test \\
     --from-file=test.js=tests/load/baseline-test.js \\
     -n fleet-management
   \`\`\`

2. **Run as Kubernetes Job**:
   \`\`\`yaml
   apiVersion: batch/v1
   kind: Job
   metadata:
     name: k6-baseline-test
     namespace: fleet-management
   spec:
     template:
       spec:
         containers:
         - name: k6
           image: grafana/k6:latest
           command: ["k6", "run", "/tests/test.js"]
           env:
           - name: API_URL
             value: "http://fleet-api-service:3000"
           volumeMounts:
           - name: test-script
             mountPath: /tests
         volumes:
         - name: test-script
           configMap:
             name: k6-baseline-test
         restartPolicy: Never
     backoffLimit: 1
   \`\`\`

   \`\`\`bash
   kubectl apply -f k6-job.yaml
   kubectl logs -f job/k6-baseline-test -n fleet-management
   \`\`\`

### Using the Runner Script

\`\`\`bash
# Run baseline only
./tests/load/run-load-tests.sh

# Run all tests
RUN_STRESS=yes RUN_SPIKE=yes ./tests/load/run-load-tests.sh
\`\`\`

## Interpreting Results

### Key Metrics

**Response Time**:
- **Good**: p95 < 500ms, p99 < 1000ms
- **Acceptable**: p95 < 1000ms, p99 < 2000ms
- **Poor**: p95 > 1000ms

**Success Rate**:
- **Good**: > 99%
- **Acceptable**: > 95%
- **Poor**: < 95%

**Requests/sec**:
- Baseline: ~100 req/s per API instance
- Stress: Should handle 500+ req/s
- Spike: Should handle 1000+ req/s burst

### Example Good Result

\`\`\`
Response Time:
  min: 45.23ms
  avg: 123.45ms
  p(95): 287.12ms
  max: 892.34ms

Requests:
  total: 15234
  rate: 127.85/s

Success Rate: 99.87%
\`\`\`

### Warning Signs

- p95 > 1000ms: Database queries need optimization
- Error rate > 5%: Check logs for database connection issues
- Success rate dropping during test: Memory leak or resource exhaustion
- Spike test doesn't recover: Connection pool too small

## Optimization Recommendations

Based on test results, consider:

1. **Database**:
   - Add indexes on frequently queried columns
   - Increase connection pool size
   - Enable query caching

2. **API**:
   - Implement response caching (Redis)
   - Increase replica count
   - Optimize ORM queries (N+1 issues)

3. **Infrastructure**:
   - Scale pods horizontally
   - Increase resource limits (CPU/memory)
   - Enable HPA (Horizontal Pod Autoscaler)

## Continuous Monitoring

### Grafana k6 Cloud (Optional)

Run tests with cloud output:

\`\`\`bash
k6 cloud tests/load/baseline-test.js
\`\`\`

### Prometheus Integration

k6 can export metrics to Prometheus:

\`\`\`bash
k6 run --out experimental-prometheus-rw tests/load/baseline-test.js
\`\`\`

## CI/CD Integration

Add to GitHub Actions:

\`\`\`yaml
- name: Run Load Tests
  run: |
    kubectl port-forward svc/fleet-api-service 3000:3000 &
    sleep 5
    k6 run tests/load/baseline-test.js
    if [ $? -ne 0 ]; then
      echo "Load tests failed - performance regression detected"
      exit 1
    fi
\`\`\`

## Baseline Performance Results (Initial)

*These will be populated after first test run*

| Metric | Target | Current |
|--------|--------|---------|
| p95 Response Time | < 500ms | TBD |
| p99 Response Time | < 1000ms | TBD |
| Success Rate | > 99% | TBD |
| Req/sec (25 VUs) | > 100 | TBD |
| Max Concurrent Users | > 200 | TBD |

## Troubleshooting

**Issue**: Connection refused
- **Solution**: Ensure port-forward is running or pod has network access

**Issue**: 401 Unauthorized
- **Solution**: Check demo credentials in test script match database

**Issue**: Test hangs
- **Solution**: API might be overwhelmed, reduce VUs or check API logs

**Issue**: High error rate
- **Solution**: Check database connection pool, increase API replicas

## Next Steps

1. Run baseline test and record results
2. Set up scheduled tests (weekly)
3. Configure alerts for performance regression
4. Integrate with monitoring dashboards
5. Add custom test scenarios for your specific workflows
