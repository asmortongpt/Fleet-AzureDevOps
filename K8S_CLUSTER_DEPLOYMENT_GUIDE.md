# Kubernetes Cluster Orchestrator with Local LLM - Deployment Guide

## Overview

This system deploys **12 parallel honest orchestrator workers** to Azure Kubernetes Service (AKS) with **local Ollama LLM instances** for 87.5% cost reduction vs Anthropic API.

## Cost Savings

### API Cost Comparison
- **Anthropic Claude API**: ~$0.015 per 1K tokens
- **Local Ollama (CodeLlama 7B)**: ~$0.002 per 1K tokens (compute only)
- **Cost Reduction**: 87.5%
- **Estimated Savings**: $0.15 per task = **$10.65 saved on 71 tasks**

### Infrastructure
- **AKS Cluster**: 4 nodes (already provisioned)
- **Ollama LLM Pods**: 3 replicas with load balancing
- **Worker Jobs**: 12 parallel jobs (3x scale vs VM cluster)
- **Total Compute**: ~56 vCPUs, ~224 GB RAM across cluster

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AKS Cluster (4 nodes)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         Ollama LLM Service (3 replicas)             │    │
│  │  - CodeLlama 7B (code analysis)                     │    │
│  │  - Llama 3.1 8B (general tasks)                     │    │
│  │  - Load Balanced ClusterIP Service                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                           ↑                                   │
│                           │ Query local LLM                   │
│  ┌────────────────────────┴──────────────────────────────┐  │
│  │              12 Worker Jobs (Parallel)                 │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ Worker 1: Critical Security Frontend (3 tasks)        │  │
│  │ Worker 2: Critical Security Backend (3 tasks)         │  │
│  │ Worker 3: Critical Auth & Validation (4 tasks)        │  │
│  │ Worker 4: High Priority Frontend Arch (5 tasks)       │  │
│  │ Worker 5: High Priority Backend Arch (5 tasks)        │  │
│  │ Worker 6: High Security Implementations (6 tasks)     │  │
│  │ Worker 7: High Performance Frontend (5 tasks)         │  │
│  │ Worker 8: High Performance Backend (5 tasks)          │  │
│  │ Worker 9: Medium Priority Refactoring (6 tasks)       │  │
│  │ Worker 10: Data Fetching & State (5 tasks)            │  │
│  │ Worker 11: Testing & Quality (4 tasks)                │  │
│  │ Worker 12: Low Priority & Cleanup (3 tasks)           │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  Each worker:                                                 │
│  - Executes tasks with cryptographic proof                   │
│  - Queries local LLM for code analysis                       │
│  - Saves results with MD5 hashes                             │
│  - Reports cost savings per task                             │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Steps

### 1. Prerequisites

```bash
# Verify AKS cluster access
kubectl cluster-info
kubectl get nodes

# Expected: 4 nodes in Ready state
# aks-nodepool1-63920668-vmss000001   Ready
# aks-nodepool1-63920668-vmss000003   Ready
# aks-nodepool1-63920668-vmss000006   Ready
# aks-nodepool1-63920668-vmss00000a   Ready
```

### 2. Deploy to Kubernetes

```bash
cd /Users/andrewmorton/Documents/GitHub/fleet-local

# Make orchestrator executable
chmod +x k8s-cluster-orchestrator.py

# Run orchestration
python3 k8s-cluster-orchestrator.py
```

### 3. Deployment Process

The orchestrator will automatically:

1. **Create namespace** `honest-orchestration` with zero-simulation label
2. **Deploy Ollama LLM** (3 replicas):
   - Pull CodeLlama 7B model (~4 GB)
   - Pull Llama 3.1 8B model (~4.7 GB)
   - Create load-balanced ClusterIP service
   - Wait for pods to be ready (~2-3 minutes)

3. **Create ConfigMap** with:
   - All 71 tasks from `excel-tasks-extracted.json`
   - LLM endpoint: `ollama-llm-service.honest-orchestration.svc.cluster.local:11434`
   - Zero simulation mode enabled
   - Cryptographic proof configuration

4. **Deploy 12 worker jobs** in parallel:
   - Each job processes 3-6 tasks
   - Total: 54 tasks distributed across workers
   - Each worker queries local LLM for analysis
   - Saves results with cryptographic proof

5. **Monitor execution** with real-time updates:
   ```
   📊 Active: 12 | Succeeded: 0 | Failed: 0 | Time: 45s
   📊 Active: 8 | Succeeded: 4 | Failed: 0 | Time: 120s
   📊 Active: 3 | Succeeded: 9 | Failed: 0 | Time: 180s
   📊 Active: 0 | Succeeded: 12 | Failed: 0 | Time: 240s
   ```

6. **Collect results** from all worker pods:
   - Worker logs saved to `k8s-worker-*-log.txt`
   - Aggregated results in `k8s-cluster-results.json`
   - Cryptographic proofs for all completed tasks

### 4. Monitor Deployment

