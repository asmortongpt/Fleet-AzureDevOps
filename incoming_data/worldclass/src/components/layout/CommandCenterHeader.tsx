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
        console.log('Global search:', query);
    }, []);

    return (
        <header className={cn(
            "h-14 sm:h-16 border-b border-border/50 glass z-30 flex items-center justify-between shrink-0 transition-all duration-200",
            isMobile ? "px-14 sm:px-16" : "px-4 sm:px-6"
        )}>
            {/* Search Bar */}
            <div className={cn(
                "flex-1 max-w-xl transition-all duration-300",
                isSearchFocused && "max-w-2xl"
            )}>
                <div className="relative">
                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        onDebouncedChange={handleSearch}
                        placeholder={isMobile ? "Search..." : "Search fleet, drivers, or assets..."}
                        ariaLabel="Search fleet, drivers, or assets"
                        className={cn(
                            "[&_input]:rounded-xl [&_input]:bg-muted/30 [&_input]:border-border/40 [&_input]:backdrop-blur-sm",
                            "[&_input]:h-10 sm:[&_input]:h-11",
                            "[&_input]:transition-all [&_input]:duration-200",
                            "[&_input:focus]:bg-muted/50 [&_input:focus]:border-primary/40 [&_input:focus]:shadow-glow-sm"
                        )}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-2 ml-3 sm:ml-6">
                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Notifications */}
                <NotificationBell onNavigate={setActiveModule} />

                {/* Separator - hidden on mobile */}
                <div className="hidden sm:block h-6 w-px bg-border/50 mx-1 sm:mx-2" />

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className={cn(
                                "gap-2 sm:gap-3 h-10 sm:h-11 rounded-xl transition-all duration-200",
                                "hover:bg-muted/50 border border-transparent hover:border-border/50",
                                "pl-1 pr-1 sm:pl-2 sm:pr-1.5"
                            )}
                        >
                            <div className="hidden lg:flex flex-col items-end">
                                <span className="text-sm font-medium text-foreground leading-none">Admin User</span>
                                <span className="text-xs text-muted-foreground leading-none mt-1">Fleet Manager</span>
                            </div>
                            <Avatar className="h-8 w-8 border-2 border-border/50 ring-2 ring-background">
                                <AvatarImage src="https://github.com/shadcn.png" alt="Admin User profile picture" />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">AD</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-56 bg-popover/95 backdrop-blur-xl border-border/50 text-popover-foreground shadow-xl rounded-xl p-1"
                        sideOffset={8}
                    >
                        <DropdownMenuLabel className="px-3 py-2">
                            <div className="flex flex-col">
                                <span className="font-semibold">Admin User</span>
                                <span className="text-xs text-muted-foreground font-normal">admin@fleetops.com</span>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border/50 my-1" />
                        <DropdownMenuItem
                            className="cursor-pointer rounded-lg mx-1 px-3 py-2.5 focus:bg-muted/70 transition-colors"
                            onClick={() => setActiveModule('profile')}
                        >
                            <User className="w-4 h-4 mr-2.5 text-muted-foreground" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="cursor-pointer rounded-lg mx-1 px-3 py-2.5 focus:bg-muted/70 transition-colors"
                            onClick={() => setActiveModule('settings')}
                        >
                            <CreditCard className="w-4 h-4 mr-2.5 text-muted-foreground" />
                            Billing
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="cursor-pointer rounded-lg mx-1 px-3 py-2.5 focus:bg-muted/70 transition-colors"
                            onClick={() => setActiveModule('settings')}
                        >
                            <Users className="w-4 h-4 mr-2.5 text-muted-foreground" />
                            Team
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border/50 my-1" />
                        <DropdownMenuItem
                            className="cursor-pointer rounded-lg mx-1 px-3 py-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive transition-colors"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-4 h-4 mr-2.5" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
