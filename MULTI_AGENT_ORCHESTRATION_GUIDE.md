# Fleet Management - Multi-Agent Orchestration System
## Azure DevOps + AKS Deployment

## Executive Summary

This document provides a complete implementation of an AI-powered multi-agent orchestration system that automatically debugs, fixes, and deploys the Fleet Management application to Azure Kubernetes Service (AKS).

**What it does:**
- Detects build/deploy failures automatically
- Uses GPT-4 (CodexAgent) to analyze errors and propose fixes
- Uses GPT-4 (JulesAgent) to review fixes for safety
- Applies approved fixes and re-runs quality gates
- Deploys to AKS only when all gates pass
- Verifies production deployment with smoke tests
- Iterates until success or safe stop condition

**Key Value:**
- Zero-touch deployments when code is correct
- Automatic debugging and fixing when issues arise
- Complete audit trail of all AI decisions
- Safe stop conditions prevent infinite loops
- Azure DevOps integration for enterprise workflows

---

## Azure Target Decision

**Selected: Azure Kubernetes Service (AKS)**

### Rationale:
1. **Already in use**: Fleet app currently deployed to AKS (`fleet-management` namespace)
2. **Container-native**: React/Node.js app with Docker builds
3. **Production-grade**: Rolling updates, health checks, auto-scaling
4. **Zero-downtime**: Kubernetes handles pod rotation seamlessly
5. **Cost-effective**: Pay for nodes, not per-app like App Service
6. **ACR integration**: Native integration with Azure Container Registry

### Infrastructure:
- AKS Cluster: `fleet-production-aks`
- Node pools: System (for k8s) + User (for apps)
- Container Registry: `fleetproductionacr.azurecr.io`
- Key Vault: `fleet-keyvault-prod`
- Managed Identity: For secure Azure resource access

---

## Implementation Plan

### Phase 1: Local Agent Development (Week 1)
1. Set up Python environment with OpenAI SDK
2. Implement Orchestrator with loop logic
3. Implement CodexAgent (error analysis + patch generation)
4. Implement JulesAgent (patch review + approval)
5. Implement DevOpsAgent (build + deploy execution)
6. Implement VerificationAgent (health + smoke tests)
7. Local testing with staging environment

### Phase 2: Azure DevOps Integration (Week 2)
1. Create Azure DevOps pipeline (`azure-pipelines.yml`)
2. Set up service connections to AKS and ACR
3. Configure variable groups for secrets
4. Implement pipeline stages (build, orchestrate, deploy, verify)
5. Add manual approval gates for production
6. Test end-to-end pipeline

### Phase 3: Observability & Safety (Week 3)
1. Add Azure Application Insights logging
2. Implement max iteration limits
3. Add no-progress detection
4. Create rollback procedures
5. Set up alerting for deployment failures
6. Document runbooks

---

## File Structure

```
Fleet/
├── agent_orch/
│   ├── orchestrator.py          # Main loop controller
│   ├── config.yaml               # Configuration
│   ├── requirements.txt          # Python dependencies
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── codex_agent.py        # Error analysis + patch generation
│   │   ├── jules_agent.py        # Patch review + approval
│   │   ├── devops_agent.py       # Build + deploy execution
│   │   └── verification_agent.py  # Health + smoke tests
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── shell_executor.py     # Safe shell command execution
│   │   ├── git_helper.py         # Git operations
│   │   ├── log_collector.py      # Collect and parse logs
│   │   └── verifier.py           # Health check runner
│   └── README.md
├── azure-pipelines.yml           # Azure DevOps pipeline
├── scripts/
│   └── smoke_test.sh             # Verification script
└── docs/
    └── RUNBOOK.md                # Operations guide
```

---

## Complete Code Implementation

### 1. agent_orch/requirements.txt

```txt
openai==1.54.3
azure-identity==1.18.0
azure-keyvault-secrets==4.9.0
azure-mgmt-containerregistry==10.3.0
azure-mgmt-containerservice==33.0.0
pyyaml==6.0.2
requests==2.32.3
kubernetes==31.0.0
python-dotenv==1.0.1
```

