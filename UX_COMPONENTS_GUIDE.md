# UX Components Guide

## Overview

This guide documents the reusable UX components created to improve user experience across the Fleet Management System. These components provide consistent loading states, error handling, success feedback, navigation, and form validation.

## Components

### 1. LoadingSpinner

**Location:** `/home/user/Fleet/src/components/LoadingSpinner.tsx`

A flexible loading spinner component with multiple size options.

**Props:**
- `size?: 'sm' | 'md' | 'lg'` - Size of the spinner (default: 'md')
- `className?: string` - Additional CSS classes

**Features:**
- Three size variants (small, medium, large)
- ARIA labels for accessibility
- Screen reader support with sr-only text

**Usage:**
```tsx
import { LoadingSpinner } from '@/components/LoadingSpinner';

// Basic usage
<LoadingSpinner />

// Small spinner for buttons
<LoadingSpinner size="sm" />

// Large spinner for page loading
<LoadingSpinner size="lg" />
```

---

### 2. LoadingOverlay

**Location:** `/home/user/Fleet/src/components/LoadingOverlay.tsx`

A full-screen overlay with loading spinner for blocking UI during async operations.

**Props:**
- `message?: string` - Loading message to display (default: 'Loading...')

**Features:**
- Semi-transparent backdrop
- Centered loading indicator
- Customizable message
- High z-index for proper layering

**Usage:**
```tsx
import { LoadingOverlay } from '@/components/LoadingOverlay';

function MyComponent() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <>
      {isSubmitting && <LoadingOverlay message="Saving vehicle data..." />}
      {/* Your content */}
    </>
  );
}
```

---

### 3. SkeletonLoader

**Location:** `/home/user/Fleet/src/components/SkeletonLoader.tsx`

Skeleton loaders for lists and tables to show while data is loading.

**Components:**
- `SkeletonRow` - Single row skeleton
- `SkeletonTable` - Multiple rows skeleton

**Props (SkeletonTable):**
- `rows?: number` - Number of skeleton rows to display (default: 5)

**Features:**
- Pulse animation
- Customizable row count
- Responsive design

**Usage:**
```tsx
import { SkeletonTable, SkeletonRow } from '@/components/SkeletonLoader';

function VehicleList() {
  const { data, isLoading } = useVehicles();

  if (isLoading) {
    return <SkeletonTable rows={10} />;
  }

  return (
    <div>
      {data.map(vehicle => (
        <VehicleRow key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}
```

---

### 4. ErrorMessage

**Location:** `/home/user/Fleet/src/components/ErrorMessage.tsx`

Standardized error message component with optional retry functionality.

**Components:**
- `ErrorMessage` - Full error card with icon and retry button
- `FieldError` - Inline field error for forms

**Props (ErrorMessage):**
- `title?: string` - Error title (default: 'Error')
- `message: string` - Error message (required)
- `onRetry?: () => void` - Retry callback function
- `className?: string` - Additional CSS classes

**Props (FieldError):**
- `message: string` - Error message (required)

**Features:**
- Consistent error styling
- Optional retry button
- ARIA role for accessibility
- Icon for visual feedback

**Usage:**
```tsx
import { ErrorMessage, FieldError } from '@/components/ErrorMessage';

// Full error message with retry
<ErrorMessage
  title="Failed to Load Vehicles"
  message="Unable to fetch vehicle data. Please check your connection."
  onRetry={() => refetch()}
/>

// Inline field error for forms
<input type="text" name="vin" />
{errors.vin && <FieldError message={errors.vin} />}
```

---

### 5. Toast Notifications

**Location:** `/home/user/Fleet/src/components/Toast.tsx`

Toast notification system for success messages and feedback.

**Components:**
- `Toast` - Single toast notification
- `ToastContainer` - Container to manage multiple toasts

**Props (Toast):**
- `message: string` - Toast message (required)
- `type?: 'success' | 'error' | 'info' | 'warning'` - Toast type (default: 'success')
- `duration?: number` - Auto-dismiss duration in ms (default: 3000)
- `onClose: () => void` - Close callback (required)

**Props (ToastContainer):**
- `toasts: Array<{id, message, type}>` - Array of toast objects
- `removeToast: (id: string) => void` - Function to remove toast

