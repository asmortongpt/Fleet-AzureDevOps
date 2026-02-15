/**
 * Enhanced Dashboard Card Component
 *
 * Improved card design with:
 * - Better visual hierarchy
 * - Status indicators
 * - Hover effects
 * - Loading states
 * - Action buttons
 * - Responsive layout
 */

import React from 'react'
import { TrendingUp, TrendingDown, Loader } from 'lucide-react'
import { cn } from '@/lib/utils'
import { colors, spacing, shadows, transitions, borderRadius } from '@/theme/designSystem'

interface EnhancedDashboardCardProps {
  title: string
  value?: string | number
  unit?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  status?: 'active' | 'warning' | 'danger' | 'success'
  isLoading?: boolean
  children?: React.ReactNode
  actionButton?: {
    label: string
    onClick: () => void
  }
  className?: string
  onClick?: () => void
}

const statusColors = {
  active: colors.success[500],
  warning: colors.warning[500],
  danger: colors.danger[500],
  success: colors.success[500],
}

export const EnhancedDashboardCard: React.FC<EnhancedDashboardCardProps> = ({
  title,
  value,
  unit,
  icon,
  trend,
  trendValue,
  status = 'active',
  isLoading = false,
  children,
  actionButton,
  className,
  onClick,
}) => {
  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden transition-all',
        onClick && 'cursor-pointer hover:shadow-lg',
        className
      )}
      style={{
        backgroundColor: colors.neutral[50],
        boxShadow: shadows.sm,
        transition: transitions.base,
        border: `1px solid ${colors.neutral[200]}`,
      }}
      onClick={onClick}
    >
      {/* Header */}
      <div
        className="p-6 flex items-start justify-between"
        style={{ backgroundColor: colors.neutral[50] }}
      >
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: colors.neutral[600] }}>
            {title}
          </p>

          {isLoading ? (
            <div className="flex items-center gap-2 mt-2">
              <Loader size={20} className="animate-spin" style={{ color: colors.primary[500] }} />
              <span className="text-sm" style={{ color: colors.neutral[500] }}>
                Loading...
              </span>
            </div>
          ) : (
            <>
              {value !== undefined && (
                <div className="mt-2 flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold" style={{ color: colors.neutral[900] }}>
                    {value}
                  </h3>
                  {unit && (
                    <span className="text-sm" style={{ color: colors.neutral[600] }}>
                      {unit}
                    </span>
                  )}
                </div>
              )}

              {/* Trend Indicator */}
              {trend && trendValue && (
                <div className="mt-2 flex items-center gap-1">
                  {trend === 'up' && (
                    <TrendingUp size={16} style={{ color: colors.success[500] }} />
                  )}
                  {trend === 'down' && (
                    <TrendingDown size={16} style={{ color: colors.danger[500] }} />
                  )}
                  <span
                    className="text-xs font-medium"
                    style={{
                      color:
                        trend === 'up'
                          ? colors.success[600]
                          : trend === 'down'
                            ? colors.danger[600]
                            : colors.neutral[600],
                    }}
                  >
                    {trendValue}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Icon & Status */}
        <div className="flex items-center gap-2">
          {status && (
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: statusColors[status] }}
            />
          )}
          {icon && <div style={{ color: colors.primary[500] }}>{icon}</div>}
        </div>
      </div>

      {/* Content */}
      {children && (
        <div
          className="px-6 pb-6"
          style={{ borderTop: `1px solid ${colors.neutral[200]}` }}
        >
          {children}
        </div>
      )}

      {/* Action Button */}
      {actionButton && (
        <div
          className="px-6 pb-4"
          style={{ borderTop: `1px solid ${colors.neutral[200]}` }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              actionButton.onClick()
            }}
            className="w-full px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
            style={{
              backgroundColor: colors.primary[500],
              transition: transitions.fast,
            }}
            onHover={(e) => {
              (e.target as HTMLElement).style.backgroundColor = colors.primary[600]
            }}
          >
            {actionButton.label}
          </button>
        </div>
      )}
    </div>
  )
}

export default EnhancedDashboardCard
