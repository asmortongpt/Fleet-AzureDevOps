import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { getNavigationItemsForRole } from '@/config/role-navigation';
import { useAuth } from '@/contexts';
import { navigationItems, NavigationItem } from '@/lib/navigation';

interface NavigationContextType {
    activeModule: string;
    setActiveModule: (moduleId: string) => void;
    visibleNavItems: NavigationItem[];
    getNavItemsBySection: (section: string) => NavigationItem[];
    navigateTo: (moduleId: string) => void;
    updateNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
    const { user, isSuperAdmin } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Initialize state from URL if possible, fallback to default
    const getModuleFromPath = (path: string, search: string) => {
        const params = new URLSearchParams(search);
        const moduleParam = params.get('module');
        if (moduleParam) return moduleParam;

        const cleanPath = path.substring(1);
        return cleanPath === '' ? 'fleet-hub-consolidated' : cleanPath;
    };

    const [activeModule, setActiveModuleState] = useState(getModuleFromPath(location.pathname, location.search));

    // Sync URL changes to state
    useEffect(() => {
        const moduleId = getModuleFromPath(location.pathname, location.search);
        setActiveModuleState(moduleId);
    }, [location.pathname, location.search]);

    // Filter navigation items based on user role using workflow-optimized role-navigation config
    const visibleNavItems = useMemo(() => {
        // If no user is logged in, show nothing
        if (!user) return [];

        // Get accessible navigation item IDs for this role from workflow analysis
        const accessibleItemIds = getNavigationItemsForRole(user.role);

        // Filter navigationItems to only include items accessible to this role
        return navigationItems.filter(item => accessibleItemIds.includes(item.id));
    }, [user]);

    const getNavItemsBySection = useCallback((section: string) => {
        return visibleNavItems.filter(item => item.section === section);
    }, [visibleNavItems]);

    const navigateTo = useCallback((moduleId: string) => {
        // Set state immediately for instant UI feedback
        setActiveModuleState(moduleId);
        // Map module ID to path and navigate (URL will also sync via useEffect)
        const path = moduleId === 'live-fleet-dashboard' ? '/' : `/${moduleId}`;
        navigate(path);
    }, [navigate]);

    const updateNavigation = () => {
        // Force re-render of visible nav items
        setActiveModuleState(activeModule);
    };

    return (
        <NavigationContext.Provider value={{
            activeModule,
            setActiveModule: setActiveModuleState,
            visibleNavItems,
            getNavItemsBySection,
            navigateTo,
            updateNavigation
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
