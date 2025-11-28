#!/usr/bin/env python3
"""
Endpoint Monitor Task - Creates comprehensive endpoint monitoring dashboard
Uses: OpenAI GPT-4 Turbo
"""

import os
import json
import openai
from pathlib import Path

def create_endpoint_monitor():
    """Create endpoint monitoring and health dashboard component"""

    openai.api_key = os.getenv('OPENAI_API_KEY')

    # Define all endpoints discovered from codebase
    endpoints = {
        "REST_API": [
            {"path": "/api/vehicles", "methods": ["GET", "POST", "PUT", "DELETE"]},
            {"path": "/api/vehicles/:id", "methods": ["GET", "PUT", "DELETE"]},
            {"path": "/api/vehicles/:id/showroom", "methods": ["POST", "DELETE"]},
            {"path": "/api/showroom", "methods": ["GET"]},
            {"path": "/api/garage", "methods": ["GET"]},
            {"path": "/api/garage/:id", "methods": ["GET", "PUT", "DELETE"]},
            {"path": "/api/fdot/rates", "methods": ["GET"]},
            {"path": "/api/safety/compliance", "methods": ["GET"]},
            {"path": "/api/assets/relationships", "methods": ["GET", "POST"]},
            {"path": "/api/maintenance/history", "methods": ["GET"]},
        ],
        "WEBSOCKET_EMULATORS": [
            {"name": "OBD2 Telemetry", "port": 8081, "protocol": "ws"},
            {"name": "Radio Communications", "port": 8082, "protocol": "ws"},
            {"name": "Dispatch System", "port": 8083, "protocol": "ws"},
        ]
    }

    # Generate component using GPT-4
    prompt = f"""Create a React TypeScript component for comprehensive endpoint monitoring.

Requirements:
1. Monitor all these endpoints: {json.dumps(endpoints, indent=2)}
2. Display real-time health status with color-coded indicators
3. Show connection latency and response times
4. Auto-refresh every 5 seconds
5. Collapsible sections to minimize scrolling
6. Dark mode compatible with proper contrast
7. Use shadcn/ui components (Card, Badge, Collapsible, ScrollArea)
8. Include WebSocket connection status for each emulator

Component should:
- Be compact and fit in a sidebar or modal
- Use green/yellow/red status indicators
- Show last check timestamp
- Allow manual refresh
- Display error messages when endpoints fail
- Be fully typed with TypeScript

Generate the complete component code."""

    response = openai.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[
            {"role": "system", "content": "You are an expert React/TypeScript developer specializing in monitoring dashboards and shadcn/ui."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
    )

    component_code = response.choices[0].message.content

    # Extract code from markdown if wrapped
    if "```" in component_code:
        component_code = component_code.split("```typescript")[1].split("```")[0].strip()
    elif "```tsx" in component_code:
        component_code = component_code.split("```tsx")[1].split("```")[0].strip()

    # Write component file
    output_path = Path("/home/azureuser/Fleet/src/components/monitoring/EndpointHealthDashboard.tsx")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(component_code)

    print(f"✅ Created endpoint monitoring dashboard: {output_path}")

    # Also create a hook for the monitoring logic
    hook_prompt = """Create a custom React hook `useEndpointMonitoring` that:

1. Monitors REST API endpoints by making HEAD requests
2. Monitors WebSocket connections by checking connection state
3. Returns an object with:
   - endpoints: array of endpoint status objects
   - refresh: function to manually refresh
   - isRefreshing: boolean
   - lastCheck: timestamp
4. Auto-refreshes every 5 seconds
5. Handles errors gracefully
6. Uses TypeScript with proper types

Generate the complete hook code."""

    hook_response = openai.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[
            {"role": "system", "content": "You are an expert React/TypeScript developer."},
            {"role": "user", "content": hook_prompt}
        ],
        temperature=0.3,
    )

    hook_code = hook_response.choices[0].message.content

    if "```" in hook_code:
        hook_code = hook_code.split("```typescript")[1].split("```")[0].strip() if "```typescript" in hook_code else hook_code.split("```tsx")[1].split("```")[0].strip()

    hook_path = Path("/home/azureuser/Fleet/src/hooks/useEndpointMonitoring.ts")
    hook_path.write_text(hook_code)

    print(f"✅ Created endpoint monitoring hook: {hook_path}")

    return {
        "status": "completed",
        "files_created": [str(output_path), str(hook_path)],
        "ai_engine": "OpenAI GPT-4 Turbo"
    }

if __name__ == "__main__":
    result = create_endpoint_monitor()
    print(json.dumps(result, indent=2))
