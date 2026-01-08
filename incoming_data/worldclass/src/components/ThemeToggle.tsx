import { Moon, Sun } from "@phosphor-icons/react"

import { useThemeContext } from "@/components/providers/ThemeProvider"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme, theme } = useThemeContext()

  const toggleTheme = () => {
    // If currently system, switch to explicit light/dark based on resolved
    // Otherwise toggle between light and dark
    if (theme === 'system') {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    } else {
      setTheme(theme === 'light' ? 'dark' : 'light')
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={resolvedTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      title={resolvedTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {resolvedTheme === 'light' ? (
        <Moon className="w-5 h-5" aria-hidden="true" />
      ) : (
        <Sun className="w-5 h-5" aria-hidden="true" />
      )}
    </Button>
  )
}
