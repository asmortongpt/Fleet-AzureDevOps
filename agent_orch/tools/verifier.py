"""
Deployment Verifier Tool
Post-deployment verification with health checks and smoke tests
"""

import logging
import time
import requests
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


class DeploymentVerifier:
    """
    Deployment verification handler
    """
    
    def __init__(self, config: Dict):
        self.config = config
        self.verification_config = config.get('verification', {})
        
    def check_health_endpoint(
        self,
        url: str,
        expected_status: int = 200,
        timeout: int = 10,
        retries: int = 5,
        retry_delay: int = 10
    ) -> Tuple[bool, str]:
        """
        Check health endpoint with retries
        
        Returns:
            Tuple[bool, str]: (success, message)
        """
        logger.info(f"🏥 Checking health endpoint: {url}")
        
        for attempt in range(retries):
            try:
                response = requests.get(url, timeout=timeout, verify=True)
                
                if response.status_code == expected_status:
                    logger.info(f"✅ Health check passed (HTTP {response.status_code})")
                    return True, f"Health check passed (HTTP {response.status_code})"
                else:
                    logger.warning(f"⚠️ Unexpected status: HTTP {response.status_code}")
                    
            except requests.exceptions.Timeout:
                logger.warning(f"⏱️ Timeout on attempt {attempt + 1}/{retries}")
                
            except requests.exceptions.ConnectionError as e:
                logger.warning(f"🔌 Connection error on attempt {attempt + 1}/{retries}: {str(e)}")
                
            except Exception as e:
                logger.warning(f"❌ Error on attempt {attempt + 1}/{retries}: {str(e)}")
            
            if attempt < retries - 1:
                logger.info(f"⏳ Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
        
        error_msg = f"Health check failed after {retries} attempts"
        logger.error(f"❌ {error_msg}")
        return False, error_msg
    
    def verify_critical_flows(
        self,
        base_url: str,
        flows: Optional[List[Dict]] = None
    ) -> Tuple[bool, List[Dict]]:
        """
        Verify critical user flows
        
        Returns:
            Tuple[bool, List[Dict]]: (all_passed, results)
        """
        if not flows:
            flows = self.verification_config.get('critical_flows', [])
        
        logger.info(f"🔍 Verifying {len(flows)} critical flows")
        
        results = []
        all_passed = True
        
        for flow in flows:
            name = flow.get('name', 'Unknown')
            endpoint = flow.get('endpoint', '/')
            expected_status = flow.get('expected_status', 200)
            
            url = f"{base_url.rstrip('/')}{endpoint}"
            logger.info(f"📋 Testing: {name}")
            
            try:
                response = requests.get(url, timeout=10, verify=True)
                passed = response.status_code == expected_status
                
                result = {
                    'name': name,
                    'url': url,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'passed': passed
                }
                
                results.append(result)
                
                if passed:
                    logger.info(f"✅ {name}: PASS")
                else:
                    logger.error(f"❌ {name}: FAIL (expected {expected_status}, got {response.status_code})")
                    all_passed = False
                    
            except Exception as e:
                logger.error(f"❌ {name}: ERROR - {str(e)}")
                results.append({
                    'name': name,
                    'url': url,
                    'error': str(e),
                    'passed': False
                })
                all_passed = False
        
        return all_passed, results
    
    def verify_environment(
        self,
        environment: str,
        env_config: Dict
    ) -> Tuple[bool, Dict]:
        """
        Complete environment verification
        
        Returns:
            Tuple[bool, Dict]: (success, verification_report)
        """
        logger.info(f"🚀 Verifying {environment} environment")
        
        report = {
            'environment': environment,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'health_check': {},
            'critical_flows': {},
            'overall_status': 'unknown'
        }
        
        # 1. Health check
        health_endpoint = env_config.get('health_endpoint')
        if health_endpoint:
            health_passed, health_msg = self.check_health_endpoint(health_endpoint)
            report['health_check'] = {
                'passed': health_passed,
                'message': health_msg,
                'endpoint': health_endpoint
            }
        else:
            logger.warning("⚠️ No health endpoint configured")
            report['health_check'] = {
                'passed': None,
                'message': 'No health endpoint configured'
            }
        
        # 2. Verification endpoints
        verification_endpoints = env_config.get('verification_endpoints', [])
        if verification_endpoints:
            endpoint_results = []
            
            for endpoint_config in verification_endpoints:
                url = endpoint_config.get('url')
                expected_status = endpoint_config.get('expected_status', 200)
                timeout = endpoint_config.get('timeout', 10)
                
                passed, msg = self.check_health_endpoint(
                    url,
                    expected_status=expected_status,
                    timeout=timeout,
                    retries=3
                )
                
                endpoint_results.append({
                    'url': url,
                    'passed': passed,
                    'message': msg
                })
            
            report['verification_endpoints'] = endpoint_results
        
        # 3. Critical flows
        base_url = env_config.get('health_endpoint', '').rsplit('/health', 1)[0]
        if base_url:
            flows_passed, flows_results = self.verify_critical_flows(base_url)
            report['critical_flows'] = {
                'passed': flows_passed,
                'results': flows_results
            }
        
        # Determine overall status
        health_ok = report['health_check'].get('passed', False)
        flows_ok = report['critical_flows'].get('passed', True)  # Default true if not tested
        
        overall_passed = health_ok and flows_ok
        report['overall_status'] = 'PASS' if overall_passed else 'FAIL'
        
        if overall_passed:
            logger.info(f"✅ {environment} verification PASSED")
        else:
            logger.error(f"❌ {environment} verification FAILED")
        
        return overall_passed, report
    
    def wait_for_deployment(
        self,
        health_endpoint: str,
        max_wait: int = 300,
        check_interval: int = 10
    ) -> bool:
        """
        Wait for deployment to become healthy
        
        Args:
            health_endpoint: Health check URL
            max_wait: Maximum wait time in seconds
            check_interval: Seconds between checks
        
        Returns:
            bool: True if deployment became healthy
        """
        logger.info(f"⏳ Waiting for deployment (max {max_wait}s)")
        
        elapsed = 0
        while elapsed < max_wait:
            try:
                response = requests.get(health_endpoint, timeout=5, verify=True)
                if response.status_code == 200:
                    logger.info(f"✅ Deployment healthy after {elapsed}s")
                    return True
            except Exception:
                pass
            
            time.sleep(check_interval)
            elapsed += check_interval
            logger.info(f"⏳ Still waiting... ({elapsed}s / {max_wait}s)")
        
        logger.error(f"❌ Deployment did not become healthy after {max_wait}s")
        return False
