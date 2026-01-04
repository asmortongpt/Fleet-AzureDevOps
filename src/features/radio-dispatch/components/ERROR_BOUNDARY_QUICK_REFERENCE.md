# Error Boundary Quick Reference

## 🚀 Quick Start

The ErrorBoundary is **already configured globally** in `app/providers.tsx`. No additional setup needed!

## 📦 What's Included

```
components/
├── ErrorBoundary.tsx          # Main boundary component
├── ErrorFallback.tsx          # Default fallback UI
├── ErrorBoundary.md           # Full documentation
└── __tests__/
    └── ErrorBoundary.test.tsx # Test suite
```

## 🎯 Common Use Cases

### 1. Wrap Specific Components

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary>
  <RiskyComponent />
</ErrorBoundary>
```

### 2. Custom Error Callback

```tsx
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Send to error tracking
    logErrorToService(error, errorInfo);
  }}
>
  <YourComponent />
</ErrorBoundary>
```

### 3. Custom Fallback UI

```tsx
<ErrorBoundary fallback={<div>Custom error message</div>}>
  <YourComponent />
</ErrorBoundary>
```

### 4. Route-Level Error (Next.js)

Create `app/(dashboard)/your-route/error.tsx`:

```tsx
'use client';

import { ErrorFallback } from '@/components/ErrorFallback';

export default function RouteError({ error, reset }) {
  return <ErrorFallback error={error} onReset={reset} />;
}
```

## ⚠️ What Error Boundaries DON'T Catch

### Event Handlers - Use try-catch

```tsx
// ❌ NOT caught by error boundary
<button onClick={() => { throw new Error('Boom!'); }}>

// ✅ Use try-catch
<button onClick={() => {
  try {
    riskyOperation();
  } catch (error) {
    console.error('Error:', error);
  }
}}>
```

### Async Code - Use try-catch

```tsx
// ❌ NOT caught by error boundary
async function fetchData() {
  const data = await api.get('/data'); // Might throw
}

// ✅ Use try-catch
async function fetchData() {
  try {
    const data = await api.get('/data');
  } catch (error) {
    console.error('Fetch error:', error);
  }
}
```

## 🧪 Testing

### Test Page
Visit: `http://localhost:3000/error-test`

**⚠️ Remove this page in production!**

### Run Tests
```bash
npm run test ErrorBoundary
```

## 🎨 UI Features

### Development Mode
- ✅ Full error message
- ✅ Component stack trace
- ✅ Error stack trace
- ✅ Expandable technical details

### Production Mode
- ✅ User-friendly message
- ✅ Recovery buttons
- ❌ No stack traces (security)

## 🔧 Integration with Error Tracking

### Example: Sentry

```tsx
// app/providers.tsx
import * as Sentry from '@sentry/nextjs';

<ErrorBoundary
  onError={(error, errorInfo) => {
    Sentry.captureException(error, {
      contexts: { react: errorInfo }
    });
  }}
>
```

### Example: Azure Application Insights

```tsx
import { ApplicationInsights } from '@azure/applicationinsights-web';

const appInsights = new ApplicationInsights({
  config: {
    connectionString: process.env.NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING
  }
});

<ErrorBoundary
  onError={(error, errorInfo) => {
    appInsights.trackException({
      exception: error,
      properties: { componentStack: errorInfo.componentStack }
    });
  }}
>
```

## 📚 Props Reference

### ErrorBoundary Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | `ReactNode` | ✅ | Components to protect |
| `fallback` | `ReactNode` | ❌ | Custom fallback UI |
| `onError` | `(error, errorInfo) => void` | ❌ | Error callback |

### ErrorFallback Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `error` | `Error \| null` | ✅ | The error object |
| `errorInfo` | `ErrorInfo \| null` | ✅ | React error info |
| `onReset` | `() => void` | ❌ | Reset callback |

## 💡 Best Practices

1. ✅ **Use sparingly** - Place at strategic points (route level, major sections)
2. ✅ **Add context** - Use `onError` to add debugging context
3. ✅ **User-friendly messages** - Keep error messages simple
4. ✅ **Test recovery** - Ensure reload/navigation works
5. ✅ **Monitor production** - Integrate with error tracking
6. ❌ **Don't wrap everything** - Only critical sections need boundaries

## 🔍 Debugging

### Error Not Caught?

Check if error is:
- In event handler → Use try-catch
- In async code → Use try-catch
- In error boundary itself → Move boundary up

### Fallback Not Showing?

1. Check console for errors
2. Verify `hasError` state is true
3. Check CSS isn't hiding fallback
4. Ensure error occurs in child component

### Stack Trace Not Showing?

1. Confirm `NODE_ENV === 'development'`
2. Check browser dev tools are open
3. Verify error has `.stack` property

## 📞 Support

- 📧 Email: support@capitaltechalliance.com
- 📖 Full docs: `components/ErrorBoundary.md`
- 🔗 React docs: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary

---

**Last Updated:** November 25, 2025
