# WCAG 2.2 Level AA Accessibility Checklist

**Version**: 1.0
**Last Updated**: 2026-01-08
**Authority**: W3C Web Content Accessibility Guidelines (WCAG) 2.2
**Conformance Level**: AA (Required for most government and enterprise applications)
**Application**: CTAFleet Vehicle Management System

---

## Overview

### What is WCAG 2.2 Level AA?

WCAG 2.2 Level AA is the **recommended accessibility baseline** for web applications. It ensures that people with disabilities can:
- Perceive content (vision, hearing, touch)
- Operate interface (keyboard, mouse, voice, touch)
- Understand content (clear language, predictable)
- Use robust technologies (assistive technologies, browsers)

**Target Users**:
- Visual disabilities (blind, low vision, color blind)
- Hearing disabilities (deaf, hard of hearing)
- Motor disabilities (limited dexterity, mobility)
- Cognitive disabilities (dyslexia, ADHD, autism)
- Temporary disabilities (broken arm, bright sunlight)
- Aging-related limitations

---

## WCAG 2.2 Principles: POUR

### 1. Perceivable
Information and UI components must be presentable to users in ways they can perceive.

### 2. Operable
UI components and navigation must be operable.

### 3. Understandable
Information and operation of UI must be understandable.

### 4. Robust
Content must be robust enough to work with assistive technologies.

---

## Guideline 1: Perceivable

### 1.1 Text Alternatives

#### 1.1.1 Non-text Content (A)
**Requirement**: All non-text content has a text alternative.

**Implementation**:
```tsx
// Images
<img src="vehicle.jpg" alt="White Toyota Camry, license plate ABC-123" />

// Decorative images (empty alt)
<img src="divider.png" alt="" role="presentation" />

// Icon buttons
<button aria-label="Delete vehicle">
  <TrashIcon aria-hidden="true" />
</button>

// Charts and graphs
<div role="img" aria-label="Monthly fuel consumption showing 20% reduction">
  <BarChart data={fuelData} />
  <table className="sr-only">
    {/* Data table alternative */}
  </table>
</div>

// Form inputs
<label htmlFor="vin">Vehicle Identification Number (VIN)</label>
<input id="vin" type="text" aria-required="true" />

// CAPTCHA
<div>
  <img src="captcha.png" alt="CAPTCHA: Enter the characters shown in the image" />
  <audio src="captcha.mp3" controls>
    <span>Audio alternative for CAPTCHA</span>
  </audio>
</div>
```

**Testing**:
- [ ] All images have meaningful alt text
- [ ] Decorative images have empty alt (`alt=""`)
- [ ] Icons have accessible labels
- [ ] Form inputs have labels
- [ ] Complex images have long descriptions

---

### 1.2 Time-based Media

#### 1.2.1 Audio-only and Video-only (Prerecorded) (A)
**Requirement**: Provide alternative for prerecorded audio/video.

#### 1.2.2 Captions (Prerecorded) (A)
**Requirement**: Captions for prerecorded audio/video.

#### 1.2.3 Audio Description or Media Alternative (Prerecorded) (A)
**Requirement**: Audio description for prerecorded video.

#### 1.2.4 Captions (Live) (AA)
**Requirement**: Captions for live audio/video.

#### 1.2.5 Audio Description (Prerecorded) (AA)
**Requirement**: Audio description for all prerecorded video.

**Implementation**:
```tsx
// Video with captions and audio description
<video controls>
  <source src="training-video.mp4" type="video/mp4" />
  <track kind="captions" src="captions-en.vtt" srclang="en" label="English" />
  <track kind="descriptions" src="descriptions-en.vtt" srclang="en" label="English Audio Descriptions" />
  <p>Your browser doesn't support HTML5 video. <a href="training-video.mp4">Download the video</a>.</p>
</video>

// Transcript link
<div>
  <video controls src="training-video.mp4" />
  <a href="training-transcript.txt">View transcript</a>
</div>
```

**Testing**:
- [ ] Videos have accurate captions
- [ ] Videos have audio descriptions
- [ ] Transcripts available for audio content
- [ ] Live events have real-time captions

---

### 1.3 Adaptable

#### 1.3.1 Info and Relationships (A)
**Requirement**: Information, structure, and relationships can be programmatically determined.

**Implementation**:
```tsx
// Semantic HTML
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/vehicles">Vehicles</a></li>
  </ul>
</nav>

<main>
  <h1>Vehicle Details</h1>
  <section aria-labelledby="specs-heading">
    <h2 id="specs-heading">Specifications</h2>
    {/* Content */}
  </section>
</main>

<aside aria-label="Recent activity">
  {/* Sidebar content */}
</aside>

// Form structure
<fieldset>
  <legend>Vehicle Type</legend>
  <label>
    <input type="radio" name="type" value="sedan" />
    Sedan
  </label>
  <label>
    <input type="radio" name="type" value="suv" />
    SUV
  </label>
</fieldset>

// Table structure
<table>
  <caption>Fleet Maintenance Schedule</caption>
  <thead>
    <tr>
      <th scope="col">Vehicle</th>
      <th scope="col">Service Type</th>
      <th scope="col">Due Date</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">ABC-123</th>
      <td>Oil Change</td>
      <td>2026-02-01</td>
    </tr>
  </tbody>
</table>

// Lists
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>

// Definition lists
<dl>
  <dt>VIN</dt>
  <dd>1HGBH41JXMN109186</dd>
  <dt>Make</dt>
  <dd>Honda</dd>
</dl>
```

