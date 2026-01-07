# Real-Time Remediation Dashboard

## Overview

The Fleet Security Orchestrator includes a **real-time web dashboard** that provides live monitoring of remediation progress. Watch as findings are analyzed, prioritized, and automatically fixed—all in real-time with beautiful visualizations.

## Features

### 📊 Live Metrics
- **Total Findings**: Real-time count of all security/quality issues
- **Remediation Progress**: Live updates as fixes are applied
- **Success Rate**: Percentage of successfully remediated findings
- **Status Breakdown**: Current, in-progress, failed, and remaining findings

### 📈 Visualizations
- **Severity Distribution**: Bar chart showing critical/high/medium/low findings
- **Type Distribution**: Breakdown by security, quality, dependency, etc.
- **Risk Trend**: Line chart tracking total risk score over iterations
- **Progress Indicators**: Visual progress bars and metrics

### 🔄 Real-Time Updates
- **WebSocket Connection**: Instant updates without page refresh
- **Activity Stream**: See current remediation activity
- **Recent Fixes**: Live feed of remediated findings
- **Gate Results**: Verification gate pass/fail status

### 🎨 Professional UI
- **Modern Design**: Clean, gradient-based interface
- **Responsive**: Works on desktop and mobile
- **Color-Coded**: Severity badges, status indicators
- **Animations**: Pulse effects for in-progress items

## Quick Start

### 1. Launch Dashboard Only

```bash
# From Fleet root
cd tools/orchestrator
npm run dashboard

# Or using CLI
node dist/cli/index.js dashboard

# Custom port
node dist/cli/index.js dashboard --port 3002

# No auto-open browser
node dist/cli/index.js dashboard --no-open
```

### 2. Launch with Remediation

```bash
# Run remediation with live dashboard
npm run finish:dashboard

# Or using CLI
node dist/cli/index.js finish --dashboard

# With options
node dist/cli/index.js finish --dashboard --max-iterations 15 --port 3002

# Dry run (demo mode)
node dist/cli/index.js finish --dashboard --dry-run
```

### 3. Using Makefile

```bash
# From Fleet root
make dashboard          # Launch dashboard only
make finish-dashboard   # Remediation with dashboard
```

## Dashboard Interface

### Main Sections

#### 1. Header
- Connection status indicator (green = connected)
- Last update timestamp
- Current activity banner

#### 2. Overview Cards
- **Total Findings**: Count of all issues
- **Remediated**: Successfully fixed (with progress bar)
- **Success Rate**: Percentage complete
- **Status Breakdown**: 4-box grid showing all statuses

#### 3. Progress Card
- **Iteration**: Current/Total (e.g., "3 / 10")
- **Elapsed Time**: Time since start
- **Estimated Remaining**: Projected completion time

#### 4. Charts Section
- **By Severity**: Stacked bar chart (Critical, High, Medium, Low)
- **By Type**: Horizontal bar chart (Security, Quality, Dependency, etc.)
- **Risk Trend**: Dual-axis line chart showing risk score and finding count over iterations

#### 5. Activity Feeds
- **Recent Fixes**: Live scrolling list of remediated findings
  - Color-coded by status (green = success, red = failed, yellow = in progress)
  - Shows severity badge, timestamp, duration
  - Animated pulse for in-progress items

- **Gate Results**: Verification gate pass/fail status
  - Security gates
  - Quality gates
  - Test gates
  - Build gates

## Architecture

### Backend (WebSocket Server)

```typescript
// tools/orchestrator/src/dashboard/server.ts
class DashboardServer {
  - Express HTTP server
  - Socket.IO WebSocket server
  - Real-time metric broadcasting
  - RESTful API endpoints
}
```

**Endpoints**:
- `GET /` - Dashboard HTML
- `GET /api/metrics` - Current metrics (JSON)
- `GET /api/health` - Health check
- `WebSocket /` - Real-time updates

### Frontend (Single-Page App)

```html
<!-- tools/orchestrator/src/dashboard/public/index.html -->
- Socket.IO client
- Chart.js for visualizations
- Vanilla JavaScript (no framework dependencies)
- Responsive CSS Grid layout
```

## Integration

### Programmatic Usage

```typescript
import { getDashboard } from './dashboard/server.js';

// Get singleton instance
const dashboard = getDashboard(3001);

// Start server
await dashboard.start();

// Update metrics
dashboard.updateMetrics({
  overview: {
    total_findings: 100,
    remediated: 50,
    in_progress: 5,
    failed: 2,
    remaining: 43,
    success_rate: 50.0
  },
  current_activity: 'Fixing SQL injection vulnerabilities...'
});

// Update specific finding
dashboard.updateFinding('finding-123', 'success', {
  title: 'Fixed hardcoded password',
  severity: 'critical',
  type: 'security',
  duration_ms: 2500
});

// Add gate result
dashboard.addGateResult('Security Scan', true);

// Update risk trend
dashboard.updateRiskTrend(1, 850, 43);

// Set activity
dashboard.setActivity('Running ESLint verification...');

// Stop server
await dashboard.stop();
```

