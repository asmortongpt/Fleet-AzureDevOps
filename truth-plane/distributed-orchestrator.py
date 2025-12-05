#!/usr/bin/env python3
"""
Distributed Orchestrator - Maximum Resource Utilization
Distributes tasks across Azure VM + Local VMs/Containers

Architecture:
- Master Scheduler: Coordinates work distribution
- Azure VM Worker Pool: Uses all available cores
- Local Docker Workers: Spawns containers for additional compute
- Work Queue: Task distribution with load balancing
- Result Aggregator: Collects and merges results

Resource Utilization:
- Azure VM: N-core parallel execution
- Local Machine: M Docker containers
- Total Workers: N + M concurrent tasks
"""

import subprocess
import json
import multiprocessing
import threading
import queue
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import time
import socket


class ComputeNode:
    """Represents a compute node (VM or container)"""

    def __init__(
        self,
        node_id: str,
        node_type: str,  # "azure_vm" or "local_docker"
        connection_info: Dict
    ):
        self.node_id = node_id
        self.node_type = node_type
        self.connection_info = connection_info
        self.status = "idle"
        self.current_task = None
        self.completed_tasks = 0

    def execute_task(self, task: Dict) -> Dict:
        """Execute a task on this compute node"""
        self.status = "busy"
        self.current_task = task

        try:
            if self.node_type == "azure_vm":
                result = self._execute_on_azure_vm(task)
            elif self.node_type == "local_docker":
                result = self._execute_in_docker(task)
            else:
                result = {"status": "FAILED", "error": f"Unknown node type: {self.node_type}"}

            self.completed_tasks += 1
            return result

        except Exception as e:
            return {"status": "FAILED", "error": str(e)}

        finally:
            self.status = "idle"
            self.current_task = None

    def _execute_on_azure_vm(self, task: Dict) -> Dict:
        """Execute task on Azure VM via SSH"""
        ssh_host = self.connection_info["host"]
        ssh_user = self.connection_info["user"]
        workspace = self.connection_info["workspace"]

        # Create task file
        task_file = f"/tmp/task_{task['id']}_{int(time.time())}.json"
        with open(task_file, 'w') as f:
            json.dump(task, f)

        # Copy task to VM
        subprocess.run([
            "scp",
            "-o", "StrictHostKeyChecking=no",
            "-o", "UserKnownHostsFile=/dev/null",
            task_file,
            f"{ssh_user}@{ssh_host}:{workspace}/"
        ], capture_output=True)

        # Execute on VM
        cmd = f"""
        cd {workspace} && \
        python3 -c '
import json
import sys
sys.path.insert(0, "{workspace}")
exec(open("honest-orchestrator.py").read())

with open("{Path(task_file).name}", "r") as f:
    task = json.load(f)

orch = HonestOrchestrator(workspace="{workspace}")
result = orch.execute_task(task)
print(json.dumps(result))
'
        """

        result = subprocess.run([
            "ssh",
            "-o", "StrictHostKeyChecking=no",
            "-o", "UserKnownHostsFile=/dev/null",
            f"{ssh_user}@{ssh_host}",
            cmd
        ], capture_output=True, text=True, timeout=600)

        # Parse result
        try:
            return json.loads(result.stdout)
        except:
            return {
                "status": "FAILED",
                "error": f"Failed to parse result: {result.stdout[:200]}"
            }

    def _execute_in_docker(self, task: Dict) -> Dict:
        """Execute task in local Docker container"""
        container_name = f"fleet-worker-{self.node_id}"
        workspace = self.connection_info["workspace"]

        # Create task file
        task_file = Path(workspace) / f"task_{task['id']}_{int(time.time())}.json"
        with open(task_file, 'w') as f:
            json.dump(task, f)

        # Execute in Docker container
        cmd = [
            "docker", "run",
            "--rm",
            "--name", container_name,
            "-v", f"{workspace}:/workspace",
            "-w", "/workspace",
            "python:3.11-slim",
            "python3", "-c",
            f"""
import json
import sys
sys.path.insert(0, "/workspace")
exec(open("/workspace/honest-orchestrator.py").read())

with open("{task_file.name}", "r") as f:
    task = json.load(f)

orch = HonestOrchestrator(workspace="/workspace")
result = orch.execute_task(task)
print(json.dumps(result))
"""
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)

        # Parse result
        try:
            return json.loads(result.stdout)
        except:
            return {
                "status": "FAILED",
                "error": f"Failed to parse result: {result.stdout[:200]}"
            }


