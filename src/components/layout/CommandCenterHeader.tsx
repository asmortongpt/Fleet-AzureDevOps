import {
    Search,
    Bell,
    LogOut
} from 'lucide-react';

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

export function CommandCenterHeader() {
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
            <div className="flex items-center gap-4 ml-6">
                <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white hover:bg-white/5 rounded-full">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#0d1221]" />
                </Button>

                <div className="h-6 w-px bg-white/10 mx-2" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="pl-2 pr-1 gap-3 h-10 rounded-full hover:bg-white/5 border border-transparent hover:border-white/5">
                            <div className="flex flex-col items-end hidden md:flex">
                                <span className="text-sm font-medium text-white leading-none">Admin User</span>
                                <span className="text-[10px] text-slate-400 leading-none mt-1">Fleet Manager</span>
                            </div>
                            <Avatar className="h-8 w-8 border border-white/10">
                                <AvatarImage src="https://github.com/shadcn.png" />
                                <AvatarFallback>AD</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-[#1a2030] border-white/10 text-slate-200">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem className="focus:bg-white/5 cursor-pointer">Profile</DropdownMenuItem>
                        <DropdownMenuItem className="focus:bg-white/5 cursor-pointer">Billing</DropdownMenuItem>
                        <DropdownMenuItem className="focus:bg-white/5 cursor-pointer">Team</DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer">
                            <LogOut className="w-4 h-4 mr-2" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
