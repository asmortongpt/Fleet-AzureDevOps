import { Search, LogOut, User, CreditCard, Users } from 'lucide-react';

import { NotificationBell } from '@/components/common/NotificationBell';
import { ThemeToggle } from '@/components/ThemeToggle';
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

export function CommandCenterHeader() {
    const { setActiveModule } = useNavigation();

    const handleLogout = () => {
        // Clear any auth state and redirect to login
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
    };

    return (
        <header className="h-16 border-b border-white/5 bg-[#0d1221]/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search fleet, drivers, or assets..."
                        className="w-full bg-[#151b2d] border border-white/5 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-inner"
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 ml-6">
                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Notifications */}
                <NotificationBell onNavigate={setActiveModule} />

                <div className="h-6 w-px bg-white/10 mx-2" />

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="pl-2 pr-1 gap-3 h-10 rounded-full hover:bg-white/5 border border-transparent hover:border-white/5">
                            <div className="flex flex-col items-end hidden md:flex">
                                <span className="text-sm font-medium text-white leading-none">Admin User</span>
                                <span className="text-[10px] text-slate-600 dark:text-slate-300 leading-none mt-1">Fleet Manager</span>
                            </div>
                            <Avatar className="h-8 w-8 border border-white/10">
                                <AvatarImage src="https://github.com/shadcn.png" alt="Admin User profile picture" />
                                <AvatarFallback>AD</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-[#1a2030] border-white/10 text-slate-200">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem
                            className="focus:bg-white/5 cursor-pointer"
                            onClick={() => setActiveModule('profile')}
                        >
                            <User className="w-4 h-4 mr-2" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="focus:bg-white/5 cursor-pointer"
                            onClick={() => setActiveModule('settings')}
                        >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Billing
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="focus:bg-white/5 cursor-pointer"
                            onClick={() => setActiveModule('settings')}
                        >
                            <Users className="w-4 h-4 mr-2" />
                            Team
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem
                            className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
