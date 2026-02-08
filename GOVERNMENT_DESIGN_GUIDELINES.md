# Government Client Design Guidelines

**Target Audience:** Federal, State, and Local Government Fleet Managers
**Compliance:** FedRAMP, NIST 800-53, Section 508, WCAG 2.1 AA
**Tone:** Professional, Trustworthy, Authoritative, Modern

---

## Design Philosophy: "Professional Elegance"

Fleet-CTA balances **government professionalism** with **modern design excellence**:

### ✅ DO: Professional & Modern
- Clean, uncluttered interfaces
- Subtle, purposeful animations
- High-contrast, accessible colors
- Data-driven visualizations
- Enterprise-grade reliability

### ❌ DON'T: Flashy or Trendy
- Excessive animations
- Bright neon colors
- Playful illustrations
- Consumer app aesthetics
- Experimental UI patterns

---

## 1. Color Palette: Trust & Authority

### Primary Colors (Government-Appropriate)

**Blue (Trust & Stability)**
- Primary: `#2563EB` - Professional blue (WCAG AA compliant)
- Hover: `#1D4ED8` - Darker blue for interactions
- Light: `#DBEAFE` - Subtle backgrounds
- Usage: Primary actions, links, data highlights

**Gray (Professionalism)**
- Text: `#111827` - High contrast (14.6:1 ratio)
- Secondary: `#6B7280` - Readable gray (4.8:1 ratio)
- Background: `#F9FAFB` - Clean, neutral background
- Borders: `#E5E7EB` - Subtle dividers

**Green (Success & Compliance)**
- Success: `#059669` - WCAG AA compliant
- Usage: Compliance status, completed tasks, "in service" vehicles

**Red (Alerts & Critical)**
- Critical: `#DC2626` - High visibility
- Usage: Safety violations, maintenance alerts, "out of service" vehicles

**Amber (Warnings)**
- Warning: `#D97706` - Attention without alarm
- Usage: Pending inspections, upcoming maintenance

### Secondary Colors (Data Visualization)

```css
/* Government-appropriate data viz palette */
--data-blue: #3B82F6;
--data-teal: #14B8A6;
--data-violet: #8B5CF6;
--data-amber: #F59E0B;
--data-rose: #F43F5E;

/* All colors tested for colorblind accessibility */
```

### Color Usage Rules

1. **High Contrast Required**: Minimum 4.5:1 for text, 3:1 for large text
2. **Never Use Color Alone**: Always pair with icons, labels, or patterns
3. **Colorblind Safe**: Test with Coblis Color Blindness Simulator
4. **Consistent Meaning**: Green = good, Red = critical, Amber = caution

---

## 2. Typography: Clarity & Readability

### Font Stack

```css
/* Primary: Inter (modern, professional, government-approved) */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;

/* Monospace: JetBrains Mono (for codes, IDs, technical data) */
font-family: 'JetBrains Mono', 'Courier New', monospace;
```

### Type Scale (Modular Scale: 1.250 - Major Third)

```css
/* Headers */
--text-6xl: 3.815rem;  /* 61px - Dashboard titles */
--text-5xl: 3.052rem;  /* 49px - Page headers */
--text-4xl: 2.441rem;  /* 39px - Section headers */
--text-3xl: 1.953rem;  /* 31px - Card headers */
--text-2xl: 1.563rem;  /* 25px - Subsections */
--text-xl: 1.25rem;    /* 20px - Labels */

/* Body */
--text-base: 1rem;     /* 16px - Body text */
--text-sm: 0.8rem;     /* 13px - Captions */
--text-xs: 0.64rem;    /* 10px - Footnotes */

/* Line Height */
--leading-tight: 1.25;   /* Headers */
--leading-normal: 1.5;   /* Body */
--leading-relaxed: 1.75; /* Longform content */
```

### Font Weights

```css
--font-normal: 400;    /* Body text */
--font-medium: 500;    /* Labels, navigation */
--font-semibold: 600;  /* Subheadings, emphasis */
--font-bold: 700;      /* Page headers, critical info */
--font-extrabold: 800; /* Dashboard stats, KPIs */
```

### Typography Rules

