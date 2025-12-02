# Demo Mode & Role Switcher Integration Guide

**Status**: ✅ Complete - Ready for Integration
**Date**: November 11, 2025
**Components**: Role Switcher, Demo Mode System, Toast Notifications, Analytics

---

## 📋 Overview

This guide walks through integrating the demo mode and role-switching functionality into the Fleet Management application. This system allows users to experience the application from different perspectives (Fleet Manager, Driver, Technician, etc.) without needing separate accounts.

---

## 🗂️ Files Created

### **Hooks**
1. `/frontend/src/hooks/useDemoMode.ts` - Demo mode state management
2. `/frontend/src/hooks/useAuth.ts` - Authentication state management

### **Components**
3. `/frontend/src/components/demo/RoleSwitcher.tsx` - Main role switcher component
4. `/frontend/src/components/demo/RoleSwitcher.css` - Component styles
5. `/frontend/src/components/common/ToastContainer.tsx` - Toast notifications
6. `/frontend/src/components/common/ToastContainer.css` - Toast styles
7. `/frontend/src/components/providers/AuthProvider.tsx` - Auth context provider

### **Utilities**
8. `/frontend/src/utils/toast.ts` - Toast notification system
9. `/frontend/src/utils/analytics.ts` - Analytics tracking

---

## 🚀 Quick Start Integration

### Step 1: Install Dependencies

The demo mode system requires Framer Motion for animations:

```bash
cd frontend
npm install framer-motion
```

### Step 2: Wrap App with AuthProvider

**File**: `frontend/src/App.tsx`

```tsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './components/providers/AuthProvider';
import { ToastContainer } from './components/common/ToastContainer';
import { RoleSwitcher } from './components/demo/RoleSwitcher';
import { useRoleSwitcherShortcut } from './components/demo/RoleSwitcher';

function App() {
  // Enable keyboard shortcuts for role switching
  useRoleSwitcherShortcut();

  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Your existing routes and components */}
        <YourMainContent />

        {/* Add these at the root level */}
        <ToastContainer />
        <RoleSwitcher />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

### Step 3: Enable Demo Mode

To enable demo mode for a user session:

```tsx
import { useDemoMode } from './hooks/useDemoMode';

function DemoButton() {
  const { enableDemoMode, disableDemoMode, isDemoMode } = useDemoMode();

  return (
    <button onClick={() => isDemoMode ? disableDemoMode() : enableDemoMode()}>
      {isDemoMode ? 'Exit Demo Mode' : 'Enter Demo Mode'}
    </button>
  );
}
```

---

## 🎭 User Roles

The system supports 7 distinct user roles:

| Role | Icon | Color | Description |
|------|------|-------|-------------|
| **Fleet Manager** | 👔 | Blue (#3B82F6) | Full fleet oversight and management |
| **Driver** | 🚗 | Green (#10B981) | Mobile-first experience for daily operations |
| **Technician** | 🔧 | Orange (#F59E0B) | Maintenance and repair workflow |
| **Dispatcher** | 📍 | Purple (#8B5CF6) | Real-time fleet coordination |
| **Safety Officer** | 🛡️ | Red (#EF4444) | Safety compliance and incident management |
| **Accountant** | 💰 | Cyan (#06B6D4) | Financial tracking and reporting |
| **Admin** | ⚙️ | Gray (#6B7280) | System configuration and user management |

---

## 🎯 Features

### 1. **Role Switcher Component**

- **Floating FAB Button**: Always accessible in bottom-right corner
- **Role Selection Panel**: Slide-in panel with all available roles
- **Current Role Bar**: Top bar showing current role and user
- **Dropdown Version**: Compact version for navigation bar

### 2. **Keyboard Shortcuts**

- `Ctrl/Cmd + Shift + R` - Cycle through roles
- `Ctrl/Cmd + Shift + [1-7]` - Switch to specific role by number

### 3. **Toast Notifications**

Toast notifications provide user feedback for:
- Role switching success/failure
- Loading states
- General user actions

```tsx
import { showToast, toast } from './utils/toast';

// Basic usage
showToast('Action completed', { type: 'success', duration: 3000 });

// Convenience methods
toast.success('Saved successfully!');
toast.error('Something went wrong');
toast.info('Loading...');
toast.warning('Be careful!');
```

### 4. **Analytics Tracking**

All role switches and user interactions are tracked:

```tsx
import { trackEvent } from './utils/analytics';

trackEvent('demo_role_switched', {
  from: 'fleet_manager',
  to: 'driver',
  timestamp: Date.now()
});
```

---

## 🔐 Permission System

Each role has specific permissions that can be checked:

```tsx
import { useDemoMode } from './hooks/useDemoMode';

