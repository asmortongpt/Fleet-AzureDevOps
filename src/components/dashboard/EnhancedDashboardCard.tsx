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

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Loader } from 'lucide-react'
import React from 'react'

import { cardHoverVariants, cardTapVariants } from '@/lib/animations'
import { cn } from '@/lib/utils'
import { colors, transitions } from '@/theme/designSystem'

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
  const getStatusStyles = () => {
    switch (status) {
      case 'active':
        return {
          borderLeft: '4px solid #10B981',
          boxShadow: 'inset 0 0 0 1px rgba(16, 185, 129, 0.2), 0 4px 12px rgba(16, 185, 129, 0.1)',
        };
      case 'warning':
        return {
          borderLeft: '4px solid #a0a0a0',
          boxShadow: 'inset 0 0 0 1px rgba(160, 160, 160, 0.2), 0 4px 12px rgba(160, 160, 160, 0.1)',
        };
      case 'danger':
        return {
          borderLeft: '4px solid #f5f5f5',
          boxShadow: 'inset 0 0 0 1px rgba(245, 245, 245, 0.2), 0 4px 12px rgba(245, 245, 245, 0.1)',
        };
      case 'success':
        return {
          borderLeft: '4px solid #10B981',
          boxShadow: 'inset 0 0 0 1px rgba(16, 185, 129, 0.2), 0 4px 12px rgba(16, 185, 129, 0.15)',
        };
      default:
        return {};
    }
  };

  return (
    <motion.div
      className={cn(
        'rounded-xl overflow-hidden',
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        backgroundColor: colors.neutral[50],
        border: `1px solid ${colors.neutral[200]}`,
        ...getStatusStyles(),
      }}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      variants={{ ...cardHoverVariants, ...cardTapVariants }}
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
        <div className="flex items-center gap-3">
          {status && (
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: statusColors[status],
                boxShadow: `0 0 8px ${statusColors[status]}40`,
              }}
            />
          )}
          {icon && (
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: status === 'active'
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))'
                  : status === 'warning'
                  ? 'linear-gradient(135deg, rgba(160, 160, 160, 0.2), rgba(160, 160, 160, 0.1))'
                  : status === 'danger'
                  ? 'linear-gradient(135deg, rgba(245, 245, 245, 0.2), rgba(245, 245, 245, 0.1))'
                  : 'linear-gradient(135deg, rgba(31, 48, 118, 0.2), rgba(31, 48, 118, 0.1))',
                boxShadow: status === 'active'
                  ? '0 4px 12px rgba(16, 185, 129, 0.2)'
                  : status === 'warning'
                  ? '0 4px 12px rgba(160, 160, 160, 0.2)'
                  : status === 'danger'
                  ? '0 4px 12px rgba(245, 245, 245, 0.2)'
                  : '0 4px 12px rgba(31, 48, 118, 0.1)',
                color: status === 'active'
                  ? colors.success[500]
                  : status === 'warning'
                  ? colors.warning[500]
                  : status === 'danger'
                  ? colors.danger[500]
                  : colors.primary[500],
              }}
            >
              {icon}
            </div>
          )}
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
            className="w-full px-4 py-2 rounded-lg text-sm font-medium text-white transition-all bg-gradient-to-r from-[#333333] to-[#555555] hover:from-[#444444] hover:to-[#666666] shadow-md shadow-black/20 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5"
            style={{
              transition: transitions.fast,
            }}
          >
            {actionButton.label}
          </button>
        </div>
      )}
    </motion.div>
  )
}

export default EnhancedDashboardCard