#### 1.3.2 Meaningful Sequence (A)
**Requirement**: Content order makes sense when linearized.

**Implementation**:
```tsx
// Correct DOM order (not just visual order)
<div className="card">
  <h3>Vehicle Name</h3>  {/* Comes first in DOM */}
  <img src="vehicle.jpg" alt="..." />
  <p>Description</p>
  <button>View Details</button>
</div>

// CSS for visual reordering (if needed)
.card {
  display: flex;
  flex-direction: column;
}
.card img {
  order: -1; /* Move image before heading visually */
}
```

#### 1.3.3 Sensory Characteristics (A)
**Requirement**: Instructions don't rely solely on sensory characteristics.

**Implementation**:
```tsx
// WRONG: "Click the green button"
// CORRECT:
<button className="btn-primary" style={{ backgroundColor: 'green' }}>
  Save Changes
</button>
<p>Click the "Save Changes" button to continue.</p>

// WRONG: "See the icon on the right"
// CORRECT:
<p>Click the "Delete" button (trash can icon) to remove the vehicle.</p>
```

#### 1.3.4 Orientation (AA)
**Requirement**: Content works in portrait and landscape.

**Implementation**:
```css
/* Responsive design */
@media (orientation: portrait) {
  .dashboard {
    grid-template-columns: 1fr;
  }
}

@media (orientation: landscape) {
  .dashboard {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Don't lock orientation */
/* WRONG: */
/* @media (orientation: portrait) {
  html {
    transform: rotate(90deg);
  }
} */
```

#### 1.3.5 Identify Input Purpose (AA)
**Requirement**: Input purpose can be programmatically determined.

**Implementation**:
```tsx
// Use autocomplete attributes
<form>
  <label htmlFor="name">Full Name</label>
  <input id="name" type="text" autoComplete="name" />

  <label htmlFor="email">Email</label>
  <input id="email" type="email" autoComplete="email" />

  <label htmlFor="phone">Phone Number</label>
  <input id="phone" type="tel" autoComplete="tel" />

  <label htmlFor="street">Street Address</label>
  <input id="street" type="text" autoComplete="street-address" />

  <label htmlFor="city">City</label>
  <input id="city" type="text" autoComplete="address-level2" />

  <label htmlFor="state">State</label>
  <input id="state" type="text" autoComplete="address-level1" />

  <label htmlFor="zip">ZIP Code</label>
  <input id="zip" type="text" autoComplete="postal-code" />
</form>
```

**Common autocomplete values**:
- `name`, `given-name`, `family-name`
- `email`, `tel`, `url`
- `street-address`, `address-level1`, `address-level2`, `postal-code`, `country`
- `cc-name`, `cc-number`, `cc-exp`, `cc-csc`
- `username`, `new-password`, `current-password`

---

### 1.4 Distinguishable

#### 1.4.1 Use of Color (A)
**Requirement**: Color is not the only visual means of conveying information.

**Implementation**:
```tsx
// WRONG: Red text for errors only
<span style={{ color: 'red' }}>Invalid input</span>

// CORRECT: Icon + color + text
<span className="error">
  <AlertIcon aria-hidden="true" />
  <span>Invalid input: VIN must be 17 characters</span>
</span>

// Form validation
<div className="form-field error">
  <label htmlFor="vin">VIN</label>
  <input
    id="vin"
    type="text"
    aria-invalid="true"
    aria-describedby="vin-error"
  />
  <span id="vin-error" className="error-message">
    <AlertIcon aria-hidden="true" />
    VIN must be exactly 17 characters
  </span>
</div>

// Status indicators
<span className="status-badge status-active">
  <CheckIcon aria-hidden="true" />
  Active
</span>
<span className="status-badge status-inactive">
  <XIcon aria-hidden="true" />
  Inactive
</span>

// Charts with patterns (not just colors)
<BarChart>
  <Bar dataKey="electric" fill="#3b82f6" pattern="diagonal-stripe" />
  <Bar dataKey="gas" fill="#ef4444" pattern="dot" />
</BarChart>
```

#### 1.4.2 Audio Control (A)
**Requirement**: Provide controls for audio that plays automatically.

#### 1.4.3 Contrast (Minimum) (AA)
**Requirement**:
- **Text**: 4.5:1 contrast ratio
- **Large text** (18pt+, 14pt+ bold): 3:1 contrast ratio

