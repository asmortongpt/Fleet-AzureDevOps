#!/bin/bash
set -euo pipefail

# Fleet Management - Deploy Fortune 50 UI/UX AI Agents
# This script creates Azure VMs with AI-powered agents to implement:
# 1. Complete responsive design (mobile, tablet, desktop, 4K)
# 2. Reactive components with real-time updates
# 3. Fortune 50 production-grade UI/UX

echo "Deploying Fortune 50 UI/UX AI Agents on Azure VMs"
echo "=================================================="

RESOURCE_GROUP="fleet-fortune50-agents-rg"
LOCATION="eastus"
SUBSCRIPTION_ID="021415c2-2f52-4a73-ae77-f8363165a5e1"

# External LLM API Keys from environment
ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}"
OPENAI_API_KEY="${OPENAI_API_KEY}"
GEMINI_API_KEY="${GEMINI_API_KEY}"

az account set --subscription "$SUBSCRIPTION_ID"

# Create resource group
echo "Creating resource group..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION"

# Agent 1: Responsive Design System Architect
echo ""
echo "Agent 1: Responsive Design System Architect"
echo "Task: Implement complete design tokens with responsive breakpoints"
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "agent-responsive-design" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_B2s" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --custom-data @- <<'AGENT1'
#!/bin/bash
# Responsive Design System Agent

# Install dependencies
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git python3 python3-pip

# Install AI libraries
pip3 install anthropic openai google-generativeai

# Clone repository
cd /home/azureuser
git clone https://github.com/andrewmorton/Fleet.git
cd Fleet

# Install npm dependencies
npm install

# Create AI agent script
cat > agent-responsive-design.py <<'PYTHON'
import anthropic
import openai
import os
import subprocess
import json

# Initialize AI clients
anthropic_client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
openai_client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

print("🎨 Responsive Design System Agent Starting...")
print("Task: Implement complete design tokens with responsive breakpoints")

# Task 1: Create responsive design tokens
design_tokens_prompt = """
Create a complete responsive design token system in CSS for a Fleet Management application.

Requirements:
1. Breakpoints: mobile (320px), tablet (768px), desktop (1024px), wide (1440px), ultrawide (1920px), 4K (2560px)
2. Fluid typography using clamp() for smooth scaling
3. Responsive spacing scale (base 4px on mobile, 8px on desktop)
4. Container max-widths for each breakpoint
5. Grid systems (12-column, 16-column, 24-column)
6. Complete color palette with 10 shades per color
7. Dark mode with WCAG AAA compliance
8. Shadow system with responsive elevation
9. Border radius that scales with screen size
10. Touch-friendly sizing (44px minimum on mobile)

Output the complete CSS file.
"""

response = anthropic_client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=8000,
    messages=[{"role": "user", "content": design_tokens_prompt}]
)

design_tokens_css = response.content[0].text

# Write design tokens
with open('src/styles/design-tokens-responsive.css', 'w') as f:
    f.write(design_tokens_css)

print("✅ Created responsive design tokens")

# Task 2: Create responsive utilities
utilities_prompt = """
Create a responsive utility class system in CSS that includes:
1. Display utilities (hide-on-mobile, hide-on-desktop, etc.)
2. Flexbox/Grid utilities with responsive modifiers
3. Spacing utilities (p-4, md:p-6, lg:p-8)
4. Typography utilities (text-sm, md:text-base, lg:text-lg)
5. Width/height utilities (w-full, md:w-1/2, lg:w-1/3)
6. Container queries for component-based responsive design

Use Tailwind-style naming with breakpoint prefixes (sm:, md:, lg:, xl:, 2xl:)
"""

response = anthropic_client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=8000,
    messages=[{"role": "user", "content": utilities_prompt}]
)

utilities_css = response.content[0].text

with open('src/styles/responsive-utilities.css', 'w') as f:
    f.write(utilities_css)

print("✅ Created responsive utility classes")

# Task 3: Create responsive layout components
layout_prompt = """
Create React components for responsive layouts:
1. ResponsiveContainer - max-width container with padding
2. ResponsiveGrid - CSS Grid with responsive columns
3. ResponsiveFlex - Flexbox with responsive direction
4. Stack - Vertical/horizontal stack with responsive spacing
5. Breakpoint - Component that renders children only at specific breakpoints

Use TypeScript and include full type definitions.
"""

