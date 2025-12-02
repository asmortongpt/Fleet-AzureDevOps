# Planning Guide

A comprehensive enterprise fleet management system that provides real-time vehicle tracking, maintenance scheduling, driver management, fuel analytics, predictive maintenance capabilities, vendor management, parts inventory, purchase order processing, AI-powered communication assistance, and deep Microsoft Office integrations (Teams, Outlook, Excel) for large organizations managing diverse vehicle fleets.

**Experience Qualities**:
1. **Professional** - The interface should convey trust, reliability, and enterprise-grade quality through clean typography and structured layouts
2. **Informative** - Data should be immediately scannable with clear visual hierarchies that guide attention to critical metrics
3. **Responsive** - The dashboard should feel alive with smooth transitions and real-time data updates that provide confidence in system accuracy

**Complexity Level**: Complex Application (advanced functionality, accounts)
  - Comprehensive fleet management platform with multiple interconnected modules including vehicle tracking, maintenance scheduling, driver management, fuel analytics, GIS mapping, predictive maintenance, mileage reimbursement workflows, vendor management, parts inventory, purchase orders, invoicing, AI assistant, Microsoft Teams integration, Outlook email center, automated scheduling, receipt processing with OCR, and communication logging with role-based access and data persistence

## Essential Features

### Real-Time Metrics Dashboard
- **Functionality**: Display key performance indicators across operations, fleet, sales, and system health with visual charts and trend indicators
- **Purpose**: Provide at-a-glance visibility into business performance and system status
- **Trigger**: Automatic on page load
- **Progression**: Page loads → Data initializes → Charts render → Real-time updates simulate activity → User can switch between metric categories
- **Success criteria**: All metrics display correctly with smooth animations, charts are readable, and data updates create sense of live monitoring

### Vendor Management System
- **Functionality**: Complete vendor lifecycle management including onboarding, performance tracking, contract management, and communication history
- **Purpose**: Centralize all vendor relationships and streamline procurement processes
- **Trigger**: User navigates to vendor management module
- **Progression**: View vendor list → Search/filter vendors → Add new vendor → Track performance → Manage contracts → Generate reports
- **Success criteria**: Vendors can be easily added, tracked, rated, and contacted with full audit trail

### Parts Inventory Management
- **Functionality**: Real-time inventory tracking with stock levels, reorder points, location management, and automated alerts
- **Purpose**: Prevent stockouts and optimize parts inventory investment
- **Trigger**: User accesses parts inventory module
- **Progression**: View inventory → Check stock levels → Receive low stock alerts → Create purchase orders → Track usage → Generate reports
- **Success criteria**: Stock levels are accurate, alerts trigger appropriately, and inventory value is tracked

### Purchase Order Processing
- **Functionality**: Create, approve, track, and receive purchase orders with multi-level approval workflows
- **Purpose**: Streamline procurement process and maintain financial controls
- **Trigger**: User creates new purchase order or vendor submits quote
- **Progression**: Create PO → Add items → Submit for approval → Approve → Send to vendor → Track delivery → Receive items → Close PO
- **Success criteria**: POs flow through approval process, vendors receive notifications, and receipt is tracked

### Invoice & Billing Management
- **Functionality**: Process vendor invoices, track payment status, manage payment terms, and prevent duplicate payments
- **Purpose**: Maintain accurate accounts payable and vendor payment schedules
- **Trigger**: Invoice received from vendor or system-generated
- **Progression**: Receive invoice → Match to PO → Review charges → Approve payment → Schedule payment → Process payment → Record transaction
- **Success criteria**: Invoices are accurately tracked, payments are timely, and aging reports are available

### AI Fleet Assistant
- **Functionality**: Natural language AI assistant for drafting communications, analyzing data, suggesting vendors, processing receipts, and generating reports
- **Purpose**: Accelerate decision-making and reduce administrative burden through intelligent automation
- **Trigger**: User opens AI assistant or system suggests assistance
- **Progression**: User asks question → AI analyzes context → AI provides recommendations → User accepts/modifies → Action executed → Results logged
- **Success criteria**: AI provides accurate, contextual responses and successfully automates routine tasks

### Microsoft Teams Integration
- **Functionality**: Post notifications, share reports, coordinate maintenance schedules, and collaborate with team members directly in Teams
- **Purpose**: Enable seamless team communication without leaving the fleet management system
- **Trigger**: User posts message or system generates notification
- **Progression**: Create message → Select channel → Add mentions → Post → Team receives notification → Responses tracked → Actions logged
- **Success criteria**: Messages post successfully, notifications reach right people, and conversation is threaded

