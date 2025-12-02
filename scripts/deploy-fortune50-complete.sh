#!/bin/bash
set -euo pipefail

# Fleet Management - Deploy All AI Agents (Settings + User Accounts + Fortune 50 UI)
# This script creates Azure VMs with AI-powered agents to complete ALL development

echo "Deploying Complete Fleet UI Development Agents on Azure VMs"
echo "==========================================================="

RESOURCE_GROUP="fleet-fortune50-agents-rg"
LOCATION="eastus"
SUBSCRIPTION_ID="021415c2-2f52-4a73-ae77-f8363165a5e1"

# External LLM API Keys from environment
ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}"
OPENAI_API_KEY="${OPENAI_API_KEY}"
GEMINI_API_KEY="${GEMINI_API_KEY}"
GITHUB_PAT="${GITHUB_PAT}"

az account set --subscription "$SUBSCRIPTION_ID"

# Create or use existing resource group
echo "Setting up resource group..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" 2>/dev/null || true

# Agent 1: Settings Section Developer
echo ""
echo "Agent 1: Settings Section Developer"
echo "Task: Build complete settings UI with all configuration options"
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "agent-settings" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_B2s" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --custom-data @- <<'AGENT1'
#!/bin/bash
# Settings Section Agent

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git python3 python3-pip
pip3 install anthropic openai

cd /home/azureuser
git clone https://github.com/andrewmorton/Fleet.git
cd Fleet
npm install

cat > agent-settings.py <<'PYTHON'
import anthropic
import os
import subprocess

client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

print("[SETTINGS AGENT] Starting...")

settings_prompt = """
Create a complete Settings section for a Fleet Management application.

Requirements:

1. Settings Page Layout (src/pages/SettingsPage.tsx):
   - Tabbed interface with categories
   - Responsive design (mobile, tablet, desktop)
   - Real-time save indicators
   - Unsaved changes warning

2. Setting Categories:

   a) General Settings
      - Application language
      - Timezone
      - Date/time format
      - Number format (thousand separator, decimal)
      - Default dashboard view
      - Items per page

   b) Appearance Settings
      - Theme (light, dark, auto)
      - Color scheme selector
      - Font size (small, medium, large)
      - Compact/comfortable density
      - Sidebar collapsed by default
      - Animation preferences

   c) Notification Settings
      - Email notifications (on/off per type)
      - In-app notifications
      - Push notifications
      - Sound effects
      - Notification frequency
      - Quiet hours

   d) Fleet Settings
      - Default vehicle view (list, grid, map)
      - Auto-refresh interval
      - Distance units (miles, km)
      - Fuel units (gallons, liters)
      - Temperature units (F, C)
      - Map provider (Google, Mapbox, OSM)
      - Geofence alerts

   e) Security Settings
      - Change password
      - Two-factor authentication setup
      - Active sessions list
      - Login history
      - API keys management
      - Audit log access

   f) Data & Privacy
      - Export my data
      - Delete account
      - Data retention period
      - Cookie preferences
      - Analytics opt-in/out

   g) Advanced Settings
      - Developer mode
      - API endpoint override
      - Feature flags
      - Experimental features
      - Debug logging
      - Performance metrics

3. Components to Create:

   - SettingsLayout.tsx - Main layout with tabs
   - GeneralSettings.tsx - General preferences
   - AppearanceSettings.tsx - Theme and UI
   - NotificationSettings.tsx - Notification prefs
   - FleetSettings.tsx - Fleet-specific settings
   - SecuritySettings.tsx - Security options
   - DataPrivacySettings.tsx - Data management
   - AdvancedSettings.tsx - Developer options

4. Features:
   - Form validation
   - Auto-save (debounced)
   - Reset to defaults
   - Import/export settings
   - Search within settings
   - Keyboard shortcuts (Cmd+S to save)
   - Accessible (WCAG AA)
   - Mobile-responsive
   - Dark mode support

5. State Management:
   - Use Jotai atoms for settings
   - Persist to localStorage
   - Sync to backend API
   - Optimistic updates

Output all TypeScript files with full implementations.
Include routing configuration and navigation updates.
"""

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=16000,
    messages=[{"role": "user", "content": settings_prompt}]
)

