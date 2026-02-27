import { LogOut, User, CreditCard, Users, Search } from 'lucide-react';
import { useState, useCallback } from 'react';

import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/common/NotificationBell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useNavigation } from '@/contexts/NavigationContext';
import { cn } from '@/lib/utils';
import logger from '@/utils/logger';

interface CommandCenterHeaderProps {
    isMobile?: boolean;
}

export function CommandCenterHeader({ isMobile = false }: CommandCenterHeaderProps) {
    const { setActiveModule } = useNavigation();

    const handleLogout = useCallback(() => {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
    }, []);

    // Cmd+K handler to open command palette
    const handleSearchClick = useCallback(() => {
        const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
        document.dispatchEvent(event);
    }, []);

    return (
        <header className="relative shrink-0" style={{ backgroundColor: 'var(--surface-1)' }}>
            <div className={cn(
                "flex items-center justify-between",
                isMobile ? "px-3" : "px-4"
            )}
            style={{
                height: 'var(--header-height)',
                borderBottom: '1px solid var(--border-subtle)',
            }}>
                {/* Left: Logo */}
                <div className="flex items-center gap-3 shrink-0">
                    <img
                        src={isMobile ? "/logos/cta-approved-logo-icon.svg" : "/logos/cta-approved-logo-horizontal.svg"}
                        alt="CTA Fleet"
                        className={cn(
                            "transition-all duration-[var(--duration-fast)]",
                            isMobile ? "h-8 w-8" : "h-9"
                        )}
                        style={{ objectFit: 'contain' }}
                    />
                </div>

                {/* Center: Cmd+K Search Pill */}
                {!isMobile && (
                    <button
                        onClick={handleSearchClick}
                        className="flex items-center gap-2 px-3 h-8 rounded-[var(--radius-full)] transition-all duration-[var(--duration-fast)] cursor-pointer mx-4"
                        style={{
                            backgroundColor: 'var(--surface-glass)',
                            border: '1px solid var(--border-default)',
                            color: 'var(--text-muted)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-strong)';
                            e.currentTarget.style.color = 'var(--text-tertiary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-default)';
                            e.currentTarget.style.color = 'var(--text-muted)';
                        }}
                    >
                        <Search className="w-3.5 h-3.5" />
                        <span className="text-[var(--text-sm)]">Search fleet...</span>
                        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ml-4"
                            style={{
                                backgroundColor: 'var(--surface-glass-hover)',
                                color: 'var(--text-muted)',
                            }}>
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </button>
                )}

                {/* Right Actions */}
                <div className="flex items-center gap-1.5 ml-auto">
                    <ThemeToggle />
                    <NotificationBell onNavigate={setActiveModule} />

                    <div className="hidden sm:block h-6 w-px mx-1.5" style={{ backgroundColor: 'var(--border-subtle)' }} />

                    {/* User Menu */}
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="gap-2.5 h-9 rounded-[var(--radius-md)] transition-all duration-[var(--duration-fast)] hover:bg-[var(--surface-glass-hover)] px-2"
                            >
                                <div className="hidden lg:flex flex-col items-end">
                                    <span className="text-[var(--text-sm)] font-medium leading-none" style={{ color: 'var(--text-primary)' }}>Admin User</span>
                                    <span className="text-[var(--text-xs)] leading-none mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Fleet Manager</span>
                                </div>
                                <Avatar className="h-7 w-7" style={{ border: '2px solid var(--border-default)' }}>
                                    <AvatarImage src="https://github.com/shadcn.png" alt="Admin User" />
                                    <AvatarFallback className="text-[10px] font-semibold" style={{ backgroundColor: 'var(--surface-4)', color: 'var(--text-secondary)' }}>AD</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-56 rounded-[var(--radius-lg)] p-1"
                            style={{
                                backgroundColor: 'var(--surface-3)',
                                border: '1px solid var(--border-default)',
                                boxShadow: 'var(--shadow-lg)',
                            }}
                            sideOffset={8}
                        >
                            <DropdownMenuLabel className="px-3 py-2">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-[var(--text-sm)]" style={{ color: 'var(--text-primary)' }}>Admin User</span>
                                    <span className="text-[var(--text-xs)] font-normal" style={{ color: 'var(--text-tertiary)' }}>admin@fleetops.com</span>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator style={{ backgroundColor: 'var(--border-subtle)' }} />
                            <DropdownMenuItem
                                className="cursor-pointer rounded-[var(--radius-sm)] mx-1 px-3 py-2 text-[var(--text-sm)] transition-colors"
                                style={{ color: 'var(--text-primary)' }}
                                onClick={() => setActiveModule('profile')}
                            >
                                <User className="w-4 h-4 mr-3" style={{ color: 'var(--text-tertiary)' }} />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer rounded-[var(--radius-sm)] mx-1 px-3 py-2 text-[var(--text-sm)] transition-colors"
                                style={{ color: 'var(--text-primary)' }}
                                onClick={() => setActiveModule('settings')}
                            >
                                <CreditCard className="w-4 h-4 mr-3" style={{ color: 'var(--text-tertiary)' }} />
                                Billing
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer rounded-[var(--radius-sm)] mx-1 px-3 py-2 text-[var(--text-sm)] transition-colors"
                                style={{ color: 'var(--text-primary)' }}
                                onClick={() => setActiveModule('settings')}
                            >
                                <Users className="w-4 h-4 mr-3" style={{ color: 'var(--text-tertiary)' }} />
                                Team
                            </DropdownMenuItem>
                            <DropdownMenuSeparator style={{ backgroundColor: 'var(--border-subtle)' }} />
                            <DropdownMenuItem
                                className="cursor-pointer rounded-[var(--radius-sm)] mx-1 px-3 py-2 text-[var(--text-sm)] transition-colors"
                                style={{ color: 'var(--status-danger)' }}
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4 mr-3" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
