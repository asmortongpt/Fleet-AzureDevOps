/**
 * Skeleton Loader Components
 *
 * Loading placeholders that match actual content layout
 * - Text skeleton
 * - Card skeleton
 * - List skeleton
 * - Table skeleton
 * - Dashboard skeleton
 */

import React from 'react'
import { colors, spacing } from '@/theme/designSystem'

interface SkeletonProps {
  className?: string
  count?: number
}

// Basic Skeleton Line
export const SkeletonLine: React.FC<{ width?: string; height?: string }> = ({
  width = '100%',
  height = '1rem',
}) => (
  <div
    style={{
      width,
      height,
      backgroundColor: colors.neutral[200],
      borderRadius: '0.5rem',
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    }}
  />
)

// Skeleton Circle (for avatars)
export const SkeletonCircle: React.FC<{ size?: string }> = ({ size = '2.5rem' }) => (
  <div
    style={{
      width: size,
      height: size,
      backgroundColor: colors.neutral[200],
      borderRadius: '9999px',
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    }}
  />
)

// Card Skeleton
export const SkeletonCard: React.FC<{ count?: number }> = ({ count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          padding: spacing[6],
          backgroundColor: colors.neutral[50],
          borderRadius: '0.75rem',
          border: `1px solid ${colors.neutral[200]}`,
          marginBottom: spacing[6],
        }}
      >
        <div style={{ marginBottom: spacing[4] }}>
          <SkeletonLine width="30%" height="0.875rem" />
        </div>
        <div style={{ marginBottom: spacing[3] }}>
          <SkeletonLine height="2rem" />
        </div>
        <div style={{ marginBottom: spacing[3] }}>
          <SkeletonLine />
        </div>
        <div>
          <SkeletonLine width="60%" />
        </div>
      </div>
    ))}
  </>
)

// Text Skeleton (paragraph)
export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div style={{ gap: spacing[2], display: 'flex', flexDirection: 'column' }}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonLine key={i} width={i === lines - 1 ? '80%' : '100%'} height="1rem" />
    ))}
  </div>
)

// List Skeleton
export const SkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div style={{ gap: spacing[4], display: 'flex', flexDirection: 'column' }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} style={{ display: 'flex', gap: spacing[4], alignItems: 'center' }}>
        <SkeletonCircle size="2.5rem" />
        <div style={{ flex: 1 }}>
          <SkeletonLine width="40%" height="1rem" />
          <div style={{ marginTop: spacing[2] }}>
            <SkeletonLine width="60%" height="0.875rem" />
          </div>
        </div>
      </div>
    ))}
  </div>
)

// Table Skeleton
export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => (
  <div
    style={{
      width: '100%',
      borderCollapse: 'collapse',
    }}
  >
    {/* Header */}
    <div style={{ display: 'flex', gap: spacing[4], paddingBottom: spacing[4], borderBottom: `1px solid ${colors.neutral[200]}` }}>
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} style={{ flex: 1 }}>
          <SkeletonLine width="80%" height="0.875rem" />
        </div>
      ))}
    </div>

    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={rowIndex}
        style={{
          display: 'flex',
          gap: spacing[4],
          paddingTop: spacing[4],
          paddingBottom: spacing[4],
          borderBottom: `1px solid ${colors.neutral[200]}`,
        }}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div key={colIndex} style={{ flex: 1 }}>
            <SkeletonLine height="1rem" />
          </div>
        ))}
      </div>
    ))}
  </div>
)

// Dashboard Grid Skeleton
export const SkeletonDashboard: React.FC<{ cards?: number }> = ({ cards = 4 }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: spacing[6],
    }}
  >
    {Array.from({ length: cards }).map((_, i) => (
      <div
        key={i}
        style={{
          padding: spacing[6],
          backgroundColor: colors.neutral[50],
          borderRadius: '0.75rem',
          border: `1px solid ${colors.neutral[200]}`,
        }}
      >
        <div style={{ marginBottom: spacing[4] }}>
          <SkeletonLine width="40%" height="0.875rem" />
        </div>
        <div style={{ marginBottom: spacing[3] }}>
          <SkeletonLine height="2.5rem" />
        </div>
        <div>
          <SkeletonLine width="50%" height="0.875rem" />
        </div>
      </div>
    ))}
  </div>
)

// Inline Loading Spinner
export const SkeletonSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing[3], padding: spacing[8] }}>
    <div
      style={{
        width: '2rem',
        height: '2rem',
        border: `3px solid ${colors.neutral[200]}`,
        borderTopColor: colors.primary[500],
        borderRadius: '9999px',
        animation: 'spin 1s linear infinite',
      }}
    />
    {message && (
      <span style={{ fontSize: '0.875rem', color: colors.neutral[600] }}>
        {message}
      </span>
    )}
  </div>
)

// Export all skeleton components
export const SkeletonLoader = {
  Line: SkeletonLine,
  Circle: SkeletonCircle,
  Card: SkeletonCard,
  Text: SkeletonText,
  List: SkeletonList,
  Table: SkeletonTable,
  Dashboard: SkeletonDashboard,
  Spinner: SkeletonSpinner,
}

export default SkeletonLoader
