#!/usr/bin/env python3
"""
Task Dependency Graph Analyzer
Builds and resolves task dependencies for parallel execution
"""

import json
from typing import Dict, List, Set, Optional, Tuple
from dataclasses import dataclass, field
from collections import defaultdict, deque

# ============================================================================
# Graph Data Structures
# ============================================================================

@dataclass
class TaskNode:
    """Represents a task in the dependency graph"""
    task_id: str
    name: str
    phase: str
    priority: int
    status: str
    depends_on: Set[str] = field(default_factory=set)
    blocks: Set[str] = field(default_factory=set)
    agent_type: Optional[str] = None
    parallelizable: bool = True

    def can_execute(self, completed_tasks: Set[str]) -> bool:
        """Check if all dependencies are satisfied"""
        return self.depends_on.issubset(completed_tasks)

    def to_dict(self) -> Dict:
        return {
            'task_id': self.task_id,
            'name': self.name,
            'phase': self.phase,
            'priority': self.priority,
            'status': self.status,
            'depends_on': list(self.depends_on),
            'blocks': list(self.blocks),
            'agent_type': self.agent_type,
            'parallelizable': self.parallelizable
        }

# ============================================================================
# Dependency Graph
# ============================================================================

class TaskDependencyGraph:
    """Manages task dependencies and execution order"""

    def __init__(self):
        self.nodes: Dict[str, TaskNode] = {}
        self.adjacency_list: Dict[str, Set[str]] = defaultdict(set)
        self.reverse_adjacency: Dict[str, Set[str]] = defaultdict(set)

    def add_task(self, task_id: str, name: str, phase: str, priority: int = 5,
                 agent_type: str = None, parallelizable: bool = True):
        """Add a task node to the graph"""
        if task_id in self.nodes:
            return

        node = TaskNode(
            task_id=task_id,
            name=name,
            phase=phase,
            priority=priority,
            status='pending',
            agent_type=agent_type,
            parallelizable=parallelizable
        )
        self.nodes[task_id] = node

    def add_dependency(self, task_id: str, depends_on_id: str):
        """Add a dependency: task_id depends on depends_on_id"""
        if task_id == depends_on_id:
            raise ValueError(f"Task cannot depend on itself: {task_id}")

        if task_id not in self.nodes or depends_on_id not in self.nodes:
            raise ValueError(f"Both tasks must exist in graph")

        # Add to node's depends_on set
        self.nodes[task_id].depends_on.add(depends_on_id)
        self.nodes[depends_on_id].blocks.add(task_id)

        # Add to adjacency lists
        self.adjacency_list[depends_on_id].add(task_id)
        self.reverse_adjacency[task_id].add(depends_on_id)

    def get_ready_tasks(self, completed_tasks: Set[str]) -> List[TaskNode]:
        """Get all tasks ready to execute (dependencies satisfied)"""
        ready = []

        for task in self.nodes.values():
            if task.status == 'pending' and task.can_execute(completed_tasks):
                ready.append(task)

        # Sort by priority (lower number = higher priority)
        ready.sort(key=lambda t: (t.priority, t.task_id))
        return ready

    def get_parallel_batches(self) -> List[List[TaskNode]]:
        """
        Group tasks into parallel execution batches
        Each batch contains tasks that can run in parallel
        """
        batches = []
        completed = set()
        pending = set(self.nodes.keys())

        while pending:
            # Get tasks ready for execution
            ready = [
                self.nodes[tid] for tid in pending
                if self.nodes[tid].can_execute(completed) and self.nodes[tid].parallelizable
            ]

            if not ready:
                # Check for non-parallelizable tasks
                sequential = [
                    self.nodes[tid] for tid in pending
                    if self.nodes[tid].can_execute(completed) and not self.nodes[tid].parallelizable
                ]

                if sequential:
                    # Execute one non-parallelizable task
                    ready = [sequential[0]]
                else:
                    # Circular dependency or blocked
                    break

            batches.append(ready)

            # Mark as completed
            for task in ready:
                completed.add(task.task_id)
                pending.remove(task.task_id)

        return batches

    def topological_sort(self) -> List[str]:
        """
        Return tasks in topological order (dependencies first)
        Uses Kahn's algorithm
        """
        # Calculate in-degrees
        in_degree = {tid: len(self.nodes[tid].depends_on) for tid in self.nodes}

        # Queue of tasks with no dependencies
        queue = deque([tid for tid, degree in in_degree.items() if degree == 0])

        sorted_tasks = []

        while queue:
            # Sort queue by priority before processing
            queue_list = list(queue)
            queue_list.sort(key=lambda tid: self.nodes[tid].priority)
            queue = deque(queue_list)

            task_id = queue.popleft()
            sorted_tasks.append(task_id)

            # Reduce in-degree of dependent tasks
            for dependent_id in self.adjacency_list[task_id]:
                in_degree[dependent_id] -= 1
                if in_degree[dependent_id] == 0:
                    queue.append(dependent_id)

        # Check for cycles
        if len(sorted_tasks) != len(self.nodes):
            raise ValueError("Cycle detected in task dependencies")

        return sorted_tasks

    def detect_cycles(self) -> List[List[str]]:
        """Detect cycles in the dependency graph"""
        visited = set()
        rec_stack = set()
        cycles = []

        def dfs(task_id: str, path: List[str]):
            visited.add(task_id)
            rec_stack.add(task_id)
            path.append(task_id)

            for dependent_id in self.adjacency_list[task_id]:
                if dependent_id not in visited:
                    dfs(dependent_id, path.copy())
                elif dependent_id in rec_stack:
                    # Cycle detected
                    cycle_start = path.index(dependent_id)
                    cycle = path[cycle_start:] + [dependent_id]
                    cycles.append(cycle)

            rec_stack.remove(task_id)

        for task_id in self.nodes:
            if task_id not in visited:
                dfs(task_id, [])

        return cycles

    def get_critical_path(self) -> Tuple[List[str], int]:
        """
        Find the critical path (longest path through the graph)
        Returns (path, total_priority_sum)
        """
        # Topological sort
        try:
            sorted_tasks = self.topological_sort()
        except ValueError:
            return ([], 0)

        # Calculate longest path to each node
        longest_path = {tid: (0, []) for tid in self.nodes}

        for task_id in sorted_tasks:
            current_priority = self.nodes[task_id].priority

            # Check all dependencies
            for dep_id in self.nodes[task_id].depends_on:
                dep_length, dep_path = longest_path[dep_id]
                new_length = dep_length + current_priority
                if new_length > longest_path[task_id][0]:
                    longest_path[task_id] = (new_length, dep_path + [dep_id])

        # Find the maximum path
        max_task = max(longest_path.items(), key=lambda x: x[1][0])
        critical_path = max_task[1][1] + [max_task[0]]
        total_length = max_task[1][0] + self.nodes[max_task[0]].priority

        return (critical_path, total_length)

    def visualize_graph(self) -> str:
        """Generate a text-based visualization of the graph"""
        lines = ["Task Dependency Graph", "=" * 60, ""]

        # Group by phase
        phases = defaultdict(list)
        for task in self.nodes.values():
            phases[task.phase].append(task)

        for phase in sorted(phases.keys()):
            lines.append(f"\n{phase.upper()}")
            lines.append("-" * 60)

            for task in sorted(phases[phase], key=lambda t: t.priority):
                deps = ", ".join(self.nodes[d].name for d in task.depends_on) if task.depends_on else "None"
                lines.append(f"  [{task.priority}] {task.name}")
                lines.append(f"      Dependencies: {deps}")
                lines.append(f"      Blocks: {len(task.blocks)} task(s)")
                lines.append(f"      Status: {task.status}")
                lines.append("")

        return "\n".join(lines)

    def to_json(self) -> str:
        """Export graph as JSON"""
        graph_data = {
            'nodes': {tid: node.to_dict() for tid, node in self.nodes.items()},
            'edges': [
                {'from': dep_id, 'to': task_id}
                for task_id, node in self.nodes.items()
                for dep_id in node.depends_on
            ]
        }
        return json.dumps(graph_data, indent=2)