```bash
# Watch namespace resources
kubectl get all -n honest-orchestration --watch

# Check LLM pods
kubectl get pods -n honest-orchestration -l app=ollama-llm

# Check worker jobs
kubectl get jobs -n honest-orchestration

# View worker logs (example)
kubectl logs -n honest-orchestration k8s-worker-1-xxxxx

# Check LLM service
kubectl get svc -n honest-orchestration ollama-llm-service
```

### 5. Verify LLM Deployment

```bash
# Port-forward to test LLM locally
kubectl port-forward -n honest-orchestration svc/ollama-llm-service 11434:11434 &

# Test LLM query
curl http://localhost:11434/api/generate -d '{
  "model": "codellama:7b",
  "prompt": "Write a function to validate JWT tokens",
  "stream": false
}'

# Expected: JSON response with code generation
```

## Expected Results

### Execution Metrics
- **Total Tasks**: 54 (distributed across 12 workers)
- **Execution Time**: ~4-6 minutes (parallel execution)
- **Success Rate**: >95% (with retry on failure)
- **Cost Savings**: ~$8.10 total (54 tasks × $0.15 each)

### Output Files
```
k8s-cluster-results.json     # Aggregated results with metrics
k8s-worker-1-log.txt          # Worker 1 execution log
k8s-worker-2-log.txt          # Worker 2 execution log
...
k8s-worker-12-log.txt         # Worker 12 execution log

k8s-namespace.yaml            # Namespace definition
ollama-deployment.yaml        # LLM deployment
ollama-service.yaml           # LLM service
orchestrator-configmap.yaml   # Task configuration
k8s-worker-*-job.yaml         # Worker job definitions
```

### Sample Results JSON
```json
{
  "start_time": 1733234567.89,
  "end_time": 1733234927.12,
  "total_duration": 359.23,
  "total_tasks": 54,
  "completed_tasks": 52,
  "failed_tasks": 2,
  "workers": [...],
  "cost_savings": {
    "api_calls_avoided": 520,
    "estimated_savings_usd": 7.80
  }
}
```

## Cleanup (Optional)

```bash
# Delete all resources in namespace
kubectl delete namespace honest-orchestration

# This removes:
# - All worker jobs
# - Ollama LLM deployment
# - ConfigMaps
# - Services
```

## Scaling Options

### Increase Workers
Edit `k8s-cluster-orchestrator.py`:
```python
orchestrator = K8sClusterOrchestrator(workspace, num_workers=24)  # 2x scale
```

### More LLM Replicas
Edit LLM deployment in orchestrator:
```python
"replicas": 6,  # More LLM instances for higher throughput
```

### Larger Models
Use more capable models (requires more RAM):
```python
"lifecycle": {
    "postStart": {
        "exec": {
            "command": [
                "/bin/sh", "-c",
                "ollama pull codellama:13b && ollama pull llama3.1:70b"  # Larger models
            ]
        }
    }
}
```

## Troubleshooting

### LLM Pods Not Ready
```bash
# Check pod status
kubectl describe pod -n honest-orchestration -l app=ollama-llm

# Common issues:
# - Model download timeout (increase postStart timeout)
# - Insufficient memory (increase resource limits)
# - Image pull errors (check network connectivity)
```

### Worker Jobs Failing
```bash
# View job events
kubectl describe job -n honest-orchestration k8s-worker-1

# View pod logs
kubectl logs -n honest-orchestration k8s-worker-1-xxxxx

# Common issues:
# - LLM service not ready (wait for LLM pods)
# - ConfigMap not mounted (check volume mounts)
# - Network policy blocking LLM access
```

### Cost Savings Not Showing
```bash
# Verify LLM is being used (not falling back to API)
kubectl logs -n honest-orchestration k8s-worker-1-xxxxx | grep "LLM_ENDPOINT"

# Expected: ollama-llm-service.honest-orchestration.svc.cluster.local:11434
```

## Integration with VM Cluster

Run both orchestrators in parallel:

```bash
# Terminal 1: AKS cluster (12 workers)
python3 k8s-cluster-orchestrator.py

# Terminal 2: VM cluster (6 workers)
python3 cluster-honest-orchestrator.py
```

**Total Parallel Capacity**: 18 workers across VM + AKS
**Total Tasks Processed**: ~80 tasks in parallel
**Combined Cost Savings**: ~$12 total

## Zero Simulation Policy Compliance

✅ **All workers maintain cryptographic proof**:
1. MD5 hash validation for file modifications
2. LLM response hash for audit trail
3. Task execution timestamps
4. Cost savings per task tracked
5. Honest failure reporting (no fake successes)

## Next Steps

After deployment completes:
1. Review `k8s-cluster-results.json` for execution summary
2. Examine worker logs for detailed task analysis
3. Verify cost savings metrics
4. Collect cryptographic proofs for git commits
5. Push verified changes to GitHub

## Support

Issues with deployment?
1. Check AKS cluster health: `kubectl get nodes`
2. Verify namespace creation: `kubectl get ns honest-orchestration`
3. Check LLM pods: `kubectl get pods -n honest-orchestration`
4. View orchestrator output for detailed errors
5. Consult worker logs for task-specific failures
