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

// Add to global CSS:
/*
.skip-navigation {
  position: relative;
}

.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px 16px;
  text-decoration: none;
  border-radius: 0 0 4px 0;
  z-index: 100;
  transition: top 0.2s;
}

.skip-link:focus {
  top: 0;
}
*/