**Features:**
- Auto-dismiss with configurable duration
- Multiple toast types with different colors
- Stacked display for multiple toasts
- Close button for manual dismissal

**Usage:**
```tsx
import { ToastContainer } from '@/components/Toast';
import { useState } from 'react';

function App() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message: string, type = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleSave = async () => {
    await saveVehicle();
    addToast('Vehicle saved successfully!', 'success');
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {/* Your app content */}
    </>
  );
}
```

---

### 6. Breadcrumb Navigation

**Location:** `/home/user/Fleet/src/components/Breadcrumb.tsx`

Breadcrumb navigation component for drill-down views.

**Components:**
- `Breadcrumb` - Generic breadcrumb component
- `VehicleDetailBreadcrumb` - Pre-configured for vehicle details

**Props (Breadcrumb):**
- `items: BreadcrumbItem[]` - Array of breadcrumb items (required)
  - `label: string` - Item label
  - `href?: string` - Optional link (last item typically has no href)
- `className?: string` - Additional CSS classes

**Features:**
- React Router integration
- ARIA navigation role
- Separator chevrons
- Hover states for links
- Last item shown as plain text (current page)

**Usage:**
```tsx
import { Breadcrumb, VehicleDetailBreadcrumb } from '@/components/Breadcrumb';

// Generic usage
<Breadcrumb
  items={[
    { label: 'Home', href: '/' },
    { label: 'Fleet', href: '/fleet' },
    { label: 'Vehicles', href: '/vehicles' },
    { label: 'Vehicle Details' }
  ]}
/>

// Pre-configured for vehicle details
<VehicleDetailBreadcrumb
  vehicleId="123"
  vehicleName="Ford F-150"
/>
```

---

## Hooks

### useFormValidation

**Location:** `/home/user/Fleet/src/hooks/useFormValidation.ts`

A comprehensive form validation hook with real-time validation.

**Signature:**
```tsx
const {
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  validateAll,
  reset,
  setValues
} = useFormValidation(initialValues, rules);
```

**Parameters:**
- `initialValues: object` - Initial form values
- `rules: ValidationRules` - Validation rules for each field

**Validation Rules:**
- `required?: boolean` - Field is required
- `minLength?: number` - Minimum string length
- `maxLength?: number` - Maximum string length
- `pattern?: RegExp` - Regex pattern to match
- `email?: boolean` - Validate email format
- `custom?: (value) => string | undefined` - Custom validation function

**Returns:**
- `values` - Current form values
- `errors` - Current validation errors
- `touched` - Fields that have been interacted with
- `handleChange(name, value)` - Update field value
- `handleBlur(name)` - Mark field as touched and validate
- `validateAll()` - Validate all fields (returns boolean)
- `reset()` - Reset form to initial state
- `setValues(values)` - Set form values programmatically

**Features:**
- Real-time validation after first blur
- Touch tracking to avoid premature errors
- Built-in validation rules
- Custom validation support
- Form reset functionality

**Usage:**
```tsx
import { useFormValidation } from '@/hooks/useFormValidation';

function VehicleForm() {
  const { values, errors, touched, handleChange, handleBlur, validateAll } =
    useFormValidation(
      {
        vin: '',
        make: '',
        model: '',
        year: ''
      },
      {
        vin: { required: true, minLength: 17, maxLength: 17 },
        make: { required: true, minLength: 2 },
        model: { required: true },
        year: {
          required: true,
          custom: (value) => {
            const year = parseInt(value);
            if (isNaN(year) || year < 1900 || year > 2025) {
              return 'Invalid year';
            }
          }
        }
      }
    );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateAll()) {
      // Submit form
      submitVehicle(values);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={values.vin}
        onChange={(e) => handleChange('vin', e.target.value)}
        onBlur={() => handleBlur('vin')}
      />
      {touched.vin && errors.vin && <FieldError message={errors.vin} />}

      {/* More fields... */}
    </form>
  );
}
```

---

## Example Integration

See `/home/user/Fleet/src/components/examples/VehicleForm.example.tsx` for a complete example showing:
- Form validation with useFormValidation
- Loading states with LoadingSpinner
- Error display with ErrorMessage and FieldError
- Real-time validation feedback
- Disabled submit button during loading

---

## Best Practices

