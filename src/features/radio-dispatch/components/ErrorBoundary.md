# ErrorBoundary Component

A production-ready React Error Boundary component for catching and handling errors in the component tree.

## Features

- ✅ Catches all React component errors
- ✅ Shows friendly error UI (prevents white screen of death)
- ✅ Logs errors to console in development
- ✅ Provides "Reload Page" and "Go to Home" buttons
- ✅ Includes detailed error information in development mode only
- ✅ Styled with Tailwind CSS matching app design system
- ✅ TypeScript typed with React 18 best practices
- ✅ Expandable technical details for debugging
- ✅ Custom error callback support
- ✅ Custom fallback component support

## Usage

### Global Error Boundary (Already Configured)

The ErrorBoundary is already wrapped around the entire application in `app/providers.tsx`:

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary onError={handleError}>
      <SessionProvider>
        {/* rest of app */}
      </SessionProvider>
    </ErrorBoundary>
  );
}
```

### Custom Error Boundaries

You can also wrap specific parts of your application with additional Error Boundaries:

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function MyComponent() {
  return (
    <ErrorBoundary>
      <SomeComponentThatMightError />
    </ErrorBoundary>
  );
}
```

### With Error Callback

```tsx
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Send to error tracking service
    console.error('Caught error:', error);
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }}
>
  <YourComponent />
</ErrorBoundary>
```

### With Custom Fallback

```tsx
<ErrorBoundary
  fallback={
    <div className="p-4">
      <h1>Custom error message</h1>
      <button onClick={() => window.location.reload()}>Try Again</button>
    </div>
  }
>
  <YourComponent />
</ErrorBoundary>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | The component tree to protect |
| `fallback` | `ReactNode` | Custom fallback UI (optional) |
| `onError` | `(error: Error, errorInfo: ErrorInfo) => void` | Callback when error occurs (optional) |

## Error Fallback UI

The default fallback component (`ErrorFallback.tsx`) includes:

1. **User-Friendly Message**: Clear explanation without technical jargon
2. **Error Details**: Shows error message in a formatted box
3. **Technical Details** (dev only): Expandable section with:
   - Component stack trace
   - Full error stack trace
4. **Suggestions**: Helpful tips for users
5. **Action Buttons**:
   - **Reload Page**: Refreshes the page to try again
   - **Go to Home**: Navigates to the home page
6. **Support Contact**: Email link for persistent issues

### Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| Error message | ✅ Shown | ✅ Shown |
| Technical details | ✅ Expandable | ❌ Hidden |
| Component stack | ✅ Shown | ❌ Hidden |
| Stack trace | ✅ Shown | ❌ Hidden |
| Console logging | ✅ Detailed | ⚠️ Minimal |

## Testing

Run the tests:

```bash
cd frontend
npm run test ErrorBoundary
```

The test suite includes:
- ✅ Normal rendering (no errors)
- ✅ Error catching and fallback display
- ✅ Error callback invocation
- ✅ Custom fallback rendering
- ✅ Reset functionality
- ✅ Technical details toggle
- ✅ Button interactions

## Error Recovery Strategies

### 1. Reload Page
The most common recovery method. Reloads the entire page to reset state:

```tsx
const handleReload = () => {
  window.location.reload();
};
```

### 2. Reset State
If you want to try recovering without a full reload:

```tsx
<ErrorBoundary
  onError={(error) => {
    // Reset error state
    this.setState({ hasError: false });
  }}
>
  <YourComponent />
</ErrorBoundary>
```

### 3. Navigate Away
Redirect to a safe page (like home):

```tsx
const handleGoHome = () => {
  window.location.href = '/';
};
```

## Integration with Error Tracking Services

### Sentry Example

```tsx
import * as Sentry from '@sentry/nextjs';

<ErrorBoundary
  onError={(error, errorInfo) => {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }}
>
  <YourComponent />
</ErrorBoundary>
```

### Azure Application Insights Example

```tsx
import { ApplicationInsights } from '@azure/applicationinsights-web';

const appInsights = new ApplicationInsights({
  config: {
    connectionString: process.env.NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING,
  },
});

<ErrorBoundary
  onError={(error, errorInfo) => {
    appInsights.trackException({
      exception: error,
      properties: {
        componentStack: errorInfo.componentStack,
      },
    });
  }}
>
  <YourComponent />
</ErrorBoundary>
```

## Best Practices

1. **Don't Overuse**: Place Error Boundaries at strategic points (route level, major sections)
2. **Provide Context**: Use `onError` to add context before logging
3. **User-Friendly Messages**: Keep error messages simple for end users
4. **Test Recovery**: Ensure recovery actions (reload, navigate) work correctly
5. **Monitor in Production**: Integrate with error tracking services
6. **Graceful Degradation**: Show partial UI when possible instead of complete failure

## What Error Boundaries Don't Catch

Error boundaries do **NOT** catch errors in:

- Event handlers (use try-catch)
- Asynchronous code (setTimeout, promises)
- Server-side rendering
- Errors thrown in the error boundary itself

For these cases, use regular error handling:

```tsx
// Event handler
const handleClick = () => {
  try {
    riskyOperation();
  } catch (error) {
    console.error('Button click error:', error);
  }
};

// Async code
async function fetchData() {
  try {
    const data = await api.getData();
  } catch (error) {
    console.error('Fetch error:', error);
  }
}
```

## Styling

The ErrorFallback component uses Tailwind CSS with design tokens from `globals.css`:

- **Colors**: `bg-background`, `text-foreground`, `bg-destructive`, etc.
- **Layout**: Responsive with `sm:` breakpoints
- **Typography**: Consistent with app font sizes and weights
- **Spacing**: Uses standard Tailwind spacing scale
- **Animations**: Smooth transitions with `transition-colors`

## Accessibility

- ✅ Semantic HTML structure
- ✅ Proper heading hierarchy (h1, h2, h3)
- ✅ Focus management on buttons
- ✅ Screen reader friendly error messages
- ✅ Keyboard navigation support

## Troubleshooting

### Error Boundary Not Catching Errors

1. Make sure the error occurs in a **child component** (not the boundary itself)
2. Check if error is in an **event handler** (use try-catch instead)
3. Verify error occurs during **render phase** (not async)

### Fallback UI Not Displaying

1. Check browser console for errors
2. Verify `hasError` state is being set
3. Ensure no CSS hiding the fallback

### Technical Details Not Showing

1. Confirm `NODE_ENV === 'development'`
2. Check that `errorInfo` is being passed to ErrorFallback

## Related Files

- `components/ErrorBoundary.tsx` - Main Error Boundary class component
- `components/ErrorFallback.tsx` - Fallback UI component
- `components/__tests__/ErrorBoundary.test.tsx` - Test suite
- `app/providers.tsx` - Global ErrorBoundary implementation

## References

- [React Error Boundaries Documentation](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Error Handling in React 18](https://react.dev/learn/error-boundaries)
- [TypeScript and React Best Practices](https://react-typescript-cheatsheet.netlify.app/)
