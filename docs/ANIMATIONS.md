# Fleet-CTA Comprehensive Animation System

## Overview

The Fleet-CTA animation system provides a production-ready collection of 50+ CSS keyframe animations with Framer Motion integration. All animations are optimized for 60fps performance, GPU-accelerated, and fully accessible with support for `prefers-reduced-motion`.

**Location**: `/src/styles/animations.css`

## Table of Contents

1. [Quick Start](#quick-start)
2. [Animation Categories](#animation-categories)
3. [Page Transitions](#page-transitions)
4. [Button & Interactive Elements](#button--interactive-elements)
5. [Form Inputs](#form-inputs)
6. [Cards & Containers](#cards--containers)
7. [Modals & Dialogs](#modals--dialogs)
8. [Loading States](#loading-states)
9. [Notifications & Toasts](#notifications--toasts)
10. [Gesture-Based Animations](#gesture-based-animations)
11. [Text & Content](#text--content)
12. [Status & State Changes](#status--state-changes)
13. [Floating & Suspension](#floating--suspension)
14. [Attention-Seeking Effects](#attention-seeking-effects)
15. [Color & Background](#color--background)
16. [Framer Motion Integration](#framer-motion-integration)
17. [Performance Optimization](#performance-optimization)
18. [Accessibility (prefers-reduced-motion)](#accessibility-prefers-reduced-motion)
19. [Browser Compatibility](#browser-compatibility)
20. [Testing](#testing)

## Quick Start

### Basic Usage

Apply animations using utility classes:

```jsx
// CSS Class
<div className="animate-fade-in">Content fades in</div>
<button className="animate-button-hover-shimmer">Shimmer on hover</button>

// With Framer Motion
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Fade in content
</motion.div>
```

### Animation Timing

```css
/* Built-in animation durations */
.animate-duration-150 { animation-duration: 150ms; }
.animate-duration-300 { animation-duration: 300ms; }
.animate-duration-500 { animation-duration: 500ms; }
.animate-duration-700 { animation-duration: 700ms; }
.animate-duration-1000 { animation-duration: 1s; }
```

### Stagger Delays (for list items)

```css
/* Stagger animation delays */
.animate-delay-100 { animation-delay: 0.1s; }
.animate-delay-200 { animation-delay: 0.2s; }
.animate-delay-300 { animation-delay: 0.3s; }
.animate-delay-400 { animation-delay: 0.4s; }
.animate-delay-500 { animation-delay: 0.5s; }
.animate-delay-700 { animation-delay: 0.7s; }
.animate-delay-1000 { animation-delay: 1s; }
```

## Animation Categories

### Total Animations: 50+

- **Page Transitions**: 8 animations
- **Button Interactions**: 6 animations
- **Form Inputs**: 6 animations
- **Card Effects**: 6 animations
- **Modals/Dialogs**: 6 animations
- **Loading/Shimmer**: 7 animations
- **Notifications**: 5 animations
- **Gestures**: 5 animations
- **Text/Content**: 6 animations
- **Status Changes**: 6 animations
- **Floating Effects**: 5 animations
- **Attention-Seeking**: 6 animations
- **Colors/Gradients**: 4 animations

## Page Transitions

Smooth entrance and exit effects for full page transitions.

### Available Animations

```css
@keyframes fadeInPageEnter     /* Fade in from transparent */
@keyframes fadeOutPageExit     /* Fade out to transparent */
@keyframes slideInPageFromRight /* Slide from right with fade */
@keyframes slideInPageFromLeft  /* Slide from left with fade */
@keyframes slideOutPageToRight  /* Slide to right with fade */
@keyframes slideOutPageToLeft   /* Slide to left with fade */
@keyframes expandEnter          /* Scale up from 0.95 */
@keyframes contractExit         /* Scale down to 0.95 */
```

### Usage Examples

```jsx
// Fade in page
<div className="animate-page-enter">Page content</div>

// Slide in from right
<div className="animate-page-slide-in-right">New page</div>

// Custom duration
<div className="animate-page-slide-in-left animate-duration-500">
  Slower transition
</div>
```

### React Router Integration

```jsx
import { useLocation } from 'react-router-dom';

function AnimatedPage() {
  const location = useLocation();

  return (
    <div key={location.pathname} className="animate-page-enter">
      {/* Page content animates in on route change */}
    </div>
  );
}
```

## Button & Interactive Elements

Ripple effects, hover states, and interactive feedback.

### Available Animations

```css
@keyframes rippleEffect         /* Material Design ripple */
@keyframes buttonHoverShimmer   /* Shimmer effect on hover */
@keyframes buttonPressDown      /* Scale down on press */
@keyframes buttonPressUp        /* Scale up on release */
@keyframes hoverLiftShadow      /* Lift with shadow */
@keyframes buttonGlow           /* Expanding glow pulse */
@keyframes tooltipFadeIn        /* Tooltip entrance */
```

### Usage Examples

```jsx
// Button with ripple effect
<button className="btn-ripple">Click me</button>

// Button with hover shimmer
<button className="animate-button-hover-shimmer">Shimmer effect</button>

// Button with glow on hover
<button className="animate-button-glow">Glowing button</button>

// Interactive element with hover lift
<div className="animate-hover-lift">Lifts on hover</div>
```

### Custom Button Styles

```jsx
function AnimatedButton({ children }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className={isHovered ? 'animate-hover-lift' : ''}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </button>
  );
}
```

## Form Inputs

Floating labels, focus states, input glows, and validation feedback.

### Available Animations

```css
@keyframes floatingLabelUp      /* Label floats above input */
@keyframes floatingLabelDown    /* Label returns to input */
@keyframes inputFocusGlow       /* Expanding glow on focus */
@keyframes inputSuccessCheckmark /* Success indicator */
@keyframes inputErrorShake      /* Error shake effect */
@keyframes validationPulse      /* Pulsing validation ring */
@keyframes focusRingPulse       /* Pulsing focus ring */
```

### Usage Examples

```jsx
// Input with focus glow
<input
  type="text"
  className="animate-input-focus-glow"
  placeholder="Type here"
/>

// Input with error shake
<input
  type="text"
  className="animate-input-error-shake"
  aria-invalid="true"
/>

// Input with success checkmark
<div className="relative">
  <input type="text" className="w-full" />
  <div className="animate-input-success-check">✓</div>
</div>
```

### Floating Label Pattern

```jsx
function FloatingLabelInput({ label, value, onChange }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(value.length > 0)}
        className="w-full px-4 py-2 border rounded-lg"
      />
      <label
        className={
          isFocused || value.length > 0
            ? 'animate-floating-label-up'
            : 'animate-floating-label-down'
        }
      >
        {label}
      </label>
    </div>
  );
}
```

## Cards & Containers

Lift, shadow enhancement, border effects, and overlay animations.

### Available Animations

```css
@keyframes cardHoverLift       /* Lift up with shadow */
@keyframes cardShadowExpand    /* Shadow expansion */
@keyframes cardBorderGlow      /* Border glow effect */
@keyframes cardBgOverlay       /* Background overlay */
@keyframes cardGradientFlow    /* Gradient animation */
@keyframes cardBorderTopGlow   /* Top border glow */
```

### Usage Examples

```jsx
// Card with hover lift
<div className="p-6 border rounded-lg animate-card-hover-lift">
  Card content
</div>

// Card with shadow expansion
<div className="p-6 border rounded-lg animate-card-shadow-expand">
  Premium card
</div>

// Glassmorphic card with hover
<div className="glass-card p-6 rounded-xl animate-card-border-glow">
  Glass effect
</div>
```

### Advanced Card Component

```jsx
function AnimatedCard({ children, elevation = 'md' }) {
  return (
    <motion.div
      className={`p-6 border rounded-xl transition-all duration-300`}
      whileHover={{
        y: -8,
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
      }}
    >
      {children}
    </motion.div>
  );
}
```

## Modals & Dialogs

Entrance animations with scale and fade effects, backdrop fade.

### Available Animations

```css
@keyframes modalBackdropFadeIn  /* Backdrop fades in with blur */
@keyframes modalBackdropFadeOut /* Backdrop fades out */
@keyframes modalScaleFadeIn     /* Scale up from center */
@keyframes modalScaleFadeOut    /* Scale down to center */
@keyframes modalSlideInFromTop  /* Slide down from top */
@keyframes modalSlideOutToTop   /* Slide up to top */
```

### Usage Examples

```jsx
// Modal with backdrop
<div className="animate-modal-backdrop-in fixed inset-0 bg-black/50">
  <div className="animate-modal-scale-in bg-card rounded-lg p-6">
    Modal content
  </div>
</div>

// Modal sliding from top
<div className="animate-modal-slide-in-top">
  Alert dialog
</div>
```

### Animated Dialog Component

```jsx
import { AnimatePresence, motion } from 'framer-motion';

function AnimatedDialog({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-card rounded-lg p-6"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

## Loading States

Skeleton loading, spinners, progress bars, and shimmer effects.

### Available Animations

```css
@keyframes shimmerWave         /* Wave shimmer effect */
@keyframes shimmerPulse        /* Pulsing shimmer */
@keyframes loadingSpinner      /* Rotating spinner */
@keyframes loadingSpinnerFade  /* Spinner with fade */
@keyframes progressBarIndeterminate /* Moving progress bar */
@keyframes progressBarPulse    /* Pulsing progress bar */
@keyframes skeletonLoading     /* Skeleton shimmer */
```

### Usage Examples

```jsx
// Loading spinner
<div className="animate-loading-spinner">
  <svg className="w-8 h-8 border-4 border-t-primary rounded-full" />
</div>

// Skeleton loader
<div className="animate-skeleton-loading w-full h-12 rounded-lg" />

// Shimmer effect
<div className="animate-shimmer-wave bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

// Progress bar
<div className="animate-progress-bar w-full h-2 bg-primary/20 rounded-full" />
```

### Skeleton Component

```jsx
function SkeletonLoader() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="animate-skeleton-loading h-16 rounded-lg"
          style={{
            animationDelay: `${i * 100}ms`,
          }}
        />
      ))}
    </div>
  );
}
```

## Notifications & Toasts

Slide in/out effects, bounce, and stagger animations for toast messages.

### Available Animations

```css
@keyframes toastSlideInRight   /* Slide in from right */
@keyframes toastSlideOutRight  /* Slide out to right */
@keyframes toastSlideInBottom  /* Slide in from bottom */
@keyframes toastSlideOutBottom /* Slide out to bottom */
@keyframes toastBounceIn       /* Bounce entrance */
@keyframes toastStaggerEnter   /* Stagger multiple toasts */
```

### Usage Examples

```jsx
// Toast notification
<div className="animate-toast-slide-in-right fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg">
  Success! Item saved.
</div>

// Toast with bounce
<div className="animate-toast-bounce-in">
  Notification
</div>

// Multiple toasts with stagger
{toasts.map((toast, index) => (
  <div
    key={toast.id}
    className="animate-toast-stagger-enter"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    {toast.message}
  </div>
))}
```

### Toast Container Component

```jsx
import { AnimatePresence, motion } from 'framer-motion';

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-4 right-4 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="bg-card border rounded-lg p-4"
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

## Gesture-Based Animations

Swipe, drag, pull-refresh, and touch interactions.

### Available Animations

```css
@keyframes swipeOutLeft       /* Swipe left to dismiss */
@keyframes swipeOutRight      /* Swipe right to dismiss */
@keyframes pullRefreshRotate  /* Pull-to-refresh rotation */
@keyframes dragHoverScale     /* Scale on drag hover */
@keyframes touchRipple        /* Touch ripple effect */
```

### Usage Examples

```jsx
// Swipe-to-dismiss card
<motion.div
  drag="x"
  dragConstraints={{ left: -500, right: 500 }}
  onDragEnd={(event, info) => {
    if (Math.abs(info.offset.x) > 100) {
      // Dismiss
    }
  }}
>
  Swipe to dismiss
</motion.div>

// Pull-to-refresh
<div className="animate-pull-refresh" onPull={handleRefresh}>
  Pull to refresh
</div>
```

### Swipe-to-Dismiss Component

```jsx
function SwipeDismissCard({ children, onDismiss }) {
  return (
    <motion.div
      className="bg-card rounded-lg p-4"
      drag="x"
      dragElastic={0.2}
      onDragEnd={(event, info) => {
        if (Math.abs(info.offset.x) > 100) {
          onDismiss();
        }
      }}
    >
      {children}
    </motion.div>
  );
}
```

## Text & Content

Staggered text reveals, word by word effects, line animations.

### Available Animations

```css
@keyframes textFadeInUp      /* Fade in with upward movement */
@keyframes textStaggerEnter  /* Staggered text entrance */
@keyframes underlineSweep    /* Underline sweep effect */
@keyframes gradientShift     /* Gradient animation */
@keyframes textGlow          /* Text glow effect */
@keyframes wordHighlight     /* Word highlighting */
```

### Usage Examples

```jsx
// Fading text
<p className="animate-text-fade-in-up">
  Content fades in and moves up
</p>

// Gradient text
<h1 className="animate-gradient-shift bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
  Shifting gradient text
</h1>

// Glowing text
<span className="animate-text-glow text-blue-400">
  Glowing effect
</span>
```

### Staggered Text Component

```jsx
function StaggeredText({ children }) {
  return (
    <div className="space-y-2">
      {children.split('\n').map((line, i) => (
        <div
          key={i}
          className="animate-text-stagger"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          {line}
        </div>
      ))}
    </div>
  );
}
```

## Status & State Changes

Transitions for status updates, success/error states, badges.

### Available Animations

```css
@keyframes statusPulse         /* Pulsing status */
@keyframes statusGlow          /* Status glow effect */
@keyframes successCheckmark    /* Success checkmark */
@keyframes errorX              /* Error X mark */
@keyframes warningPulse        /* Warning pulse */
@keyframes badgeFlip           /* Badge flip animation */
```

### Usage Examples

```jsx
// Status indicator
<div className="flex items-center gap-2">
  <div className="animate-status-pulse w-3 h-3 bg-green-500 rounded-full" />
  <span>Online</span>
</div>

// Success state
<div className="animate-success-check text-green-500">
  ✓
</div>

// Error state
<div className="animate-error-x text-red-500">
  ✗
</div>

// Warning badge
<div className="animate-warning-pulse px-3 py-1 bg-yellow-500/20 rounded-full">
  Warning
</div>
```

### Status Badge Component

```jsx
function StatusBadge({ status }) {
  const statusConfig = {
    online: { color: 'green', icon: '●' },
    offline: { color: 'gray', icon: '●' },
    warning: { color: 'yellow', icon: '⚠' },
    error: { color: 'red', icon: '✗' },
  };

  const config = statusConfig[status];

  return (
    <div className={`animate-status-pulse text-${config.color}-500`}>
      {config.icon} {status}
    </div>
  );
}
```

## Floating & Suspension

Floating elements, bounce, levitation effects for emphasis.

### Available Animations

```css
@keyframes floatUp           /* Float upward */
@keyframes floatDown         /* Float downward */
@keyframes bounce            /* Bouncing effect */
@keyframes bounceIn          /* Bounce entrance */
@keyframes levitate          /* Levitation effect */
```

### Usage Examples

```jsx
// Floating element
<div className="animate-float-up">
  Floating content
</div>

// Bouncing button
<button className="animate-bounce">
  Click me
</button>

// Bounce in animation
<div className="animate-bounce-in">
  Bounces in on enter
</div>

// Levitation effect
<div className="animate-levitate">
  Levitating card
</div>
```

### Floating Component

```jsx
function FloatingButton() {
  return (
    <motion.button
      className="fixed bottom-8 right-8 p-4 bg-primary rounded-full"
      animate={{
        y: [0, -10, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
      }}
    >
      Floating Action Button
    </motion.button>
  );
}
```

## Attention-Seeking Effects

Blink, pulse, wiggle, and other emphasis effects for important content.

### Available Animations

```css
@keyframes pulse           /* Fading pulse */
@keyframes pulseBright     /* Bright pulse with scale */
@keyframes blink           /* Blinking effect */
@keyframes wiggle          /* Wiggling effect */
@keyframes headShake       /* Head shake effect */
@keyframes heartBeat       /* Heart beat effect */
```

### Usage Examples

```jsx
// Pulsing content
<div className="animate-pulse">
  Loading...
</div>

// Bright pulse with scale
<div className="animate-pulse-bright">
  Important notice
</div>

// Blinking text
<span className="animate-blink">
  New!
</span>

// Wiggling element
<div className="animate-wiggle">
  Attention!
</div>

// Heart beat
<div className="animate-heart-beat">
  ❤️
</div>
```

## Color & Background

Gradient shifts, color transitions, background pulsing.

### Available Animations

```css
@keyframes colorShift              /* Color transition */
@keyframes backgroundGradientShift /* Background gradient animation */
@keyframes bgColorFade             /* Background color fade */
@keyframes neonGlow                /* Neon glow text effect */
```

### Usage Examples

```jsx
// Color shifting text
<span className="animate-color-shift">
  Shifting color
</span>

// Gradient background animation
<div className="animate-bg-gradient-shift bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
  Animated background
</div>

// Fading background color
<div className="animate-bg-color-fade bg-blue-500">
  Fading background
</div>

// Neon glow text
<h1 className="animate-neon-glow text-blue-400">
  Neon Effect
</h1>
```

## Framer Motion Integration

Combine CSS animations with Framer Motion for advanced interactions.

### Installation

```bash
npm install framer-motion
```

### Basic Integration

```jsx
import { motion } from 'framer-motion';

function AnimatedComponent() {
  return (
    <motion.div
      className="animate-page-enter"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      Content
    </motion.div>
  );
}
```

### Variants Pattern

```jsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
  },
};

function AnimatedList({ items }) {
  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((item) => (
        <motion.li key={item.id} variants={itemVariants}>
          {item.name}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

### Gesture Animations

```jsx
function AnimatedButton() {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="animate-button-hover-shimmer"
    >
      Click me
    </motion.button>
  );
}
```

### Drag and Drop

```jsx
function DragToReorder() {
  const [items, setItems] = useState([...]);

  return (
    <motion.div layout>
      {items.map((item) => (
        <motion.div
          key={item.id}
          layout
          drag
          dragElastic={0.2}
          className="bg-card p-4 rounded-lg"
        >
          {item.name}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

## Performance Optimization

### GPU-Accelerated Properties

Use these properties for optimal 60fps performance:

- `transform` (translate, scale, rotate)
- `opacity`
- `filter`

**Avoid these (they trigger layout/paint):**
- `top`, `left`, `right`, `bottom` (use `transform` instead)
- `width`, `height` (use `transform: scale()`)
- `background-color` (use `opacity` + overlay)

### Example: Good vs Bad

```jsx
// ❌ BAD - Triggers layout recalculation
<div style={{
  transition: 'top 0.3s, left 0.3s',
  top: isHovered ? '-10px' : '0px',
}} />

// ✅ GOOD - GPU-accelerated
<div className="transition-transform hover:-translate-y-2" />
```

### Enabling Hardware Acceleration

```css
/* Enable 3D acceleration */
.accelerated {
  transform: translateZ(0);
  will-change: transform;
}

/* For animations */
@keyframes optimized {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-10px);
    opacity: 0.8;
  }
}
```

## Accessibility (prefers-reduced-motion)

The animation system automatically respects the `prefers-reduced-motion` media query:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Testing Reduced Motion

```bash
# macOS: System Preferences > Accessibility > Display > Reduce motion
# Windows: Settings > Ease of Access > Display > Show animations

# Browser DevTools:
# Chrome: Rendering > Emulate CSS media feature prefers-reduced-motion
```

### Code Example

```jsx
function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: prefersReducedMotion ? 0.01 : 0.3,
      }}
    >
      Content
    </motion.div>
  );
}
```

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| CSS Animations | 43+ | 16+ | 9+ | 12+ |
| Transform | 26+ | 16+ | 9+ | 10+ |
| Will-change | 36+ | 36+ | 9.1+ | 15+ |
| Backdrop Filter | 76+ | 103+ | 9+ | 76+ |
| GPU Acceleration | All | All | All | All |

## Testing

### Playwright Tests

Run animation tests with Playwright:

```bash
npm run test -- tests/e2e/animations.spec.ts
```

### Test Coverage

The animation test suite covers:

- ✅ Page transition animations
- ✅ Button hover effects
- ✅ Form input animations
- ✅ Card hover states
- ✅ Modal entrance animations
- ✅ Loading and shimmer effects
- ✅ Toast notifications
- ✅ Text animations
- ✅ Status indicators
- ✅ Performance metrics (60fps target)
- ✅ GPU acceleration verification
- ✅ Accessibility (prefers-reduced-motion)

### Running Tests

```bash
# Run all animation tests
npm run test -- tests/e2e/animations.spec.ts

# Run with headed browser (visible)
npm run test -- tests/e2e/animations.spec.ts --headed

# Run specific test
npm run test -- tests/e2e/animations.spec.ts -g "button hover"

# Generate coverage report
npm run test:coverage
```

## Common Patterns

### Fade In on Mount

```jsx
function FadeInComponent({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

### Staggered List

```jsx
function StaggeredList({ items }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((item) => (
        <motion.li key={item.id} variants={itemVariants}>
          {item.name}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

### Page Transition with React Router

```jsx
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

function Layout({ children }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

### Hover Card Lift

```jsx
function HoverLiftCard({ children }) {
  return (
    <motion.div
      className="bg-card rounded-lg p-6 cursor-pointer"
      whileHover={{
        y: -8,
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
      }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

## Troubleshooting

### Animations Not Playing

1. Check `prefers-reduced-motion` setting
2. Verify animation class is applied
3. Check browser DevTools for CSS errors
4. Ensure animation keyframes are imported

### Performance Issues

1. Use GPU-accelerated properties (transform, opacity)
2. Reduce animation duration or complexity
3. Check browser DevTools Performance tab
4. Use `will-change` sparingly

### Animation Jank

1. Enable hardware acceleration: `transform: translateZ(0);`
2. Reduce number of simultaneous animations
3. Use `requestAnimationFrame` for smooth updates
4. Profile with Chrome DevTools

## Best Practices

1. **Keep animations subtle** - Focus on 200-400ms durations
2. **Use easing functions** - cubic-bezier for natural motion
3. **Test on devices** - Mobile performance varies
4. **Respect user preferences** - Support prefers-reduced-motion
5. **Document animations** - Help team understand intent
6. **Measure performance** - Use Chrome DevTools Lighthouse
7. **Use semantic HTML** - Accessibility first
8. **Combine with content** - Animations enhance, not distract

## Additional Resources

- [MDN: CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [WCAG 2.1: Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)
- [60fps Performance Guide](https://www.html5rocks.com/en/tutorials/speed/high-performance-animations/)

---

**Last Updated**: February 15, 2026
**System Version**: 1.0.0
**Total Animations**: 50+