1. **Max Line Length**: 75 characters for readability
2. **Minimum Font Size**: 14px for body text (better than WCAG minimum)
3. **Adequate Spacing**: 1.5x line height for body, 1.25x for headers
4. **Sentence Case**: Use sentence case, not ALL CAPS (better readability)

---

## 3. Spacing & Layout: Organized & Scannable

### Spacing Scale (8px Base Grid)

```css
--space-1: 0.25rem;  /* 4px - Tight spacing */
--space-2: 0.5rem;   /* 8px - Between related items */
--space-3: 0.75rem;  /* 12px - Card padding */
--space-4: 1rem;     /* 16px - Section spacing */
--space-6: 1.5rem;   /* 24px - Component margins */
--space-8: 2rem;     /* 32px - Large gaps */
--space-12: 3rem;    /* 48px - Page sections */
--space-16: 4rem;    /* 64px - Major divisions */
```

### Layout Principles

**Government Data is Dense** - Use whitespace strategically:

```tsx
// ✅ GOOD: Grouped, scannable data
<div className="space-y-6">
  <section className="card p-6">
    <h2 className="text-2xl font-bold mb-4">Active Vehicles</h2>
    <div className="grid grid-cols-3 gap-4">
      <Stat label="In Service" value={245} />
      <Stat label="Maintenance" value={12} />
      <Stat label="Out of Service" value={3} />
    </div>
  </section>

  <section className="card p-6">
    <h2 className="text-2xl font-bold mb-4">Safety Compliance</h2>
    {/* compliance data */}
  </section>
</div>

// ❌ BAD: Cramped, hard to scan
<div>
  <h2>Active Vehicles</h2>
  <div><span>In Service: 245</span><span>Maintenance: 12</span></div>
</div>
```

### Grid System

**12-Column Grid** for flexibility:

```css
/* Desktop: 3 columns of data */
.grid-cols-3

/* Tablet: 2 columns */
@media (max-width: 1024px) {
  .md:grid-cols-2
}

/* Mobile: 1 column (government users need full data visibility) */
@media (max-width: 768px) {
  .sm:grid-cols-1
}
```

---

## 4. Animations: Subtle & Purposeful

### Government Animation Philosophy

**Animations should:**
- ✅ Provide feedback (button pressed, data loading)
- ✅ Guide attention (new data appearing)
- ✅ Indicate progress (upload status)
- ✅ Respect `prefers-reduced-motion` (mandatory for Section 508)

**Animations should NOT:**
- ❌ Be decorative or "fun"
- ❌ Distract from critical information
- ❌ Delay task completion
- ❌ Cause motion sickness

### Approved Animation Types

**1. Button Feedback (100ms)**

```tsx
// Subtle scale on press (professional, not playful)
<motion.button
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.1 }}
>
  Submit Report
</motion.button>
```

**2. Loading States (300-500ms)**

```tsx
// Skeleton loaders, NOT spinners (shows data structure)
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
  <div className="h-4 bg-gray-200 rounded w-1/2" />
</div>
```

**3. Page Transitions (200-300ms)**

```tsx
// Crossfade, NOT slide (professional, not flashy)
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2 }}
>
  {content}
</motion.div>
```

**4. Data Updates (400ms)**

```tsx
// Fade in new data (draws attention without distraction)
<AnimatePresence mode="wait">
  <motion.div
    key={data.id}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.4 }}
  >
    {data}
  </motion.div>
</AnimatePresence>
```

### Animation Timing

```css
/* Duration Guidelines */
--duration-instant: 100ms;  /* Button feedback */
--duration-fast: 200ms;     /* Tooltips, dropdowns */
--duration-normal: 300ms;   /* Page transitions */
--duration-slow: 400ms;     /* Data loading */
--duration-lazy: 500ms;     /* Large modals */

/* Easing Functions */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);      /* Default */
--ease-out: cubic-bezier(0.0, 0, 0.2, 1);         /* Entering */
--ease-in: cubic-bezier(0.4, 0, 1, 1);            /* Exiting */
```

---

## 5. Components: Enterprise-Grade

### Data Tables

**Government Requirement:** Handle 1,000+ rows, sortable, filterable, exportable