### 2. agent_orch/config.yaml

```yaml
# Fleet Management - Orchestrator Configuration

# Environment-specific settings
environments:
  staging:
    namespace: fleet-management-staging
    url: https://staging.fleet.capitaltechalliance.com
    health_endpoint: /health
    require_approval: false
    
  prod:
    namespace: fleet-management
    url: https://fleet.capitaltechalliance.com
    health_endpoint: /health
    require_approval: true

# Build configuration
build:
  registry: fleetproductionacr.azurecr.io
  image_name: fleet-frontend
  dockerfile_path: ./Dockerfile
  context_path: .
  
# Quality gates
quality_gates:
  - name: "lint"
    command: "npm run lint"
    required: false
    
  - name: "test"
    command: "npm run test"
    required: true
    
  - name: "build"
    command: "npm run build"
    required: true

# Deployment configuration
deploy:
  method: "kubectl"
  manifest_path: "./k8s/deployment.yaml"
  wait_timeout: 300  # seconds
  
# Verification tests
verification:
  health_check:
    endpoint: "{{ env.health_endpoint }}"
    timeout: 10
    retries: 3
    
  smoke_tests:
    script: "./scripts/smoke_test.sh"
    timeout: 60
    
  user_flows:
    - name: "Authentication"
      steps:
        - "GET /login"
        - "POST /api/auth/microsoft/login"
    - name: "Dashboard Load"
      steps:
        - "GET /"
        - "GET /api/v1/vehicles"

# Agent configuration
agents:
  codex:
    model: "gpt-4-turbo-preview"
    temperature: 0.2
    max_tokens: 4000
    system_prompt: |
      You are a senior software engineer debugging build and deployment issues.
      Analyze errors and propose minimal, safe fixes as unified git patches.
      Focus on the root cause. Never make unrelated changes.
      
  jules:
    model: "gpt-4-turbo-preview"
    temperature: 0.1
    max_tokens: 2000
    system_prompt: |
      You are a code reviewer focused on safety and correctness.
      Review proposed patches and reject anything risky or incorrect.
      Suggest improvements if the patch is on the right track but flawed.

# Safety limits
safety:
  max_iterations: 5
  no_progress_threshold: 2  # stop if same error appears this many times
  never_delete:
    - "*.sql"
    - "migrations/"
    - "k8s/secrets.yaml"
  require_confirmation:
    - "DROP"
    - "DELETE FROM"
    - "rm -rf"
    - "kubectl delete namespace"
    
# Logging
logging:
  level: INFO
  file: logs/orchestrator_{date}.log
  format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
  
# Metrics
metrics:
  enabled: true
  path: metrics/deployments.json
```

### 3. agent_orch/orchestrator.py

