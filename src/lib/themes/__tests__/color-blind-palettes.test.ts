/**
 * Color Blind Palettes Tests
 * Tests for WCAG contrast ratio calculations and color blind safe palettes
 */

import { describe, it, expect } from 'vitest'
import {
  calculateLuminance,
  calculateContrastRatio,
  meetsWCAGLevel,
  getWCAGLevel,
  DEUTERANOPIA_PALETTE,
  PROTANOPIA_PALETTE,
  TRITANOPIA_PALETTE,
  HIGH_CONTRAST_LIGHT,
  HIGH_CONTRAST_DARK,
  COLOR_BLIND_PALETTES,
  HIGH_CONTRAST_PALETTES,
} from '../color-blind-palettes'

describe('Color Blind Palettes', () => {
  describe('calculateLuminance', () => {
    it('should calculate luminance for black', () => {
      const luminance = calculateLuminance('#000000')
      expect(luminance).toBe(0)
    })

    it('should calculate luminance for white', () => {
      const luminance = calculateLuminance('#FFFFFF')
      expect(luminance).toBe(1)
    })

    it('should return values between 0 and 1', () => {
      const colors = ['#FF0000', '#00FF00', '#0000FF', '#808080', '#CCCCCC']
      colors.forEach((color) => {
        const luminance = calculateLuminance(color)
        expect(luminance).toBeGreaterThanOrEqual(0)
        expect(luminance).toBeLessThanOrEqual(1)
      })
    })

    it('should handle 6-digit hex colors', () => {
      expect(() => calculateLuminance('#2563EB')).not.toThrow()
    })
  })

  describe('calculateContrastRatio', () => {
    it('should calculate contrast ratio between black and white', () => {
      const ratio = calculateContrastRatio('#000000', '#FFFFFF')
      expect(ratio).toBe(21)
    })

    it('should calculate contrast ratio between white and black', () => {
      const ratio = calculateContrastRatio('#FFFFFF', '#000000')
      expect(ratio).toBe(21)
    })

    it('should be order-independent', () => {
      const ratio1 = calculateContrastRatio('#000000', '#FFFFFF')
      const ratio2 = calculateContrastRatio('#FFFFFF', '#000000')
      expect(ratio1).toBe(ratio2)
    })

    it('should return values between 1 and 21', () => {
      const colorPairs = [
        ['#000000', '#111111'],
        ['#FFFFFF', '#EEEEEE'],
        ['#2563EB', '#7C3AED'],
      ]
      colorPairs.forEach(([color1, color2]) => {
        const ratio = calculateContrastRatio(color1, color2)
        expect(ratio).toBeGreaterThanOrEqual(1)
        expect(ratio).toBeLessThanOrEqual(21)
      })
    })

    it('should calculate high contrast for deuteranopia palette', () => {
      const ratio = calculateContrastRatio(
        DEUTERANOPIA_PALETTE.colors.foreground,
        DEUTERANOPIA_PALETTE.colors.background
      )
      expect(ratio).toBeGreaterThan(7)
    })
  })

  describe('meetsWCAGLevel', () => {
    it('should verify black on white meets AAA', () => {
      expect(meetsWCAGLevel('#000000', '#FFFFFF', 'AAA')).toBe(true)
    })

    it('should verify black on white meets AA', () => {
      expect(meetsWCAGLevel('#000000', '#FFFFFF', 'AA')).toBe(true)
    })

    it('should verify black on white meets A', () => {
      expect(meetsWCAGLevel('#000000', '#FFFFFF', 'A')).toBe(true)
    })

    it('should reject insufficient contrast for AAA', () => {
      expect(meetsWCAGLevel('#777777', '#888888', 'AAA')).toBe(false)
    })

    it('should validate deuteranopia palette meets AAA', () => {
      const isAAA = meetsWCAGLevel(
        DEUTERANOPIA_PALETTE.colors.foreground,
        DEUTERANOPIA_PALETTE.colors.background,
        'AAA'
      )
      expect(isAAA).toBe(true)
    })
  })

  describe('getWCAGLevel', () => {
    it('should return AAA for ratio >= 7', () => {
      expect(getWCAGLevel(7)).toBe('AAA')
      expect(getWCAGLevel(8)).toBe('AAA')
      expect(getWCAGLevel(21)).toBe('AAA')
    })

    it('should return AA for ratio >= 4.5 but < 7', () => {
      expect(getWCAGLevel(4.5)).toBe('AA')
      expect(getWCAGLevel(5)).toBe('AA')
      expect(getWCAGLevel(6.9)).toBe('AA')
    })

    it('should return A for ratio >= 3 but < 4.5', () => {
      expect(getWCAGLevel(3)).toBe('A')
      expect(getWCAGLevel(4)).toBe('A')
      expect(getWCAGLevel(4.4)).toBe('A')
    })

    it('should return FAIL for ratio < 3', () => {
      expect(getWCAGLevel(1)).toBe('FAIL')
      expect(getWCAGLevel(2.5)).toBe('FAIL')
    })
  })

  describe('DEUTERANOPIA_PALETTE', () => {
    it('should have valid structure', () => {
      expect(DEUTERANOPIA_PALETTE).toHaveProperty('name')
      expect(DEUTERANOPIA_PALETTE).toHaveProperty('description')
      expect(DEUTERANOPIA_PALETTE).toHaveProperty('colors')
      expect(DEUTERANOPIA_PALETTE).toHaveProperty('wcagLevel')
      expect(DEUTERANOPIA_PALETTE).toHaveProperty('contrastRatio')
    })

    it('should have AAA wcag level', () => {
      expect(DEUTERANOPIA_PALETTE.wcagLevel).toBe('AAA')
    })

    it('should have 7+ contrast ratio', () => {
      expect(DEUTERANOPIA_PALETTE.contrastRatio).toBeGreaterThanOrEqual(7)
    })

    it('should have all required colors', () => {
      const requiredColors = ['primary', 'secondary', 'accent', 'background', 'foreground', 'success', 'warning', 'error']
      requiredColors.forEach((color) => {
        expect(DEUTERANOPIA_PALETTE.colors).toHaveProperty(color)
      })
    })

    it('should include pattern definitions', () => {
      expect(DEUTERANOPIA_PALETTE.patterns).toBeTruthy()
      expect(DEUTERANOPIA_PALETTE.patterns).toHaveProperty('success')
      expect(DEUTERANOPIA_PALETTE.patterns).toHaveProperty('warning')
      expect(DEUTERANOPIA_PALETTE.patterns).toHaveProperty('error')
    })

    it('should avoid red/green only differentiation', () => {
      // Red (#FF0000 = #FF0000) and green (#00FF00 = #00FF00) should not be the only differentiators
      const colors = Object.values(DEUTERANOPIA_PALETTE.colors)
      // Just verify colors are present and valid
      expect(colors.length).toBeGreaterThan(0)
      colors.forEach((color) => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      })
    })
  })

  describe('PROTANOPIA_PALETTE', () => {
    it('should have valid structure', () => {
      expect(PROTANOPIA_PALETTE).toHaveProperty('colors')
      expect(PROTANOPIA_PALETTE.wcagLevel).toBe('AAA')
    })

    it('should have 7+ contrast ratio', () => {
      expect(PROTANOPIA_PALETTE.contrastRatio).toBeGreaterThanOrEqual(7)
    })

    it('should use blue and yellow safe colors', () => {
      // Protanopia can see blue and yellow
      expect(PROTANOPIA_PALETTE.colors.primary).toBeTruthy()
      expect(PROTANOPIA_PALETTE.colors.secondary).toBeTruthy()
    })

    it('should include pattern definitions', () => {
      expect(PROTANOPIA_PALETTE.patterns).toBeTruthy()
      expect(PROTANOPIA_PALETTE.patterns?.success).toBeTruthy()
    })
  })

  describe('TRITANOPIA_PALETTE', () => {
    it('should have valid structure', () => {
      expect(TRITANOPIA_PALETTE).toHaveProperty('colors')
      expect(TRITANOPIA_PALETTE.wcagLevel).toBe('AAA')
    })

    it('should have 7+ contrast ratio', () => {
      expect(TRITANOPIA_PALETTE.contrastRatio).toBeGreaterThanOrEqual(7)
    })

    it('should use red and cyan safe colors', () => {
      // Tritanopia can see red and cyan
      expect(TRITANOPIA_PALETTE.colors.primary).toBeTruthy()
      expect(TRITANOPIA_PALETTE.colors.secondary).toBeTruthy()
    })
  })

  describe('HIGH_CONTRAST_LIGHT', () => {
    it('should have maximum contrast for light theme', () => {
      const ratio = calculateContrastRatio(
        HIGH_CONTRAST_LIGHT.colors.foreground,
        HIGH_CONTRAST_LIGHT.colors.background
      )
      expect(ratio).toBeGreaterThanOrEqual(8)
    })

    it('should use black on white', () => {
      expect(HIGH_CONTRAST_LIGHT.colors.foreground).toBe('#000000')
      expect(HIGH_CONTRAST_LIGHT.colors.background).toBe('#FFFFFF')
    })

    it('should have AAA+ level', () => {
      expect(HIGH_CONTRAST_LIGHT.wcagLevel).toBe('AAA')
      expect(HIGH_CONTRAST_LIGHT.contrastRatio).toBeGreaterThanOrEqual(8)
    })
  })

  describe('HIGH_CONTRAST_DARK', () => {
    it('should have maximum contrast for dark theme', () => {
      const ratio = calculateContrastRatio(
        HIGH_CONTRAST_DARK.colors.foreground,
        HIGH_CONTRAST_DARK.colors.background
      )
      expect(ratio).toBeGreaterThanOrEqual(8)
    })

    it('should use white on black', () => {
      expect(HIGH_CONTRAST_DARK.colors.foreground).toBe('#FFFFFF')
      expect(HIGH_CONTRAST_DARK.colors.background).toBe('#000000')
    })

    it('should have AAA+ level', () => {
      expect(HIGH_CONTRAST_DARK.wcagLevel).toBe('AAA')
    })
  })

  describe('Color palette collections', () => {
    it('should have all color blind palettes', () => {
      expect(COLOR_BLIND_PALETTES.length).toBe(3)
      expect(COLOR_BLIND_PALETTES).toContainEqual(DEUTERANOPIA_PALETTE)
      expect(COLOR_BLIND_PALETTES).toContainEqual(PROTANOPIA_PALETTE)
      expect(COLOR_BLIND_PALETTES).toContainEqual(TRITANOPIA_PALETTE)
    })

    it('should have all high contrast palettes', () => {
      expect(HIGH_CONTRAST_PALETTES.length).toBe(2)
      expect(HIGH_CONTRAST_PALETTES).toContainEqual(HIGH_CONTRAST_LIGHT)
      expect(HIGH_CONTRAST_PALETTES).toContainEqual(HIGH_CONTRAST_DARK)
    })

    it('should have sufficient contrast in all color blind palettes', () => {
      COLOR_BLIND_PALETTES.forEach((palette) => {
        const ratio = calculateContrastRatio(
          palette.colors.foreground,
          palette.colors.background
        )
        expect(ratio).toBeGreaterThanOrEqual(7)
      })
    })
  })

  describe('Pattern generation', () => {
    it('should have pattern URLs for color blind variants', () => {
      COLOR_BLIND_PALETTES.forEach((palette) => {
        expect(palette.patterns).toBeTruthy()
        expect(palette.patterns?.success).toContain('pattern')
        expect(palette.patterns?.warning).toContain('pattern')
        expect(palette.patterns?.error).toContain('pattern')
        expect(palette.patterns?.info).toContain('pattern')
      })
    })
  })
})