```tsx
// Use AG Grid (enterprise standard)
<AgGridReact
  rowData={vehicles}
  columnDefs={columnDefs}
  pagination={true}
  paginationPageSize={50}
  enableCellTextSelection={true}  // Copy-paste for reports
  suppressMovableColumns={true}    // Consistent layout
  defaultColDef={{
    sortable: true,
    filter: true,
    resizable: true
  }}
/>
```

**Styling:**
- Zebra striping for readability
- Fixed headers during scroll
- High-contrast borders (accessible)
- No hover effects (touchscreen accessibility)

### Cards

**Professional Card Design:**

```tsx
<div className="card bg-white rounded-lg border border-gray-200 shadow-sm">
  <div className="card-header p-4 border-b border-gray-200">
    <h3 className="text-lg font-semibold text-gray-900">Vehicle #245</h3>
  </div>
  <div className="card-body p-4">
    <dl className="grid grid-cols-2 gap-4">
      <div>
        <dt className="text-sm font-medium text-gray-600">Status</dt>
        <dd className="text-base font-semibold text-green-600">In Service</dd>
      </div>
      <div>
        <dt className="text-sm font-medium text-gray-600">Mileage</dt>
        <dd className="text-base font-semibold text-gray-900">24,567 mi</dd>
      </div>
    </dl>
  </div>
</div>
```

**Card Rules:**
- Always use definition lists (`<dl>`) for structured data
- Label-value pairs aligned
- Consistent padding (16px)
- Subtle shadows (professional, not flashy)

### Buttons

**Primary Button (Call-to-Action):**

```tsx
<button className="btn btn-primary">
  Submit Inspection Report
</button>

/* Styles */
.btn-primary {
  @apply px-4 py-2 bg-blue-600 text-white font-medium rounded-md;
  @apply hover:bg-blue-700 focus:ring-2 focus:ring-blue-500;
  @apply transition-colors duration-150;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}
```

**Secondary Button (Alternative Actions):**

```tsx
<button className="btn btn-secondary">
  Cancel
</button>

.btn-secondary {
  @apply px-4 py-2 bg-white text-gray-700 font-medium rounded-md;
  @apply border border-gray-300 hover:bg-gray-50;
  @apply focus:ring-2 focus:ring-gray-500;
}
```

**Destructive Button (Dangerous Actions):**

```tsx
<button className="btn btn-destructive">
  Delete Vehicle Record
</button>

.btn-destructive {
  @apply px-4 py-2 bg-red-600 text-white font-medium rounded-md;
  @apply hover:bg-red-700 focus:ring-2 focus:ring-red-500;
}
```

### Icons

**Government Icon Library:** Lucide Icons (professional, consistent)

```tsx
import { Truck, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

// Icon Sizes
<Truck size={16} />  {/* Small - inline text */}
<Truck size={20} />  {/* Medium - buttons */}
<Truck size={24} />  {/* Large - headers */}
<Truck size={48} />  {/* XL - empty states */}
```

**Icon Rules:**
- Always pair with text labels (accessibility)
- Use consistent stroke width (2px)
- Color must meet WCAG contrast (not icon alone)
- Avoid decorative icons (purposeful only)

---

## 6. Data Visualization: Trustworthy & Clear

### Chart Guidelines

**Government Data Viz Requirements:**
- ✅ Accessible to colorblind users
- ✅ High-contrast colors
- ✅ Clear axis labels
- ✅ Exportable data
- ✅ Printable (black & white legible)

### Color-Safe Palette

```css
/* All colors tested with Coblis */
--viz-blue: #2563EB;     /* Primary trend */
--viz-teal: #14B8A6;     /* Secondary trend */
--viz-amber: #F59E0B;    /* Warnings */
--viz-green: #059669;    /* Success */
--viz-red: #DC2626;      /* Critical */
```

### Chart Types

**Line Charts** (Trends over Time):

