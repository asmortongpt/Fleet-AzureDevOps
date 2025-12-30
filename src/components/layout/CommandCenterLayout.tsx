import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

import { CommandCenterHeader } from './CommandCenterHeader';
import { CommandCenterSidebar } from './CommandCenterSidebar';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CommandCenterLayoutProps {
    children: React.ReactNode;
}

export function CommandCenterLayout({ children }: CommandCenterLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Detect mobile viewport
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) {
                setIsSidebarOpen(true); // Always show full sidebar labels in mobile drawer
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Close mobile menu when clicking outside
    useEffect(() => {
        if (mobileMenuOpen) {
            const handleClickOutside = () => setMobileMenuOpen(false);
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [mobileMenuOpen]);

    return (
        <div className="flex h-screen w-full bg-[#0a0f1c] text-slate-100 overflow-hidden font-sans">
            {/* MOBILE OVERLAY */}
            {isMobile && mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* SIDEBAR - Desktop: always visible, Mobile: drawer overlay */}
            <div className={cn(
                "z-50",
                isMobile ? cn(
                    "fixed inset-y-0 left-0 transform transition-transform duration-300 ease-in-out",
                    mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                ) : "relative"
            )}>
                <CommandCenterSidebar
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                />
                {/* Mobile close button */}
                {isMobile && mobileMenuOpen && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 text-white hover:bg-white/10 lg:hidden"
                        onClick={(e) => {
                            e.stopPropagation();
                            setMobileMenuOpen(false);
                        }}
                    >
                        <X className="w-5 h-5" />
                    </Button>
                )}
            </div>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col relative z-10 overflow-hidden bg-[#0a0f1c]">
                {/* Header with mobile menu button */}
                <div className="relative">
                    {isMobile && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/10 lg:hidden"
                            onClick={(e) => {
                                e.stopPropagation();
                                setMobileMenuOpen(true);
                            }}
                        >
                            <Menu className="w-5 h-5" />
                        </Button>
                    )}
                    <CommandCenterHeader />
                </div>

                {/* Content Wrapper - responsive padding */}
                <div className="flex-1 overflow-auto relative p-4 lg:p-6">
                    <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    <div className="relative z-10 h-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
