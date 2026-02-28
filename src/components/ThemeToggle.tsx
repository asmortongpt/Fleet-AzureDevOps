import { Moon, Sun, MonitorPlay } from "lucide-react"
import * as React from "react"

import { useThemeContext } from "@/components/providers/ThemeProvider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * ThemeToggle Component
 *
 * Provides theme switching with three modes:
 * - Light: Force light mode
 * - Dark: Force dark mode
 * - System: Follow OS/browser preference
 *
 * Theme preference is persisted to localStorage and respects
 * system media query changes when in system mode.
 *
 * WCAG AAA Compliant color contrast ratios in both light and dark modes.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme, theme } = useThemeContext()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9"
          aria-label="Toggle theme menu"
          title="Open theme menu"
        >
          {resolvedTheme === "light" ? (
            <Sun className="h-4 w-4 text-amber-500" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4 text-emerald-300" aria-hidden="true" />
          )}
          <span className="sr-only">Toggle theme menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuCheckboxItem
          checked={theme === "light"}
          onCheckedChange={() => setTheme("light")}
          className="cursor-pointer gap-2"
        >
          <Sun className="h-4 w-4 text-amber-500" />
          <span>Light</span>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={theme === "dark"}
          onCheckedChange={() => setTheme("dark")}
          className="cursor-pointer gap-2"
        >
          <Moon className="h-4 w-4 text-emerald-300" />
          <span>Dark</span>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={theme === "system"}
          onCheckedChange={() => setTheme("system")}
          className="cursor-pointer gap-2"
        >
          <MonitorPlay className="h-4 w-4 text-[var(--text-tertiary)]" />
          <span>System</span>
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
