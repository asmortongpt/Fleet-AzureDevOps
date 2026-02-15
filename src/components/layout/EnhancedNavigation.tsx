/**
 * Enhanced Navigation Component
 *
 * Improved navigation with:
 * - Better visual hierarchy
 * - Smooth transitions and animations
 * - Responsive design
 * - Active state indicators
 * - Search functionality
 * - User menu
 * - Notification badge
 */

import React, { useState, useCallback } from 'react'
import { Menu, X, Search, Bell, User, LogOut, Settings, ChevronDown } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { colors, spacing, shadows, transitions, typography, borderRadius } from '@/theme/designSystem'

interface NavItem {
  label: string
  href: string
  icon?: React.ReactNode
  badge?: number
  children?: NavItem[]
}

interface EnhancedNavigationProps {
  items: NavItem[]
  onLogout?: () => void
  userEmail?: string
  notifications?: number
}

export const EnhancedNavigation: React.FC<EnhancedNavigationProps> = ({
  items,
  onLogout,
  userEmail = 'user@example.com',
  notifications = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const location = useLocation()

  const toggleMenu = useCallback(() => {
    setIsOpen(!isOpen)
  }, [isOpen])

  const toggleSubmenu = useCallback((label: string) => {
    setOpenSubmenu(openSubmenu === label ? null : label)
  }, [openSubmenu])

  const isActive = (href: string) => location.pathname === href

  const filteredItems = items.filter(
    item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.children?.some(child => child.label.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <nav
      className="bg-white shadow-md"
      style={{
        boxShadow: shadows.md,
      }}
    >
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center justify-between px-6 py-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: colors.primary[600] }}
          >
            F
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: colors.neutral[900] }}>
              Fleet CTA
            </h1>
            <p className="text-xs" style={{ color: colors.neutral[500] }}>
              Management System
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div
          className="flex-1 mx-8 relative"
          style={{
            maxWidth: '400px',
          }}
        >
          <input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border"
            style={{
              borderColor: colors.neutral[300],
              fontSize: typography.fontSize.sm,
            }}
          />
          <Search
            size={18}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.neutral[400],
            }}
          />
        </div>

        {/* Nav Items */}
        <div className="flex items-center gap-1">
          {filteredItems.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'px-4 py-2 rounded-lg font-medium text-sm transition-all',
                isActive(item.href)
                  ? 'text-white'
                  : 'text-gray-700 hover:text-gray-900'
              )}
              style={{
                backgroundColor: isActive(item.href) ? colors.primary[600] : 'transparent',
                transition: transitions.base,
              }}
            >
              {item.label}
              {item.badge && item.badge > 0 && (
                <span
                  className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: colors.danger[500] }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100" style={{ transition: transitions.fast }}>
            <Bell size={20} style={{ color: colors.neutral[600] }} />
            {notifications > 0 && (
              <span
                className="absolute top-1 right-1 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center font-bold"
                style={{ backgroundColor: colors.danger[500] }}
              >
                {notifications}
              </span>
            )}
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
              style={{ transition: transitions.fast }}
            >
              <User size={18} style={{ color: colors.neutral[600] }} />
              <span className="text-sm font-medium" style={{ color: colors.neutral[900] }}>
                Account
              </span>
              <ChevronDown size={16} style={{ color: colors.neutral[500] }} />
            </button>

            {/* User Dropdown */}
            {isUserMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-50 overflow-hidden"
                style={{
                  backgroundColor: colors.neutral[50],
                  boxShadow: shadows.lg,
                }}
              >
                <div className="p-4 border-b" style={{ borderColor: colors.neutral[200] }}>
                  <p className="text-sm font-medium" style={{ color: colors.neutral[900] }}>
                    {userEmail}
                  </p>
                </div>

                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
                  <Settings size={16} />
                  <span className="text-sm">Settings</span>
                </button>

                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                  style={{ color: colors.danger[600] }}
                >
                  <LogOut size={16} />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden px-4 py-3 flex items-center justify-between">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: colors.primary[600] }}
        >
          F
        </div>

        <button onClick={toggleMenu} className="p-2">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          className="md:hidden border-t"
          style={{ borderColor: colors.neutral[200] }}
        >
          {/* Mobile Search */}
          <div className="p-4">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border"
              style={{ borderColor: colors.neutral[300] }}
            />
          </div>

          {/* Mobile Nav Items */}
          <div className="px-4 pb-4 space-y-2">
            {filteredItems.map((item) => (
              <div key={item.href}>
                <Link
                  to={item.href}
                  className="block px-4 py-2 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: isActive(item.href)
                      ? colors.primary[100]
                      : 'transparent',
                    color: isActive(item.href)
                      ? colors.primary[600]
                      : colors.neutral[700],
                  }}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>

                {item.children && (
                  <button
                    onClick={() => toggleSubmenu(item.label)}
                    className="w-full text-left px-4 py-2 text-sm flex items-center justify-between"
                    style={{ color: colors.neutral[600] }}
                  >
                    <span>More</span>
                    <ChevronDown
                      size={16}
                      style={{
                        transform: openSubmenu === item.label ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: transitions.fast,
                      }}
                    />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Mobile User Section */}
          <div
            className="p-4 border-t space-y-2"
            style={{ borderColor: colors.neutral[200] }}
          >
            <button className="w-full text-left px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-100">
              <Bell size={18} />
              <span className="text-sm">Notifications</span>
            </button>
            <button className="w-full text-left px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-100">
              <Settings size={18} />
              <span className="text-sm">Settings</span>
            </button>
            <button
              onClick={onLogout}
              className="w-full text-left px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-100"
              style={{ color: colors.danger[600] }}
            >
              <LogOut size={18} />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

export default EnhancedNavigation
