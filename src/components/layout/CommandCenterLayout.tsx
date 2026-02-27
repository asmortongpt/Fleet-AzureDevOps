/**
 * CommandCenterLayout — Secondary layout for hub pages that use the
 * CommandCenterSidebar instead of the IconRail.
 *
 * Tesla/Rivian minimal: dark backgrounds, no visual noise.
 */
import { X, PanelLeft } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

import { CommandCenterHeader } from './CommandCenterHeader';
import { CommandCenterSidebar } from './CommandCenterSidebar';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CommandCenterLayoutProps {
    children: React.ReactNode;
}

export function CommandCenterLayout({ children }: CommandCenterLayoutProps): React.ReactElement {
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [isTablet, setIsTablet] = useState<boolean>(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;
        const checkViewport = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const width = window.innerWidth;
                setIsMobile(width < 768);
                setIsTablet(width >= 768 && width < 1024);
                if (width < 768) setIsSidebarOpen(true);
                else if (width < 1024) setIsSidebarOpen(false);
            }, 100);
        };
        checkViewport();
        window.addEventListener('resize', checkViewport);
        return () => { clearTimeout(timeoutId); window.removeEventListener('resize', checkViewport); };
    }, []);

    useEffect(() => {
        if (mobileMenuOpen) {
            const close = () => setMobileMenuOpen(false);
            const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
            document.addEventListener('click', close);
            document.addEventListener('keydown', esc);
            document.body.style.overflow = 'hidden';
            return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
        }
        return () => {};
    }, [mobileMenuOpen]);

    const toggleMobileMenu = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setMobileMenuOpen(prev => !prev);
    }, []);

    const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

    return (
        <div className="min-h-screen bg-[#0a0a0a] cta-hub">
            <div className="relative z-10 flex h-screen w-full text-white overflow-hidden">
                <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-2 focus:py-2 focus:bg-white focus:text-black focus:rounded-lg">
                    Skip to main content
                </a>

                {/* Mobile overlay */}
                <div
                    className={cn(
                        "fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity duration-300",
                        mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                    onClick={closeMobileMenu}
                    aria-hidden={!mobileMenuOpen}
                />

                {/* Sidebar */}
                <aside className={cn(
                    "z-50 shrink-0",
                    (isMobile || isTablet)
                        ? cn("fixed inset-y-0 left-0 transform transition-all duration-300", mobileMenuOpen ? "translate-x-0" : "-translate-x-full")
                        : "relative transition-all duration-300"
                )}>
                    <CommandCenterSidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} onNavigate={closeMobileMenu} />
                    <Button
                        variant="ghost" size="icon"
                        className={cn("absolute top-4 right-4 text-white/60 hover:text-white lg:hidden rounded-full", mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none")}
                        onClick={toggleMobileMenu} aria-label="Close navigation menu"
                    >
                        <X className="w-3 h-3" />
                    </Button>
                </aside>

                {/* Main content */}
                <main id="main-content" className="flex-1 flex flex-col relative z-10 overflow-hidden bg-[#0a0a0a] min-w-0">
                    <div className="relative shrink-0">
                        {(isMobile || isTablet) && (
                            <Button variant="ghost" size="icon"
                                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 text-white/60 hover:text-white lg:hidden rounded-full"
                                onClick={toggleMobileMenu} aria-label="Open navigation menu" aria-expanded={mobileMenuOpen}
                            >
                                <PanelLeft className="w-3 h-3" />
                            </Button>
                        )}
                        <CommandCenterHeader isMobile={isMobile || isTablet} />
                    </div>

                    <div className="flex-1 overflow-auto relative p-2" tabIndex={0} role="region" aria-label="Main content area">
                        <div className="relative z-10 h-full">{children}</div>
                    </div>

                    <footer className="shrink-0 px-6 py-2 text-[12px] text-white/20 border-t border-white/[0.04] bg-[#0a0a0a]">
                        <div className="flex items-center justify-between">
                            <span>&copy; {new Date().getFullYear()} CTA Fleet</span>
                            <span>v1.0.0</span>
                        </div>
                    </footer>
                </main>
            </div>
        </div>
    );
}
