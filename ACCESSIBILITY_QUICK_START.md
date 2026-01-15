# Accessibility Quick Start Guide

**Fleet Management System - Globalization & Accessibility Feature**

## Quick Reference

This guide provides a quick overview of the accessibility features and how to use them.

---

## For Developers

### Running Accessibility Tests

```bash
# Run all accessibility tests
npm run test:a11y

# Watch mode for development
npm run test:a11y:watch

# Run all tests including accessibility
npm test

# Generate coverage report
npm run test:coverage
```

### Using Accessibility Hooks

```typescript
import {
  useFocusTrap,
  useKeyboardNavigation,
  useAriaAnnouncer,
  useAccessibility
} from '@/lib/accessibility/hooks';

// Focus trap for modals
const modalRef = useFocusTrap<HTMLDivElement>(isOpen);

// Keyboard navigation for lists
const { currentIndex, handleKeyDown } = useKeyboardNavigation(items.length, {
  orientation: 'vertical',
  loop: true,
  onSelect: (index) => handleItemSelect(items[index])
});

// Screen reader announcements
const announce = useAriaAnnouncer();
announce('Vehicle saved successfully');

// Full accessibility context
const { announce, prefersReducedMotion } = useAccessibility();
```

### Adding Translations

1. Add your key to all language files:
   - `/src/i18n/locales/en-US.json`
   - `/src/i18n/locales/es-ES.json`
   - `/src/i18n/locales/fr-FR.json`
   - `/src/i18n/locales/de-DE.json`
   - `/src/i18n/locales/ar-SA.json`
   - `/src/i18n/locales/he-IL.json`

2. Use in your component:

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return <h1>{t('dashboard.title')}</h1>;
}
```

### RTL Support

RTL styles are automatically applied when language is set to Arabic or Hebrew:

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { i18n } = useTranslation();

  // Change language (RTL applied automatically)
  i18n.changeLanguage('ar-SA'); // Arabic
  i18n.changeLanguage('he-IL'); // Hebrew
}
```

### Accessibility Checklist

When creating new components:

- [ ] Add proper ARIA labels to interactive elements
- [ ] Ensure keyboard navigation works (Tab, Enter, Escape, Arrows)
- [ ] Provide alt text for images
- [ ] Use semantic HTML (header, nav, main, footer, etc.)
- [ ] Maintain proper heading hierarchy (h1 → h2 → h3)
- [ ] Ensure color contrast meets WCAG 2.1 AA (4.5:1 for text)
- [ ] Test with screen reader
- [ ] Add focus indicators for keyboard users
- [ ] Provide error messages for form validation
- [ ] Use live regions for dynamic content updates
- [ ] Test in RTL mode (Arabic/Hebrew)

---

## For Users

### Keyboard Navigation

| Action | Key |
|--------|-----|
| Navigate forward | Tab |
| Navigate backward | Shift + Tab |
| Activate button/link | Enter or Space |
| Navigate lists | Arrow keys |
| Close modal | Escape |
| Jump to start | Home |
| Jump to end | End |
| Skip to main content | Tab to skip link, then Enter |

### Screen Reader Support

The Fleet Management System is compatible with:
- **Windows:** NVDA, JAWS, Narrator
- **macOS/iOS:** VoiceOver
- **Android:** TalkBack

### Changing Language

1. Click on your profile icon
2. Select "Settings"
3. Choose "Language" from the menu
4. Select your preferred language:
   - English (US)
   - Spanish (Spain)
   - French (France)
   - German (Germany)
   - Arabic (Saudi Arabia)
   - Hebrew (Israel)

### Accessibility Features

- **Skip Links:** Press Tab on any page to access skip navigation
- **Focus Indicators:** Keyboard navigation highlights interactive elements
- **High Contrast:** System high contrast mode is respected
- **Reduced Motion:** System motion preferences are respected
- **Text Resize:** Text can be resized up to 200% without breaking layout
- **Screen Reader Friendly:** All content is accessible via screen reader
- **Touch Targets:** All buttons are at least 44x44 pixels

### Reporting Accessibility Issues

If you encounter an accessibility barrier:

1. Email: accessibility@fleetmanagement.com
2. Include:
   - What you were trying to do
   - What happened instead
   - Your assistive technology (if applicable)
   - Browser and operating system

---

## For QA Testers

### Manual Testing Checklist

#### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Verify focus order is logical
- [ ] Test arrow key navigation in lists/menus
- [ ] Ensure no keyboard traps
- [ ] Verify skip links work

#### Screen Reader
- [ ] All images have alt text
- [ ] Form labels are properly associated
- [ ] Error messages are announced
- [ ] Dynamic content updates are announced
- [ ] Headings create a logical outline

#### Visual
- [ ] Focus indicators are visible
- [ ] Color contrast is sufficient
- [ ] Text is readable at 200% zoom
- [ ] Layout doesn't break on small screens
- [ ] RTL languages display correctly

#### Forms
- [ ] All inputs have labels
- [ ] Error messages are clear and specific
- [ ] Required fields are indicated
- [ ] Validation errors are announced
- [ ] Success messages are announced

### Automated Testing

```bash
# Run accessibility test suite
npm run test:a11y

# Expected result: All tests pass (0 violations)
```

### Browser Testing

Test in these browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Assistive Technology Testing

Test with at least one of:
- NVDA (Windows - free)
- VoiceOver (macOS - built-in)
- JAWS (Windows - commercial)

---

## Supported Languages

| Language | Code | Direction | Status |
|----------|------|-----------|--------|
| English (US) | en-US | LTR | ✅ Complete |
| Spanish (Spain) | es-ES | LTR | ✅ Complete |
| French (France) | fr-FR | LTR | ✅ Complete |
| German (Germany) | de-DE | LTR | ✅ Complete |
| Arabic (Saudi Arabia) | ar-SA | RTL | ✅ Complete |
| Hebrew (Israel) | he-IL | RTL | ✅ Complete |

---

## File Structure

```
src/
├── i18n/
│   ├── config.ts                    # i18next configuration
│   └── locales/
│       ├── en-US.json               # English translations
│       ├── es-ES.json               # Spanish translations
│       ├── fr-FR.json               # French translations
│       ├── de-DE.json               # German translations
│       ├── ar-SA.json               # Arabic translations
│       └── he-IL.json               # Hebrew translations
├── lib/
│   └── accessibility/
│       └── hooks.ts                 # Custom accessibility hooks
├── styles/
│   ├── accessibility.css            # WCAG 2.1 AA styles
│   └── rtl.css                      # RTL language support
└── tests/
    ├── setup.ts                     # Test configuration
    └── accessibility.test.tsx       # Accessibility test suite
```

---

## Resources

### Documentation
- [WCAG 2.1 AA Compliance Report](./WCAG_2.1_AA_COMPLIANCE.md)
- [i18next Documentation](https://www.i18next.com/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)

### Tools
- [Chrome DevTools Accessibility](https://developer.chrome.com/docs/devtools/accessibility/reference/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)

### Testing
- [NVDA Screen Reader](https://www.nvaccess.org/) (Free)
- [axe DevTools Browser Extension](https://www.deque.com/axe/devtools/)

---

## Support

For questions or issues:
- Email: accessibility@fleetmanagement.com
- Documentation: See WCAG_2.1_AA_COMPLIANCE.md
- Issue Tracker: GitHub Issues

---

**Last Updated:** January 12, 2026
