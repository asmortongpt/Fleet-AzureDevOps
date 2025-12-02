# UX Components Quick Reference

Quick reference guide for using UX improvement components in the Fleet Management System.

## Quick Imports

```tsx
// Individual imports
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { SkeletonTable } from '@/components/SkeletonLoader';
import { ErrorMessage, FieldError } from '@/components/ErrorMessage';
import { Toast, ToastContainer } from '@/components/Toast';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useToast } from '@/hooks/useToast';

// Centralized import
import {
  LoadingSpinner,
  ErrorMessage,
  Toast
} from '@/components/ux';
```

---

## Common Patterns

### 1. Loading Data with Error Handling

```tsx
function VehicleList() {
  const { data, isLoading, error, refetch } = useQuery();

  if (isLoading) return <SkeletonTable rows={10} />;
  if (error) return (
    <ErrorMessage
      message={error.message}
      onRetry={refetch}
    />
  );

  return <div>{/* Render data */}</div>;
}
```

### 2. Form with Validation

```tsx
function VehicleForm() {
  const { values, errors, touched, handleChange, handleBlur, validateAll } =
    useFormValidation(
      { vin: '', make: '', model: '' },
      {
        vin: { required: true, minLength: 17 },
        make: { required: true },
        model: { required: true }
      }
    );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateAll()) {
      // Submit form
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
    </form>
  );
}
```

### 3. Toast Notifications

```tsx
// Option A: Local toast management
function MyComponent() {
  const { toasts, addToast, removeToast } = useToast();

  const handleSave = async () => {
    try {
      await save();
      addToast('Saved successfully!', 'success');
    } catch {
      addToast('Failed to save', 'error');
    }
  };

  return (
    <>
      <button onClick={handleSave}>Save</button>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}

// Option B: Global toast context (recommended)
import { useToastContext } from '@/contexts/ToastContext';

function MyComponent() {
  const { showSuccess, showError } = useToastContext();

  const handleSave = async () => {
    try {
      await save();
      showSuccess('Saved successfully!');
    } catch {
      showError('Failed to save');
    }
  };
}
```

### 4. Button with Loading State

```tsx
<button type="submit" disabled={isLoading}>
  {isLoading ? (
    <>
      <LoadingSpinner size="sm" className="mr-2" />
      Saving...
    </>
  ) : (
    'Save'
  )}
</button>
```

### 5. Breadcrumb Navigation

```tsx
<Breadcrumb
  items={[
    { label: 'Home', href: '/' },
    { label: 'Vehicles', href: '/vehicles' },
    { label: 'Details' }
  ]}
/>
```

---

## Validation Rules Quick Reference

```tsx
{
  // Required field
  fieldName: { required: true },

  // Length constraints
  fieldName: { minLength: 5, maxLength: 20 },

  // Email validation
  email: { email: true },

  // Pattern matching
  phone: { pattern: /^\d{3}-\d{3}-\d{4}$/ },

  // Custom validation
  age: {
    custom: (value) => {
      const age = parseInt(value);
      if (age < 18) return 'Must be 18 or older';
    }
  },

  // Multiple rules
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[A-Z])(?=.*[0-9])/
  }
}
```

---

## Component Sizes

```tsx
// LoadingSpinner
<LoadingSpinner size="sm" />  // h-4 w-4
<LoadingSpinner size="md" />  // h-8 w-8 (default)
<LoadingSpinner size="lg" />  // h-12 w-12

// Toast types
addToast('Message', 'success')  // Green
addToast('Message', 'error')    // Red
addToast('Message', 'info')     // Blue
addToast('Message', 'warning')  // Yellow
```

---

## File Locations

| Component | Path |
|-----------|------|
| LoadingSpinner | `/home/user/Fleet/src/components/LoadingSpinner.tsx` |
| LoadingOverlay | `/home/user/Fleet/src/components/LoadingOverlay.tsx` |
| SkeletonLoader | `/home/user/Fleet/src/components/SkeletonLoader.tsx` |
| ErrorMessage | `/home/user/Fleet/src/components/ErrorMessage.tsx` |
| Toast | `/home/user/Fleet/src/components/Toast.tsx` |
| Breadcrumb | `/home/user/Fleet/src/components/Breadcrumb.tsx` |
| useFormValidation | `/home/user/Fleet/src/hooks/useFormValidation.ts` |
| useToast | `/home/user/Fleet/src/hooks/useToast.ts` |
| ToastContext | `/home/user/Fleet/src/contexts/ToastContext.tsx` |

---

## Common Mistakes to Avoid

1. **Don't validate before blur**: Wait for field blur before showing errors
2. **Always use validateAll() on submit**: Don't rely on individual field validation
3. **Don't forget accessibility**: Always include ARIA labels
4. **Limit toast count**: Too many toasts overwhelm users
5. **Use appropriate loading states**: Skeleton for data, spinner for actions

---

## Setup Global Toast Provider

```tsx
// In your main App.tsx or _app.tsx
import { ToastProvider } from '@/contexts/ToastContext';

function App() {
  return (
    <ToastProvider maxToasts={5}>
      <Router>
        <YourApp />
      </Router>
    </ToastProvider>
  );
}
```

---

## Examples

Full examples available in:
- `/home/user/Fleet/src/components/examples/VehicleForm.example.tsx`
- `/home/user/Fleet/src/components/examples/CompleteUXIntegration.example.tsx`

Full documentation:
- `/home/user/Fleet/UX_COMPONENTS_GUIDE.md`

---

**Last Updated:** 2025-11-19