**Implementation**:
```css
/* Good contrast ratios */
.text-primary {
  color: #1f2937; /* Dark gray on white: 16.1:1 */
}

.text-secondary {
  color: #4b5563; /* Medium gray on white: 8.6:1 */
}

.btn-primary {
  background: #2563eb; /* Blue */
  color: #ffffff; /* White text: 8.6:1 */
}

.btn-success {
  background: #059669; /* Green */
  color: #ffffff; /* White text: 4.5:1 */
}

/* WRONG: Insufficient contrast */
.text-light-gray {
  color: #d1d5db; /* Light gray on white: 1.4:1 ❌ */
}
```

**Testing Tools**:
- Chrome DevTools: Lighthouse accessibility audit
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Contrast Ratio Tool](https://contrast-ratio.com/)

**Testing**:
- [ ] Normal text has 4.5:1 contrast
- [ ] Large text has 3:1 contrast
- [ ] UI components have 3:1 contrast
- [ ] Focus indicators have 3:1 contrast

#### 1.4.4 Resize Text (AA)
**Requirement**: Text can be resized up to 200% without loss of functionality.

**Implementation**:
```css
/* Use relative units (rem, em, %) */
body {
  font-size: 16px; /* Base size */
}

h1 {
  font-size: 2rem; /* 32px, scales with zoom */
}

p {
  font-size: 1rem; /* 16px, scales with zoom */
}

button {
  padding: 0.5rem 1rem; /* Scales with zoom */
}

/* WRONG: Fixed pixel sizes */
.small-text {
  font-size: 12px; /* Doesn't scale well */
}

/* CORRECT: Relative size */
.small-text {
  font-size: 0.875rem; /* Scales with zoom */
}

/* Responsive containers */
.container {
  max-width: 100%;
  padding: 1rem;
}
```

**Testing**:
- [ ] Zoom to 200% in browser
- [ ] All text remains visible
- [ ] No horizontal scrolling (except data tables)
- [ ] No content overlap

#### 1.4.5 Images of Text (AA)
**Requirement**: Use actual text, not images of text (unless essential).

**Implementation**:
```tsx
// WRONG: Image of text
<img src="welcome-heading.png" alt="Welcome to CTAFleet" />

// CORRECT: Actual text with styling
<h1 className="welcome-heading">Welcome to CTAFleet</h1>

// Acceptable: Logo
<img src="ctafleet-logo.png" alt="CTAFleet" />
```

#### 1.4.10 Reflow (AA)
**Requirement**: Content reflows to single column at 320px width without horizontal scrolling.

**Implementation**:
```css
/* Mobile-first responsive design */
.dashboard {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .dashboard {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .dashboard {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Tables: Allow horizontal scroll */
.table-container {
  overflow-x: auto;
}
```

**Testing**:
- [ ] Test at 320px viewport width
- [ ] No horizontal scrolling (except tables/images)
- [ ] Content remains readable
- [ ] All functionality accessible

#### 1.4.11 Non-text Contrast (AA)
**Requirement**: UI components and graphics have 3:1 contrast ratio.

**Implementation**:
```css
/* Form inputs */
input {
  border: 1px solid #6b7280; /* Gray on white: 5.7:1 ✓ */
}

input:focus {
  border: 2px solid #2563eb; /* Blue on white: 8.6:1 ✓ */
  outline: 2px solid #2563eb;
}

/* Buttons */
.btn {
  background: #2563eb;
  color: #ffffff;
  border: 2px solid #2563eb; /* Border adds to contrast */
}

/* Icons */
.icon-button {
  color: #1f2937; /* Dark gray on white: 16.1:1 ✓ */
}

/* Focus indicators */
:focus-visible {
  outline: 2px solid #2563eb; /* 8.6:1 against white ✓ */
  outline-offset: 2px;
}
```

#### 1.4.12 Text Spacing (AA)
**Requirement**: Content adapts to user-defined text spacing without loss of functionality.

**Implementation**:
```css
/* Design for increased spacing */
body {
  line-height: 1.5; /* Minimum */
  letter-spacing: 0.12em; /* Accommodate user overrides */
}

p {
  margin-bottom: 2em; /* Paragraph spacing */
}

h1, h2, h3, h4, h5, h6 {
  line-height: 1.3; /* Minimum for headings */
}

/* Test with these user stylesheet values */
* {
  line-height: 1.5 !important;
  letter-spacing: 0.12em !important;
  word-spacing: 0.16em !important;
}

p {
  margin-bottom: 2em !important;
}
```

**Testing**:
- [ ] Apply text spacing bookmarklet
- [ ] No content truncation
- [ ] No content overlap
- [ ] All controls remain functional

#### 1.4.13 Content on Hover or Focus (AA)
**Requirement**: Additional content triggered by hover/focus must be dismissible, hoverable, and persistent.

**Implementation**:
```tsx
// Tooltip component
const Tooltip = ({ children, content }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="tooltip-container">
      <button
        aria-describedby="tooltip"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
      </button>
      {isVisible && (
        <div
          id="tooltip"
          role="tooltip"
          className="tooltip-content"
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
        >
          {content}
          <button
            aria-label="Close"
            onClick={() => setIsVisible(false)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

// Requirements:
// 1. Dismissible: ESC key or close button
// 2. Hoverable: Can move mouse to tooltip
// 3. Persistent: Doesn't disappear until trigger removed
```

---

## Guideline 2: Operable

### 2.1 Keyboard Accessible

#### 2.1.1 Keyboard (A)
**Requirement**: All functionality available via keyboard.

**Implementation**:
```tsx
// Native interactive elements (automatically keyboard accessible)
<button onClick={handleClick}>Save</button>
<a href="/vehicles">View Vehicles</a>
<input type="text" />
<select>
  <option>Option 1</option>
</select>

// Custom interactive elements need keyboard support
const CustomButton = ({ onClick, children }: Props) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label="Custom button"
    >
      {children}
    </div>
  );
};

// Modal dialog (trap focus)
const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    firstElement?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title">Modal Title</h2>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};
```

**Testing**:
- [ ] Tab through all interactive elements
- [ ] Shift+Tab goes backward
- [ ] Enter activates buttons/links
- [ ] Space activates buttons
- [ ] Arrow keys work in custom widgets
- [ ] Escape closes dialogs

#### 2.1.2 No Keyboard Trap (A)
**Requirement**: Keyboard focus can move away from any component.

**Implementation**:
```tsx
// Modal with proper focus management (see above)
// Ensure ESC key can close modal
// Ensure focus returns to trigger element

const DialogButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleClose = () => {
    setIsOpen(false);
    // Return focus to trigger
    triggerRef.current?.focus();
  };

  return (
    <>
      <button ref={triggerRef} onClick={() => setIsOpen(true)}>
        Open Dialog
      </button>
      <Modal isOpen={isOpen} onClose={handleClose}>
        {/* Content */}
      </Modal>
    </>
  );
};
```

#### 2.1.4 Character Key Shortcuts (A)
**Requirement**: Single character shortcuts can be disabled/remapped or only active on focus.

**Implementation**:
```tsx
// Global keyboard shortcuts
const useKeyboardShortcuts = () => {
  const [shortcutsEnabled, setShortcutsEnabled] = useState(true);

  useEffect(() => {
    if (!shortcutsEnabled) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if not in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Use modifier keys (Ctrl/Cmd) for shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'k':
            e.preventDefault();
            handleSearch();
            break;
        }
      }
    };

    document.addEventListener('keypress', handleKeyPress);
    return () => document.removeEventListener('keypress', handleKeyPress);
  }, [shortcutsEnabled]);

  return { shortcutsEnabled, setShortcutsEnabled };
};

// Settings page
<label>
  <input
    type="checkbox"
    checked={shortcutsEnabled}
    onChange={(e) => setShortcutsEnabled(e.target.checked)}
  />
  Enable keyboard shortcuts
</label>
```

---

### 2.2 Enough Time

#### 2.2.1 Timing Adjustable (A)
**Requirement**: Users can extend, adjust, or disable time limits.

**Implementation**:
```tsx
// Session timeout warning
const SessionTimeoutWarning = () => {
  const [timeRemaining, setTimeRemaining] = useState(60); // 60 seconds

  const extendSession = () => {
    // Extend session by 15 minutes
    fetch('/api/extend-session', { method: 'POST' });
  };

  return (
    <div role="alert" aria-live="assertive">
      <p>Your session will expire in {timeRemaining} seconds.</p>
      <button onClick={extendSession}>Extend Session</button>
      <button onClick={logout}>Logout Now</button>
    </div>
  );
};
```

#### 2.2.2 Pause, Stop, Hide (A)
**Requirement**: Moving, blinking, scrolling, or auto-updating content can be paused, stopped, or hidden.

**Implementation**:
```tsx
// Auto-rotating carousel with pause button
const Carousel = ({ items }: Props) => {
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, items.length]);

  return (
    <div
      className="carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div>{items[currentIndex]}</div>
      <button
        onClick={() => setIsPaused(!isPaused)}
        aria-label={isPaused ? 'Play carousel' : 'Pause carousel'}
      >
        {isPaused ? '▶' : '⏸'}
      </button>
    </div>
  );
};
```

---

### 2.3 Seizures and Physical Reactions

#### 2.3.1 Three Flashes or Below Threshold (A)
**Requirement**: No content flashes more than 3 times per second.

**Implementation**:
- Avoid rapid flashing animations
- Use CSS `prefers-reduced-motion` media query
- Provide option to disable animations

```css
/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### 2.4 Navigable

#### 2.4.1 Bypass Blocks (A)
**Requirement**: Skip navigation mechanism to bypass repeated content.

**Implementation**:
```tsx
// Skip to main content link
<a href="#main-content" className="skip-link">
  Skip to main content
</a>

<nav>
  {/* Navigation */}
</nav>

<main id="main-content" tabIndex={-1}>
  {/* Main content */}
</main>

// CSS
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

#### 2.4.2 Page Titled (A)
**Requirement**: Web pages have descriptive titles.

**Implementation**:
```tsx
// React Helmet or document.title
<Helmet>
  <title>Vehicle Details - ABC-123 - CTAFleet</title>
</Helmet>

// Update on route change
useEffect(() => {
  document.title = `${vehicleName} - CTAFleet`;
}, [vehicleName]);
```

#### 2.4.3 Focus Order (A)
**Requirement**: Focus order preserves meaning and operability.

**Implementation**:
```tsx
// Correct DOM order (matches visual order)
<form>
  <input type="text" placeholder="First name" />
  <input type="text" placeholder="Last name" />
  <input type="email" placeholder="Email" />
  <button type="submit">Submit</button>
</form>

// Avoid manipulating tab order with tabindex > 0
// WRONG:
<button tabIndex={3}>Third</button>
<button tabIndex={1}>First</button>
<button tabIndex={2}>Second</button>

// CORRECT: Use proper DOM order
<button>First</button>
<button>Second</button>
<button>Third</button>
```

#### 2.4.4 Link Purpose (In Context) (A)
**Requirement**: Link purpose can be determined from link text or context.

**Implementation**:
```tsx
// WRONG: Ambiguous links
<a href="/vehicles/123">Click here</a>
<a href="/edit">Edit</a>

// CORRECT: Descriptive links
<a href="/vehicles/123">View details for Vehicle ABC-123</a>
<a href="/edit" aria-label="Edit vehicle ABC-123">Edit</a>

// Context from surrounding content
<article aria-labelledby="vehicle-heading">
  <h2 id="vehicle-heading">Vehicle ABC-123</h2>
  <p>2020 Toyota Camry</p>
  <a href="/vehicles/123">View details</a> {/* Context from article */}
</article>
```

#### 2.4.5 Multiple Ways (AA)
**Requirement**: Multiple ways to locate pages (search, sitemap, navigation).

**Implementation**:
- Navigation menu
- Search functionality
- Breadcrumbs
- Sitemap page

```tsx
// Breadcrumbs
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/vehicles">Vehicles</a></li>
    <li aria-current="page">ABC-123</li>
  </ol>
</nav>

// Search
<form role="search">
  <label htmlFor="search">Search vehicles</label>
  <input id="search" type="search" />
  <button type="submit">Search</button>
</form>
```

#### 2.4.6 Headings and Labels (AA)
**Requirement**: Headings and labels are descriptive.

**Implementation**:
```tsx
// WRONG: Generic headings
<h1>Details</h1>
<h2>Information</h2>

// CORRECT: Descriptive headings
<h1>Vehicle Details: 2020 Toyota Camry (ABC-123)</h1>
<h2>Maintenance History</h2>

// Descriptive labels
<label htmlFor="vin">Vehicle Identification Number (VIN)</label>
<input id="vin" type="text" />

// Not just:
<label htmlFor="vin">VIN</label>
```

#### 2.4.7 Focus Visible (AA)
**Requirement**: Keyboard focus indicator is visible.

**Implementation**:
```css
/* Custom focus styles */
:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
  border-radius: 2px;
}

/* Component-specific focus */
button:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

input:focus-visible {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Don't remove focus outlines! */
/* WRONG: */
/* :focus {
  outline: none;
} */
```

**Testing**:
- [ ] Tab through page
- [ ] Focus indicator always visible
- [ ] Focus indicator has 3:1 contrast
- [ ] Focus indicator clearly indicates focused element

---

### 2.5 Input Modalities

#### 2.5.1 Pointer Gestures (A)
**Requirement**: Functions using multipoint or path-based gestures can be operated with single-pointer.

#### 2.5.2 Pointer Cancellation (A)
**Requirement**: Functions using single-pointer can be aborted or undone.

**Implementation**:
```tsx
// Click activation on mouse up (not mouse down)
<button
  onMouseDown={() => setPressed(true)}
  onMouseUp={handleClick}
  onMouseLeave={() => setPressed(false)}
>
  Click me
</button>

// Allow drag cancellation
const [isDragging, setIsDragging] = useState(false);

<div
  draggable
  onDragStart={() => setIsDragging(true)}
  onDragEnd={(e) => {
    if (e.dataTransfer.dropEffect === 'none') {
      // Drag cancelled (ESC key)
      setIsDragging(false);
    }
  }}
>
  Draggable item
</div>
```

#### 2.5.3 Label in Name (A)
**Requirement**: Visible label text is part of accessible name.

**Implementation**:
```tsx
// WRONG: Visible label doesn't match accessible name
<button aria-label="Submit form">Send</button>

// CORRECT: Accessible name includes visible label
<button aria-label="Send message">Send</button>
// Or just:
<button>Send</button>
```

#### 2.5.4 Motion Actuation (A)
**Requirement**: Functions triggered by device motion can also be operated by UI components.

**Implementation**:
```tsx
// Shake to undo - provide button alternative
const UndoFeature = () => {
  useEffect(() => {
    const handleShake = (e: DeviceMotionEvent) => {
      if (detectShake(e)) {
        handleUndo();
      }
    };

    window.addEventListener('devicemotion', handleShake);
    return () => window.removeEventListener('devicemotion', handleShake);
  }, []);

  return (
    <>
      <p>Shake your device to undo</p>
      <button onClick={handleUndo}>Undo</button> {/* Alternative */}
    </>
  );
};
```

---

## Guideline 3: Understandable

### 3.1 Readable

#### 3.1.1 Language of Page (A)
**Requirement**: Default human language can be programmatically determined.

**Implementation**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>CTAFleet</title>
</head>
<body>
  <!-- Content in English -->
</body>
</html>
```

#### 3.1.2 Language of Parts (AA)
**Requirement**: Language of each passage can be programmatically determined.

**Implementation**:
```tsx
<div lang="en">
  <p>This is in English.</p>
  <blockquote lang="es">
    <p>Este es un texto en español.</p>
  </blockquote>
  <p>Back to English.</p>
</div>
```

---

### 3.2 Predictable

#### 3.2.1 On Focus (A)
**Requirement**: Receiving focus doesn't initiate context change.

**Implementation**:
```tsx
// WRONG: Navigation on focus
<select onChange={navigate} autoFocus>
  <option value="/page1">Page 1</option>
</select>

// CORRECT: Navigation on submit
<form onSubmit={navigate}>
  <select name="page">
    <option value="/page1">Page 1</option>
  </select>
  <button type="submit">Go</button>
</form>
```

#### 3.2.2 On Input (A)
**Requirement**: Changing settings doesn't automatically cause context change (unless user is warned).

**Implementation**:
```tsx
// WRONG: Auto-submit on change
<select onChange={(e) => form.submit()}>

// CORRECT: Explicit submit button
<form onSubmit={handleSubmit}>
  <select onChange={(e) => setSelected(e.target.value)}>
    <option>Option 1</option>
  </select>
  <button type="submit">Apply</button>
</form>

// Or: Warn user first
<label>
  <input
    type="checkbox"
    onChange={(e) => {
      if (e.target.checked) {
        if (confirm('This will reload the page. Continue?')) {
          handleChange();
        }
      }
    }}
  />
  Enable feature (page will reload)
</label>
```

#### 3.2.3 Consistent Navigation (AA)
**Requirement**: Navigation mechanisms are consistent across pages.

**Implementation**:
- Keep main navigation in same location
- Use same navigation order
- Use consistent labels

#### 3.2.4 Consistent Identification (AA)
**Requirement**: Components with same functionality are identified consistently.

**Implementation**:
```tsx
// Use same icon and label for "Delete" everywhere
<button aria-label="Delete vehicle">
  <TrashIcon />
</button>

// Not:
<button aria-label="Remove vehicle">
  <TrashIcon />
</button>
```

---

### 3.3 Input Assistance

#### 3.3.1 Error Identification (A)
**Requirement**: Input errors are identified and described in text.

**Implementation**:
```tsx
<form onSubmit={handleSubmit}>
  <div className={errors.vin ? 'form-field error' : 'form-field'}>
    <label htmlFor="vin">VIN</label>
    <input
      id="vin"
      type="text"
      aria-invalid={errors.vin ? 'true' : 'false'}
      aria-describedby={errors.vin ? 'vin-error' : undefined}
    />
    {errors.vin && (
      <span id="vin-error" className="error-message" role="alert">
        <AlertIcon aria-hidden="true" />
        {errors.vin}
      </span>
    )}
  </div>
  <button type="submit">Submit</button>
</form>

// Form-level errors
{errors.length > 0 && (
  <div role="alert" aria-labelledby="error-heading">
    <h2 id="error-heading">There are {errors.length} errors in the form:</h2>
    <ul>
      {errors.map((error) => (
        <li key={error.field}>
          <a href={`#${error.field}`}>{error.message}</a>
        </li>
      ))}
    </ul>
  </div>
)}
```

#### 3.3.2 Labels or Instructions (A)
**Requirement**: Labels or instructions provided when input is required.

**Implementation**:
```tsx
<form>
  <div className="form-field">
    <label htmlFor="vin">
      Vehicle Identification Number (VIN)
      <span aria-label="required">*</span>
    </label>
    <input
      id="vin"
      type="text"
      required
      aria-required="true"
      aria-describedby="vin-help"
    />
    <span id="vin-help" className="help-text">
      17-character code found on your vehicle registration
    </span>
  </div>

  <fieldset>
    <legend>
      Select vehicle type
      <span aria-label="required">*</span>
    </legend>
    <label>
      <input type="radio" name="type" value="sedan" required />
      Sedan
    </label>
    <label>
      <input type="radio" name="type" value="suv" required />
      SUV
    </label>
  </fieldset>

  <button type="submit">Submit</button>
</form>
```

#### 3.3.3 Error Suggestion (AA)
**Requirement**: Suggest corrections for input errors (if known).

**Implementation**:
```tsx
// Email validation with suggestion
const validateEmail = (email: string): ValidationResult => {
  if (!email.includes('@')) {
    return {
      valid: false,
      error: 'Email must include @',
    };
  }

  // Check for common typos
  const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com'];
  const [, domain] = email.split('@');

  const suggestion = commonDomains.find((d) =>
    levenshteinDistance(domain, d) <= 2
  );

  if (suggestion && domain !== suggestion) {
    return {
      valid: false,
      error: `Did you mean ${email.split('@')[0]}@${suggestion}?`,
      suggestion: `${email.split('@')[0]}@${suggestion}`,
    };
  }

  return { valid: true };
};

// Display suggestion
{error.suggestion && (
  <button
    type="button"
    onClick={() => setValue(error.suggestion)}
  >
    Use {error.suggestion}
  </button>
)}
```

#### 3.3.4 Error Prevention (Legal, Financial, Data) (AA)
**Requirement**: For legal/financial transactions, provide:
- Reversible submissions, or
- Data validation, or
- Confirmation before submission

**Implementation**:
```tsx
// Confirmation dialog
const DeleteVehicleButton = ({ vehicle }: Props) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    await deleteVehicle(vehicle.id);
    setShowConfirm(false);
  };

  return (
    <>
      <button onClick={() => setShowConfirm(true)}>
        Delete Vehicle
      </button>

      {showConfirm && (
        <div role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <h2 id="confirm-title">Confirm Deletion</h2>
          <p>
            Are you sure you want to delete vehicle {vehicle.name}?
            This action cannot be undone.
          </p>
          <button onClick={handleDelete}>
            Yes, Delete
          </button>
          <button onClick={() => setShowConfirm(false)}>
            Cancel
          </button>
        </div>
      )}
    </>
  );
};

