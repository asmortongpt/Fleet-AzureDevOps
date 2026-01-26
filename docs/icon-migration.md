# Icon Migration Guide

## Overview

This guide documents the migration from react-icons to lucide-react icons throughout the application.

## Icon Mapping

### Navigation Icons

| Old Icon (react-icons) | New Icon (lucide-react) | Usage |
|------------------------|-------------------------|--------|
| FiHome | Home | Dashboard, home navigation |
| FiUsers | Users | User management |
| FiSettings | Settings | Settings pages |
| FiLogOut | LogOut | Logout buttons |
| FiMenu | Menu | Mobile menu toggle |
| FiX | X | Close buttons, modals |
| FiChevronDown | ChevronDown | Dropdowns, accordions |
| FiChevronUp | ChevronUp | Dropdowns, accordions |
| FiChevronLeft | ChevronLeft | Back navigation |
| FiChevronRight | ChevronRight | Forward navigation |

### Action Icons

| Old Icon (react-icons) | New Icon (lucide-react) | Usage |
|------------------------|-------------------------|--------|
| FiPlus | Plus | Add buttons |
| FiEdit | Edit | Edit actions |
| FiTrash2 | Trash2 | Delete actions |
| FiSave | Save | Save buttons |
| FiSearch | Search | Search inputs |
| FiFilter | Filter | Filter controls |
| FiDownload | Download | Download actions |
| FiUpload | Upload | Upload actions |
| FiCopy | Copy | Copy to clipboard |
| FiCheck | Check | Success states |

### Status Icons

| Old Icon (react-icons) | New Icon (lucide-react) | Usage |
|------------------------|-------------------------|--------|
| FiAlertCircle | AlertCircle | Warnings, alerts |
| FiInfo | Info | Information messages |
| FiCheckCircle | CheckCircle | Success messages |
| FiXCircle | XCircle | Error messages |
| FiLoader | Loader2 | Loading states |
| FiRefreshCw | RefreshCw | Refresh actions |

### Communication Icons

| Old Icon (react-icons) | New Icon (lucide-react) | Usage |
|------------------------|-------------------------|--------|
| FiMail | Mail | Email actions |
| FiPhone | Phone | Phone numbers |
| FiMessageSquare | MessageSquare | Messages, comments |
| FiBell | Bell | Notifications |
| FiSend | Send | Send actions |

### File Icons

| Old Icon (react-icons) | New Icon (lucide-react) | Usage |
|------------------------|-------------------------|--------|
| FiFile | File | Generic files |
| FiFileText | FileText | Documents |
| FiImage | Image | Images |
| FiFolder | Folder | Directories |
| FiPaperclip | Paperclip | Attachments |

### Data Icons

| Old Icon (react-icons) | New Icon (lucide-react) | Usage |
|------------------------|-------------------------|--------|
| FiDatabase | Database | Database operations |
| FiBarChart | BarChart | Analytics |
| FiPieChart | PieChart | Statistics |
| FiTrendingUp | TrendingUp | Growth indicators |
| FiCalendar | Calendar | Date pickers |

## Migration Steps

### 1. Update Imports

Replace react-icons imports:

```typescript
// Before
import { FiHome, FiUsers, FiSettings } from 'react-icons/fi';

// After
import { Home, Users, Settings } from 'lucide-react';
```

### 2. Update Component Usage

Replace icon components:

```typescript
// Before
<FiHome className="w-5 h-5" />

// After
<Home className="w-5 h-5" />
```

### 3. Update Icon Props

Lucide-react icons support the same props as react-icons:

```typescript
<Home 
  size={20}
  color="#333"
  strokeWidth={2}
  className="icon-class"
/>
```

### 4. Animation Classes

For rotating icons (like loaders):

```typescript
// Before
<FiLoader className="animate-spin" />

// After
<Loader2 className="animate-spin" />
```

## Common Patterns

### Icon Button Component

```typescript
import { LucideIcon } from 'lucide-react';

interface IconButtonProps {
  icon: LucideIcon;
  onClick?: () => void;
  className?: string;
}

const IconButton: React.FC<IconButtonProps> = ({ 
  icon: Icon, 
  onClick, 
  className 
}) => (
  <button onClick={onClick} className={className}>
    <Icon className="w-5 h-5" />
  </button>
);
```

### Dynamic Icon Selection

```typescript
import * as Icons from 'lucide-react';

const getIcon = (name: keyof typeof Icons) => {
  return Icons[name];
};

// Usage
const HomeIcon = getIcon('Home');
<HomeIcon className="w-5 h-5" />
```

## Size Guidelines

- Small icons: `w-4 h-4` (16px)
- Default icons: `w-5 h-5` (20px)
- Medium icons: `w-6 h-6` (24px)
- Large icons: `w-8 h-8` (32px)

## Styling Best Practices

1. Use Tailwind classes for sizing: `w-5 h-5`
2. Use `stroke-current` for color inheritance
3. Apply hover states: `hover:text-primary-600`
4. Ensure proper contrast ratios for accessibility

## Testing Icon Changes

1. Verify all icons render correctly
2. Check icon sizes are consistent
3. Test interactive states (hover, focus)
4. Ensure animations work (loading spinners)
5. Validate accessibility (aria-labels where needed)

## Troubleshooting

### Icon Not Found

If an exact match doesn't exist in lucide-react:
1. Check [lucide.dev](https://lucide.dev) for alternatives
2. Use a similar icon that conveys the same meaning
3. Consider custom SVG icons for specific needs

### Size Issues

If icons appear too large/small:
1. Check the size prop or className
2. Ensure parent containers don't override sizes
3. Use consistent sizing across the application

### Color Issues

If icons don't inherit colors:
1. Add `stroke-current` class
2. Check parent text color classes
3. Use explicit color props when needed