```tsx
<LineChart data={fuelCosts}>
  <Line
    type="monotone"
    dataKey="cost"
    stroke="#2563EB"
    strokeWidth={2}
    dot={{ r: 4, fill: "#2563EB" }}
  />
  <XAxis
    dataKey="date"
    tick={{ fill: "#6B7280", fontSize: 12 }}
    axisLine={{ stroke: "#E5E7EB" }}
  />
  <YAxis
    tick={{ fill: "#6B7280", fontSize: 12 }}
    axisLine={{ stroke: "#E5E7EB" }}
    label={{ value: "Cost ($)", angle: -90, position: "insideLeft" }}
  />
  <Tooltip
    contentStyle={{
      backgroundColor: "#FFF",
      border: "1px solid #E5E7EB",
      borderRadius: "4px"
    }}
  />
  <Legend
    wrapperStyle={{ fontSize: 14 }}
    iconType="line"
  />
</LineChart>
```

**Bar Charts** (Comparisons):

```tsx
<BarChart data={maintenanceCosts}>
  <Bar
    dataKey="cost"
    fill="#2563EB"
    radius={[4, 4, 0, 0]}  {/* Rounded tops only */}
  />
  {/* Axes styled same as line chart */}
</BarChart>
```

**Pie Charts** (Proportions - Use Sparingly):

```tsx
// Only use for 3-5 categories max
<PieChart>
  <Pie
    data={statusData}
    dataKey="count"
    nameKey="status"
    cx="50%"
    cy="50%"
    outerRadius={80}
    label={(entry) => `${entry.status}: ${entry.count}`}
  >
    {statusData.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={COLORS[index]} />
    ))}
  </Pie>
</PieChart>
```

---

## 7. Accessibility: Section 508 & WCAG 2.1 AA

### Keyboard Navigation

**All Interactive Elements Must:**
- Be keyboard accessible (Tab, Enter, Escape, Arrow keys)
- Show clear focus indicators
- Have logical tab order
- Support keyboard shortcuts (where applicable)

```tsx
// Example: Accessible modal
<Dialog
  onClose={close}
  onKeyDown={(e) => {
    if (e.key === 'Escape') close()
  }}
>
  <DialogTitle id="dialog-title">Inspection Report</DialogTitle>
  <DialogDescription id="dialog-desc">
    Complete the DVIR inspection for Vehicle #245
  </DialogDescription>

  {/* First focusable element */}
  <input autoFocus />

  <button onClick={submit}>Submit</button>
  <button onClick={close}>Cancel</button>
</Dialog>
```

### Screen Reader Support

**ARIA Labels Required:**

```tsx
// Icon buttons
<button aria-label="Filter vehicles by status">
  <FilterIcon />
</button>

// Status badges
<span className="badge" aria-label={`Vehicle status: ${status}`}>
  {status}
</span>

// Data tables
<table aria-label="Active vehicles" aria-describedby="table-caption">
  <caption id="table-caption">
    List of 245 active fleet vehicles with current status
  </caption>
  {/* ... */}
</table>
```

### Color Contrast

**All Text Must Meet WCAG AA:**
- Regular text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- Interactive elements: 3:1 minimum

**Testing Tools:**
- WebAIM Contrast Checker
- Axe DevTools
- WAVE Browser Extension

---

## 8. Mobile & Tablet: Government Users On-the-Go

### Responsive Breakpoints

```css
/* Mobile First */
@media (min-width: 640px) { /* sm - Small tablets */ }
@media (min-width: 768px) { /* md - Tablets */ }
@media (min-width: 1024px) { /* lg - Desktop */ }
@media (min-width: 1280px) { /* xl - Large desktop */ }
@media (min-width: 1536px) { /* 2xl - Ultra-wide */ }
```

### Touch Targets

**Government Standard: 44px minimum** (WCAG 2.5.5)

```css
.btn, .link, a, button {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 16px;
}
```

### Mobile Navigation

```tsx
// Hamburger menu for mobile (icon + label)
<button
  className="md:hidden"
  aria-label="Open navigation menu"
  aria-expanded={menuOpen}
>
  <MenuIcon size={24} />
  <span className="sr-only">Menu</span>
</button>

// Full navigation for desktop
<nav className="hidden md:flex gap-6">
  <a href="/fleet">Fleet</a>
  <a href="/drivers">Drivers</a>
  <a href="/maintenance">Maintenance</a>
</nav>
```

---

## 9. Error Handling: Clear & Actionable

### Error Message Format