// Review before submit
<form onSubmit={handleSubmit}>
  {step === 'review' ? (
    <div>
      <h2>Review Your Information</h2>
      <dl>
        <dt>VIN:</dt>
        <dd>{formData.vin}</dd>
        <dt>Make:</dt>
        <dd>{formData.make}</dd>
      </dl>
      <button type="button" onClick={() => setStep('edit')}>
        Edit
      </button>
      <button type="submit">
        Confirm and Submit
      </button>
    </div>
  ) : (
    <div>
      {/* Form fields */}
      <button type="button" onClick={() => setStep('review')}>
        Review
      </button>
    </div>
  )}
</form>
```

---

## Guideline 4: Robust

### 4.1 Compatible

#### 4.1.1 Parsing (A)
**Requirement**: Markup is well-formed (for HTML: start/end tags, unique IDs, proper nesting).

**Implementation**:
- Use linters (ESLint, HTMLHint)
- Validate HTML (W3C Validator)
- Use TypeScript for JSX validation

```tsx
// WRONG: Duplicate IDs
<input id="email" />
<input id="email" />

// CORRECT: Unique IDs
<input id="email-1" />
<input id="email-2" />

// WRONG: Improper nesting
<div>
  <p>Text
    <div>Nested div</div>
  </p>
</div>

