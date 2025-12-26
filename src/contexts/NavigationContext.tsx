import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth, UserRole } from '@/contexts/AuthContext';
import { navigationItems, NavigationItem } from '@/lib/navigation';

interface NavigationContextType {
    activeModule: string;
    setActiveModule: (moduleId: string) => void;
    visibleNavItems: NavigationItem[];
    getNavItemsBySection: (section: string) => NavigationItem[];
    navigateTo: (moduleId: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
    const { user, isSuperAdmin } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Initialize state from URL if possible, fallback to default
    const getModuleFromPath = (path: string) => {
        const cleanPath = path.substring(1);
        return cleanPath === '' ? 'live-fleet-dashboard' : cleanPath;
    };

    const [activeModule, setActiveModuleState] = useState(getModuleFromPath(location.pathname));

    // Sync URL changes to state
    useEffect(() => {
        const moduleId = getModuleFromPath(location.pathname);
        setActiveModuleState(moduleId);
    }, [location.pathname]);

    // Filter navigation items based on user role/permissions
    const visibleNavItems = useMemo(() => {
        // If no user is logged in, show nothing or public items (if any existed)
        if (!user) return [];

        return navigationItems.filter(item => {
            // 1. Role Check
            if (item.roles && item.roles.length > 0) {
                // If the user is SuperAdmin, they see everything regardless of specific role restrictions
                // otherwise, check if their role is in the allowed list
                if (isSuperAdmin()) return true;

                // Cast string[] to UserRole[] for comparison safely
                const allowedRoles = item.roles as UserRole[];
                if (!allowedRoles.includes(user.role)) return false;
            }

            // 2. Permission Check can be added here in the future

            return true;
        });
    }, [user, isSuperAdmin]);

    const getNavItemsBySection = useCallback((section: string) => {
        return visibleNavItems.filter(item => item.section === section);
    }, [visibleNavItems]);

    const navigateTo = useCallback((moduleId: string) => {
        // Map module ID to path
        const path = moduleId === 'live-fleet-dashboard' ? '/' : `/${moduleId}`;
        navigate(path);
        // State update happens via useEffect
    }, [navigate]);

    return (
        <NavigationContext.Provider value={{
            activeModule,
            setActiveModule: setActiveModuleState,
            visibleNavItems,
            getNavItemsBySection,
            navigateTo
        }}>
            {children}
        </NavigationContext.Provider>
    );
}

export function useNavigation() {
    const context = useContext(NavigationContext);
    if (context === undefined) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
}
