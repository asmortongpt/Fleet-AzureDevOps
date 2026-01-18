# Toast Import Standardization

## Standard Import Pattern

All files using toast notifications should follow this standardized import pattern:

```typescript
import { toast } from 'sonner'
```

## Usage Examples

### Basic Notifications

```typescript
// Success
toast.success('Operation completed successfully')

// Error
toast.error('An error occurred')

// Info
toast.info('Please note this information')

// Warning
toast.warning('This action cannot be undone')

// Loading
toast.loading('Processing...')
```

### With Options

```typescript
toast.success('File uploaded', {
  description: 'Your file has been uploaded successfully',
  duration: 5000,
})

toast.error('Upload failed', {
  description: error.message,
  action: {
    label: 'Retry',
    onClick: () => handleRetry(),
  },
})
```

### Promise-based Operations

```typescript
toast.promise(uploadFile(file), {
  loading: 'Uploading file...',
  success: 'File uploaded successfully',
  error: 'Failed to upload file',
})
```

## Migration Guide

### From react-hot-toast

Replace:
```typescript
import toast from 'react-hot-toast'
```

With:
```typescript
import { toast } from 'sonner'
```

### From custom toast implementations

Replace any custom toast implementations with the standardized sonner import.

## Best Practices

1. **Import at the top**: Always import toast at the beginning of the file with other imports
2. **Consistent naming**: Always use `toast` as the imported name
3. **Type safety**: The sonner library provides built-in TypeScript support
4. **Error handling**: Always provide meaningful error messages in toast notifications

## Common Patterns

### Form Submissions

```typescript
import { toast } from 'sonner'

async function handleSubmit(data: FormData) {
  try {
    await submitForm(data)
    toast.success('Form submitted successfully')
  } catch (error) {
    toast.error('Failed to submit form')
  }
}
```

### API Calls

```typescript
import { toast } from 'sonner'

async function fetchData() {
  const promise = api.getData()
  
  toast.promise(promise, {
    loading: 'Loading data...',
    success: 'Data loaded',
    error: 'Failed to load data',
  })
  
  return promise
}
```

### File Operations

```typescript
import { toast } from 'sonner'

function handleFileUpload(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    toast.error('File too large', {
      description: `Maximum file size is ${MAX_FILE_SIZE_MB}MB`,
    })
    return
  }
  
  // Proceed with upload
  toast.promise(uploadFile(file), {
    loading: `Uploading ${file.name}...`,
    success: `${file.name} uploaded successfully`,
    error: `Failed to upload ${file.name}`,
  })
}
```

## Configuration

The toast provider is configured in the root layout. Individual components should not need to configure toast settings.

## Do's and Don'ts

### Do's
- ✅ Use descriptive messages
- ✅ Include error details when helpful
- ✅ Use appropriate toast types (success, error, info, warning)
- ✅ Keep messages concise
- ✅ Use promise-based toasts for async operations

### Don'ts
- ❌ Don't import from 'react-hot-toast'
- ❌ Don't create custom toast implementations
- ❌ Don't show multiple toasts for the same action
- ❌ Don't use generic error messages like "Error occurred"
- ❌ Don't forget to handle loading states