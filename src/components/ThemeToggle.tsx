import { Moon, Sun } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { useThemeContext } from "@/components/providers/ThemeProvider"

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
      title={resolvedTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {resolvedTheme === 'light' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </Button>
  )
}
