import { Globe, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { languages, type LanguageCode } from '@/i18n/config';
import { cn } from '@/lib/utils';
import logger from '@/utils/logger';

interface LanguageSwitcherProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  className?: string;
}

/**
 * LanguageSwitcher Component
 *
 * Provides a dropdown menu for switching between supported languages.
 * Automatically handles RTL/LTR direction changes and persists language preference.
 *
 * Features:
 * - 6 supported languages (en-US, es-ES, fr-FR, de-DE, ar-SA, he-IL)
 * - RTL support for Arabic and Hebrew
 * - Persistent language preference in localStorage
 * - Visual indicators for current language
 * - Accessible keyboard navigation
 *
 * @example
 * ```tsx
 * <LanguageSwitcher variant="outline" size="sm" showLabel />
 * ```
 */
export function LanguageSwitcher({
  variant = 'outline',
  size = 'sm',
  showLabel = true,
  className,
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState<LanguageCode>(
    (i18n.language as LanguageCode) || 'en-US'
  );
  const [isChanging, setIsChanging] = useState(false);

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setCurrentLang(lng as LanguageCode);
    };

    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  const changeLanguage = async (lng: LanguageCode) => {
    if (lng === currentLang || isChanging) return;

    setIsChanging(true);

    try {
      // Change language
      await i18n.changeLanguage(lng);

      // Get language config
      const language = languages[lng];

      // Update document direction for RTL languages
      document.dir = language.dir;

      // Update HTML lang attribute
      document.documentElement.lang = lng;

      // Update data attribute for CSS targeting
      document.documentElement.setAttribute('data-lang', lng);
      document.documentElement.setAttribute('data-dir', language.dir);

      // Store preference in localStorage
      localStorage.setItem('preferred-language', lng);

      // Update state
      setCurrentLang(lng);

      // Trigger page reload for full RTL/LTR transition (optional)
      // Uncomment if you need a full page reload for complex layouts
      // window.location.reload();
    } catch (error) {
      logger.error('Failed to change language:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const currentLanguage = languages[currentLang];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn('gap-2', className)}
          disabled={isChanging}
          aria-label={`Change language. Current language: ${currentLanguage?.nativeName || 'Language'}`}
          aria-haspopup="menu"
          aria-expanded={false}
        >
          <Globe className="h-4 w-4" aria-hidden="true" />
          {showLabel && (
            <span className="hidden sm:inline-block">
              {currentLanguage?.nativeName || 'Language'}
            </span>
          )}
          {showLabel && (
            <span className="sm:hidden" aria-hidden="true">{currentLanguage?.flag}</span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56" role="menu" aria-label="Language selection menu">
        <DropdownMenuLabel className="text-xs text-muted-foreground" id="language-menu-label">
          Select Language
        </DropdownMenuLabel>
        <DropdownMenuSeparator role="separator" />

        {Object.entries(languages).map(([code, lang]) => {
          const isActive = currentLang === code;
          const isRTL = lang.dir === 'rtl';

          return (
            <DropdownMenuItem
              key={code}
              onClick={() => changeLanguage(code as LanguageCode)}
              className={cn(
                'cursor-pointer gap-2',
                isActive && 'bg-accent',
                isRTL && 'flex-row-reverse justify-end'
              )}
              disabled={isChanging}
              role="menuitemradio"
              aria-checked={isActive}
              aria-label={`${lang.nativeName} (${lang.name})${isActive ? ' - Currently selected' : ''}`}
            >
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm" role="img" aria-label={`${lang.name} flag`}>{lang.flag}</span>
                <div className={cn('flex flex-col', isRTL && 'items-end')}>
                  <span className="font-medium">{lang.nativeName}</span>
                  <span className="text-xs text-muted-foreground">
                    {lang.name}
                  </span>
                </div>
              </div>
              {isActive && (
                <Check className="h-4 w-4 text-primary" aria-hidden="true" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Compact Language Switcher
 * A minimal version showing only the flag
 */
export function LanguageSwitcherCompact({ className }: { className?: string }) {
  return (
    <LanguageSwitcher
      variant="ghost"
      size="icon"
      showLabel={false}
      className={className}
    />
  );
}

/**
 * Language Switcher with Full Label
 * Shows both native name and English name
 */
export function LanguageSwitcherFull({ className }: { className?: string }) {
  return (
    <LanguageSwitcher
      variant="outline"
      size="default"
      showLabel={true}
      className={className}
    />
  );
}