### Outlook Email Center
- **Functionality**: Send and receive fleet-related emails, auto-categorize by vehicle/vendor/workorder, extract receipts, and schedule maintenance via email
- **Purpose**: Centralize all fleet communications and automate email-based workflows
- **Trigger**: Email received or user composes message
- **Progression**: Receive email → AI categorizes → Extract attachments → Link to relevant records → Suggest actions → User responds → Track communication
- **Success criteria**: Emails are properly categorized, receipts are extracted, and responses are tracked

### Automated Maintenance Scheduling
- **Functionality**: Calendar-based maintenance scheduling with vendor coordination, automatic reminders, and conflict detection
- **Purpose**: Ensure vehicles receive timely maintenance and optimize service center utilization
- **Trigger**: Mileage threshold reached or date-based schedule
- **Progression**: System detects service due → AI suggests vendors → Create appointment → Send email to vendor → Receive confirmation → Add to calendar → Send reminders → Complete service → Update records
- **Success criteria**: Maintenance is scheduled automatically, vendors are notified, and calendar is always current

### Receipt Processing with OCR
- **Functionality**: Capture receipt images, extract data using OCR, categorize expenses, link to vehicles/workorders, and submit for approval
- **Purpose**: Eliminate manual data entry and ensure accurate expense tracking
- **Trigger**: User uploads receipt image or email with attachment
- **Progression**: Upload image → AI extracts data → User reviews/corrects → Categorize expense → Link to records → Submit for approval → Approve → Record in system
- **Success criteria**: OCR accuracy >90%, proper categorization, and seamless approval workflow

### Communication Logging
- **Functionality**: Track all communications (email, Teams, phone, in-person) related to vehicles, vendors, and work orders
- **Purpose**: Maintain complete audit trail and enable follow-up management
- **Trigger**: Communication occurs through system or manually logged
- **Progression**: Communication happens → System logs details → Links to related records → Sets follow-up reminders → User completes follow-up → Log updated
- **Success criteria**: All communications are logged, searchable, and properly linked to related entities

## Edge Case Handling

- **No Data States**: Display helpful empty states with icons and guidance when metrics aren't available
- **Loading States**: Show skeleton loaders during initial data fetch to maintain perceived performance
- **Large Numbers**: Format large values with abbreviations (K, M, B) while maintaining readability
- **Responsive Layouts**: Charts and grids reorganize gracefully on smaller screens without losing functionality
- **Rapid Updates**: Throttle animation updates to prevent performance degradation during high-frequency data changes
- **Offline Mode**: Queue critical actions when offline and sync when connection restored
- **API Failures**: Graceful degradation with clear error messages and retry mechanisms
- **Duplicate Prevention**: Detect duplicate POs, invoices, and prevent double-booking maintenance slots
- **Permission Errors**: Clear messaging when users lack permissions with guidance on obtaining access

## Design Direction

The dashboard should feel like a premium enterprise SaaS platform - sophisticated, data-rich yet uncluttered, with a minimal interface that lets the data be the hero. The design should convey reliability and professionalism through structured grids, generous whitespace, and purposeful use of color to indicate status and importance. Microsoft Office integration should feel native and seamless.

## Color Selection

**Triadic** - Three strategically chosen colors that work together to create visual interest while maintaining professional aesthetics. The scheme uses deep blue for trust and stability, vibrant purple for technology and innovation, and emerald for success and positive metrics.

- **Primary Color**: Deep Blue (oklch(0.45 0.15 250)) - Communicates enterprise trust, stability, and professionalism. Used for primary actions and key UI elements.
- **Secondary Colors**: 
  - Rich Purple (oklch(0.55 0.18 290)) - Represents innovation and technology, used for secondary actions and accent elements
  - Emerald Green (oklch(0.65 0.15 160)) - Indicates success, growth, and positive trends in metrics
- **Accent Color**: Bright Cyan (oklch(0.75 0.12 210)) - Attention-grabbing highlight for CTAs, active states, and important alerts
- **Foreground/Background Pairings**:
  - Background (Slate Gray oklch(0.98 0.005 250)): Deep Charcoal text (oklch(0.25 0.02 250)) - Ratio 13.2:1 ✓
  - Card (White oklch(1 0 0)): Deep Charcoal text (oklch(0.25 0.02 250)) - Ratio 15.8:1 ✓
  - Primary (Deep Blue oklch(0.45 0.15 250)): White text (oklch(1 0 0)) - Ratio 8.9:1 ✓
  - Secondary (Soft Slate oklch(0.94 0.01 250)): Deep Charcoal text (oklch(0.25 0.02 250)) - Ratio 13.5:1 ✓
  - Accent (Bright Cyan oklch(0.75 0.12 210)): Deep Charcoal text (oklch(0.25 0.02 250)) - Ratio 10.2:1 ✓
  - Muted (Light Slate oklch(0.96 0.008 250)): Slate Gray text (oklch(0.52 0.03 250)) - Ratio 5.8:1 ✓