# ============================================================================
# Spider Certification Task Graph Builder
# ============================================================================

class SpiderCertificationGraph:
    """Builds the complete task graph for spider certification"""

    def __init__(self):
        self.graph = TaskDependencyGraph()

    def build_phase_0_preconditions(self) -> List[str]:
        """Phase 0: Precondition validation tasks"""
        tasks = [
            ('precond-env', 'Validate environment URLs', 1, 'inventory'),
            ('precond-creds', 'Check test credentials', 1, 'inventory'),
            ('precond-dataset', 'Verify dataset access', 1, 'inventory'),
            ('precond-observability', 'Test observability hooks', 1, 'inventory'),
            ('precond-ai', 'Validate AI constraints', 1, 'ai-test')
        ]

        task_ids = []
        for task_id, name, priority, agent_type in tasks:
            self.graph.add_task(task_id, name, 'phase_0', priority, agent_type)
            task_ids.append(task_id)

        return task_ids

    def build_phase_1_inventory(self, precond_tasks: List[str]) -> List[str]:
        """Phase 1: Build complete inventory"""
        tasks = [
            ('inv-ui-routes', 'Enumerate UI routes/pages', 2, 'inventory'),
            ('inv-ui-components', 'Enumerate UI components', 2, 'inventory'),
            ('inv-api-endpoints', 'Enumerate API endpoints', 2, 'inventory'),
            ('inv-services', 'Enumerate backend services', 2, 'inventory'),
            ('inv-jobs', 'Enumerate scheduled jobs', 2, 'inventory'),
            ('inv-integrations', 'Enumerate external integrations', 2, 'inventory'),
            ('inv-ai-features', 'Enumerate AI features', 2, 'ai-test'),
            ('inv-consolidate', 'Consolidate inventory', 1, 'inventory', False)  # Sequential
        ]

        task_ids = []
        for task_id, name, priority, agent_type, *parallelizable in tasks:
            parallel = parallelizable[0] if parallelizable else True
            self.graph.add_task(task_id, name, 'phase_1', priority, agent_type, parallel)

            # All inventory tasks depend on preconditions
            for precond_id in precond_tasks:
                self.graph.add_dependency(task_id, precond_id)

            task_ids.append(task_id)

        # Consolidation depends on all other inventory tasks
        for tid in task_ids[:-1]:
            self.graph.add_dependency('inv-consolidate', tid)

        return task_ids

    def build_phase_2_testing(self, inventory_task: str) -> List[str]:
        """Phase 2: Execute tests with evidence"""
        # This phase will have dynamic tasks created based on inventory
        # For now, create placeholders
        tasks = [
            ('test-ui-all', 'Test all UI surfaces', 3, 'ui-test'),
            ('test-api-all', 'Test all API endpoints', 3, 'api-test'),
            ('test-services-all', 'Test all services', 3, 'service-test'),
            ('test-integrations-all', 'Test all integrations', 3, 'integration-test'),
            ('test-ai-all', 'Test all AI features', 3, 'ai-test')
        ]

        task_ids = []
        for task_id, name, priority, agent_type in tasks:
            self.graph.add_task(task_id, name, 'phase_2', priority, agent_type)

            # Depends on inventory consolidation
            self.graph.add_dependency(task_id, inventory_task)

            task_ids.append(task_id)

        return task_ids

    def build_phase_3_gating(self, test_tasks: List[str]) -> str:
        """Phase 3: Apply mandatory gates"""
        task_id = 'gate-enforce'
        self.graph.add_task(
            task_id,
            'Enforce correctness/accuracy gates',
            'phase_3',
            1,
            'gate-enforcer',
            False  # Must run sequentially
        )

        # Depends on all tests
        for test_id in test_tasks:
            self.graph.add_dependency(task_id, test_id)

        return task_id

    def build_phase_4_scoring(self, gate_task: str) -> str:
        """Phase 4: Score and rank items"""
        task_id = 'score-all'
        self.graph.add_task(
            task_id,
            'Score all items (target ≥990)',
            'phase_4',
            1,
            'scoring',
            False  # Sequential
        )

        self.graph.add_dependency(task_id, gate_task)
        return task_id

    def build_phase_5_remediation(self, score_task: str) -> str:
        """Phase 5: Remediation loop (dynamic)"""
        task_id = 'remediate-loop'
        self.graph.add_task(
            task_id,
            'Run remediation loop until ≥990',
            'phase_5',
            1,
            'remediation',
            False  # Sequential
        )

        self.graph.add_dependency(task_id, score_task)
        return task_id

    def build_phase_6_certification(self, remediation_task: str) -> str:
        """Phase 6: Final certification"""
        task_id = 'cert-final'
        self.graph.add_task(
            task_id,
            'Generate final certification bundle',
            'phase_6',
            1,
            'evidence-collector',
            False  # Sequential
        )

        self.graph.add_dependency(task_id, remediation_task)
        return task_id

    def build_complete_graph(self) -> TaskDependencyGraph:
        """Build the complete spider certification task graph"""
        print("🔨 Building complete task dependency graph...")

        # Phase 0
        precond_tasks = self.build_phase_0_preconditions()
        print(f"   Phase 0: {len(precond_tasks)} precondition tasks")

        # Phase 1
        inventory_tasks = self.build_phase_1_inventory(precond_tasks)
        print(f"   Phase 1: {len(inventory_tasks)} inventory tasks")

        # Phase 2
        test_tasks = self.build_phase_2_testing(inventory_tasks[-1])
        print(f"   Phase 2: {len(test_tasks)} testing tasks")

        # Phase 3
        gate_task = self.build_phase_3_gating(test_tasks)
        print(f"   Phase 3: 1 gating task")

        # Phase 4
        score_task = self.build_phase_4_scoring(gate_task)
        print(f"   Phase 4: 1 scoring task")

        # Phase 5
        remediation_task = self.build_phase_5_remediation(score_task)
        print(f"   Phase 5: 1 remediation task")

        # Phase 6
        cert_task = self.build_phase_6_certification(remediation_task)
        print(f"   Phase 6: 1 certification task")

        print(f"\n✅ Graph complete: {len(self.graph.nodes)} total tasks\n")

        return self.graph

