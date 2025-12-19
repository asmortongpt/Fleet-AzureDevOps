#!/usr/bin/env python3
"""
AI Agents Monitoring Dashboard
Real-time monitoring of all 5 AI agents running on Azure VMs
"""

import subprocess
import json
import time
import sys
from datetime import datetime
from typing import Dict, List, Any

# Configuration
RESOURCE_GROUP = "fleet-completion-agents-rg"
SSH_KEY_PATH = "~/.ssh/fleet-agents-key"
ADMIN_USER = "azureuser"

# ANSI color codes
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    MAGENTA = '\033[95m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'

def run_command(cmd: List[str]) -> str:
    """Run a command and return output"""
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        return f"ERROR: {e.stderr}"

def get_vm_list() -> List[str]:
    """Get list of VMs in the resource group"""
    try:
        output = run_command([
            'az', 'vm', 'list',
            '-g', RESOURCE_GROUP,
            '--query', '[].name',
            '-o', 'tsv'
        ])
        return [vm for vm in output.split('\n') if vm]
    except:
        return []

def get_vm_info(vm_name: str) -> Dict[str, Any]:
    """Get VM information"""
    try:
        # Get VM status
        status_output = run_command([
            'az', 'vm', 'get-instance-view',
            '-g', RESOURCE_GROUP,
            '-n', vm_name,
            '--query', "instanceView.statuses[?starts_with(code, 'PowerState/')].displayStatus",
            '-o', 'tsv'
        ])

        # Get public IP
        ip_output = run_command([
            'az', 'vm', 'show',
            '-g', RESOURCE_GROUP,
            '-n', vm_name,
            '-d',
            '--query', 'publicIps',
            '-o', 'tsv'
        ])

        # Get tags
        tags_output = run_command([
            'az', 'vm', 'show',
            '-g', RESOURCE_GROUP,
            '-n', vm_name,
            '--query', 'tags',
            '-o', 'json'
        ])

        tags = {}
        try:
            tags = json.loads(tags_output) if tags_output and not tags_output.startswith('ERROR') else {}
        except:
            pass

        return {
            'name': vm_name,
            'status': status_output,
            'ip': ip_output,
            'agent': tags.get('Agent', 'Unknown'),
            'llm': tags.get('LLM', 'Unknown'),
            'output': tags.get('Output', 'Unknown')
        }
    except Exception as e:
        return {
            'name': vm_name,
            'status': 'Error',
            'ip': '',
            'agent': 'Unknown',
            'llm': 'Unknown',
            'output': 'Unknown',
            'error': str(e)
        }

def get_agent_log(ip: str, lines: int = 20) -> str:
    """Get agent log from VM via SSH"""
    try:
        result = subprocess.run([
            'ssh',
            '-o', 'StrictHostKeyChecking=no',
            '-o', 'ConnectTimeout=5',
            '-i', SSH_KEY_PATH.replace('~', subprocess.os.path.expanduser('~')),
            f'{ADMIN_USER}@{ip}',
            f'tail -{lines} ~/agent.log 2>/dev/null || echo "Log not found"'
        ], capture_output=True, text=True, timeout=10)
        return result.stdout
    except Exception as e:
        return f"Error accessing log: {str(e)}"

def get_agent_status(ip: str) -> Dict[str, Any]:
    """Get agent status JSON from VM"""
    try:
        result = subprocess.run([
            'ssh',
            '-o', 'StrictHostKeyChecking=no',
            '-o', 'ConnectTimeout=5',
            '-i', SSH_KEY_PATH.replace('~', subprocess.os.path.expanduser('~')),
            f'{ADMIN_USER}@{ip}',
            'cat ~/fleet-agent/fleet/agent*-status.json 2>/dev/null || echo "{}"'
        ], capture_output=True, text=True, timeout=10)

        return json.loads(result.stdout) if result.stdout else {}
    except Exception as e:
        return {}

def print_header():
    """Print dashboard header"""
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*80}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}Fleet AI Agents - Real-Time Monitoring Dashboard{Colors.END}")
    print(f"{Colors.CYAN}Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.END}")
    print(f"{Colors.CYAN}{'='*80}{Colors.END}\n")