// CORRECT: Proper nesting
<div>
  <p>Text</p>
  <div>Nested div</div>
</div>
```

#### 4.1.2 Name, Role, Value (A)
**Requirement**: For all UI components, name and role can be programmatically determined.

**Implementation**:
```tsx
// Native elements (automatic)
<button>Click me</button> {/* role="button", name="Click me" */}
<input type="checkbox" id="agree" />
<label htmlFor="agree">I agree</label> {/* role="checkbox", name="I agree" */}

// Custom components need ARIA
<div
  role="button"
  tabIndex={0}
  aria-label="Custom button"
  aria-pressed="false"
  onClick={handleClick}
  onKeyDown={handleKeyDown}
>
  Click me
</div>

// Custom checkbox
<div
  role="checkbox"
  tabIndex={0}
  aria-checked={isChecked}
  aria-labelledby="checkbox-label"
  onClick={toggle}
  onKeyDown={handleKeyDown}
>
  <span id="checkbox-label">Custom checkbox</span>
</div>

// Custom select
<div>
  <button
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    aria-labelledby="select-label"
    onClick={() => setIsOpen(!isOpen)}
  >
    {selectedOption}
  </button>
  <span id="select-label">Select option</span>
  {isOpen && (
    <ul role="listbox" aria-labelledby="select-label">
      {options.map((option) => (
        <li
          key={option.value}
          role="option"
          aria-selected={option.value === selectedOption}
          onClick={() => handleSelect(option)}
        >
          {option.label}
        </li>
      ))}
    </ul>
  )}