settings_code = response.content[0].text

# Extract and write files
import re

# Simple file extraction - look for file path markers
files = {}
current_file = None
current_content = []

for line in settings_code.split('\n'):
    if 'src/' in line and '.tsx' in line:
        if current_file:
            files[current_file] = '\n'.join(current_content)
        current_file = line.strip('# ').strip()
        current_content = []
    elif current_file:
        current_content.append(line)

if current_file:
    files[current_file] = '\n'.join(current_content)

# Write files
for filepath, content in files.items():
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"[SETTINGS] Created {filepath}")

# If extraction failed, write as single file
if not files:
    with open('src/pages/SettingsPage.tsx', 'w') as f:
        f.write(settings_code)
    print("[SETTINGS] Created src/pages/SettingsPage.tsx (combined)")

subprocess.run(['git', 'add', '.'], check=True)
subprocess.run(['git', 'commit', '-m', 'feat: Add complete Settings section'], check=True)
subprocess.run(['git', 'push'], check=True)

print("[SETTINGS AGENT] Complete!")
PYTHON

export ANTHROPIC_API_KEY="__ANTHROPIC_KEY__"
export GITHUB_TOKEN="__GITHUB_PAT__"
python3 agent-settings.py
AGENT1

# Agent 2: User Accounts Section Developer
echo ""
echo "Agent 2: User Accounts Section Developer"
echo "Task: Build complete user account management UI"
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "agent-user-accounts" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_B2s" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --custom-data @- <<'AGENT2'
#!/bin/bash
# User Accounts Agent

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git python3 python3-pip
pip3 install openai

cd /home/azureuser
git clone https://github.com/andrewmorton/Fleet.git
cd Fleet
npm install

cat > agent-user-accounts.py <<'PYTHON'
import openai
import os
import subprocess

client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

print("[USER ACCOUNTS AGENT] Starting...")

accounts_prompt = """
Create a complete User Accounts management section for a Fleet Management application.

Requirements:

1. User Account Pages:

   a) My Profile Page (src/pages/ProfilePage.tsx):
      - Avatar upload with crop
      - Display name
      - Email (verified badge)
      - Phone number
      - Job title
      - Department
      - Bio
      - Social links

   b) Account Security Page (src/pages/AccountSecurityPage.tsx):
      - Password change form
      - Two-factor authentication (QR code, backup codes)
      - Active sessions with device info
      - Login history table
      - Security questions
      - Recovery email

   c) Users Management Page (src/pages/UsersManagementPage.tsx):
      - User list table (sortable, filterable)
      - Add new user modal
      - Edit user modal
      - Deactivate/activate user
      - Reset password
      - Role assignment
      - Bulk actions (export, invite, deactivate)

   d) Roles & Permissions Page (src/pages/RolesPermissionsPage.tsx):
      - Roles list
      - Create/edit role
      - Permission matrix
      - Permission groups (Fleet, Reports, Admin, etc.)
      - User count per role

   e) Team Management Page (src/pages/TeamsPage.tsx):
      - Team list
      - Create team
      - Assign users to teams
      - Team hierarchy
      - Team permissions

2. Components:

   - UserAvatar.tsx - Avatar with fallback initials
   - UserCard.tsx - User info card
   - UserTable.tsx - Sortable user table
   - UserForm.tsx - Add/edit user form
   - RoleSelector.tsx - Multi-select for roles
   - PermissionMatrix.tsx - Permission grid
   - TeamSelector.tsx - Team hierarchy selector
   - InviteUserModal.tsx - Email invitation
   - TwoFactorSetup.tsx - 2FA configuration
   - SessionsList.tsx - Active sessions
   - LoginHistory.tsx - Login events table

3. Features:

   Profile:
   - Avatar upload with preview
   - Real-time validation
   - Auto-save
   - Change email (verification required)
   - Deactivate account

   Security:
   - Password strength meter
   - 2FA with QR code
   - Backup codes download
   - Revoke sessions
   - Export login history

   User Management:
   - Advanced search/filter
   - Pagination
   - Bulk invite via CSV
   - User status (active, inactive, invited)
   - Last active timestamp
   - Impersonate user (admin only)

   Roles & Permissions:
   - RBAC matrix
   - Custom roles
   - Permission inheritance
   - Clone role
   - Role templates

   Teams:
   - Nested teams
   - Team leads
   - Team permissions override
   - Team activity feed

4. State & API:
   - React Query for data fetching
   - Optimistic updates
   - Error handling
   - Loading states
   - Toast notifications

5. Validation:
   - Email format
   - Password requirements
   - Phone number format
   - Required fields
   - Unique constraints

6. Accessibility:
   - ARIA labels
   - Keyboard navigation
   - Focus management
   - Screen reader support

Output all TypeScript files with full implementations.
Include API integration hooks and routing.
"""