function ProtectedFeature() {
  const { hasPermission, isRole } = useDemoMode();

  // Check specific permission
  if (!hasPermission('vehicles.create')) {
    return <div>Access Denied</div>;
  }

  // Check if specific role
  if (isRole('fleet_manager')) {
    return <ManagerView />;
  }

  return <StandardView />;
}
```

**Permission Examples**:
- `vehicles.view` - View vehicles
- `vehicles.create` - Create new vehicles
- `maintenance.schedule` - Schedule maintenance
- `reports.export` - Export reports
- `*` - Full access (admin only)

---

## 🎨 Customization

### Styling

All styles are in CSS files and can be customized:

**Primary Color**: Edit `.role-fab-button { background-color: #3B82F6; }`

**Role Colors**: Edit the `ROLES` array in `RoleSwitcher.tsx`

**Toast Position**: Edit `.toast-container` in `ToastContainer.css`

### Adding New Roles

1. Add role type in `useDemoMode.ts`:
```tsx
export type UserRole =
  | 'fleet_manager'
  | 'driver'
  | 'my_new_role'; // Add here
```

2. Add role config in `RoleSwitcher.tsx`:
```tsx
const ROLES: RoleConfig[] = [
  // ... existing roles
  {
    id: 'my_new_role',
    name: 'My New Role',
    icon: '🎉',
    color: '#10B981',
    description: 'Description of new role',
    features: ['Feature 1', 'Feature 2'],
    demoUser: {
      name: 'John Doe',
      avatar: '/avatars/new-role.png',
      email: 'john@fleet.demo'
    }
  }
];
```

3. Add permissions in `useDemoMode.ts`:
```tsx
const rolePermissions: Record<UserRole, string[]> = {
  // ... existing permissions
  my_new_role: ['specific.permission', 'another.permission']
};
```

---

## 📊 Demo User Profiles

Each role has a pre-configured demo user:

```typescript
const DEMO_USERS = {
  fleet_manager: {
    id: 'demo-fleet-manager',
    email: 'sarah.johnson@fleet.demo',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'fleet_manager'
  },
  // ... 6 more roles
};
```

These users are automatically set when switching roles and persisted to localStorage.

---

## 🧪 Testing the Integration

### Manual Testing Checklist:

1. **Enable Demo Mode**
   - [ ] Click "Enter Demo Mode" button
   - [ ] Verify floating FAB appears in bottom-right
   - [ ] Verify "DEMO MODE" badge is visible

2. **Role Switching via FAB**
   - [ ] Click FAB button
   - [ ] Verify slide-in panel appears
   - [ ] Click a different role card
   - [ ] Verify toast notification appears
   - [ ] Verify current role bar updates

3. **Role Switching via Keyboard**
   - [ ] Press `Ctrl/Cmd + Shift + R`
   - [ ] Verify role cycles to next
   - [ ] Press `Ctrl/Cmd + Shift + 3`
   - [ ] Verify switches to role #3

4. **Permission System**
   - [ ] Switch to "Driver" role
   - [ ] Verify limited features visible
   - [ ] Switch to "Admin" role
   - [ ] Verify all features visible

5. **Analytics**
   - [ ] Open browser console
   - [ ] Switch roles
   - [ ] Verify analytics events logged

---

## 🐛 Troubleshooting

### Issue: "useAuth must be used within an AuthProvider"

**Fix**: Ensure `<AuthProvider>` wraps your entire app in `App.tsx`

### Issue: Toast notifications not appearing

**Fix**: Verify `<ToastContainer />` is added to your app root

### Issue: Role switcher not showing

**Fix**: Demo mode must be enabled first. Call `enableDemoMode()` from `useDemoMode` hook

### Issue: Keyboard shortcuts not working

**Fix**: Call `useRoleSwitcherShortcut()` at the root level of your app

---

## 📈 Analytics Events

The following events are automatically tracked:

| Event Name | Properties | Description |
|------------|-----------|-------------|
| `demo_mode_enabled` | `{ role: string }` | User enabled demo mode |
| `demo_mode_disabled` | - | User disabled demo mode |
| `demo_role_switched` | `{ from: string, to: string }` | User switched roles |

---

## 🔒 Security Considerations

1. **Demo Mode Detection**: Backend should detect demo tokens and prevent actual data modification
2. **Token Prefix**: All demo tokens use prefix `demo-token-` for easy identification
3. **LocalStorage**: Demo state persists in localStorage, cleared on logout
4. **Read-Only**: Consider making demo mode read-only for sensitive operations

---

## 🎓 Next Steps

1. **Test Integration**: Follow the testing checklist above
2. **Create Demo Landing Page**: Add a landing page explaining demo mode
3. **Add Demo Data**: Seed database with demo-specific data
4. **Video Tutorials**: Record role-specific video tutorials (see INTERACTIVE_TRAINING_MODULE_PLAN.md)
5. **Help Documentation**: Create help docs for each role

---

## 📚 Related Documentation

- [Interactive Training Module Plan](./INTERACTIVE_TRAINING_MODULE_PLAN.md)
- [Component Architecture](../architecture/COMPONENT_ARCHITECTURE.md)
- [API Documentation](../api/API_DOCUMENTATION.md)

---

## ✅ Implementation Checklist

- [x] Create `useDemoMode` hook
- [x] Create `useAuth` hook
- [x] Create `RoleSwitcher` component
- [x] Create `ToastContainer` component
- [x] Create `AuthProvider` component
- [x] Add toast notification system
- [x] Add analytics tracking
- [x] Create CSS styles
- [x] Add keyboard shortcuts
- [x] Document integration steps
- [ ] Install framer-motion dependency
- [ ] Integrate into App.tsx
- [ ] Test all role switches
- [ ] Test permission system
- [ ] Add demo landing page
- [ ] Create demo data seeds

---

**Need Help?** Contact the development team or refer to the codebase documentation.