response = openai_client.chat.completions.create(
    model="gpt-4-turbo-preview",
    messages=[{"role": "user", "content": layout_prompt}],
    max_tokens=8000
)

layout_components = response.choices[0].message.content

with open('src/components/layout/ResponsiveLayout.tsx', 'w') as f:
    f.write(layout_components)

print("✅ Created responsive layout components")

# Commit changes
subprocess.run(['git', 'add', '.'], check=True)
subprocess.run(['git', 'commit', '-m', 'feat: Add responsive design system with AI'], check=True)

print("🎉 Responsive Design System Agent Complete!")
PYTHON

# Run the agent
python3 agent-responsive-design.py
AGENT1

# Agent 2: Reactive Components Engineer
echo ""
echo "Agent 2: Reactive Components Engineer"
echo "Task: Implement reactive components with real-time updates"
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "agent-reactive-components" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_B2s" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --custom-data @- <<'AGENT2'
#!/bin/bash
# Reactive Components Agent

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git python3 python3-pip
pip3 install anthropic openai

cd /home/azureuser
git clone https://github.com/andrewmorton/Fleet.git
cd Fleet
npm install

cat > agent-reactive-components.py <<'PYTHON'
import anthropic
import openai
import os
import subprocess

anthropic_client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
openai_client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

print("⚡ Reactive Components Agent Starting...")

# Task 1: Create reactive state management
state_prompt = """
Create a reactive state management system for React using signals/atoms pattern:
1. createSignal() - reactive primitive
2. createComputed() - derived values
3. createEffect() - side effects
4. createStore() - complex state objects
5. useSignal() - React hook integration

Include TypeScript types and examples for:
- Real-time vehicle tracking
- Live telemetry updates
- WebSocket integration
- Optimistic updates

Use Jotai or similar lightweight library.
"""

response = anthropic_client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=8000,
    messages=[{"role": "user", "content": state_prompt}]
)

with open('src/lib/reactive-state.ts', 'w') as f:
    f.write(response.content[0].text)

print("✅ Created reactive state management")

# Task 2: Create reactive UI components
components_prompt = """
Create reactive UI components using React with real-time updates:

1. ReactiveMetricCard
   - Auto-updates when data changes
   - Smooth number counting animations
   - Trend indicators with real-time changes

2. ReactiveDataTable
   - Live row updates
   - Real-time sorting/filtering
   - Optimistic UI updates
   - Virtual scrolling for performance

3. RealtimeChart
   - Streaming data points
   - Auto-scaling axes
   - Smooth transitions
   - Configurable update interval

4. LiveVehicleMap
   - Real-time marker updates
   - Smooth position transitions
   - Clustering for performance
   - WebSocket integration

5. RealtimeAlertsFeed
   - New alerts slide in
   - Auto-dismiss old alerts
   - Priority-based ordering
   - Sound notifications

Include full TypeScript types, WebSocket hooks, and error handling.
"""

response = openai_client.chat.completions.create(
    model="gpt-4-turbo-preview",
    messages=[{"role": "user", "content": components_prompt}],
    max_tokens=8000
)

with open('src/components/reactive/ReactiveComponents.tsx', 'w') as f:
    f.write(response.choices[0].message.content)

print("✅ Created reactive UI components")

# Task 3: WebSocket integration
websocket_prompt = """
Create a production-grade WebSocket client for React:
1. Auto-reconnection with exponential backoff
2. Message queue for offline mode
3. Heartbeat/ping-pong
4. Message type routing
5. React hooks (useWebSocket, useSubscription)
6. TypeScript event types
7. Error handling and recovery

Include hooks for:
- Vehicle telemetry updates
- Alert notifications
- System status changes
- Chat/dispatch messages
"""

response = anthropic_client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=8000,
    messages=[{"role": "user", "content": websocket_prompt}]
)

with open('src/lib/websocket-client.ts', 'w') as f:
    f.write(response.content[0].text)

print("✅ Created WebSocket client")