def print_vm_summary(vms_info: List[Dict[str, Any]]):
    """Print summary of all VMs"""
    print(f"{Colors.BOLD}VM Summary:{Colors.END}")
    print(f"{Colors.BOLD}{'-'*80}{Colors.END}")

    for i, vm in enumerate(vms_info, 1):
        status_color = Colors.GREEN if vm['status'] == 'VM running' else Colors.RED
        agent_name = vm['agent'].replace('-', ' ').title()

        print(f"{Colors.BOLD}Agent {i}: {agent_name}{Colors.END}")
        print(f"  VM: {vm['name']}")
        print(f"  Status: {status_color}{vm['status']}{Colors.END}")
        print(f"  IP: {vm['ip']}")
        print(f"  LLM: {Colors.MAGENTA}{vm['llm']}{Colors.END}")
        print(f"  Output: {vm['output']}")

        # Get and display agent status if available
        if vm['ip'] and vm['status'] == 'VM running':
            agent_status = get_agent_status(vm['ip'])
            if agent_status:
                status_value = agent_status.get('status', 'unknown')
                status_color = Colors.GREEN if status_value == 'completed' else Colors.YELLOW
                print(f"  Agent Status: {status_color}{status_value.upper()}{Colors.END}")

                if status_value == 'completed':
                    timestamp = agent_status.get('timestamp', '')
                    if timestamp:
                        print(f"  Completed: {timestamp}")
                elif status_value == 'failed':
                    error = agent_status.get('error', 'Unknown error')
                    print(f"  Error: {Colors.RED}{error}{Colors.END}")

        print()

def print_agent_logs(vms_info: List[Dict[str, Any]]):
    """Print recent logs from each agent"""
    print(f"{Colors.BOLD}Recent Agent Logs:{Colors.END}")
    print(f"{Colors.BOLD}{'-'*80}{Colors.END}\n")

    for vm in vms_info:
        if vm['ip'] and vm['status'] == 'VM running':
            print(f"{Colors.BOLD}{Colors.BLUE}[{vm['agent']}]{Colors.END}")
            log_content = get_agent_log(vm['ip'], lines=10)
            print(log_content)
            print(f"{Colors.BLUE}{'-'*80}{Colors.END}\n")

def print_progress_bar(completed: int, total: int, width: int = 50):
    """Print a progress bar"""
    progress = completed / total if total > 0 else 0
    filled = int(width * progress)
    bar = '█' * filled + '░' * (width - filled)

    percentage = int(progress * 100)
    color = Colors.GREEN if percentage == 100 else Colors.YELLOW if percentage > 50 else Colors.RED

    print(f"Overall Progress: {color}{bar} {percentage}%{Colors.END} ({completed}/{total} agents completed)")

def print_instructions():
    """Print usage instructions"""
    print(f"\n{Colors.BOLD}Commands:{Colors.END}")
    print(f"  {Colors.CYAN}Press Ctrl+C to exit{Colors.END}")
    print(f"  {Colors.CYAN}SSH to VM: ssh -i {SSH_KEY_PATH} {ADMIN_USER}@<IP>{Colors.END}")
    print(f"  {Colors.CYAN}View full logs: ssh -i {SSH_KEY_PATH} {ADMIN_USER}@<IP> 'tail -f ~/agent.log'{Colors.END}")
    print(f"  {Colors.CYAN}Stop agents: ./stop-agents.sh{Colors.END}")

def main():
    """Main monitoring loop"""
    try:
        # Clear screen
        subprocess.run(['clear'])

        print_header()

        # Get VM list
        print(f"{Colors.YELLOW}Fetching VM information...{Colors.END}\n")
        vms = get_vm_list()

        if not vms:
            print(f"{Colors.RED}No VMs found in resource group: {RESOURCE_GROUP}{Colors.END}")
            print(f"Have you run the deployment script yet?")
            sys.exit(1)

        # Get info for all VMs
        vms_info = [get_vm_info(vm) for vm in vms]

        # Print VM summary
        print_vm_summary(vms_info)

        # Calculate progress
        completed_count = 0
        for vm in vms_info:
            if vm['ip'] and vm['status'] == 'VM running':
                status = get_agent_status(vm['ip'])
                if status.get('status') == 'completed':
                    completed_count += 1

        print_progress_bar(completed_count, len(vms_info))
        print()

        # Print recent logs
        print_agent_logs(vms_info)

        # Print instructions
        print_instructions()

        print(f"\n{Colors.YELLOW}This is a one-time snapshot. Run again to refresh.{Colors.END}")
        print(f"{Colors.YELLOW}For continuous monitoring, run: watch -n 30 python3 monitor-dashboard.py{Colors.END}\n")

    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Monitoring stopped by user.{Colors.END}")
        sys.exit(0)
    except Exception as e:
        print(f"{Colors.RED}Error: {str(e)}{Colors.END}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
