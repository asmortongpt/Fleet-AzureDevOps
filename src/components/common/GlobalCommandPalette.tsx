/**
 * Global Command Palette
 * Spotlight-style command palette triggered by ⌘K (Mac) or Ctrl+K (Windows)
 */

import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Truck,
    Users,
    Wrench,
    BarChart3,
    Shield,
    AlertTriangle,
    Settings,
    Map,
    FileText,
    Search,
    Calendar,
    Bell,
    Home,
    Fuel,
    Radio
} from 'lucide-react'

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from '@/components/ui/command'

interface CommandAction {
    id: string
    label: string
    icon: React.ReactNode
    shortcut?: string
    action: () => void
    keywords?: string[]
}

export function GlobalCommandPalette() {
    const [open, setOpen] = useState(false)
    const navigate = useNavigate()

    // Handle ⌘K / Ctrl+K keyboard shortcut
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [])

    const runCommand = useCallback((command: () => void) => {
        setOpen(false)
        command()
    }, [])

    // Navigation commands
    const navigationCommands: CommandAction[] = [
        {
            id: 'home',
            label: 'Go to Dashboard',
            icon: <Home className="mr-2 h-4 w-4" />,
            shortcut: '⌘D',
            action: () => navigate('/'),
            keywords: ['home', 'dashboard', 'main'],
        },
        {
            id: 'fleet',
            label: 'Fleet Hub',
            icon: <Truck className="mr-2 h-4 w-4" />,
            shortcut: '⌘F',
            action: () => navigate('/fleet-hub-consolidated'),
            keywords: ['fleet', 'vehicles', 'cars', 'trucks'],
        },
        {
            id: 'drivers',
            label: 'Drivers Hub',
            icon: <Users className="mr-2 h-4 w-4" />,
            shortcut: '⌘R',
            action: () => navigate('/drivers-hub-consolidated'),
            keywords: ['drivers', 'team', 'staff', 'employees'],
        },
        {
            id: 'maintenance',
            label: 'Maintenance Hub',
            icon: <Wrench className="mr-2 h-4 w-4" />,
            shortcut: '⌘M',
            action: () => navigate('/maintenance-hub-consolidated'),
            keywords: ['maintenance', 'repairs', 'service', 'garage'],
        },
        {
            id: 'operations',
            label: 'Operations Hub',
            icon: <Radio className="mr-2 h-4 w-4" />,
            shortcut: '⌘O',
            action: () => navigate('/operations-hub-consolidated'),
            keywords: ['operations', 'dispatch', 'routes'],
        },
        {
            id: 'analytics',
            label: 'Analytics Hub',
            icon: <BarChart3 className="mr-2 h-4 w-4" />,
            shortcut: '⌘A',
            action: () => navigate('/analytics-hub-consolidated'),
            keywords: ['analytics', 'reports', 'metrics', 'data'],
        },
        {
            id: 'compliance',
            label: 'Compliance Hub',
            icon: <Shield className="mr-2 h-4 w-4" />,
            action: () => navigate('/compliance-hub-consolidated'),
            keywords: ['compliance', 'dot', 'regulations', 'ifta'],
        },
        {
            id: 'safety',
            label: 'Safety Hub',
            icon: <AlertTriangle className="mr-2 h-4 w-4" />,
            action: () => navigate('/safety-hub'),
            keywords: ['safety', 'alerts', 'incidents', 'osha'],
        },
    ]

    // Quick actions
    const quickActions: CommandAction[] = [
        {
            id: 'new-vehicle',
            label: 'Add New Vehicle',
            icon: <Truck className="mr-2 h-4 w-4" />,
            action: () => navigate('/fleet-hub-consolidated?action=add-vehicle'),
            keywords: ['add', 'new', 'vehicle', 'create'],
        },
        {
            id: 'new-driver',
            label: 'Add New Driver',
            icon: <Users className="mr-2 h-4 w-4" />,
            action: () => navigate('/drivers-hub-consolidated?action=add-driver'),
            keywords: ['add', 'new', 'driver', 'hire'],
        },
        {
            id: 'schedule-maintenance',
            label: 'Schedule Maintenance',
            icon: <Calendar className="mr-2 h-4 w-4" />,
            action: () => navigate('/maintenance-hub-consolidated?action=schedule'),
            keywords: ['schedule', 'maintenance', 'service', 'appointment'],
        },
        {
            id: 'view-map',
            label: 'Open Live Map',
            icon: <Map className="mr-2 h-4 w-4" />,
            action: () => navigate('/gps-tracking'),
            keywords: ['map', 'gps', 'tracking', 'location'],
        },
        {
            id: 'fuel-log',
            label: 'Log Fuel Transaction',
            icon: <Fuel className="mr-2 h-4 w-4" />,
            action: () => navigate('/fleet-hub-consolidated?tab=fuel'),
            keywords: ['fuel', 'gas', 'diesel', 'fill'],
        },
    ]

    // System commands
    const systemCommands: CommandAction[] = [
        {
            id: 'notifications',
            label: 'View Notifications',
            icon: <Bell className="mr-2 h-4 w-4" />,
            action: () => navigate('/notifications'),
            keywords: ['notifications', 'alerts', 'messages'],
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: <Settings className="mr-2 h-4 w-4" />,
            action: () => navigate('/admin-hub-consolidated'),
            keywords: ['settings', 'preferences', 'config'],
        },
        {
            id: 'reports',
            label: 'Generate Report',
            icon: <FileText className="mr-2 h-4 w-4" />,
            action: () => navigate('/analytics-hub-consolidated?tab=reports'),
            keywords: ['report', 'export', 'pdf', 'csv'],
        },
        {
            id: 'search',
            label: 'Global Search',
            icon: <Search className="mr-2 h-4 w-4" />,
            action: () => navigate('/search'),
            keywords: ['search', 'find', 'lookup'],
        },
    ]

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>

                <CommandGroup heading="Navigation">
                    {navigationCommands.map((cmd) => (
                        <CommandItem
                            key={cmd.id}
                            value={cmd.id}
                            onSelect={() => runCommand(cmd.action)}
                            keywords={cmd.keywords}
                        >
                            {cmd.icon}
                            <span>{cmd.label}</span>
                            {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
                        </CommandItem>
                    ))}
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Quick Actions">
                    {quickActions.map((cmd) => (
                        <CommandItem
                            key={cmd.id}
                            value={cmd.id}
                            onSelect={() => runCommand(cmd.action)}
                            keywords={cmd.keywords}
                        >
                            {cmd.icon}
                            <span>{cmd.label}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="System">
                    {systemCommands.map((cmd) => (
                        <CommandItem
                            key={cmd.id}
                            value={cmd.id}
                            onSelect={() => runCommand(cmd.action)}
                            keywords={cmd.keywords}
                        >
                            {cmd.icon}
                            <span>{cmd.label}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    )
}
