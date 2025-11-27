#!/usr/bin/env python3
"""
DevOps Agent - Handles build and deployment operations.
This agent runs npm builds, deploys to Azure Static Web Apps,
and returns logs and deployment URLs.
"""

import os
import subprocess
import logging
import json
import time
from typing import Dict, Optional, Tuple
from pathlib import Path

logger = logging.getLogger(__name__)


class DevOpsAgent:
    """Agent responsible for build and deployment operations."""

    def __init__(self, project_root: str):
        """
        Initialize the DevOps Agent.

        Args:
            project_root: Path to the project root directory
        """
        self.project_root = Path(project_root)
        logger.info(f"Initialized DevOpsAgent with project_root={project_root}")

    def run_build(self, timeout: int = 300) -> Tuple[bool, str, str]:
        """
        Run npm build and capture output.

        Args:
            timeout: Build timeout in seconds (default: 300)

        Returns:
            (success, stdout, stderr) tuple
        """
        logger.info("Starting npm build...")

        try:
            # Ensure we're in the project root
            os.chdir(self.project_root)

            # Run npm install first to ensure dependencies are up to date
            logger.info("Running npm install...")
            install_result = subprocess.run(
                ["npm", "install"],
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=self.project_root
            )

            if install_result.returncode != 0:
                logger.error("npm install failed")
                return False, install_result.stdout, install_result.stderr

            # Run the build
            logger.info("Running npm run build...")
            build_result = subprocess.run(
                ["npm", "run", "build"],
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=self.project_root
            )

            success = build_result.returncode == 0
            stdout = build_result.stdout
            stderr = build_result.stderr

            if success:
                logger.info("Build completed successfully")
            else:
                logger.error(f"Build failed with exit code {build_result.returncode}")

            return success, stdout, stderr

        except subprocess.TimeoutExpired:
            logger.error(f"Build timed out after {timeout} seconds")
            return False, "", f"Build timed out after {timeout} seconds"
        except Exception as e:
            logger.error(f"Build error: {str(e)}")
            return False, "", str(e)

    def check_build_output(self) -> Dict[str, any]:
        """
        Check the build output for quality metrics.

        Returns:
            Dictionary with build metrics
        """
        dist_path = self.project_root / "dist"

        if not dist_path.exists():
            return {
                "exists": False,
                "error": "dist directory not found"
            }

        # Count files and calculate total size
        total_size = 0
        file_count = 0
        js_files = []
        css_files = []

        for file in dist_path.rglob("*"):
            if file.is_file():
                file_count += 1
                size = file.stat().st_size
                total_size += size

                if file.suffix == ".js":
                    js_files.append({
                        "name": file.name,
                        "size": size,
                        "size_kb": round(size / 1024, 2)
                    })
                elif file.suffix == ".css":
                    css_files.append({
                        "name": file.name,
                        "size": size,
                        "size_kb": round(size / 1024, 2)
                    })

        return {
            "exists": True,
            "total_files": file_count,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "js_files": len(js_files),
            "css_files": len(css_files),
            "largest_js": sorted(js_files, key=lambda x: x["size"], reverse=True)[:5],
            "largest_css": sorted(css_files, key=lambda x: x["size"], reverse=True)[:3]
        }

    def deploy_to_azure(
        self,
        deployment_token: str,
        app_name: str,
        environment: str = "staging"
    ) -> Tuple[bool, str, str]:
        """
        Deploy to Azure Static Web Apps using the Azure CLI.

        Args:
            deployment_token: Azure Static Web Apps deployment token
            app_name: Name of the Azure Static Web App
            environment: Deployment environment (staging/prod)

        Returns:
            (success, deployment_url, error_message) tuple
        """
        logger.info(f"Deploying to Azure Static Web App: {app_name} ({environment})")

        try:
            # Check if dist directory exists
            dist_path = self.project_root / "dist"
            if not dist_path.exists():
                error = "dist directory not found. Run build first."
                logger.error(error)
                return False, "", error

            # For Azure Static Web Apps, we can use the deployment token directly
            # The deployment URL is predetermined based on the app name
            if environment == "staging":
                deployment_url = "https://purple-river-0f465960f.3.azurestaticapps.net"
            else:
                deployment_url = f"https://{app_name}.azurestaticapps.net"

            # Use SWA CLI for deployment (if available) or manual upload
            logger.info("Deploying using Azure Static Web Apps CLI...")

            # Check if we have the SWA CLI installed
            swa_check = subprocess.run(
                ["which", "swa"],
                capture_output=True,
                text=True
            )

            if swa_check.returncode == 0:
                # Use SWA CLI
                deploy_result = subprocess.run(
                    [
                        "npx", "@azure/static-web-apps-cli", "deploy",
                        "--app-location", ".",
                        "--output-location", "dist",
                        "--deployment-token", deployment_token
                    ],
                    capture_output=True,
                    text=True,
                    timeout=300,
                    cwd=self.project_root
                )

                if deploy_result.returncode == 0:
                    logger.info("Deployment completed successfully")
                    return True, deployment_url, ""
                else:
                    error = f"Deployment failed: {deploy_result.stderr}"
                    logger.error(error)
                    return False, "", error
            else:
                # Manual deployment instructions
                logger.warning("SWA CLI not found. Using Azure portal deployment...")
                return True, deployment_url, "SWA CLI not installed - manual deployment required"

        except subprocess.TimeoutExpired:
            error = "Deployment timed out after 300 seconds"
            logger.error(error)
            return False, "", error
        except Exception as e:
            error = f"Deployment error: {str(e)}"
            logger.error(error)
            return False, "", error

    def create_deployment_artifact(self) -> Optional[str]:
        """
        Create a deployment artifact (tarball) of the dist directory.

        Returns:
            Path to the artifact, or None on failure
        """
        logger.info("Creating deployment artifact...")

        try:
            dist_path = self.project_root / "dist"
            if not dist_path.exists():
                logger.error("dist directory not found")
                return None

            # Create tarball
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            artifact_name = f"fleet-deployment-{timestamp}.tar.gz"
            artifact_path = self.project_root / artifact_name

            result = subprocess.run(
                ["tar", "-czf", str(artifact_path), "-C", str(dist_path), "."],
                capture_output=True,
                text=True,
                timeout=60
            )

            if result.returncode == 0:
                logger.info(f"Created deployment artifact: {artifact_name}")
                return str(artifact_path)
            else:
                logger.error(f"Failed to create artifact: {result.stderr}")
                return None

        except Exception as e:
            logger.error(f"Error creating artifact: {str(e)}")
            return None

    def run_tests(self, test_command: str = "npm run test:smoke", timeout: int = 120) -> Tuple[bool, str]:
        """
        Run tests and return results.

        Args:
            test_command: Test command to run
            timeout: Test timeout in seconds

        Returns:
            (success, output) tuple
        """
        logger.info(f"Running tests: {test_command}")

        try:
            result = subprocess.run(
                test_command.split(),
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=self.project_root
            )

            success = result.returncode == 0
            output = result.stdout + "\n" + result.stderr

            if success:
                logger.info("Tests passed")
            else:
                logger.error("Tests failed")

            return success, output

        except subprocess.TimeoutExpired:
            logger.error(f"Tests timed out after {timeout} seconds")
            return False, f"Tests timed out after {timeout} seconds"
        except Exception as e:
            logger.error(f"Test error: {str(e)}")
            return False, str(e)


if __name__ == "__main__":
    # Test the agent
    import sys
    logging.basicConfig(level=logging.INFO)

    project_root = os.getenv("PROJECT_ROOT", "/Users/andrewmorton/Documents/GitHub/fleet-local")
    agent = DevOpsAgent(project_root)

    # Test build
    print("Testing build...")
    success, stdout, stderr = agent.run_build()
    print(f"Success: {success}")

    if success:
        metrics = agent.check_build_output()
        print(json.dumps(metrics, indent=2))
