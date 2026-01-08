/**
 * Dark Mode Toggle Component
 * Toggles between light and dark theme
 */

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Theme = 'light' | 'dark' | 'system'

export function DarkModeToggle() {
    const [theme, setTheme] = useState<Theme>('dark')

    useEffect(() => {
        // Check for saved preference or system preference
        const savedTheme = localStorage.getItem('theme') as Theme | null
        if (savedTheme) {
            setTheme(savedTheme)
            applyTheme(savedTheme)
        } else {
            // Default to dark mode for this application
            setTheme('dark')
            applyTheme('dark')
        }
    }, [])

    const applyTheme = (newTheme: Theme) => {
        const root = document.documentElement

        if (newTheme === 'system') {
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            root.classList.toggle('dark', systemDark)
            root.classList.toggle('light', !systemDark)
        } else {
            root.classList.toggle('dark', newTheme === 'dark')
            root.classList.toggle('light', newTheme === 'light')
        }
    }

    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
        applyTheme(newTheme)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-slate-400 hover:text-white hover:bg-white/5 rounded-full"
                    aria-label="Toggle theme"
                >
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-white/10">
                <DropdownMenuItem
                    onClick={() => handleThemeChange('light')}
                    className="focus:bg-white/10 cursor-pointer"
                >
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleThemeChange('dark')}
                    className="focus:bg-white/10 cursor-pointer"
                >
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleThemeChange('system')}
                    className="focus:bg-white/10 cursor-pointer"
                >
                    <span className="mr-2">💻</span>
                    <span>System</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
