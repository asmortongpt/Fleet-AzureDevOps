"""
DevOpsAgent - Azure & Kubernetes Operations
Handles Azure CLI, kubectl, and Docker commands
"""

import logging
from typing import Dict, List, Optional, Tuple
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tools.shell import ShellExecutor

logger = logging.getLogger(__name__)


class DevOpsAgent:
    """
    DevOpsAgent handles infrastructure operations
    """
    
    def __init__(self, config: Dict, dry_run: bool = False):
        self.config = config
        self.dry_run = dry_run
        self.shell = ShellExecutor(config, dry_run)
        self.azure_config = config.get('azure', {})
        self.k8s_config = config.get('kubernetes', {})
        
        logger.info(f"✅ DevOpsAgent initialized (dry_run: {dry_run})")
    
    def check_az_login(self) -> bool:
        """Check if Azure CLI is logged in"""
        logger.info("🔐 Checking Azure CLI login")
        
        try:
            code, _, _ = self.shell.execute(
                self.azure_config.get('commands', {}).get('login_check', 'az account show'),
                timeout=30
            )
            
            if code == 0:
                logger.info("✅ Azure CLI authenticated")
                return True
            else:
                logger.warning("⚠️ Azure CLI not authenticated")
                return False
                
        except Exception as e:
            logger.error(f"❌ Failed to check Azure login: {str(e)}")
            return False
    
    def login_acr(self) -> bool:
        """Login to Azure Container Registry"""
        logger.info("🔐 Logging into ACR")
        
        acr_name = self.azure_config.get('acr_name', 'fleetproductionacr')
        
        try:
            code, _, stderr = self.shell.execute(
                f"az acr login --name {acr_name}",
                timeout=60
            )
            
            if code == 0:
                logger.info("✅ ACR login successful")
                return True
            else:
                logger.error(f"❌ ACR login failed: {stderr}")
                return False
                
        except Exception as e:
            logger.error(f"❌ ACR login error: {str(e)}")
            return False
    
    def build_and_push_docker(
        self,
        image_name: str,
        tag: str,
        dockerfile: str = "Dockerfile",
        build_args: Optional[Dict] = None
    ) -> bool:
        """
        Build and push Docker image using Azure DevOps agent
        """
        logger.info(f"🐳 Building Docker image: {image_name}:{tag}")
        
        # Build args
        args_str = ""
        if build_args:
            args_str = " ".join([f"--build-arg {k}={v}" for k, v in build_args.items()])
        
        registry = self.azure_config.get('acr_name', 'fleetproductionacr') + '.azurecr.io'
        full_image = f"{registry}/{image_name}:{tag}"
        
        try:
            # Build image
            build_cmd = f"docker build {args_str} -t {full_image} -f {dockerfile} ."
            code, stdout, stderr = self.shell.execute(build_cmd, timeout=1800)  # 30 min
            
            if code != 0:
                logger.error(f"❌ Docker build failed: {stderr}")
                return False
            
            logger.info("✅ Docker build successful")
            
            # Push image
            push_cmd = f"docker push {full_image}"
            code, stdout, stderr = self.shell.execute(push_cmd, timeout=600)  # 10 min
            
            if code != 0:
                logger.error(f"❌ Docker push failed: {stderr}")
                return False
            
            logger.info(f"✅ Image pushed: {full_image}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Docker build/push error: {str(e)}")
            return False
    
    def get_aks_credentials(self) -> bool:
        """Get AKS cluster credentials"""
        logger.info("🔑 Getting AKS credentials")
        
        rg = self.azure_config.get('resource_group')
        cluster = self.azure_config.get('aks_cluster')
        
        try:
            code, _, stderr = self.shell.execute(
                f"az aks get-credentials --resource-group {rg} --name {cluster} --overwrite-existing",
                timeout=60
            )
            
            if code == 0:
                logger.info("✅ AKS credentials retrieved")
                return True
            else:
                logger.error(f"❌ Failed to get AKS credentials: {stderr}")
                return False
                
        except Exception as e:
            logger.error(f"❌ AKS credentials error: {str(e)}")
            return False
    
    def deploy_to_k8s(
        self,
        namespace: str,
        manifests: List[str]
    ) -> bool:
        """Deploy to Kubernetes"""
        logger.info(f"🚀 Deploying to k8s namespace: {namespace}")
        
        try:
            # Apply manifests
            for manifest in manifests:
                logger.info(f"📝 Applying {manifest}")
                code, _, stderr = self.shell.execute(
                    f"kubectl apply -f {manifest} -n {namespace}",
                    timeout=self.k8s_config.get('apply_timeout', 300)
                )
                
                if code != 0:
                    logger.error(f"❌ Failed to apply {manifest}: {stderr}")
                    return False
            
            logger.info("✅ All manifests applied")
            return True
            
        except Exception as e:
            logger.error(f"❌ k8s deployment error: {str(e)}")
            return False
    
    def check_pod_health(
        self,
        namespace: str,
        selector: str,
        expected_count: int = 1
    ) -> Tuple[bool, str]:
        """
        Check if pods are healthy
        
        Returns:
            Tuple[bool, str]: (healthy, status_message)
        """
        logger.info(f"🏥 Checking pod health: {selector}")
        
        try:
            # Get pod status
            code, stdout, stderr = self.shell.execute(
                f"kubectl get pods -n {namespace} -l {selector} -o json",
                timeout=30
            )
            
            if code != 0:
                return False, f"Failed to get pods: {stderr}"
            
            import json
            pods = json.loads(stdout)
            
            if not pods.get('items'):
                return False, "No pods found"
            
            pod_count = len(pods['items'])
            ready_count = 0
            
            for pod in pods['items']:
                status = pod.get('status', {})
                phase = status.get('phase', '')
                
                if phase == 'Running':
                    # Check container readiness
                    container_statuses = status.get('containerStatuses', [])
                    if all(cs.get('ready', False) for cs in container_statuses):
                        ready_count += 1
            
            message = f"{ready_count}/{pod_count} pods ready"
            healthy = ready_count >= expected_count
            
            if healthy:
                logger.info(f"✅ Pods healthy: {message}")
            else:
                logger.warning(f"⚠️ Pods not ready: {message}")
            
            return healthy, message
            
        except Exception as e:
            logger.error(f"❌ Health check error: {str(e)}")
            return False, str(e)
