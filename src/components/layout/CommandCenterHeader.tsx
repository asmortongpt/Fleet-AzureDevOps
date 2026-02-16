import { LogOut, User, CreditCard, Users, Menu, X } from 'lucide-react';
import { useState, useCallback } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/common/NotificationBell';
import { SearchInput } from '@/components/shared/SearchInput';
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
import { brandColors } from '@/theme/designSystem';
import { cn } from '@/lib/utils';
import logger from '@/utils/logger';

interface CommandCenterHeaderProps {
    isMobile?: boolean;
}

export function CommandCenterHeader({ isMobile = false }: CommandCenterHeaderProps) {
    const { setActiveModule } = useNavigation();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
    }, []);

    const handleSearch = useCallback((query: string) => {
        logger.info('Global search:', query);
    }, []);

    return (
        <header className="relative shrink-0">
            <div className={cn(
                "h-16 border-b transition-all duration-200 shadow-md flex items-center justify-between",
                isMobile ? "px-4" : "px-6"
            )}
            style={{
                backgroundColor: brandColors.archon.white,
                borderColor: `${brandColors.cta.navy}20`,
            }}>
                {/* Left: CTA Branding */}
                <div className="flex items-center gap-2 shrink-0">
                    <img
                        src="/logos/cta-logo-primary-lockup.svg"
                        alt="CTA Fleet - Capital Technology Alliance"
                        className={cn(
                            "h-full transition-all duration-200",
                            isMobile ? "h-12 w-12" : "h-14"
                        )}
                        style={{ maxHeight: '100%', objectFit: 'contain' }}
                    />
                </div>

                {/* Center: Search Bar */}
                <div className={cn(
                    "flex-1 max-w-lg mx-6 transition-all duration-300 ease-out",
                    isSearchFocused && "max-w-2xl"
                )}>
                    <div className="relative group">
                        <SearchInput
                            value={searchQuery}
                            onChange={setSearchQuery}
                            onDebouncedChange={handleSearch}
                            placeholder={isMobile ? "Search..." : "Search fleet, drivers, or assets..."}
                            ariaLabel="Search fleet, drivers, or assets"
                            className={cn(
                                "search-input-enhanced input-premium elevation-interactive",
                                "[&_input]:rounded-xl [&_input]:bg-gradient-to-b [&_input]:from-white/50 [&_input]:to-white/30",
                                "[&_input]:dark:from-gray-800/50 [&_input]:dark:to-gray-800/30",
                                "[&_input]:border border-gray-300 [&_input]:dark:border-gray-600",
                                "[&_input]:h-11 [&_input]:text-sm [&_input]:px-4",
                                "[&_input]:transition-all [&_input]:duration-300 [&_input]:ease-out",
                                "[&_input:focus]:border-[#41B2E3] [&_input:focus]:ring-2 [&_input:focus]:ring-[#41B2E3]/40 [&_input:focus]:shadow-lg [&_input:focus]:shadow-[#41B2E3]/20"
                            )}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                        />
                        {/* Search indicator glow on focus */}
                        {isSearchFocused && (
                            <div
                                className="absolute inset-0 rounded-xl pointer-events-none"
                                style={{
                                    boxShadow: '0 0 20px rgba(65, 178, 227, 0.3)',
                                    animation: 'fadeInScale 0.3s ease-out'
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 ml-4">
                    {/* Theme Toggle */}
                    <ThemeToggle />

                    {/* Notifications */}
                    <NotificationBell onNavigate={setActiveModule} />

                    {/* Separator - hidden on mobile */}
                    <div className="hidden sm:block h-8 w-px bg-border/50 mx-2" />

                    {/* User Menu */}
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "gap-3 h-11 rounded-lg transition-all duration-200",
                                    "hover:bg-muted/60 border border-transparent hover:border-border/50",
                                    "pl-3 pr-3"
                                )}
                            >
                                <div className="hidden lg:flex flex-col items-end">
                                    <span className="text-sm font-medium text-foreground leading-none">Admin User</span>
                                    <span className="text-xs text-muted-foreground leading-none mt-1">Fleet Manager</span>
                                </div>
                                <Avatar className="h-9 w-9 border-2 border-border/50">
                                    <AvatarImage src="https://github.com/shadcn.png" alt="Admin User profile picture" />
                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">AD</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-56 bg-popover border-border/50 shadow-lg rounded-lg p-1"
                            sideOffset={8}
                        >
                            <DropdownMenuLabel className="px-3 py-2">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm">Admin User</span>
                                    <span className="text-xs text-muted-foreground font-normal">admin@fleetops.com</span>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border/50 my-1" />
                            <DropdownMenuItem
                                className="cursor-pointer rounded-md mx-1 px-3 py-2 text-sm focus:bg-muted/60 transition-colors"
                                onClick={() => setActiveModule('profile')}
                            >
                                <User className="w-4 h-4 mr-3 text-muted-foreground" />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer rounded-md mx-1 px-3 py-2 text-sm focus:bg-muted/60 transition-colors"
                                onClick={() => setActiveModule('settings')}
                            >
                                <CreditCard className="w-4 h-4 mr-3 text-muted-foreground" />
                                Billing
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer rounded-md mx-1 px-3 py-2 text-sm focus:bg-muted/60 transition-colors"
                                onClick={() => setActiveModule('settings')}
                            >
                                <Users className="w-4 h-4 mr-3 text-muted-foreground" />
                                Team
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border/50 my-1" />
                            <DropdownMenuItem
                                className="cursor-pointer rounded-md mx-1 px-3 py-2 text-sm text-destructive focus:bg-destructive/10 focus:text-destructive transition-colors"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4 mr-3" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            {/* CTA Gradient Bar Accent */}
            <div className="h-1 bg-gradient-to-r from-[#F0A000] to-[#DD3903] shadow-sm" aria-hidden="true" />
        </header>
    );
}