</div>
```

#### 4.1.3 Status Messages (AA)
**Requirement**: Status messages can be programmatically determined through roles or properties.

**Implementation**:
```tsx
// Success message
<div role="status" aria-live="polite">
  <p>Vehicle saved successfully</p>
</div>

// Error message
<div role="alert" aria-live="assertive">
  <p>Error: Unable to save vehicle</p>
</div>

// Loading indicator
<div role="status" aria-live="polite" aria-busy="true">
  <p>Loading vehicles...</p>
  <Spinner aria-hidden="true" />
</div>

// Search results
<div role="status" aria-live="polite" aria-atomic="true">
  <p>Found {results.length} vehicles matching "{query}"</p>
</div>

// Toast notification
const Toast = ({ message, type }: Props) => {
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={`toast toast-${type}`}
    >
      {message}
    </div>
  );
};
```

---

## WCAG 2.2 New Success Criteria

### 2.4.11 Focus Not Obscured (Minimum) (AA)
**Requirement**: Focused element is not entirely hidden by author-created content.

**Implementation**:
```css
/* Ensure sticky headers don't cover focus */
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 100;
}

/* Scroll padding to account for sticky header */
html {
  scroll-padding-top: 80px; /* Height of sticky header */
}

/* Ensure focus is visible */
:focus-visible {
  scroll-margin-top: 80px;
}
```

### 2.4.12 Focus Not Obscured (Enhanced) (AAA)
**Requirement**: Focused element is not partially hidden by author-created content.

### 2.4.13 Focus Appearance (AAA)
**Requirement**: Focus indicator has minimum size and contrast.

### 3.2.6 Consistent Help (A)
**Requirement**: Help mechanism is in same relative order across pages.

**Implementation**:
```tsx
// Help link in consistent location (header)
<header>
  <nav>
    {/* Navigation */}
  </nav>
  <a href="/help" className="help-link">
    <HelpIcon aria-hidden="true" />
    Help
  </a>