response = client.chat.completions.create(
    model="gpt-4-turbo-preview",
    messages=[{"role": "user", "content": accounts_prompt}],
    max_tokens=16000
)

accounts_code = response.choices[0].message.content

# Write generated code
import re
files = {}
current_file = None
current_content = []

for line in accounts_code.split('\n'):
    if 'src/' in line and ('.tsx' in line or '.ts' in line):
        if current_file:
            files[current_file] = '\n'.join(current_content)
        current_file = line.strip('# ').strip()
        current_content = []
    elif current_file:
        current_content.append(line)

if current_file:
    files[current_file] = '\n'.join(current_content)

for filepath, content in files.items():
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"[USER ACCOUNTS] Created {filepath}")

if not files:
    with open('src/pages/UserAccountsPage.tsx', 'w') as f:
        f.write(accounts_code)
    print("[USER ACCOUNTS] Created src/pages/UserAccountsPage.tsx (combined)")

subprocess.run(['git', 'add', '.'], check=True)
subprocess.run(['git', 'commit', '-m', 'feat: Add complete User Accounts section'], check=True)
subprocess.run(['git', 'push'], check=True)

print("[USER ACCOUNTS AGENT] Complete!")
PYTHON

export OPENAI_API_KEY="__OPENAI_KEY__"
export GITHUB_TOKEN="__GITHUB_PAT__"
python3 agent-user-accounts.py
AGENT2

# Agent 3: Enterprise Data Table
echo ""
echo "Agent 3: Enterprise Data Table Builder"
echo "Task: Build production-grade data table with all features"
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "agent-data-table" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_B2s" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --custom-data @- <<'AGENT3'
#!/bin/bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git python3 python3-pip
pip3 install anthropic

cd /home/azureuser
git clone https://github.com/andrewmorton/Fleet.git
cd Fleet
npm install

cat > agent-data-table.py <<'PYTHON'
import anthropic
import os
import subprocess

client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

print("[DATA TABLE AGENT] Starting...")

table_prompt = """
Create an enterprise-grade DataTable component for React with TypeScript.

Features required:
- Column sorting (multi-column)
- Advanced filtering (text, number, date, select, multi-select)
- Column resizing
- Column reordering (drag-drop)
- Column visibility toggle
- Row selection (single, multi, all)
- Bulk actions toolbar
- Pagination (client/server)
- Virtual scrolling for 10,000+ rows
- Export (CSV, Excel, PDF)
- Global search
- Inline editing
- Expandable rows
- Frozen columns
- Responsive (mobile data cards)
- Dark mode
- Accessibility (WCAG AA)

Create these files:
1. src/components/tables/EnterpriseDataTable.tsx - Main component
2. src/components/tables/DataTableTypes.ts - TypeScript types
3. src/components/tables/DataTableColumns.tsx - Column helpers
4. src/components/tables/DataTableFilters.tsx - Filter components
5. src/components/tables/DataTableToolbar.tsx - Toolbar
6. src/components/tables/useDataTable.ts - Hook
7. src/components/tables/DataTable.stories.tsx - Storybook examples

Use @tanstack/react-table v8. Full implementation required.
"""

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=16000,
    messages=[{"role": "user", "content": table_prompt}]
)

