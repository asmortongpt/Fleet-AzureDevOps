import { LogOut, User, CreditCard, Users } from 'lucide-react';
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
                backgroundColor: '#242424',
                borderColor: 'rgba(255, 255, 255, 0.1)',
            }}>
                {/* Left: CTA Branding - Approved Logo */}
                <div className="flex items-center gap-3 shrink-0">
                    <img
                        src={isMobile ? "/logos/cta-approved-logo-icon.svg" : "/logos/cta-approved-logo-horizontal.svg"}
                        alt="CTA Fleet - Capital Technology Alliance"
                        className={cn(
                            "transition-all duration-200 drop-shadow-lg",
                            isMobile ? "h-12 w-12" : "h-14"
                        )}
                        style={{ objectFit: 'contain' }}
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
                                "[&_input]:rounded-xl [&_input]:bg-white/90 [&_input]:backdrop-blur-sm",
                                "[&_input]:dark:from-gray-900/90 [&_input]:dark:to-gray-900/80",
                                "[&_input]:border border-white/20 [&_input]:dark:border-white/10",
                                "[&_input]:h-11 [&_input]:text-sm [&_input]:px-4 [&_input]:text-gray-900 [&_input]:dark:text-white",
                                "[&_input]:transition-all [&_input]:duration-300 [&_input]:ease-out",
                                "[&_input:focus]:border-white/60 [&_input:focus]:ring-2 [&_input:focus]:ring-white/30 [&_input:focus]:shadow-lg [&_input:focus]:shadow-white/10"
                            )}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                        />
                        {/* Search indicator glow on focus - Gold accent */}
                        {isSearchFocused && (
                            <div
                                className="absolute inset-0 rounded-xl pointer-events-none"
                                style={{
                                    boxShadow: '0 0 20px rgba(255, 255, 255, 0.15)',
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
                    <div className="hidden sm:block h-8 w-px bg-white/20 mx-2" />

                    {/* User Menu */}
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "gap-3 h-11 rounded-lg transition-all duration-200",
                                    "hover:bg-white/10 border border-white/10 hover:border-white/20",
                                    "pl-3 pr-3 text-white hover:text-white"
                                )}
                            >
                                <div className="hidden lg:flex flex-col items-end">
                                    <span className="text-sm font-medium text-white leading-none">Admin User</span>
                                    <span className="text-xs text-white/70 leading-none mt-1">Fleet Manager</span>
                                </div>
                                <Avatar className="h-9 w-9 border-2 border-white/30">
                                    <AvatarImage src="https://github.com/shadcn.png" alt="Admin User profile picture" />
                                    <AvatarFallback className="bg-white/20 text-white font-semibold text-xs">AD</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-56 bg-[#111] border-white/20 shadow-lg rounded-lg p-1"
                            sideOffset={8}
                        >
                            <DropdownMenuLabel className="px-3 py-2">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm text-white">Admin User</span>
                                    <span className="text-xs text-white/60 font-normal">admin@fleetops.com</span>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/10 my-1" />
                            <DropdownMenuItem
                                className="cursor-pointer rounded-md mx-1 px-3 py-2 text-sm text-white focus:bg-white/10 hover:bg-white/5 transition-colors"
                                onClick={() => setActiveModule('profile')}
                            >
                                <User className="w-4 h-4 mr-3 text-white/70" />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer rounded-md mx-1 px-3 py-2 text-sm text-white focus:bg-white/10 hover:bg-white/5 transition-colors"
                                onClick={() => setActiveModule('settings')}
                            >
                                <CreditCard className="w-4 h-4 mr-3 text-white/70" />
                                Billing
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer rounded-md mx-1 px-3 py-2 text-sm text-white focus:bg-white/10 hover:bg-white/5 transition-colors"
                                onClick={() => setActiveModule('settings')}
                            >
                                <Users className="w-4 h-4 mr-3 text-white/70" />
                                Team
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10 my-1" />
                            <DropdownMenuItem
                                className="cursor-pointer rounded-md mx-1 px-3 py-2 text-sm text-red-400 focus:bg-red-500/20 hover:bg-red-500/10 transition-colors"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4 mr-3" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            {/* Gold/Orange Accent Bar - Approved Branding */}
            {/* Full Skyline Gradient Bar — ADELE Feb 2026 brand guide */}
            <div className="h-1 shadow-sm" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)' }} aria-hidden="true" />
        </header>
    );
}