subprocess.run(['git', 'add', '.'], check=True)
subprocess.run(['git', 'commit', '-m', 'feat: Add reactive components with real-time updates'], check=True)

print("🎉 Reactive Components Agent Complete!")
PYTHON

python3 agent-reactive-components.py
AGENT2

# Agent 3: Mobile-First UI Developer
echo ""
echo "Agent 3: Mobile-First UI Developer"
echo "Task: Create mobile-optimized components and layouts"
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "agent-mobile-first" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_B2s" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --custom-data @- <<'AGENT3'
#!/bin/bash
# Mobile-First UI Agent

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git python3 python3-pip
pip3 install anthropic openai google-generativeai

cd /home/azureuser
git clone https://github.com/andrewmorton/Fleet.git
cd Fleet
npm install

cat > agent-mobile-first.py <<'PYTHON'
import anthropic
import google.generativeai as genai
import os
import subprocess

anthropic_client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

print("📱 Mobile-First UI Agent Starting...")

# Task 1: Mobile navigation
mobile_nav_prompt = """
Create a mobile-first navigation system:

1. MobileBottomNav - Bottom navigation bar with icons
2. MobileDrawer - Slide-out drawer menu
3. MobileTabs - Swipeable tabs
4. MobileHeader - Collapsing header with search
5. MobileFab - Floating action button

Features:
- Touch-optimized (44px minimum)
- Swipe gestures
- Safe area insets for notches
- Haptic feedback
- Smooth animations
- Accessibility

Use React, TypeScript, and Framer Motion for animations.
"""

response = anthropic_client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=8000,
    messages=[{"role": "user", "content": mobile_nav_prompt}]
)

with open('src/components/mobile/MobileNavigation.tsx', 'w') as f:
    f.write(response.content[0].text)

print("✅ Created mobile navigation")

# Task 2: Touch-optimized components
touch_prompt = """
Create touch-optimized interactive components:

1. SwipeableCard - Swipe to reveal actions
2. PullToRefresh - Pull down to refresh
3. InfiniteScroll - Load more on scroll
4. TouchableHighlight - Native-like touch feedback
5. GestureHandler - Multi-touch gestures (pinch, rotate)
6. BottomSheet - Modal that slides from bottom
7. ActionSheet - iOS-style action menu

All components must:
- Support touch, mouse, keyboard
- Have smooth 60fps animations
- Include haptic feedback (vibrate API)
- Be fully accessible
- Handle edge cases (no content, errors)

TypeScript with full type safety.
"""

model = genai.GenerativeModel('gemini-1.5-pro')
response = model.generate_content(touch_prompt)

with open('src/components/mobile/TouchComponents.tsx', 'w') as f:
    f.write(response.text)

print("✅ Created touch-optimized components")

# Task 3: Responsive dashboard for mobile
mobile_dashboard_prompt = """
Create a mobile-optimized dashboard layout:

1. Single column layout
2. Collapsible sections
3. Priority-based card ordering
4. Compact metric cards (2 per row)
5. Horizontal scrolling charts
6. Bottom sheet for details
7. Quick actions FAB menu

Breakpoints:
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

Include:
- Progressive web app (PWA) manifest
- Service worker for offline
- Install prompt
- Push notifications
"""

response = anthropic_client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=8000,
    messages=[{"role": "user", "content": mobile_dashboard_prompt}]
)

with open('src/components/mobile/MobileDashboard.tsx', 'w') as f:
    f.write(response.content[0].text)

print("✅ Created mobile dashboard")

subprocess.run(['git', 'add', '.'], check=True)
subprocess.run(['git', 'commit', '-m', 'feat: Add mobile-first UI components'], check=True)

print("🎉 Mobile-First UI Agent Complete!")
PYTHON

python3 agent-mobile-first.py
AGENT3

# Agent 4: Enterprise Component Library Builder
echo ""
echo "Agent 4: Enterprise Component Library Builder"
echo "Task: Build complete component library with Storybook"
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "agent-component-library" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_B2s" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --custom-data @- <<'AGENT4'
#!/bin/bash
# Component Library Agent

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git python3 python3-pip
pip3 install anthropic openai