</header>
```

### 3.3.7 Redundant Entry (A)
**Requirement**: Don't ask for same information twice (unless necessary or previously entered info no longer valid).

**Implementation**:
```tsx
// Remember previously entered data
<form>
  <label htmlFor="email">Email</label>
  <input
    id="email"
    type="email"
    defaultValue={user?.email} // Pre-fill from user profile
  />

  {/* Don't ask for email again */}
</form>

// Multi-step form - carry data forward
const MultiStepForm = () => {
  const [formData, setFormData] = useState({});

  return (
    <>
      {step === 1 && <Step1 data={formData} onNext={setFormData} />}
      {step === 2 && <Step2 data={formData} onNext={setFormData} />}
      {/* Data from Step 1 available in Step 2 */}
    </>
  );
};
```

### 3.3.8 Accessible Authentication (Minimum) (AA)
**Requirement**: Cognitive function test not required for authentication (unless alternative provided).

**Implementation**:
- Allow password managers (don't block paste)
- Provide email magic links as alternative to passwords
- Support OAuth/SSO
- Don't use CAPTCHAs (or provide alternative)

```tsx
// Allow paste in password fields
<input
  type="password"
  onPaste={(e) => {
    // Don't prevent default
    // Allow password managers
  }}
/>

// Magic link authentication
<div>
  <button onClick={sendMagicLink}>
    Send login link to email
  </button>
  <p>No password required</p>
