/**
 * Mobile Navigation Components
 * Bottom navigation, drawer, tabs, header, and FAB
 */

import { motion, AnimatePresence } from 'framer-motion'
import React, { useState, ReactNode } from 'react'

/* ============================================================
   MOBILE BOTTOM NAV (Tab Bar)
   ============================================================ */

interface NavItem {
  id: string
  label: string
  icon: ReactNode
  badge?: number
  onClick?: () => void
}

interface MobileBottomNavProps {
  items: NavItem[]
  activeId: string
  onItemClick?: (id: string) => void
}

export function MobileBottomNav({ items, activeId, onItemClick }: MobileBottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-bottom">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const isActive = item.id === activeId

          return (
            <button
              key={item.id}
              onClick={() => {
                item.onClick?.()
                onItemClick?.(item.id)
              }}
              className={`
                flex flex-col items-center justify-center py-2 px-1 min-h-[64px] touch-target
                transition-colors duration-200
                ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
                }
              `}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <div className="text-2xl">{item.icon}</div>
                {item.badge !== undefined && item.badge > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </motion.div>
                )}
              </div>
              <span className="text-xs mt-1 font-medium truncate max-w-full">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 dark:bg-blue-400 rounded-t-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

/* ============================================================
   MOBILE DRAWER (Slide-out Menu)
   ============================================================ */

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  position?: 'left' | 'right'
  width?: string
}

export function MobileDrawer({
  isOpen,
  onClose,
  children,
  position = 'left',
  width = '280px',
}: MobileDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: position === 'left' ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: position === 'left' ? '-100%' : '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`
              fixed top-0 ${position === 'left' ? 'left-0' : 'right-0'} bottom-0 z-50
              bg-white dark:bg-gray-900
              shadow-2xl
              overflow-y-auto
              safe-area
            `}
            style={{ width }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ============================================================
   MOBILE TABS (Swipeable)
   ============================================================ */

interface TabItem {
  id: string
  label: string
  content: ReactNode
}

interface MobileTabsProps {
  tabs: TabItem[]
  activeId?: string
  onChange?: (id: string) => void
}

export function MobileTabs({ tabs, activeId: controlledActiveId, onChange }: MobileTabsProps) {
  const [internalActiveId, setInternalActiveId] = useState(tabs[0]?.id || '')
  const activeId = controlledActiveId ?? internalActiveId

  const handleTabChange = (id: string) => {
    setInternalActiveId(id)
    onChange?.(id)
  }

  const activeIndex = tabs.findIndex((tab) => tab.id === activeId)

  return (
    <div className="flex flex-col h-full">
      {/* Tab headers */}
      <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = tab.id === activeId

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap
                transition-colors duration-200 touch-target
                ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
                }
              `}
              aria-selected={isActive}
              role="tab"
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeId}
            initial={{ opacity: 0, x: activeIndex > 0 ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeIndex > 0 ? -100 : 100 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 overflow-y-auto"
          >
            {tabs.find((tab) => tab.id === activeId)?.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ============================================================
   MOBILE HEADER (Collapsing)
   ============================================================ */

interface MobileHeaderProps {
  title: string
  leftAction?: ReactNode
  rightAction?: ReactNode
  collapsible?: boolean
}

export function MobileHeader({
  title,
  leftAction,
  rightAction,
  collapsible = true,
}: MobileHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)

  React.useEffect(() => {
    if (!collapsible) return

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [collapsible])

  return (
    <motion.header
      className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 safe-top"
      animate={{
        boxShadow: isScrolled
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          : '0 0 0 0 rgba(0, 0, 0, 0)',
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3 flex-1">
          {leftAction && <div className="flex-shrink-0">{leftAction}</div>}
          <motion.h1
            className="text-lg font-semibold truncate"
            animate={{
              fontSize: isScrolled ? '1rem' : '1.125rem',
            }}
            transition={{ duration: 0.2 }}
          >
            {title}
          </motion.h1>
        </div>
        {rightAction && <div className="flex-shrink-0 ml-3">{rightAction}</div>}
      </div>
    </motion.header>
  )
}

/* ============================================================
   MOBILE FAB (Floating Action Button)
   ============================================================ */

interface MobileFabProps {
  icon: ReactNode
  onClick: () => void
  label?: string
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  color?: 'primary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
}

export function MobileFab({
  icon,
  onClick,
  label,
  position = 'bottom-right',
  color = 'primary',
  size = 'md',
}: MobileFabProps) {
  const positionClasses: Record<string, string> = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'bottom-center': 'bottom-20 left-1/2 -translate-x-1/2',
  }

  const colorClasses: Record<string, string> = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    error: 'bg-red-600 hover:bg-red-700 text-white',
  }

  const sizeClasses: Record<string, string> = {
    sm: 'w-12 h-12 text-xl',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-16 h-16 text-3xl',
  }

  return (
    <motion.button
      onClick={onClick}
      className={`
        fixed z-40 rounded-full shadow-2xl
        flex items-center justify-center
        transition-colors duration-200
        ${positionClasses[position]}
        ${colorClasses[color]}
        ${sizeClasses[size]}
        ${label ? 'px-4 gap-2' : ''}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={label || 'Floating action button'}
    >
      <span>{icon}</span>
      {label && <span className="text-sm font-medium whitespace-nowrap">{label}</span>}
    </motion.button>
  )
}

/* ============================================================
   MOBILE SEARCH BAR
   ============================================================ */

interface MobileSearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onFocus?: () => void
  onBlur?: () => void
}

export function MobileSearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  onFocus,
  onBlur,
}: MobileSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className="relative">
      <motion.div
        className="relative"
        animate={{
          scale: isFocused ? 1.02 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setIsFocused(true)
            onFocus?.()
          }}
          onBlur={() => {
            setIsFocused(false)
            onBlur?.()
          }}
          placeholder={placeholder}
          className="
            w-full px-4 py-3 pl-10 pr-10
            bg-gray-100 dark:bg-gray-800
            border border-gray-300 dark:border-gray-700
            rounded-full
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-all duration-200
          "
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</div>
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </motion.div>
    </div>
  )
}

/* ============================================================
   MOBILE MENU ITEM
   ============================================================ */

interface MobileMenuItemProps {
  icon?: ReactNode
  label: string
  onClick: () => void
  badge?: number
  rightContent?: ReactNode
  danger?: boolean
}

export function MobileMenuItem({
  icon,
  label,
  onClick,
  badge,
  rightContent,
  danger = false,
}: MobileMenuItemProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 touch-target
        transition-colors duration-200
        ${
          danger
            ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
            : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
        }
      `}
      whileTap={{ scale: 0.98 }}
    >
      {icon && <div className="text-xl flex-shrink-0">{icon}</div>}
      <span className="flex-1 text-left font-medium">{label}</span>
      {badge !== undefined && badge > 0 && (
        <div className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
          {badge > 99 ? '99+' : badge}
        </div>
      )}
      {rightContent && <div className="flex-shrink-0">{rightContent}</div>}
    </motion.button>
  )
}