cd /home/azureuser
git clone https://github.com/andrewmorton/Fleet.git
cd Fleet
npm install
npm install --save-dev @storybook/react @storybook/addon-essentials @storybook/addon-a11y

cat > agent-component-library.py <<'PYTHON'
import anthropic
import openai
import os
import subprocess

anthropic_client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
openai_client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

print("📚 Component Library Agent Starting...")

# Task 1: Enterprise data table
data_table_prompt = """
Create an enterprise-grade DataTable component:

Features:
- Column sorting (single + multi)
- Advanced filtering (text, number, date, select)
- Column resizing
- Column reordering (drag-and-drop)
- Column visibility toggle
- Row selection (single + multi)
- Bulk actions
- Pagination
- Virtual scrolling (10,000+ rows)
- Export (CSV, Excel, PDF)
- Saved views
- Global search
- Inline editing
- Expandable rows
- Frozen columns

Props:
- data: T[]
- columns: ColumnDef<T>[]
- All optional feature configs

TypeScript with full generics support.
Include Storybook stories with examples.
"""

response = anthropic_client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=16000,
    messages=[{"role": "user", "content": data_table_prompt}]
)

with open('src/components/tables/EnterpriseDataTable.tsx', 'w') as f:
    f.write(response.content[0].text)

print("✅ Created enterprise data table")

# Task 2: Advanced chart components
charts_prompt = """
Create a complete chart library with these components:

1. LineChart - Multi-series, time-series, real-time
2. AreaChart - Stacked, percentage
3. BarChart - Vertical, horizontal, stacked
4. PieChart - Donut option, custom labels
5. ScatterChart - Bubble chart support
6. HeatmapChart - Calendar heatmap, matrix
7. GaugeChart - Half-circle, full-circle
8. SparklineChart - Inline micro charts
9. CandlestickChart - Financial data
10. SankeyChart - Flow diagrams

All charts must support:
- Responsive sizing
- Dark mode
- Animations
- Tooltips
- Legends
- Export (PNG, SVG, PDF)
- Accessibility (ARIA, keyboard nav)
- Real-time updates
- Zoom/pan
- Brushing
- Annotations

Use Recharts or D3.js. TypeScript with full types.
Include Storybook stories for each chart type.
"""

response = openai_client.chat.completions.create(
    model="gpt-4-turbo-preview",
    messages=[{"role": "user", "content": charts_prompt}],
    max_tokens=16000
)

with open('src/components/charts/ChartLibrary.tsx', 'w') as f:
    f.write(response.choices[0].message.content)

print("✅ Created chart library")

# Task 3: Form component system
forms_prompt = """
Create a complete form component system:

Components:
1. TextInput - prefix/suffix, validation
2. NumberInput - increment/decrement, formatting
3. DatePicker - single, range
4. TimePicker - 12/24 hour
5. DateTimePicker - combined
6. Select - native dropdown
7. Combobox - searchable, creatable
8. MultiSelect - tags, checkboxes
9. RadioGroup - inline, stacked
10. CheckboxGroup - select all
11. Switch - toggle
12. Slider - single, range
13. FileUpload - drag-drop, preview
14. ColorPicker - swatches, hex input
15. RichTextEditor - markdown support

Features for all:
- Controlled/uncontrolled
- Validation (sync + async)
- Error messages
- Hints
- Labels
- Required indicators
- Disabled states
- Loading states
- Responsive
- Accessible

TypeScript + Storybook stories.
"""

response = anthropic_client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=16000,
    messages=[{"role": "user", "content": forms_prompt}]
)

with open('src/components/forms/FormComponents.tsx', 'w') as f:
    f.write(response.content[0].text)

print("✅ Created form components")

subprocess.run(['git', 'add', '.'], check=True)
subprocess.run(['git', 'commit', '-m', 'feat: Add enterprise component library'], check=True)

print("🎉 Component Library Agent Complete!")
PYTHON

python3 agent-component-library.py
AGENT4

# Agent 5: Performance Optimization Specialist
echo ""
echo "Agent 5: Performance Optimization Specialist"
echo "Task: Optimize bundle size, lazy loading, caching"
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "agent-performance" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_B2s" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --custom-data @- <<'AGENT5'
#!/bin/bash
# Performance Optimization Agent

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git python3 python3-pip
pip3 install anthropic openai