### Loading States
1. Use `LoadingSpinner` for small inline loading (buttons, sections)
2. Use `LoadingOverlay` for full-screen blocking operations
3. Use `SkeletonLoader` for list/table placeholders during data fetching

### Error Handling
1. Use `ErrorMessage` for page-level or section-level errors
2. Use `FieldError` for inline form field validation errors
3. Always provide retry functionality when appropriate
4. Keep error messages user-friendly and actionable

### Success Feedback
1. Use toasts for confirmation of successful actions
2. Keep toast messages concise (1-2 lines)
3. Use appropriate toast types (success, error, info, warning)
4. Don't overwhelm users with too many toasts

### Navigation
1. Use breadcrumbs for multi-level navigation
2. Ensure last breadcrumb item is not clickable (current page)
3. Keep breadcrumb labels short and descriptive

### Form Validation
1. Validate on blur (after field interaction) for better UX
2. Show errors only after field has been touched
3. Validate all fields on form submission
4. Provide clear, specific error messages
5. Use custom validators for complex business rules

---

## Accessibility Features

All components include accessibility features:

- **ARIA Labels**: Proper ARIA roles and labels for screen readers
- **Keyboard Navigation**: Full keyboard support where applicable
- **Focus Management**: Proper focus indicators and management
- **Semantic HTML**: Correct HTML elements for better accessibility
- **Screen Reader Text**: Hidden text for screen reader context
- **Color Contrast**: Sufficient color contrast for visibility
- **Error Announcements**: ARIA live regions for error messages

---

## Component Composition Examples

### Loading State Pattern
```tsx
function VehicleList() {
  const { data, isLoading, error, refetch } = useVehicles();

  if (isLoading) return <SkeletonTable rows={10} />;
  if (error) return (
    <ErrorMessage
      title="Failed to Load Vehicles"
      message={error.message}
      onRetry={refetch}
    />
  );

  return (
    <div>
      {data.map(vehicle => <VehicleRow key={vehicle.id} {...vehicle} />)}
    </div>
  );
}
```

### Form with Full UX
```tsx
function EditVehicleForm({ vehicleId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);

  const { values, errors, touched, handleChange, handleBlur, validateAll } =
    useFormValidation(initialValues, validationRules);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    setLoading(true);
    setError(null);

    try {
      await updateVehicle(vehicleId, values);
      addToast('Vehicle updated successfully!', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Breadcrumb items={breadcrumbItems} />

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit}>
        {/* Form fields with validation */}

        <button type="submit" disabled={loading}>
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </form>

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {loading && <LoadingOverlay message="Updating vehicle..." />}
    </>
  );
}
```

---

## Styling Notes

All components use Tailwind CSS classes for styling. Key design decisions:

- **Colors**: Blue for primary actions, red for errors, green for success
- **Spacing**: Consistent spacing using Tailwind's spacing scale
- **Typography**: Clear hierarchy with appropriate font sizes
- **Transitions**: Smooth animations for better UX (pulse, spin, slide)
- **Responsive**: Mobile-first design with responsive breakpoints

---

## Future Enhancements

Potential improvements for future iterations:

1. **Toast Queue Management**: Advanced toast stacking and priority
2. **Loading Progress**: Progress bars for long operations
3. **Skeleton Variants**: More skeleton loader patterns (cards, grids)
4. **Error Recovery**: Advanced retry strategies and error boundaries
5. **Animation Library**: Custom animation utilities for transitions
6. **Dark Mode Support**: Theme variants for all components
7. **Internationalization**: Multi-language support for messages

---

## Testing Recommendations

When testing these components:

1. **Accessibility Testing**: Use tools like axe or WAVE
2. **Keyboard Navigation**: Test all interactive elements with keyboard only
3. **Screen Reader Testing**: Verify with NVDA or JAWS
4. **Visual Regression**: Test appearance across browsers
5. **Error States**: Test all error scenarios
6. **Loading States**: Test with slow network conditions
7. **Form Validation**: Test all validation rules and edge cases

---

## Support

For questions or issues with these components:
- Check the example implementations in `/home/user/Fleet/src/components/examples/`
- Review existing usage in the codebase
- Refer to React and TypeScript documentation for patterns

---

**Last Updated:** 2025-11-19
**Version:** 1.0.0