### CLI Integration

The dashboard is automatically integrated into:
- `review` command (optional --dashboard flag)
- `finish` command (optional --dashboard flag)
- Dedicated `dashboard` command

## Configuration

### Port Configuration

Default port: **3001**

Change via:
```bash
# Environment variable
PORT=3002 npm run dashboard

# CLI flag
node dist/cli/index.js dashboard --port 3002

# Code
const dashboard = getDashboard(3002);
```

### Auto-Open Browser

By default, the dashboard auto-opens in your browser. Disable with:
```bash
node dist/cli/index.js dashboard --no-open
```

## Data Flow

```
Remediation Engine
        ↓
Dashboard Server (updates metrics)
        ↓
WebSocket Broadcast
        ↓
Browser Clients (real-time update)
        ↓
Chart.js Re-render
```

## Performance

- **Lightweight**: ~100KB total (HTML + JS + CSS)
- **Efficient**: Delta updates only via WebSocket
- **Scalable**: Supports multiple concurrent clients
- **Low Latency**: <50ms update propagation

## Security

- **CORS Enabled**: Allows localhost connections
- **No Authentication**: Dashboard is localhost-only by design
- **Input Validation**: All updates validated before broadcast
- **XSS Protection**: HTML escaping for user content

## Troubleshooting

### Port Already in Use

```bash
# Check what's using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or use a different port
node dist/cli/index.js dashboard --port 3002
```

### Dashboard Won't Open

```bash
# Manually navigate to
http://localhost:3001

# Check server logs
tail -f tools/orchestrator/logs/orchestrator-*.log

# Verify server is running
curl http://localhost:3001/api/health
```

### WebSocket Connection Failed

1. Check firewall settings
2. Ensure port 3001 is not blocked
3. Try disabling browser extensions
4. Check browser console for errors

### No Data Showing

1. Verify remediation is running
2. Check console for WebSocket errors
3. Refresh the page
4. Check server logs for errors

## Examples

### Example 1: Monitor Existing Scan

```bash
# Terminal 1: Start dashboard
cd tools/orchestrator
npm run dashboard

# Terminal 2: Run scan
npm run review
```

### Example 2: Live Remediation

```bash
# Single command with dashboard
npm run finish:dashboard
```

### Example 3: Demo Mode

```bash
# Run dry-run to see dashboard in action
node dist/cli/index.js finish --dashboard --dry-run
```

## API Reference

### DashboardMetrics Interface

```typescript
interface DashboardMetrics {
  timestamp: string;
  overview: {
    total_findings: number;
    remediated: number;
    in_progress: number;
    failed: number;
    remaining: number;
    success_rate: number;
  };
  by_severity: Record<string, {
    total: number;
    remediated: number;
    remaining: number;
  }>;
  by_type: Record<string, {
    total: number;
    remediated: number;
    remaining: number;
  }>;
  current_iteration: number;
  max_iterations: number;
  elapsed_time_ms: number;
  estimated_time_remaining_ms: number;
  current_activity: string;
  recent_fixes: Array<{
    id: string;
    title: string;
    severity: string;
    type: string;
    status: 'success' | 'failed' | 'in_progress';
    timestamp: string;
    duration_ms?: number;
  }>;
  gate_results: Array<{
    gate: string;
    passed: boolean;
    timestamp: string;
    errors?: string[];
  }>;
  risk_trend: Array<{
    iteration: number;
    total_risk_score: number;
    findings_count: number;
  }>;
}
```

## Screenshots

### Overview Section
- Large metrics cards showing total findings, remediated count, success rate
- Progress bars with smooth animations
- Color-coded status indicators

### Charts Section
- Bar charts using Chart.js
- Responsive resizing
- Stacked visualization for remediated vs remaining

### Activity Feed
- Real-time scrolling list
- Severity badges (Critical=red, High=orange, Medium=blue, Low=purple)
- Pulse animation for in-progress items
- Timestamps and duration

### Gate Results
- Pass/fail indicators
- Recent gate executions
- Error messages for failed gates

## Future Enhancements

- [ ] Export dashboard to PDF
- [ ] Historical trend comparison
- [ ] Email notifications on completion
- [ ] Slack/Teams integration
- [ ] Custom alert thresholds
- [ ] Dark mode toggle
- [ ] Multi-project support
- [ ] Authentication for remote access

## Support

For issues with the dashboard:
1. Check logs: `tools/orchestrator/logs/`
2. Verify server is running: `curl http://localhost:3001/api/health`
3. Check browser console for errors
4. Try refreshing the page
5. Restart the dashboard server

---

**Dashboard Version:** 1.0.0
**Last Updated:** January 6, 2026
**Maintained By:** Fleet Security Orchestrator Team