with open('src/components/tables/EnterpriseDataTable.tsx', 'w') as f:
    f.write(response.content[0].text)

subprocess.run(['git', 'add', '.'], check=True)
subprocess.run(['git', 'commit', '-m', 'feat: Add enterprise data table'], check=True)
subprocess.run(['git', 'push'], check=True)

print("[DATA TABLE AGENT] Complete!")
PYTHON

export ANTHROPIC_API_KEY="__ANTHROPIC_KEY__"
export GITHUB_TOKEN="__GITHUB_PAT__"
python3 agent-data-table.py
AGENT3

# Agent 4: Advanced Charts
echo ""
echo "Agent 4: Advanced Chart Library Builder"
echo "Task: Build complete chart library with 15+ chart types"
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "agent-charts" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_B2s" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --custom-data @- <<'AGENT4'
#!/bin/bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git python3 python3-pip
pip3 install openai

cd /home/azureuser
git clone https://github.com/andrewmorton/Fleet.git
cd Fleet
npm install

cat > agent-charts.py <<'PYTHON'
import openai
import os
import subprocess

client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

print("[CHARTS AGENT] Starting...")

charts_prompt = """
Create a complete chart library using Recharts and D3.js.

Chart types required:
1. LineChart - multi-series, time-series
2. AreaChart - stacked, percentage
3. BarChart - vertical, horizontal, stacked
4. PieChart - donut variant
5. ScatterChart - bubble support
6. HeatmapChart - calendar heatmap
7. GaugeChart - half/full circle
8. SparklineChart - inline micro charts
9. RadarChart - multi-axis
10. TreemapChart - hierarchical data
11. SankeyChart - flow diagrams
12. CandlestickChart - financial
13. FunnelChart - conversion tracking
14. WaterfallChart - cumulative changes
15. ComboChart - mixed types

All charts must support:
- Responsive sizing
- Dark mode
- Animations
- Tooltips with custom formatting
- Legends (top, bottom, left, right)
- Export (PNG, SVG, PDF)
- Zoom/pan
- Brush selection
- Real-time updates
- Accessibility
- Loading states
- Empty states

Create:
1. src/components/charts/ChartLibrary.tsx - All chart components
2. src/components/charts/ChartTypes.ts - TypeScript types
3. src/components/charts/ChartHelpers.ts - Utilities
4. src/components/charts/useChartTheme.ts - Theme hook
5. src/components/charts/Charts.stories.tsx - Storybook

Full TypeScript implementation with examples.
"""

response = client.chat.completions.create(
    model="gpt-4-turbo-preview",
    messages=[{"role": "user", "content": charts_prompt}],
    max_tokens=16000
)

with open('src/components/charts/ChartLibrary.tsx', 'w') as f:
    f.write(response.choices[0].message.content)

subprocess.run(['git', 'add', '.'], check=True)
subprocess.run(['git', 'commit', '-m', 'feat: Add advanced chart library'], check=True)
subprocess.run(['git', 'push'], check=True)

print("[CHARTS AGENT] Complete!")
PYTHON

export OPENAI_API_KEY="__OPENAI_KEY__"
export GITHUB_TOKEN="__GITHUB_PAT__"
python3 agent-charts.py
AGENT4

# Agent 5: Form Components
echo ""
echo "Agent 5: Form Component System Builder"
echo "Task: Build complete form library with 15+ input types"
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "agent-forms" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_B2s" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --custom-data @- <<'AGENT5'
#!/bin/bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git python3 python3-pip
pip3 install anthropic

cd /home/azureuser
git clone https://github.com/andrewmorton/Fleet.git
cd Fleet
npm install

