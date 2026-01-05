import { X, PanelLeft } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

import { CommandCenterHeader } from './CommandCenterHeader';
import { CommandCenterSidebar } from './CommandCenterSidebar';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CommandCenterLayoutProps {
    children: React.ReactNode;
}

export function CommandCenterLayout({ children }: CommandCenterLayoutProps): JSX.Element {
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [isTablet, setIsTablet] = useState<boolean>(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

    // Detect viewport size with debounce
    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;

        const checkViewport = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const width = window.innerWidth;
                const mobile = width < 768;
                const tablet = width >= 768 && width < 1024;

                setIsMobile(mobile);
                setIsTablet(tablet);

                if (mobile) {
                    setIsSidebarOpen(true); // Always show full sidebar labels in mobile drawer
                } else if (tablet) {
                    setIsSidebarOpen(false); // Collapse sidebar on tablet
                }
            }, 100);
        };

        checkViewport();
        window.addEventListener('resize', checkViewport);
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', checkViewport);
        };
    }, []);

    // Close mobile menu when clicking outside or pressing Escape
    useEffect(() => {
        if (mobileMenuOpen) {
            const handleClickOutside = () => setMobileMenuOpen(false);
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === 'Escape') setMobileMenuOpen(false);
            };

            document.addEventListener('click', handleClickOutside);
            document.addEventListener('keydown', handleEscape);

            // Prevent body scroll when menu is open
            document.body.style.overflow = 'hidden';

            return () => {
                document.removeEventListener('click', handleClickOutside);
                document.removeEventListener('keydown', handleEscape);
                document.body.style.overflow = '';
            };
        }
        return () => { };
    }, [mobileMenuOpen]);

    const toggleMobileMenu = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setMobileMenuOpen(prev => !prev);
    }, []);

    const closeMobileMenu = useCallback(() => {
        setMobileMenuOpen(false);
    }, []);

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
            {/* Skip Link for Accessibility */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg focus:ring-2 focus:ring-primary/50"
            >
                Skip to main content
            </a>

            {/* MOBILE OVERLAY */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
                    mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={closeMobileMenu}
                aria-hidden={!mobileMenuOpen}
            />

            {/* SIDEBAR - Desktop: always visible, Mobile/Tablet: drawer overlay */}
            <aside
                className={cn(
                    "z-50 shrink-0",
                    (isMobile || isTablet) ? cn(
                        "fixed inset-y-0 left-0 transform transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                        mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
                    ) : "relative transition-all duration-300 ease-out"
                )}
            >
                <CommandCenterSidebar
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    onNavigate={closeMobileMenu}
                />
                {/* Mobile close button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "absolute top-4 right-4 text-foreground/80 hover:text-foreground hover:bg-muted/50 lg:hidden rounded-full transition-all duration-200",
                        mobileMenuOpen ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
                    )}
                    onClick={toggleMobileMenu}
                    aria-label="Close navigation menu"
                >
                    <X className="w-5 h-5" />
                </Button>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main
                id="main-content"
                className="flex-1 flex flex-col relative z-10 overflow-hidden bg-background min-w-0"
            >
                {/* Header with mobile menu button */}
                <div className="relative shrink-0">
                    {(isMobile || isTablet) && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 text-foreground/80 hover:text-foreground hover:bg-muted/50 lg:hidden rounded-full transition-all duration-200"
                            onClick={toggleMobileMenu}
                            aria-label="Open navigation menu"
                            aria-expanded={mobileMenuOpen}
                        >
                            <PanelLeft className="w-5 h-5" />
                        </Button>
                    )}
                    <CommandCenterHeader isMobile={isMobile || isTablet} />
                </div>

                {/* Content Wrapper - responsive padding */}
                <div
                    className="flex-1 overflow-auto relative p-3 sm:p-4 lg:p-6"
                    tabIndex={0}
                    role="region"
                    aria-label="Main content area"
                >
                    {/* Subtle grid background */}
                    <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />

                    {/* Gradient overlay for depth - Premium Midnight Effect */}
                    <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),rgba(255,255,255,0))]" />
                    <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />

                    <div className="relative z-10 h-full animate-fade-in">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}