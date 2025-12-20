import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
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
    const [activeModule, setActiveModuleState] = useState('live-fleet-dashboard');

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
        setActiveModuleState(moduleId);
        // In the future, this could also handle React Router navigation push
        // navigate('/' + moduleId); 
    }, []);

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