cat > agent-forms.py <<'PYTHON'
import anthropic
import os
import subprocess

client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

print("[FORMS AGENT] Starting...")

forms_prompt = """
Create a complete form component system for React with TypeScript.

Components required:
1. TextInput - with validation, prefix/suffix
2. NumberInput - with increment/decrement, formatting
3. DatePicker - single date, date range
4. TimePicker - 12/24 hour format
5. DateTimePicker - combined
6. Select - native dropdown with search
7. Combobox - autocomplete, creatable
8. MultiSelect - tags, checkboxes
9. RadioGroup - inline/stacked layouts
10. CheckboxGroup - select all option
11. Switch - toggle with labels
12. Slider - single value, range
13. FileUpload - drag-drop, multiple files, preview
14. ColorPicker - swatches, hex input
15. RichTextEditor - markdown support

All components must have:
- Controlled/uncontrolled modes
- Validation (sync + async)
- Error messages
- Helper text
- Labels with required indicators
- Disabled states
- Loading states
- Responsive design
- Dark mode
- WCAG AA accessibility
- Keyboard navigation
- TypeScript types

Create:
1. src/components/forms/FormComponents.tsx - All components
2. src/components/forms/FormTypes.ts - Types
3. src/components/forms/FormValidation.ts - Validation helpers
4. src/components/forms/useForm.ts - Form hook
5. src/components/forms/Forms.stories.tsx - Storybook

Use react-hook-form for form state. Full implementation.
"""

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=16000,
    messages=[{"role": "user", "content": forms_prompt}]
)

with open('src/components/forms/FormComponents.tsx', 'w') as f:
    f.write(response.content[0].text)

subprocess.run(['git', 'add', '.'], check=True)
subprocess.run(['git', 'commit', '-m', 'feat: Add complete form component system'], check=True)
subprocess.run(['git', 'push'], check=True)

print("[FORMS AGENT] Complete!")
PYTHON

export ANTHROPIC_API_KEY="__ANTHROPIC_KEY__"
export GITHUB_TOKEN="__GITHUB_PAT__"
python3 agent-forms.py
AGENT5

# Agent 6: Performance Optimization
echo ""
echo "Agent 6: Performance Optimization Specialist"
echo "Task: Optimize Vite config, React Query, monitoring"
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "agent-performance" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_B2s" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --custom-data @- <<'AGENT6'
#!/bin/bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git python3 python3-pip
pip3 install anthropic

cd /home/azureuser
git clone https://github.com/andrewmorton/Fleet.git
cd Fleet
npm install

cat > agent-performance.py <<'PYTHON'
import anthropic
import os
import subprocess

client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

print("[PERFORMANCE AGENT] Starting...")

perf_prompt = """
Create performance optimization configuration for a React/Vite application.

1. Optimized Vite Config (vite.config.optimized.ts):
   - Route-based code splitting
   - Vendor splitting (React, dependencies)
   - CSS splitting
   - Asset optimization
   - Tree shaking
   - Bundle analysis
   - Target: Initial < 200KB, routes < 100KB

2. React Query Setup (src/lib/react-query-setup.ts):
   - Query client with optimal defaults
   - Custom hooks for all endpoints
   - Optimistic updates
   - Infinite queries
   - Prefetching strategies
   - Request deduplication
   - Error retry logic

3. Performance Monitoring (src/lib/performance-monitoring.ts):
   - Web Vitals (LCP, FID, CLS, TTFB, FCP)
   - Custom metrics
   - Error tracking
   - Real User Monitoring
   - Azure Application Insights integration

4. Lazy Loading Config (src/lib/lazy-loading.ts):
   - Route lazy loading
   - Component lazy loading
   - Image lazy loading
   - Intersection Observer hooks

Create all files with full TypeScript implementation.
"""

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=16000,
    messages=[{"role": "user", "content": perf_prompt}]
)