# ============================================================================
# Main
# ============================================================================

if __name__ == '__main__':
    print("=" * 80)
    print("📊 Task Dependency Graph Analyzer")
    print("=" * 80)
    print()

    builder = SpiderCertificationGraph()
    graph = builder.build_complete_graph()

    # Detect cycles
    cycles = graph.detect_cycles()
    if cycles:
        print(f"⚠️  Detected {len(cycles)} cycle(s):")
        for cycle in cycles:
            print(f"   {' -> '.join(cycle)}")
    else:
        print("✅ No cycles detected")

    # Critical path
    critical_path, length = graph.get_critical_path()
    print(f"\n📈 Critical path length: {length}")
    print(f"   Path: {' -> '.join([graph.nodes[tid].name for tid in critical_path])}")

    # Parallel batches
    batches = graph.get_parallel_batches()
    print(f"\n⚡ Parallel execution plan: {len(batches)} batch(es)")
    for i, batch in enumerate(batches, 1):
        print(f"\n   Batch {i}: {len(batch)} task(s) in parallel")
        for task in batch:
            print(f"      - {task.name} ({task.agent_type})")

    # Export
    with open('/tmp/spider-cert-task-graph.json', 'w') as f:
        f.write(graph.to_json())

    print(f"\n💾 Graph exported to /tmp/spider-cert-task-graph.json")
