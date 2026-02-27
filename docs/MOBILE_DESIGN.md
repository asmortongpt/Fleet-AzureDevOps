# Mobile-First Responsive Design Guide

Fleet-CTA is built with a **mobile-first, responsive design approach** that prioritizes touch devices while maintaining full functionality across desktop screens. This guide covers all aspects of mobile design patterns, touch gestures, performance optimization, and testing.

## Table of Contents

1. [Design Principles](#design-principles)
2. [Breakpoints & Layout](#breakpoints--layout)
3. [Touch Gestures](#touch-gestures)
4. [Mobile Components](#mobile-components)
5. [Mobile Forms](#mobile-forms)
6. [Navigation Patterns](#navigation-patterns)
7. [Performance Optimization](#performance-optimization)
8. [Accessibility](#accessibility)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

## Design Principles

### Mobile-First Approach

All designs start with mobile (320px width) and progressively enhance for larger screens. This ensures:
- Faster initial load times
- Better touch UX
- Reduced data usage on 4G networks
- Improved accessibility
- Cleaner responsive code

### Key Design Goals

1. **Touch-Friendly**: All interactive elements are 44x44px minimum
2. **Performance**: Optimized for 4G networks (< 3s load time)
3. **Accessible**: WCAG 2.1 Level AA compliant
4. **Responsive**: Works seamlessly across all device sizes
5. **Intuitive**: Familiar mobile patterns (swipe, long-press, pull-to-refresh)

## Breakpoints & Layout

### Tailwind CSS Breakpoints

```css
/* Mobile portrait */
xs: 320px   /* iPhone SE, iPhone 12 mini */
sm: 480px   /* Mobile landscape */
md: 768px   /* Tablet portrait */
lg: 1024px  /* Tablet landscape */
xl: 1440px  /* Desktop */
2xl: 1920px /* Large desktop */
3xl: 2560px /* 4K monitors */
```

### Fluid Typography

Typography scales smoothly between breakpoints using CSS `clamp()`:

```css
/* These are defined in index.css as CSS variables */
--font-size-base: clamp(0.875rem, 0.8rem + 0.4vw, 1rem)
--font-size-lg: clamp(1rem, 0.95rem + 0.5vw, 1.125rem)
--font-size-xl: clamp(1.125rem, 1rem + 0.6vw, 1.375rem)
```

**Benefits:**
- No need for multiple font-size breakpoints
- Smooth scaling across device sizes
- Reduces CSS code

### Responsive Layout Strategy

#### Mobile (xs-sm: 320px-480px)
```tsx
<div className="flex flex-col gap-4 p-4">
  {/* Stack everything vertically */}
  {/* Full-width components */}
  {/* Single-column layout */}
</div>
```

#### Tablet (md: 768px)
```tsx
<div className="grid grid-cols-2 md:grid-cols-2 gap-4 p-4">
  {/* Two-column layout */}
  {/* Landscape orientation support */}
</div>
```

#### Desktop (lg+: 1024px+)
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
  {/* Multi-column layouts */}
  {/* Advanced positioning */}
</div>
```

## Touch Gestures

Fleet-CTA implements common touch gestures for mobile UX enhancement.

### Available Gesture Hooks

#### 1. useTouchGestures

```tsx
import { useTouchGestures, type TouchGestureHandlers } from '@/hooks/use-touch-gestures';

const handlers: TouchGestureHandlers = {
  onSwipeLeft: () => console.log('Swiped left'),
  onSwipeRight: () => console.log('Swiped right'),
  onSwipeUp: () => console.log('Swiped up'),
  onSwipeDown: () => console.log('Swiped down'),
  onLongPress: () => console.log('Long press detected'),
  onPinchZoom: (scale) => console.log(`Zoom scale: ${scale}`),
  onTap: () => console.log('Tapped'),
  onDoubleTap: () => console.log('Double tapped'),
};

const ref = useTouchGestures(handlers, {
  threshold: 50,           // Minimum swipe distance in pixels
  longPressDuration: 500,  // Time to trigger long press (ms)
  enabled: true,
});

return <div ref={ref} className="touch-area">{/* Content */}</div>;
```

#### 2. useResponsiveBreakpoint

```tsx
import { useResponsiveBreakpoint } from '@/hooks/use-touch-gestures';

export function MyComponent() {
  const { breakpoint } = useResponsiveBreakpoint();

  return (
    <div>
      Current breakpoint: {breakpoint}
      {breakpoint === 'xs' && <MobileVersion />}
      {breakpoint === 'md' && <TabletVersion />}
      {['lg', 'xl', '2xl'].includes(breakpoint) && <DesktopVersion />}
    </div>
  );
}
```

#### 3. useMobileDetection

```tsx
import { useMobileDetection } from '@/hooks/use-touch-gestures';

export function MyComponent() {
  const { isMobile, isTouchDevice } = useMobileDetection();

  return (
    <div>
      {isMobile && <MobileOptimizedVersion />}
      {!isMobile && <DesktopVersion />}
      {isTouchDevice && <TouchOptimizedButtons />}
    </div>
  );
}
```

### Gesture Configuration

#### Swipe Gesture Tuning

- **Threshold**: 50px default (minimum distance for swipe)
- **Time window**: 300ms (maximum time for swipe)
- Prevents accidental swipes during scrolling

#### Long-Press Configuration

- **Default duration**: 500ms
- **Cancels on movement**: Yes
- **Use cases**: Context menus, bulk actions, long-hold to delete

#### Pinch-Zoom Configuration

- **Minimum scale**: 1.0 (no zoom-out)
- **Maximum scale**: 3.0 (max 3x zoom)
- **Use cases**: Image preview, map zoom, document viewing

## Mobile Components

### Navigation Components

#### MobileBottomNav (Tab Bar)

```tsx
import { MobileBottomNav } from '@/components/mobile/MobileNavigation';
import { Home, MapPin, Settings } from 'lucide-react';

<MobileBottomNav
  items={[
    { id: 'home', label: 'Home', icon: <Home /> },
    { id: 'fleet', label: 'Fleet', icon: <MapPin /> },
    { id: 'settings', label: 'Settings', icon: <Settings /> },
  ]}
  activeId={activeTab}
  onItemClick={(id) => setActiveTab(id)}
/>
```

**Features:**
- Fixed at bottom of screen
- 44x44px minimum tap targets
- Badge support for notifications
- Safe area padding for notched devices
- Smooth transitions

#### MobileDrawer (Slide-out Menu)

```tsx
import { MobileDrawer } from '@/components/mobile/MobileNavigation';

<MobileDrawer
  isOpen={isDrawerOpen}
  onClose={() => setIsDrawerOpen(false)}
  position="left"
  width="280px"
>
  {/* Drawer content */}
</MobileDrawer>
```

#### MobileFab (Floating Action Button)

```tsx
import { MobileFab } from '@/components/mobile/MobileNavigation';
import { Plus } from 'lucide-react';

<MobileFab
  icon={<Plus className="w-6 h-6" />}
  onClick={() => createNewItem()}
  label="Add Vehicle"
  position="bottom-right"
  color="primary"
  size="md"
/>
```

**Features:**
- Floating above bottom navigation
- Multiple position options
- Color variants (primary, success, warning, error)
- Size variants (sm, md, lg)
- Accessible touch targets

### Card Components

#### MobileCard (Full-Width Cards)

```tsx
import { MobileCard } from '@/components/mobile/MobileCard';

<MobileCard className="mb-4">
  <h3 className="font-semibold">Vehicle #123</h3>
  <p className="text-sm text-muted-foreground">Status: Active</p>
</MobileCard>
```

**Responsive Behavior:**
- 100% width on mobile (with padding)
- Grid layout on tablet (2 columns)
- Multi-column on desktop (3+ columns)

### Search & Filter

#### MobileFilterSheet (Bottom Sheet)

```tsx
import { MobileFilterSheet } from '@/components/mobile/MobileFilterSheet';

<MobileFilterSheet
  isOpen={isFilterOpen}
  onClose={() => setIsFilterOpen(false)}
  title="Filters"
  onApply={(filters) => applyFilters(filters)}
>
  {/* Filter controls */}
</MobileFilterSheet>
```

**Features:**
- Modal bottom sheet (not full overlay)
- Drag handle for visual feedback
- Swipe down to close
- Touch-optimized filter controls

## Mobile Forms

### Form Best Practices

#### Input Optimization

```tsx
// Mobile-optimized input
<input
  type="text"
  className="
    w-full px-4 py-3
    rounded-lg border border-input
    bg-background text-foreground
    text-base  /* Prevents zoom on iOS */
    placeholder-muted-foreground
    focus:outline-none focus:ring-2 focus:ring-primary
    focus:border-transparent
  "
  placeholder="Full width input"
/>
```

**Key considerations:**
- **Font size**: 16px minimum (prevents iOS zoom)
- **Padding**: 12px minimum (44px tap target height)
- **Width**: 100% on mobile
- **Touch-friendly spacing**: 8-12px gap between inputs

#### Floating Labels

```tsx
<div className="relative">
  <input
    type="text"
    id="email"
    placeholder=" "
    className="
      peer w-full px-4 py-3
      border border-input rounded-lg
      placeholder-transparent
      focus:outline-none focus:ring-2 focus:ring-primary
    "
  />
  <label
    htmlFor="email"
    className="
      absolute left-4 top-3
      text-sm text-muted-foreground
      peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base
      peer-focus:top-1 peer-focus:text-xs peer-focus:text-primary
      transition-all duration-200
      pointer-events-none
    "
  >
    Email Address
  </label>
</div>
```

**Benefits:**
- Saves vertical space on mobile
- Better UX (label always visible)
- Accessible to screen readers

#### Mobile-Optimized Keyboards

```tsx
// Numeric input
<input type="tel" inputMode="numeric" placeholder="Phone number" />

// Email input
<input type="email" inputMode="email" placeholder="Email" />

// URL input
<input type="url" inputMode="url" placeholder="Website" />

// Date input
<input type="date" className="w-full" />

// Time input
<input type="time" className="w-full" />
```

### Full-Width Buttons on Mobile

```tsx
<div className="flex gap-2 flex-col sm:flex-row">
  {/* Full-width on mobile, side-by-side on larger screens */}
  <button className="flex-1 py-3 px-4">Cancel</button>
  <button className="flex-1 py-3 px-4">Confirm</button>
</div>
```

## Navigation Patterns

### Tab-Based Navigation (Mobile)

```tsx
<div className="pb-20">
  {/* Content with padding for bottom nav */}
</div>

<MobileBottomNav
  items={navigationItems}
  activeId={activeTab}
  onItemClick={setActiveTab}
/>
```

### Drawer-Based Navigation (Hamburger)

```tsx
<MobileHeader
  title="Fleet Dashboard"
  leftAction={
    <button onClick={() => setDrawerOpen(true)}>
      <Menu className="w-6 h-6" />
    </button>
  }
/>

<MobileDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)}>
  {/* Navigation items */}
</MobileDrawer>
```

### Breadcrumb Navigation

```tsx
<nav className="flex gap-2 overflow-x-auto pb-2">
  <a href="/">Home</a>
  <span>/</span>
  <a href="/fleet">Fleet</a>
  <span>/</span>
  <span>Details</span>
</nav>
```

## Performance Optimization

### Image Optimization

```tsx
// Use responsive images
<img
  src="image.jpg"
  srcSet="
    image-small.jpg 320w,
    image-medium.jpg 768w,
    image-large.jpg 1200w
  "
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  className="w-full h-auto"
  loading="lazy"
  alt="Vehicle image"
/>

// Or use WebP with fallback
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.jpg" alt="Vehicle image" />
</picture>
```

### Code Splitting

```tsx
// Lazy load heavy components
const VehicleDetails = lazy(() => import('@/components/VehicleDetails'));

<Suspense fallback={<SkeletonLoader />}>
  <VehicleDetails />
</Suspense>
```

### Network-Aware Loading

```tsx
import { useMemo } from 'react';

// Detect 4G/5G network
const useNetworkSpeed = () => {
  const [effectiveType, setEffectiveType] = useState('4g');

  useEffect(() => {
    const connection = navigator.connection || navigator.mozConnection;
    if (connection) {
      setEffectiveType(connection.effectiveType);
    }
  }, []);

  return effectiveType;
};

// Use in components
export function ImageGrid() {
  const networkSpeed = useNetworkSpeed();
  const imageSrc = networkSpeed === '4g'
    ? 'image-optimized.jpg'
    : 'image-hires.jpg';

  return <img src={imageSrc} alt="Vehicle" />;
}
```

### Bundle Size Optimization

Current build stats:
- **Main bundle**: ~250KB (gzipped)
- **Vendor bundles**: Separate chunks for React, UI libraries
- **Code splitting**: Route-based lazy loading

Optimization techniques:
- Tree-shaking unused code
- Minification with Terser
- Gzip/Brotli compression
- CDN caching

## Accessibility

### Touch Target Sizing

All interactive elements must be **44x44px minimum**:

```tsx
// ✅ Good
<button className="w-11 h-11 rounded-lg flex items-center justify-center">
  <MenuIcon className="w-6 h-6" />
</button>

// ❌ Bad - too small
<button className="px-2 py-1">
  <SmallIcon />
</button>
```

### Focus Indicators

```tsx
// Ring-based focus (visible on mobile)
.focus-visible:ring-2 .focus-visible:ring-primary .focus-visible:ring-offset-2
```

### Haptic Feedback

```tsx
// Trigger haptic feedback for button presses
const triggerHaptic = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(50); // 50ms vibration
  }
};
```

### Screen Reader Support

```tsx
{/* Use semantic HTML */}
<button aria-label="Open menu" onClick={handleOpen}>
  <MenuIcon />
</button>

{/* Provide descriptions for complex elements */}
<input
  type="range"
  aria-label="Brightness level"
  aria-valuenow={brightness}
  aria-valuemin={0}
  aria-valuemax={100}
/>
```

## Testing

### Device Testing Matrix

**Essential devices to test:**

| Device | Screen Size | Resolution | Browser |
|--------|------------|-----------|---------|
| iPhone SE | 375px | 326 ppi | Safari |
| iPhone 12 | 390px | 460 ppi | Safari |
| iPhone 14 Pro | 393px | 460 ppi | Safari |
| Galaxy S21 | 360px | 421 ppi | Chrome |
| iPad (7th gen) | 810px | 264 ppi | Safari |
| iPad Pro 12.9" | 1024px | 264 ppi | Safari |

### Responsive Testing Breakpoints

Test at Tailwind breakpoints:
- **320px** (xs) - iPhone SE
- **480px** (sm) - Mobile landscape
- **768px** (md) - Tablet portrait
- **1024px** (lg) - Tablet landscape
- **1280px** (xl) - Small desktop
- **1536px** (2xl) - Large desktop

### Playwright E2E Tests

```bash
# Run responsive tests across breakpoints
npx playwright test tests/e2e/responsive-layout.spec.ts

# Test specific breakpoint
npx playwright test --headed tests/e2e/responsive-layout.spec.ts
```

See [RESPONSIVE_DESIGN.md](./RESPONSIVE_DESIGN.md) for detailed E2E test examples.

### Performance Testing

```bash
# Measure Core Web Vitals
npm run lighthouse:ci

# Profile bundle size
npm run build && npx vite preview

# Test 4G network throttling
# Chrome DevTools > Network tab > Throttle to "Slow 4G"
```

### Touch Gesture Testing

```tsx
// Manual testing with browser dev tools:
// 1. Open Chrome DevTools
// 2. Toggle device toolbar (Ctrl+Shift+M)
// 3. Test swipe: Hold mouse button and drag
// 4. Test long-press: Hold mouse button for 500ms+
// 5. Test pinch: Simulate with two-finger scroll
```

## Troubleshooting

### Common Issues

#### 1. Text Too Small on Mobile

**Problem:** Text is difficult to read on small screens
**Solution:**
- Use `clamp()` for fluid typography
- Minimum font size 16px for inputs
- Increase line-height to 1.6+

```css
/* Good */
font-size: clamp(0.875rem, 0.8rem + 0.4vw, 1rem);
line-height: 1.6;
```

#### 2. Buttons Not Tappable

**Problem:** Buttons are too small or too close together
**Solution:**
- Ensure all buttons are at least 44x44px
- Add gap between buttons (8-12px minimum)
- Use padding instead of exact dimensions

```tsx
<button className="min-h-11 min-w-11 px-4 py-3 rounded-lg">
  Tap target
</button>
```

#### 3. Layout Breaks on Landscape

**Problem:** Layout doesn't adapt to landscape orientation
**Solution:**
- Use responsive classes
- Test with `aspect-video` for consistent proportions
- Add media queries for landscape

```tsx
<div className="md:landscape:flex gap-4">
  {/* Landscape-specific layout */}
</div>
```

#### 4. Form Inputs Zoom on iOS

**Problem:** Form input zooms in when focused on iOS Safari
**Solution:**
- Set font size to 16px minimum
- Use `inputMode` for appropriate keyboard

```tsx
<input
  type="text"
  style={{ fontSize: '16px' }}
  inputMode="numeric"
/>
```

#### 5. Slow Performance on 4G

**Problem:** App feels sluggish on slower networks
**Solution:**
- Lazy load images and components
- Reduce initial bundle size
- Implement skeleton loading states
- Cache data locally with service workers

```tsx
<img loading="lazy" src="image.jpg" alt="Vehicle" />
```

#### 6. Safe Area Insets Not Working

**Problem:** Content hidden behind notches on newer phones
**Solution:**
- Add safe area padding to fixed elements
- Use CSS variables for safe area insets

```css
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
```

## Resources

### Documentation
- [Responsive Design (RESPONSIVE_DESIGN.md)](./RESPONSIVE_DESIGN.md)
- [Accessibility Guidelines (WCAG 2.1)](https://www.w3.org/WAI/WCAG21/quickref/)
- [Touch Events API](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)

### Tools
- [Chrome DevTools Device Mode](https://developer.chrome.com/docs/devtools/device-mode/)
- [Playwright Testing Framework](https://playwright.dev/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

### Performance
- [Core Web Vitals](https://web.dev/vitals/)
- [Web.dev Performance](https://web.dev/performance/)
- [Mobile Performance Guidelines](https://web.dev/mobile-performance/)

## Related Files

- `src/hooks/use-touch-gestures.ts` - Touch gesture hooks
- `src/components/mobile/` - Mobile-specific components
- `tests/e2e/responsive-layout.spec.ts` - E2E responsive tests
- `vite.config.ts` - Build optimization configuration
- `tailwind.config.js` - Responsive design tokens

## Contributing

When adding new mobile features:

1. **Start mobile-first**: Design for 320px width first
2. **Test on devices**: Use actual phones, not just browser emulation
3. **Performance**: Keep bundle size in check
4. **Accessibility**: Follow WCAG 2.1 Level AA
5. **Touch targets**: Minimum 44x44px for interactive elements
6. **Document**: Update this guide with new patterns

## Version History

- **v1.0** (Feb 2026) - Initial mobile-first responsive design system
  - Touch gesture hooks
  - Mobile components library
  - Responsive layout patterns
  - E2E testing framework
  - 4G optimization strategies
