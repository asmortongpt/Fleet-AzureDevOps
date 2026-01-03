# Internationalization (i18n) Guide

## Overview

Fleet Management System supports 6 languages with full RTL (Right-to-Left) support for Arabic and Hebrew.

## Supported Languages

| Language | Code | Direction | Native Name |
|----------|------|-----------|-------------|
| English (US) | en-US | LTR | English |
| Spanish | es-ES | LTR | Español |
| French | fr-FR | LTR | Français |
| German | de-DE | LTR | Deutsch |
| Arabic | ar-SA | RTL | العربية |
| Hebrew | he-IL | RTL | עברית |

## Quick Start

### 1. Using Translations in Components

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.welcome')}</p>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

### 2. Using the Language Switcher

```tsx
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

function Header() {
  return (
    <header>
      <LanguageSwitcher variant="outline" size="sm" showLabel />
    </header>
  );
}
```

### 3. Using Formatters

```tsx
import { useFormatters } from '@/lib/i18n/formatters';

function VehicleCard({ vehicle }) {
  const { formatDate, formatCurrency, formatDistance } = useFormatters();

  return (
    <div>
      <p>Purchase Date: {formatDate(vehicle.purchaseDate, 'long')}</p>
      <p>Price: {formatCurrency(vehicle.price, 'USD')}</p>
      <p>Mileage: {formatDistance(vehicle.mileage)}</p>
    </div>
  );
}
```

## Translation Structure

Translation files are located in `src/i18n/locales/` and organized by namespace:

- `common` - Common UI elements (buttons, actions)
- `navigation` - Navigation menu items
- `dashboard` - Dashboard-specific text
- `vehicles` - Vehicle management
- `drivers` - Driver management
- `maintenance` - Maintenance tracking
- `fuel` - Fuel tracking
- `reports` - Reports
- `settings` - Settings
- `validation` - Form validation messages
- `errors` - Error messages
- `success` - Success messages
- `analytics` - Analytics dashboard
- `auth` - Authentication

## Adding New Translations

1. Add the key in `src/i18n/locales/en-US.json`:
```json
{
  "vehicles": {
    "addVehicle": "Add Vehicle",
    "newKey": "New Translation Text"
  }
}
```

2. Add the same key in all other language files

3. Use in your component:
```tsx
const { t } = useTranslation();
<button>{t('vehicles.newKey')}</button>
```

## Interpolation

```tsx
// In translation file
{
  "validation": {
    "minLength": "Must be at least {{min}} characters"
  }
}

// In component
t('validation.minLength', { min: 8 })
// Output: "Must be at least 8 characters"
```

## Formatters

### Date Formatting
```tsx
const { formatDate } = useFormatters();

formatDate(new Date(), 'short');  // 12/31/2025
formatDate(new Date(), 'long');   // December 31, 2025
formatDate(new Date(), 'full');   // Monday, December 31, 2025
```

### Currency Formatting
```tsx
const { formatCurrency } = useFormatters();

formatCurrency(1234.56, 'USD');  // $1,234.56
formatCurrency(1234.56, 'EUR');  // €1,234.56
```

### Number Formatting
```tsx
const { formatNumber } = useFormatters();

formatNumber(1234.567, 2);  // 1,234.57
```

### Distance Formatting
```tsx
const { formatDistance } = useFormatters();

formatDistance(5000);  // 3.1 mi (en-US) or 5.0 km (other locales)
```

### Relative Time
```tsx
const { formatRelativeTime } = useFormatters();

formatRelativeTime(new Date());  // "just now"
formatRelativeTime(pastDate);    // "2 hours ago"
formatRelativeTime(futureDate);  // "in 3 days"
```

## RTL Support

Arabic and Hebrew automatically switch to RTL mode. CSS classes are automatically adjusted.

### RTL-Specific Utilities

```tsx
// Hide content in RTL mode
<div className="ltr-only">Only visible in LTR</div>

// Show content only in RTL mode
<div className="rtl-only">Only visible in RTL</div>

// Force LTR (useful for numbers, code)
<code className="force-ltr">const x = 123;</code>
```

## Best Practices

1. **Always use translation keys** - Never hardcode text
2. **Use appropriate namespaces** - Keep translations organized
3. **Provide context in keys** - `button.save` is better than `save`
4. **Use interpolation** - For dynamic content
5. **Test with long strings** - German text is ~30% longer than English
6. **Test RTL layouts** - Ensure UI works in Arabic/Hebrew
7. **Use formatters** - For dates, numbers, currency

## Testing

```bash
# Switch language programmatically
import i18n from '@/i18n/config';
i18n.changeLanguage('es-ES');

# Check current language
console.log(i18n.language);

# Get all supported languages
import { languages } from '@/i18n/config';
console.log(Object.keys(languages));
```

## Troubleshooting

### Translation not appearing
- Check if key exists in all language files
- Verify namespace is correct
- Ensure i18n is initialized in main.tsx

### RTL not working
- Check if document.dir is being set
- Verify CSS RTL overrides are loaded
- Ensure language code matches ('ar-SA' not 'ar')

### Formatting issues
- Verify locale code format (en-US, not en_US)
- Check if Intl API is supported
- Use fallback formatters if needed

## Environment Variables

Add to `.env`:
```bash
VITE_DEFAULT_LANGUAGE=en-US
VITE_FALLBACK_LANGUAGE=en-US
```

## Resources

- [i18next Documentation](https://www.i18next.com/)
- [React i18next Documentation](https://react.i18next.com/)
- [MDN Intl API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