class DistributedOrchestrator:
    """
    Distributed orchestrator with maximum resource utilization
    """

    def __init__(self, workspace: Path):
        self.workspace = Path(workspace)
        self.nodes: List[ComputeNode] = []
        self.work_queue = queue.Queue()
        self.result_queue = queue.Queue()
        self.results = []
        self.lock = threading.Lock()

    def add_azure_vm_nodes(
        self,
        vm_host: str,
        vm_user: str,
        vm_workspace: str,
        num_workers: int
    ):
        """Add Azure VM workers (parallel SSH connections)"""
        print(f"\n🖥️  Adding {num_workers} Azure VM workers...")

        for i in range(num_workers):
            node = ComputeNode(
                node_id=f"azure-vm-{i+1}",
                node_type="azure_vm",
                connection_info={
                    "host": vm_host,
                    "user": vm_user,
                    "workspace": vm_workspace
                }
            )
            self.nodes.append(node)

        print(f"   ✅ {num_workers} Azure VM workers ready")

    def add_local_docker_nodes(self, num_workers: int):
        """Add local Docker container workers"""
        print(f"\n🐳 Adding {num_workers} local Docker workers...")

        # Check if Docker is available
        try:
            subprocess.run(["docker", "ps"], capture_output=True, check=True)
        except:
            print("   ⚠️  Docker not available - skipping local workers")
            return

        for i in range(num_workers):
            node = ComputeNode(
                node_id=f"local-docker-{i+1}",
                node_type="local_docker",
                connection_info={
                    "workspace": str(self.workspace)
                }
            )
            self.nodes.append(node)

        print(f"   ✅ {num_workers} local Docker workers ready")

    def add_local_process_nodes(self, num_workers: int):
        """Add local multiprocessing workers (fastest for local work)"""
        print(f"\n⚡ Adding {num_workers} local process workers...")

        for i in range(num_workers):
            node = ComputeNode(
                node_id=f"local-process-{i+1}",
                node_type="local_process",
                connection_info={
                    "workspace": str(self.workspace)
                }
            )
            self.nodes.append(node)

        print(f"   ✅ {num_workers} local process workers ready")

    def _worker_thread(self, node: ComputeNode):
        """Worker thread that processes tasks from queue"""
        while True:
            try:
                task = self.work_queue.get(timeout=1)

                if task is None:  # Poison pill
                    break

                print(f"   🔧 {node.node_id} executing: {task['name']}")

                result = node.execute_task(task)
                result["node_id"] = node.node_id
                result["node_type"] = node.node_type

                self.result_queue.put(result)

                self.work_queue.task_done()

            except queue.Empty:
                continue
            except Exception as e:
                print(f"   ❌ {node.node_id} error: {e}")

    def execute_distributed(self, tasks: List[Dict]) -> List[Dict]:
        """
        Execute tasks distributed across all nodes

        Returns:
            List of task results
        """
        print("\n" + "=" * 80)
        print("DISTRIBUTED EXECUTION")
        print("=" * 80)

        total_workers = len(self.nodes)
        print(f"\n📊 Cluster Status:")
        print(f"   Total Workers: {total_workers}")
        print(f"   Azure VM Workers: {sum(1 for n in self.nodes if n.node_type == 'azure_vm')}")
        print(f"   Local Docker Workers: {sum(1 for n in self.nodes if n.node_type == 'local_docker')}")
        print(f"   Local Process Workers: {sum(1 for n in self.nodes if n.node_type == 'local_process')}")
        print(f"   Total Tasks: {len(tasks)}")

        # Fill work queue
        for task in tasks:
            self.work_queue.put(task)

        # Start worker threads
        threads = []
        for node in self.nodes:
            thread = threading.Thread(target=self._worker_thread, args=(node,))
            thread.daemon = True
            thread.start()
            threads.append(thread)

        # Monitor progress
        start_time = time.time()
        completed = 0
        last_update = 0

        while completed < len(tasks):
            # Check result queue
            try:
                result = self.result_queue.get(timeout=0.1)
                self.results.append(result)
                completed += 1

                # Progress update every 5 seconds or on completion
                now = time.time()
                if now - last_update >= 5 or completed == len(tasks):
                    elapsed = now - start_time
                    rate = completed / elapsed if elapsed > 0 else 0

                    print(f"\n📊 Progress: {completed}/{len(tasks)} tasks ({completed/len(tasks)*100:.1f}%)")
                    print(f"   Elapsed: {elapsed:.1f}s")
                    print(f"   Rate: {rate:.2f} tasks/sec")

                    # Show active nodes
                    active_nodes = [n for n in self.nodes if n.status == "busy"]
                    print(f"   Active Workers: {len(active_nodes)}/{total_workers}")

                    last_update = now

            except queue.Empty:
                pass

        # Wait for all threads to complete
        self.work_queue.join()

        # Send poison pills
        for _ in self.nodes:
            self.work_queue.put(None)

        # Wait for threads to exit
        for thread in threads:
            thread.join(timeout=5)

        print(f"\n✅ Distributed execution complete")
        print(f"   Total time: {time.time() - start_time:.1f}s")
        print(f"   Average rate: {len(tasks) / (time.time() - start_time):.2f} tasks/sec")

        return self.results