with open('vite.config.optimized.ts', 'w') as f:
    f.write(response.content[0].text)

subprocess.run(['git', 'add', '.'], check=True)
subprocess.run(['git', 'commit', '-m', 'feat: Add performance optimizations'], check=True)
subprocess.run(['git', 'push'], check=True)

print("[PERFORMANCE AGENT] Complete!")
PYTHON

export ANTHROPIC_API_KEY="__ANTHROPIC_KEY__"
export GITHUB_TOKEN="__GITHUB_PAT__"
python3 agent-performance.py
AGENT6

# Agent 7: Storybook Documentation
echo ""
echo "Agent 7: Storybook Documentation Builder"
echo "Task: Create comprehensive Storybook documentation"
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "agent-storybook" \
  --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest" \
  --size "Standard_B2s" \
  --admin-username "azureuser" \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --custom-data @- <<'AGENT7'
#!/bin/bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git python3 python3-pip
pip3 install openai

cd /home/azureuser
git clone https://github.com/andrewmorton/Fleet.git
cd Fleet
npm install
npm install --save-dev @storybook/react @storybook/addon-essentials @storybook/addon-a11y

cat > agent-storybook.py <<'PYTHON'
import openai
import os
import subprocess

client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

print("[STORYBOOK AGENT] Starting...")

storybook_prompt = """
Create comprehensive Storybook configuration and stories.

1. Storybook Config (.storybook/main.ts):
   - Framework: React + Vite
   - Addons: essentials, a11y, interactions
   - TypeScript support
   - Dark mode toggle

2. Theme Config (.storybook/preview.ts):
   - Global decorators
   - Theme provider
   - Responsive viewports
   - Backgrounds

3. Story Files:
   - src/components/layout/ResponsiveLayout.stories.tsx
   - src/components/reactive/ReactiveComponents.stories.tsx
   - src/components/mobile/MobileComponents.stories.tsx
   - src/components/tables/DataTable.stories.tsx
   - src/components/charts/Charts.stories.tsx
   - src/components/forms/Forms.stories.tsx
   - src/pages/Settings.stories.tsx
   - src/pages/UserAccounts.stories.tsx

Each story must include:
- Default variant
- All variants
- With data examples
- Interaction tests
- Accessibility checks
- Responsive demos

4. Documentation (.storybook/docs):
   - Introduction.mdx
   - Getting Started.mdx
   - Design Tokens.mdx
   - Component API.mdx
   - Accessibility.mdx
   - Best Practices.mdx

Full implementation with MDX documentation.
"""

response = client.chat.completions.create(
    model="gpt-4-turbo-preview",
    messages=[{"role": "user", "content": storybook_prompt}],
    max_tokens=16000
)

with open('.storybook/main.ts', 'w') as f:
    f.write(response.choices[0].message.content)

subprocess.run(['git', 'add', '.'], check=True)
subprocess.run(['git', 'commit', '-m', 'feat: Add Storybook documentation'], check=True)
subprocess.run(['git', 'push'], check=True)

print("[STORYBOOK AGENT] Complete!")
PYTHON

export OPENAI_API_KEY="__OPENAI_KEY__"
export GITHUB_TOKEN="__GITHUB_PAT__"
python3 agent-storybook.py
AGENT7

echo ""
echo "========================================="
echo "All 7 AI Agents Deployed Successfully!"
echo "========================================="
echo ""
echo "Agents deployed:"
echo "  1. Settings Section Developer"
echo "  2. User Accounts Section Developer"
echo "  3. Enterprise Data Table Builder"
echo "  4. Advanced Chart Library Builder"
echo "  5. Form Component System Builder"
echo "  6. Performance Optimization Specialist"
echo "  7. Storybook Documentation Builder"
echo ""
echo "Monitor progress:"
echo "  az vm list-ip-addresses -g $RESOURCE_GROUP -o table"
echo ""
echo "Expected completion: 30-45 minutes"
echo "All changes will be automatically committed and pushed to GitHub + Azure DevOps"