</div>

// OAuth alternative
<button onClick={loginWithMicrosoft}>
  Sign in with Microsoft
</button>
```

### 3.3.9 Accessible Authentication (Enhanced) (AAA)
**Requirement**: Cognitive function test not required for any step in authentication.

---

## Testing Checklist

### Automated Testing
- [ ] Lighthouse accessibility audit (90+ score)
- [ ] axe DevTools (0 violations)
- [ ] WAVE browser extension
- [ ] Pa11y CI in pipeline

### Manual Testing
- [ ] Keyboard-only navigation
- [ ] Screen reader testing (NVDA, JAWS, VoiceOver)
- [ ] Zoom to 200%
- [ ] Reflow at 320px width
- [ ] Color contrast check
- [ ] Focus indicators visible

### Screen Reader Testing
- [ ] NVDA (Windows, Firefox)
- [ ] JAWS (Windows, Edge/Chrome)
- [ ] VoiceOver (macOS/iOS, Safari)
- [ ] TalkBack (Android, Chrome)

### Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

---

## References

1. **WCAG 2.2**: https://www.w3.org/TR/WCAG22/
2. **Understanding WCAG 2.2**: https://www.w3.org/WAI/WCAG22/Understanding/
3. **Techniques for WCAG 2.2**: https://www.w3.org/WAI/WCAG22/Techniques/
4. **WebAIM**: https://webaim.org/
5. **A11y Project Checklist**: https://www.a11yproject.com/checklist/
6. **MDN Accessibility**: https://developer.mozilla.org/en-US/docs/Web/Accessibility
7. **ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-08 | STANDARDS-001 | Initial WCAG 2.2 AA checklist |

---

**Document Classification**: Internal Use
**Next Review Date**: 2027-01-08
