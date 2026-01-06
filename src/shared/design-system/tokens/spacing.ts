/**
 * USWDS 3.0 Design Tokens - Spacing
 *
 * Based on U.S. Web Design System (USWDS) 3.0 spacing units
 * https://designsystem.digital.gov/design-tokens/spacing-units/
 *
 * Consistent 8px grid system for professional layouts
 */

export const spacing = {
  // Base spacing scale (8px grid)
  0: '0',
  1: '0.25rem',    // 4px  - Tight spacing
  2: '0.5rem',     // 8px  - Base unit
  3: '0.75rem',    // 12px - Small spacing
  4: '1rem',       // 16px - Standard spacing
  5: '1.25rem',    // 20px - Medium spacing
  6: '1.5rem',     // 24px - Large spacing
  8: '2rem',       // 32px - Extra large spacing
  10: '2.5rem',    // 40px - Section spacing
  12: '3rem',      // 48px - Large section spacing
  16: '4rem',      // 64px - Hero spacing
  20: '5rem',      // 80px - Extra large section spacing
  24: '6rem',      // 96px - Maximum spacing
} as const

// Semantic spacing tokens
export const semanticSpacing = {
  // Component spacing
  component: {
    xs: spacing[1],      // 4px  - Tight component padding
    sm: spacing[2],      // 8px  - Small component padding
    md: spacing[4],      // 16px - Default component padding
    lg: spacing[6],      // 24px - Large component padding
    xl: spacing[8],      // 32px - Extra large component padding
  },

  // Layout spacing
  layout: {
    xs: spacing[4],      // 16px - Tight layout spacing
    sm: spacing[6],      // 24px - Small layout spacing
    md: spacing[8],      // 32px - Default layout spacing
    lg: spacing[12],     // 48px - Large layout spacing
    xl: spacing[16],     // 64px - Extra large layout spacing
  },

  // Content spacing
  content: {
    xs: spacing[2],      // 8px  - Tight content spacing
    sm: spacing[3],      // 12px - Small content spacing
    md: spacing[4],      // 16px - Default content spacing
    lg: spacing[6],      // 24px - Large content spacing
    xl: spacing[8],      // 32px - Extra large content spacing
  },

  // Stack spacing (vertical rhythm)
  stack: {
    xs: spacing[2],      // 8px  - Tight vertical spacing
    sm: spacing[4],      // 16px - Small vertical spacing
    md: spacing[6],      // 24px - Default vertical spacing
    lg: spacing[8],      // 32px - Large vertical spacing
    xl: spacing[12],     // 48px - Extra large vertical spacing
  },

  // Inline spacing (horizontal rhythm)
  inline: {
    xs: spacing[1],      // 4px  - Tight horizontal spacing
    sm: spacing[2],      // 8px  - Small horizontal spacing
    md: spacing[3],      // 12px - Default horizontal spacing
    lg: spacing[4],      // 16px - Large horizontal spacing
    xl: spacing[6],      // 24px - Extra large horizontal spacing
  },
} as const

export type SpacingTokens = typeof spacing
export type SemanticSpacingTokens = typeof semanticSpacing