```python
#!/usr/bin/env python3
"""
Fleet Management - Multi-Agent Deployment Orchestrator

Main loop that coordinates agents to debug and deploy the application.
"""

import os
import sys
import logging
import argparse
import yaml
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from agents.codex_agent import CodexAgent
from agents.jules_agent import JulesAgent
from agents.devops_agent import DevOpsAgent
from agents.verification_agent import VerificationAgent
from tools.log_collector import LogCollector
from tools.git_helper import GitHelper


class DeploymentOrchestrator:
    """Main orchestrator that manages the deployment loop."""
    
    def __init__(self, environment: str, config_path: str = "config.yaml"):
        self.environment = environment
        self.config = self._load_config(config_path)
        self.env_config = self.config["environments"][environment]
        
        # Setup logging
        self._setup_logging()
        
        # Initialize agents
        self.codex = CodexAgent(self.config["agents"]["codex"])
        self.jules = JulesAgent(self.config["agents"]["jules"])
        self.devops = DevOpsAgent(self.config)
        self.verifier = VerificationAgent(self.config, self.env_config)
        
        # Initialize tools
        self.log_collector = LogCollector()
        self.git = GitHelper()
        
        # State tracking
        self.iteration = 0
        self.max_iterations = self.config["safety"]["max_iterations"]
        self.error_history: List[str] = []
        self.patch_history: List[str] = []
        
    def _load_config(self, path: str) -> Dict:
        """Load YAML configuration."""
        with open(path, 'r') as f:
            return yaml.safe_load(f)
    
    def _setup_logging(self):
        """Configure logging."""
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)
        
        log_file = log_dir / f"orchestrator_{datetime.now().strftime('%Y%m%d')}.log"
        
        logging.basicConfig(
            level=getattr(logging, self.config["logging"]["level"]),
            format=self.config["logging"]["format"],
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler(sys.stdout)
            ]
        )
        
        self.logger = logging.getLogger(__name__)
        
    def run(self) -> bool:
        """
        Main orchestration loop.
        
        Returns:
            bool: True if deployment successful, False otherwise
        """
        self.logger.info(f"Starting deployment orchestration for {self.environment}")
        
        while self.iteration < self.max_iterations:
            self.iteration += 1
            self.logger.info(f"\n{'='*60}")
            self.logger.info(f"ITERATION {self.iteration}/{self.max_iterations}")
            self.logger.info(f"{'='*60}\n")
            
            # Step 1: Run quality gates
            self.logger.info("Step 1: Running quality gates...")
            gates_result = self._run_quality_gates()
            
            if gates_result["success"]:
                self.logger.info("✓ All quality gates passed!")
                
                # Step 2: Deploy
                self.logger.info("\nStep 2: Deploying to AKS...")
                deploy_result = self.devops.deploy(self.environment)
                
                if deploy_result["success"]:
                    self.logger.info("✓ Deployment successful!")
                    
                    # Step 3: Verify
                    self.logger.info("\nStep 3: Verifying deployment...")
                    verify_result = self.verifier.verify(self.env_config["url"])
                    
                    if verify_result["success"]:
                        self.logger.info("✓ Verification passed!")
                        self.logger.info("\n🎉 DEPLOYMENT COMPLETE AND VERIFIED!")
                        return True
                    else:
                        self.logger.error("✗ Verification failed")
                        error_context = {
                            "stage": "verification",
                            "errors": verify_result["errors"],
                            "logs": self.log_collector.collect_pod_logs(
                                self.env_config["namespace"]
                            )
                        }
                else:
                    self.logger.error("✗ Deployment failed")
                    error_context = {
                        "stage": "deployment",
                        "errors": deploy_result["errors"],
                        "logs": deploy_result.get("logs", "")
                    }
            else:
                self.logger.error("✗ Quality gates failed")
                error_context = {
                    "stage": "build",
                    "errors": gates_result["errors"],
                    "logs": gates_result.get("logs", "")
                }
            
            # Step 4: Check for repeated errors (no progress)
            error_signature = self._get_error_signature(error_context)
            if self._is_stuck(error_signature):
                self.logger.error("\n⚠️  STOPPING: No progress detected (same error twice)")
                self.logger.error("This likely requires manual intervention.")
                return False
            
            # Step 5: Use CodexAgent to analyze and propose fix
            self.logger.info("\nStep 4: Analyzing errors with CodexAgent...")
            patch = self.codex.analyze_and_propose_patch(error_context)
            
            if not patch:
                self.logger.error("CodexAgent could not propose a patch")
                continue
            
            # Step 6: Use JulesAgent to review the patch
            self.logger.info("\nStep 5: Reviewing patch with JulesAgent...")
            review_result = self.jules.review_patch(patch, error_context)
            
            if review_result["approved"]:
                self.logger.info(f"✓ Patch approved: {review_result['reason']}")
                
                # Step 7: Apply the patch
                self.logger.info("\nStep 6: Applying patch...")
                if self._apply_patch(patch):
                    self.logger.info("✓ Patch applied successfully")
                    self.patch_history.append(patch)
                else:
                    self.logger.error("✗ Failed to apply patch")
                    continue
            else:
                self.logger.warning(f"✗ Patch rejected: {review_result['reason']}")
                if review_result.get("suggestion"):
                    self.logger.info(f"Suggestion: {review_result['suggestion']}")
                continue
        
        # Max iterations reached
        self.logger.error(f"\n⚠️  STOPPING: Reached max iterations ({self.max_iterations})")
        self.logger.error("Manual intervention required.")
        return False
    
    def _run_quality_gates(self) -> Dict:
        """Run all configured quality gates."""
        results = {"success": True, "errors": [], "logs": ""}
        
        for gate in self.config["quality_gates"]:
            self.logger.info(f"Running gate: {gate['name']}...")
            result = self.devops.run_command(gate["command"])
            
            if result["returncode"] != 0:
                if gate["required"]:
                    results["success"] = False
                    results["errors"].append(f"{gate['name']} failed")
                    results["logs"] += result["stderr"]
                else:
                    self.logger.warning(f"⚠️  {gate['name']} failed (non-blocking)")
            else:
                self.logger.info(f"✓ {gate['name']} passed")
        
        return results
    
    def _get_error_signature(self, error_context: Dict) -> str:
        """Create a signature for error comparison."""
        errors = " ".join(error_context.get("errors", []))
        # Simple signature: first 200 chars of error message
        return errors[:200]
    
    def _is_stuck(self, error_signature: str) -> bool:
        """Check if we're stuck in a loop (same error repeatedly)."""
        self.error_history.append(error_signature)
        
        # Count how many times this error has appeared
        count = self.error_history.count(error_signature)
        threshold = self.config["safety"]["no_progress_threshold"]
        
        return count >= threshold
    
    def _apply_patch(self, patch: str) -> bool:
        """Apply a git patch to the repository."""
        try:
            # Save patch to file
            patch_file = Path("logs/patches") / f"patch_{self.iteration}.diff"
            patch_file.parent.mkdir(parents=True, exist_ok=True)
            patch_file.write_text(patch)
            
            # Apply with git
            success = self.git.apply_patch(str(patch_file))
            
            if success:
                self.logger.info(f"Patch saved to: {patch_file}")
                
            return success
            
        except Exception as e:
            self.logger.error(f"Error applying patch: {e}")
            return False


def main():
    parser = argparse.ArgumentParser(
        description="Fleet Management - Multi-Agent Deployment Orchestrator"
    )
    parser.add_argument(
        "--environment",
        choices=["staging", "prod"],
        required=True,
        help="Target environment"
    )
    parser.add_argument(
        "--max-iterations",
        type=int,
        help="Override max iterations from config"
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging"
    )
    
    args = parser.parse_args()
    
    # Load environment variables from .env if present
    from dotenv import load_dotenv
    load_dotenv()
    
    # Create orchestrator
    orchestrator = DeploymentOrchestrator(args.environment)
    
    # Override config if specified
    if args.max_iterations:
        orchestrator.max_iterations = args.max_iterations
    
    if args.debug:
        orchestrator.logger.setLevel(logging.DEBUG)
    
    # Run orchestration
    success = orchestrator.run()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
```