class MaximumResourceOrchestrator:
    """
    Maximum resource utilization orchestrator
    Combines Azure VM + Local compute for fastest execution
    """

    def __init__(self, workspace: Path):
        self.workspace = Path(workspace)
        self.distributed_orch = DistributedOrchestrator(workspace)

    def auto_configure_cluster(self):
        """Automatically configure cluster with maximum resources"""
        print("\n🚀 Auto-configuring compute cluster...")

        # Detect local CPU cores
        local_cores = multiprocessing.cpu_count()
        print(f"   Local CPU cores: {local_cores}")

        # Add Azure VM workers (use N cores on VM)
        azure_vm_workers = 8  # Assume 8-core Azure VM
        self.distributed_orch.add_azure_vm_nodes(
            vm_host="172.191.51.49",
            vm_user="azureuser",
            vm_workspace="/home/azureuser/agent-workspace/fleet-local",
            num_workers=azure_vm_workers
        )

        # Add local process workers (use all local cores)
        local_workers = local_cores
        self.distributed_orch.add_local_process_nodes(num_workers=local_workers)

        # Optionally add Docker workers (if Docker available and cores available)
        # docker_workers = max(0, local_cores - 4)  # Leave some cores for system
        # if docker_workers > 0:
        #     self.distributed_orch.add_local_docker_nodes(num_workers=docker_workers)

        total_workers = azure_vm_workers + local_workers
        print(f"\n✅ Cluster configured: {total_workers} total workers")

        return total_workers

    def execute_all_tasks(self, tasks: List[Dict]) -> Dict:
        """Execute all tasks with maximum parallelization"""

        # Configure cluster
        total_workers = self.auto_configure_cluster()

        # Execute distributed
        results = self.distributed_orch.execute_distributed(tasks)

        # Aggregate results
        summary = {
            "total_tasks": len(tasks),
            "total_workers": total_workers,
            "successful": sum(1 for r in results if r.get("status") == "SUCCESS"),
            "failed": sum(1 for r in results if r.get("status") != "SUCCESS"),
            "results": results
        }

        return summary


if __name__ == "__main__":
    print("Distributed Orchestrator - Maximum Resource Utilization")
    print("=" * 80)

    workspace = Path.cwd()

    # Create orchestrator
    orch = MaximumResourceOrchestrator(workspace)

    # Load tasks
    try:
        exec(open(workspace / "production-tasks.py").read(), globals())
        tasks = PHASE_1_DOCUMENTATION_TASKS + PHASE_2_TEST_INFRASTRUCTURE_TASKS

        print(f"\n📋 Loaded {len(tasks)} tasks")

        # Execute with maximum resources
        summary = orch.execute_all_tasks(tasks)

        print("\n" + "=" * 80)
        print("EXECUTION SUMMARY")
        print("=" * 80)
        print(f"Total Tasks: {summary['total_tasks']}")
        print(f"Total Workers: {summary['total_workers']}")
        print(f"✅ Successful: {summary['successful']}")
        print(f"❌ Failed: {summary['failed']}")

    except Exception as e:
        print(f"❌ Execution failed: {e}")
        import traceback
        traceback.print_exc()
