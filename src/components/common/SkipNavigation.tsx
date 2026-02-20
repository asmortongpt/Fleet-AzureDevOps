/**
 * Skip Navigation Component
 * WCAG AAA Requirement: Allow keyboard users to skip repetitive content
 */

import { skipLinks } from '@/lib/accessibility';

export function SkipNavigation() {
  return (
    <div className="skip-navigation">
      {skipLinks.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className="skip-link"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