## Font Selection

Typography should be crisp, highly readable, and professional - conveying enterprise quality through a modern sans-serif that works across data-dense interfaces and maintains clarity at various sizes.

- **Typographic Hierarchy**:
  - H1 (Dashboard Title): Inter SemiBold / 32px / -0.02em letter spacing / 1.1 line height
  - H2 (Section Headers): Inter SemiBold / 24px / -0.01em letter spacing / 1.2 line height  
  - H3 (Card Titles): Inter Medium / 18px / normal letter spacing / 1.3 line height
  - Body (Metric Labels): Inter Regular / 14px / normal letter spacing / 1.5 line height
  - Small (Supporting Text): Inter Regular / 12px / 0.01em letter spacing / 1.4 line height
  - Numbers (Data Display): Inter SemiBold / varies / tabular-nums / 1.0 line height

## Animations

Animations should be subtle and purposeful - reinforcing the sense of real-time data without distracting from information consumption. Motion should feel smooth and refined, like a well-engineered machine operating efficiently.

- **Purposeful Meaning**: Use gentle fade-ins for data loading, subtle scale transforms on hover to indicate interactivity, and smooth value transitions when metrics update to show the dashboard is alive
- **Hierarchy of Movement**: 
  - Critical alerts: Quick attention-drawing pulse (200ms)
  - Chart updates: Smooth value transitions (400ms ease-out)
  - Navigation: Fast page transitions (250ms)
  - Hover states: Immediate feedback (150ms)
  - Status indicators: Gentle breathing effect for processing states (2s loop)
  - AI responses: Typing animation for natural feel

## Component Selection

- **Components**: 
  - **Card** (with header/content structure) - Primary container for all metric groups and charts, customized with subtle shadows and border treatments
  - **Tabs** - Category navigation between different operational views
  - **Badge** - Status indicators and metric change percentages with color variants
  - **Progress** - Visual representation of completion metrics and capacity utilization
  - **Separator** - Subtle dividers between metric groups
  - **Tooltip** - Data point details on chart hover
  - **Avatar** (with fallback) - User profile indicator in header
  - **Dropdown Menu** - Settings and user actions
  - **Dialog** - Modal forms for adding vendors, parts, creating POs
  - **Table** - Data-dense list views with sorting and filtering
  - **Calendar** - Maintenance scheduling and appointment management
  - **Textarea** - Email composition and message drafting
  - **Select** - Dropdowns for filtering and categorization
  
- **Customizations**: 
  - Custom metric card component combining Card with trend indicators and sparklines
  - Custom chart wrapper integrating Recharts with theme colors
  - Custom status indicator component with animated pulse for active states
  - Grid layouts using CSS Grid for responsive dashboard sections
  - Chat-style message bubbles for AI assistant conversations
  - Email inbox with preview pane for Outlook integration
  - Channel list with unread badges for Teams integration
  
- **States**: 
  - Buttons: Subtle background on hover, slight scale on press, muted when disabled
  - Cards: Elevated shadow on hover for interactive cards, border highlight on selection
  - Metrics: Color changes for positive (green) vs negative (red) trends, animated value updates
  - Status badges: Color-coded (green=healthy, yellow=warning, red=critical, blue=info)
  - Loading: Skeleton screens for initial load, spinner for actions, pulse for processing
  
- **Icon Selection**: 
  - @phosphor-icons/react for consistent iconography
  - Chart/TrendUp/TrendDown for metric trends
  - Circle/CheckCircle/Warning/XCircle for status indicators
  - Activity/Pulse for real-time monitoring
  - Users/Truck/ShoppingCart/Server for category icons
  - Gear/Bell/User for utility functions
  - Robot for AI assistant
  - ChatsCircle for Teams
  - Envelope for email
  - Package for inventory
  - Storefront for vendors
  
- **Spacing**: 
  - Card padding: p-6 (24px) for comfortable content spacing
  - Grid gaps: gap-6 (24px) between cards, gap-4 (16px) within card sections
  - Metric groups: space-y-4 (16px) for vertical rhythm
  - Page margins: Container with max-w-7xl and px-6 for consistent edge treatment
  
- **Mobile**: 
  - Stack cards vertically on mobile (<768px)
  - Tabs convert to full-width stacked buttons
  - Charts adjust aspect ratio for readability
  - Reduce padding to p-4 on small screens
  - Hide non-essential secondary metrics
  - Sticky header with compact controls
  - Collapsible sidebar with overlay on mobile
  - Swipe gestures for navigation