```tsx
// ✅ GOOD: Specific, actionable, helpful
<Alert variant="error" role="alert">
  <AlertTriangle className="h-5 w-5" />
  <AlertTitle>Unable to Submit Inspection Report</AlertTitle>
  <AlertDescription>
    Vehicle #245's odometer reading (24,567 mi) is less than the previous
    reading (25,102 mi). Please verify the odometer and try again.
  </AlertDescription>
  <button onClick={contactSupport}>Contact Support</button>
</Alert>

// ❌ BAD: Vague, unhelpful
<Alert>
  Error occurred. Please try again.
</Alert>
```

### Form Validation

**Inline Validation:**

```tsx
<div>
  <label htmlFor="vin" className="block text-sm font-medium">
    Vehicle Identification Number (VIN)
    <span className="text-red-600" aria-label="required">*</span>
  </label>

  <input
    id="vin"
    {...register('vin', {
      required: 'VIN is required',
      pattern: {
        value: /^[A-HJ-NPR-Z0-9]{17}$/,
        message: 'VIN must be exactly 17 characters (no I, O, or Q)'
      }
    })}
    aria-invalid={!!errors.vin}
    aria-describedby="vin-error"
  />

  {errors.vin && (
    <p id="vin-error" className="text-sm text-red-600 mt-1" role="alert">
      {errors.vin.message}
    </p>
  )}
</div>
```

---

## 10. Performance: Fast & Reliable

### Government Performance Requirements

- **Time to Interactive:** < 3 seconds on 3G
- **First Contentful Paint:** < 1.5 seconds
- **Cumulative Layout Shift:** < 0.1
- **Time to First Byte:** < 600ms

### Optimization Strategies

1. **Code Splitting** - Load only what's needed

```tsx
// Lazy load heavy components
const MaintenanceReport = lazy(() => import('./MaintenanceReport'))

<Suspense fallback={<MaintenanceReportSkeleton />}>
  <MaintenanceReport />
</Suspense>
```

2. **Image Optimization** - WebP with PNG fallback

```tsx
<picture>
  <source srcSet={`${src}.webp`} type="image/webp" />
  <img src={`${src}.png`} alt={alt} loading="lazy" />
</picture>
```

3. **API Caching** - Reduce server load

```tsx
useQuery({
  queryKey: ['vehicles'],
  queryFn: fetchVehicles,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000  // 10 minutes
})
```

---

## 11. Security & Trust Indicators

### Visual Security Cues

**SSL Certificate Indicator:**

```tsx
<div className="flex items-center gap-2 text-sm text-gray-600">
  <Shield size={16} className="text-green-600" />
  <span>Secure Connection (TLS 1.3)</span>
</div>
```

**Session Timeout Warning:**

```tsx
<Alert variant="warning">
  <Clock size={20} />
  <AlertTitle>Session Expiring Soon</AlertTitle>
  <AlertDescription>
    Your session will expire in 5 minutes due to inactivity.
    Click "Stay Logged In" to extend your session.
  </AlertDescription>
  <button onClick={extendSession}>Stay Logged In</button>
</Alert>
```

---

## 12. Real-World Government Examples

### ✅ GOOD Examples

**U.S. Web Design System (USWDS)**
- Clean, professional layouts
- High-contrast colors
- Accessible components
- Reference: https://designsystem.digital.gov

**UK Government Digital Service (GDS)**
- Simple, clear typography
- Minimal animations
- Task-focused design
- Reference: https://design-system.service.gov.uk

**Canadian Digital Service**
- Bilingual support
- Accessible forms
- Clear data visualization

### ❌ AVOID

- Consumer app aesthetics (gradients, playful icons)
- Excessive animations or transitions
- Low-contrast "trendy" colors
- Decorative illustrations
- Experimental UI patterns

---

## Conclusion

Fleet-CTA's design strikes the perfect balance:

✅ **Professional** - Trusted by government fleet managers
✅ **Modern** - Clean, efficient, up-to-date technology
✅ **Accessible** - WCAG 2.1 AA, Section 508, colorblind-safe
✅ **Secure** - FedRAMP, NIST 800-53 compliant
✅ **Reliable** - Enterprise-grade performance

**The result:** A fleet management system that government agencies can trust and users love to use.

---

**Document Version:** 1.0
**Created:** February 7, 2026
**Next Review:** March 7, 2026