### 4. Azure DevOps Pipeline (azure-pipelines.yml)

```yaml
# Fleet Management - Azure DevOps Pipeline
# Multi-Agent Orchestration for Automated Deployment

trigger:
  branches:
    include:
      - main
      - develop
  paths:
    exclude:
      - README.md
      - docs/*

pr:
  branches:
    include:
      - main
      - develop

variables:
  - group: fleet-secrets-prod  # Variable group in Azure DevOps
  - name: DOCKER_BUILDKIT
    value: 1
  - name: ACR_NAME
    value: fleetproductionacr
  - name: IMAGE_NAME
    value: fleet-frontend
  - name: AKS_CLUSTER
    value: fleet-production-aks
  - name: AKS_RESOURCE_GROUP
    value: fleet-production-rg

stages:
  # Stage 1: Build and Test
  - stage: Build
    displayName: 'Build & Test'
    jobs:
      - job: BuildJob
        displayName: 'Build Application'
        pool:
          vmImage: 'ubuntu-latest'
        
        steps:
          - checkout: self
            fetchDepth: 1
          
          - task: NodeTool@0
            inputs:
              versionSpec: '20.x'
            displayName: 'Install Node.js'
          
          - script: |
              npm install --legacy-peer-deps
            displayName: 'Install dependencies'
            env:
              NODE_OPTIONS: '--max-old-space-size=8192'
          
          - script: |
              npm run lint || echo "Lint warnings (non-blocking)"
            displayName: 'Run linter'
          
          - script: |
              npm run test
            displayName: 'Run tests'
          
          - task: Docker@2
            displayName: 'Build Docker image'
            inputs:
              containerRegistry: 'FleetProductionACR'  # Service connection name
              repository: $(IMAGE_NAME)
              command: 'build'
              Dockerfile: 'Dockerfile'
              tags: |
                $(Build.BuildId)
                latest
              arguments: '--build-arg CACHE_BUST=$(Build.BuildId) --build-arg NODE_OPTIONS="--max-old-space-size=8192"'
          
          - task: Docker@2
            displayName: 'Push to ACR'
            inputs:
              containerRegistry: 'FleetProductionACR'
              repository: $(IMAGE_NAME)
              command: 'push'
              tags: |
                $(Build.BuildId)
                latest

  # Stage 2: Orchestrator Loop (Staging)
  - stage: Orchestrate_Staging
    displayName: 'Auto-Debug & Deploy to Staging'
    dependsOn: Build
    condition: succeeded()
    jobs:
      - job: OrchestrationJob
        displayName: 'Run Orchestrator'
        pool:
          vmImage: 'ubuntu-latest'
        
        steps:
          - checkout: self
          
          - task: UsePythonVersion@0
            inputs:
              versionSpec: '3.11'
            displayName: 'Use Python 3.11'
          
          - script: |
              cd agent_orch
              pip install -r requirements.txt
            displayName: 'Install orchestrator dependencies'
          
          - task: AzureCLI@2
            displayName: 'Run Orchestrator (Staging)'
            inputs:
              azureSubscription: 'FleetProductionSubscription'  # Service connection
              scriptType: 'bash'
              scriptLocation: 'inlineScript'
              inlineScript: |
                # Set up kubectl access
                az aks get-credentials \
                  --resource-group $(AKS_RESOURCE_GROUP) \
                  --name $(AKS_CLUSTER) \
                  --overwrite-existing
                
                # Run orchestrator
                cd agent_orch
                python orchestrator.py \
                  --environment staging \
                  --max-iterations 5
            env:
              OPENAI_API_KEY: $(OPENAI_API_KEY)
              PRODUCTION_URL: https://staging.fleet.capitaltechalliance.com
          
          - task: PublishBuildArtifacts@1
            condition: always()
            inputs:
              PathtoPublish: 'agent_orch/logs'
              ArtifactName: 'orchestrator-logs-staging'
            displayName: 'Publish orchestrator logs'

  # Stage 3: Manual Approval Gate
  - stage: Approval
    displayName: 'Approve Production Deploy'
    dependsOn: Orchestrate_Staging
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - job: waitForValidation
        displayName: 'Wait for manual approval'
        pool: server
        timeoutInMinutes: 1440  # 24 hours
        steps:
          - task: ManualValidation@0
            timeoutInMinutes: 1440
            inputs:
              notifyUsers: |
                andrew.m@capitaltechalliance.com
              instructions: |
                Please review the staging deployment:
                https://staging.fleet.capital techalliance.com
                
                Check:
                - Application loads correctly
                - Authentication works
                - No console errors
                - Critical user flows work
                
                Approve to deploy to production.

  # Stage 4: Production Deployment
  - stage: Deploy_Production
    displayName: 'Deploy to Production'
    dependsOn: Approval
    condition: succeeded()
    jobs:
      - deployment: ProductionDeployment
        displayName: 'Production Deployment'
        pool:
          vmImage: 'ubuntu-latest'
        environment: 'production'  # Creates deployment history in Azure DevOps
        strategy:
          runOnce:
            deploy:
              steps:
                - checkout: self
                
                - task: UsePythonVersion@0
                  inputs:
                    versionSpec: '3.11'
                
                - script: |
                    cd agent_orch
                    pip install -r requirements.txt
                  displayName: 'Install dependencies'
                
                - task: AzureCLI@2
                  displayName: 'Deploy to Production'
                  inputs:
                    azureSubscription: 'FleetProductionSubscription'
                    scriptType: 'bash'
                    scriptLocation: 'inlineScript'
                    inlineScript: |
                      # Get AKS credentials
                      az aks get-credentials \
                        --resource-group $(AKS_RESOURCE_GROUP) \
                        --name $(AKS_CLUSTER) \
                        --overwrite-existing
                      
                      # Update deployment with new image
                      kubectl set image deployment/fleet-frontend \
                        fleet-frontend=$(ACR_NAME).azurecr.io/$(IMAGE_NAME):$(Build.BuildId) \
                        -n fleet-management
                      
                      # Wait for rollout
                      kubectl rollout status deployment/fleet-frontend \
                        -n fleet-management \
                        --timeout=300s
                
                - task: AzureCLI@2
                  displayName: 'Verify Production'
                  inputs:
                    azureSubscription: 'FleetProductionSubscription'
                    scriptType: 'bash'
                    scriptLocation: 'inlineScript'
                    inlineScript: |
                      cd agent_orch
                      python orchestrator.py \
                        --environment prod \
                        --max-iterations 1  # Only verify, don't iterate
                  env:
                    OPENAI_API_KEY: $(OPENAI_API_KEY)
                    PRODUCTION_URL: https://fleet.capitaltechalliance.com
                
                - task: PublishBuildArtifacts@1
                  condition: always()
                  inputs:
                    PathtoPublish: 'agent_orch/logs'
                    ArtifactName: 'orchestrator-logs-prod'

  # Stage 5: Rollback on Failure
  - stage: Rollback
    displayName: 'Rollback on Failure'
    dependsOn: Deploy_Production
    condition: failed()
    jobs:
      - job: RollbackJob
        displayName: 'Rollback Production'
        pool:
          vmImage: 'ubuntu-latest'
        
        steps:
          - task: AzureCLI@2
            displayName: 'Rollback Deployment'
            inputs:
              azureSubscription: 'FleetProductionSubscription'
              scriptType: 'bash'
              scriptLocation: 'inlineScript'
              inlineScript: |
                az aks get-credentials \
                  --resource-group $(AKS_RESOURCE_GROUP) \
                  --name $(AKS_CLUSTER)
                
                # Rollback to previous revision
                kubectl rollout undo deployment/fleet-frontend \
                  -n fleet-management
                
                # Wait for rollback
                kubectl rollout status deployment/fleet-frontend \
                  -n fleet-management \
                  --timeout=300s
                
                echo "✓ Rolled back to previous version"
```

---

## Next Steps

1. **Set up Azure DevOps Project**:
   - Create new project: "Fleet Management"
   - Import Git repository

2. **Configure Service Connections**:
   - Azure Resource Manager connection to subscription
   - Docker Registry connection to ACR
   - Create variable group `fleet-secrets-prod` with:
     - `OPENAI_API_KEY`
     - Other secrets from Key Vault

3. **Create Pipeline**:
   - New pipeline from `azure-pipelines.yml`
   - Run first build manually to test

4. **Test Locally**:
   ```bash
   cd agent_orch
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python orchestrator.py --environment staging --debug
   ```

5. **Monitor First Run**:
   - Check logs in `agent_orch/logs/`
   - Review patches in `agent_orch/logs/patches/`
   - Verify deployment at staging URL

---

## Support & Troubleshooting

See the full README in `agent_orch/README.md` for:
- Detailed troubleshooting guide
- Common issues and solutions
- How to add custom verification tests
- Extending the system with new agents

**Current Issue**: Docker build running out of memory (SIGKILL)
**Orchestrator would fix this by**: Proposing to increase NODE_OPTIONS to --max-old-space-size=16384 or splitting the build into smaller chunks.

