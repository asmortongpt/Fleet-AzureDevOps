/**
 * EnhancedDashboardCard — Tesla/Rivian minimal
 *
 * Clean metric card with status indicator.
 * No motion, no gradients, no light-mode colors.
 */

import { TrendingUp, TrendingDown, Loader } from 'lucide-react'
import React from 'react'

import { cn } from '@/lib/utils'

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

const statusDotColors = {
  active: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-rose-400',
  success: 'bg-emerald-400',
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
        'rounded-2xl border border-white/[0.04] bg-[#111111] overflow-hidden',
        onClick && 'cursor-pointer hover:bg-[#161616] transition-colors duration-150',
        className
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[11px] font-medium text-white/35 uppercase tracking-wider">
            {title}
          </p>

          {isLoading ? (
            <div className="flex items-center gap-2 mt-2">
              <Loader size={16} className="animate-spin text-white/30" />
              <span className="text-[12px] text-white/20">Loading...</span>
            </div>
          ) : (
            <>
              {value !== undefined && (
                <div className="mt-1 flex items-baseline gap-1.5">
                  <h3 className="text-2xl font-semibold text-white tracking-tight tabular-nums">
                    {value}
                  </h3>
                  {unit && (
                    <span className="text-[12px] text-white/30 font-medium">{unit}</span>
                  )}
                </div>
              )}

              {trend && trendValue && (
                <div className="mt-1.5 flex items-center gap-1">
                  {trend === 'up' && <TrendingUp size={14} className="text-emerald-400" />}
                  {trend === 'down' && <TrendingDown size={14} className="text-rose-400" />}
                  <span className={cn(
                    'text-[11px] font-medium',
                    trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-white/30'
                  )}>
                    {trendValue}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {status && (
            <div className={cn('w-2 h-2 rounded-full', statusDotColors[status])} />
          )}
          {icon && (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.04] text-white/30">
              {icon}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {children && (
        <div className="px-4 pb-4 border-t border-white/[0.04]">
          {children}
        </div>
      )}

      {/* Action Button */}
      {actionButton && (
        <div className="px-4 pb-4">
          <button
            onClick={(e) => {
              e.stopPropagation()
              actionButton.onClick()
            }}
            className="w-full px-4 py-2 rounded-xl text-[12px] font-medium text-white bg-white/[0.06] hover:bg-white/[0.10] transition-colors duration-150"
          >
            {actionButton.label}
          </button>
        </div>
      )}
    </div>
  )
}

export default EnhancedDashboardCard