cd /home/azureuser
git clone https://github.com/andrewmorton/Fleet.git
cd Fleet
npm install

cat > agent-performance.py <<'PYTHON'
import anthropic
import openai
import os
import subprocess
import json

anthropic_client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
openai_client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

print("🚀 Performance Optimization Agent Starting...")

# Task 1: Code splitting configuration
code_split_prompt = """
Create optimized Vite configuration for code splitting:

1. Route-based splitting (each page is separate chunk)
2. Vendor splitting (React, dependencies separate)
3. Library splitting (charts, maps on-demand)
4. Component splitting (lazy load heavy components)
5. CSS splitting (critical inline, rest lazy)
6. Asset optimization (images, fonts)
7. Tree shaking configuration
8. Bundle analysis setup

Target:
- Initial bundle < 200KB (gzipped)
- Route chunks < 100KB each
- Lighthouse score 95+

Output complete vite.config.ts
"""

response = anthropic_client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=8000,
    messages=[{"role": "user", "content": code_split_prompt}]
)

with open('vite.config.optimized.ts', 'w') as f:
    f.write(response.content[0].text)

print("✅ Created optimized Vite config")

# Task 2: React Query setup
react_query_prompt = """
Create React Query configuration for optimal caching:

1. Query client with defaults (staleTime, cacheTime)
2. Custom hooks for all API endpoints
3. Optimistic updates
4. Infinite queries for pagination
5. Prefetching strategies
6. Request deduplication
7. Error retry logic
8. Devtools setup

Include hooks for:
- useVehicles (with filters, pagination)
- useVehicle (single vehicle)
- useUpdateVehicle (optimistic)
- useDeleteVehicle (optimistic)
- useTelemetry (real-time)
- useAlerts (infinite scroll)

TypeScript with full types.
"""

response = openai_client.chat.completions.create(
    model="gpt-4-turbo-preview",
    messages=[{"role": "user", "content": react_query_prompt}],
    max_tokens=8000
)

with open('src/lib/react-query-setup.ts', 'w') as f:
    f.write(response.choices[0].message.content)

print("✅ Created React Query setup")

# Task 3: Performance monitoring
monitoring_prompt = """
Create performance monitoring system:

1. Web Vitals tracking (LCP, FID, CLS, TTFB, FCP)
2. Custom metrics (API latency, render time)
3. Error tracking
4. User session recording metadata
5. Performance budgets
6. Real User Monitoring (RUM)
7. Lighthouse CI integration
8. Bundle size monitoring

Integration:
- Azure Application Insights
- Custom analytics endpoint
- Console warnings for dev

TypeScript implementation.
"""

response = anthropic_client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=8000,
    messages=[{"role": "user", "content": monitoring_prompt}]
)

with open('src/lib/performance-monitoring.ts', 'w') as f:
    f.write(response.content[0].text)

print("✅ Created performance monitoring")

subprocess.run(['git', 'add', '.'], check=True)
subprocess.run(['git', 'commit', '-m', 'feat: Add performance optimizations'], check=True)

print("🎉 Performance Optimization Agent Complete!")
PYTHON

python3 agent-performance.py
AGENT5

echo ""
echo "All Fortune 50 AI Agents Deployed Successfully!"
echo ""
echo "Agent Status:"
echo "  - Agent 1 (Responsive Design): Creating design tokens and breakpoints"
echo "  - Agent 2 (Reactive Components): Building real-time components"
echo "  - Agent 3 (Mobile-First): Developing mobile UI"
echo "  - Agent 4 (Component Library): Building enterprise components"
echo "  - Agent 5 (Performance): Optimizing bundle and caching"
echo ""
echo "Get VM IPs:"
echo "  az vm list-ip-addresses -g $RESOURCE_GROUP -o table"
echo ""
echo "Monitor progress:"
echo "  az vm run-command invoke -g $RESOURCE_GROUP -n agent-responsive-design --command-id RunShellScript --scripts 'tail -f /var/log/cloud-init-output.log'"
echo ""
echo "Expected completion time: 30-45 minutes"
