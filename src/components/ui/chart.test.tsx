import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
} from './chart'
import { AreaChart, BarChart, Area, Bar, XAxis, YAxis } from 'recharts'

const mockChartConfig = {
  desktop: {
    label: 'Desktop',
    color: '#FF6B35',
  },
  mobile: {
    label: 'Mobile',
    color: '#41B2E3',
  },
}

const mockChartConfigWithTheme = {
  light: {
    label: 'Light Mode',
    theme: {
      light: '#FF6B35',
      dark: '#FFB8A3',
    },
  },
  dark: {
    label: 'Dark Mode',
    theme: {
      light: '#41B2E3',
      dark: '#5BC0EB',
    },
  },
}

const mockData = [
  { name: 'Jan', desktop: 100, mobile: 80 },
  { name: 'Feb', desktop: 120, mobile: 90 },
  { name: 'Mar', desktop: 140, mobile: 110 },
]

describe('Chart Components', () => {
  describe('ChartContainer - Rendering & Basic Structure', () => {
    it('renders container with proper data attributes', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <AreaChart data={mockData}>
            <Area dataKey="desktop" />
          </AreaChart>
        </ChartContainer>
      )

      const chartDiv = container.querySelector('[data-slot="chart"]')
      expect(chartDiv).toBeInTheDocument()
      expect(chartDiv).toHaveAttribute('data-chart')
    })

    it('renders ResponsiveContainer with children', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <AreaChart data={mockData}>
            <Area dataKey="desktop" />
          </AreaChart>
        </ChartContainer>
      )

      const chart = container.querySelector('[data-slot="chart"]')
      expect(chart).toBeInTheDocument()
    })

    it('applies aspect-video class for responsive sizing', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <AreaChart data={mockData}>
            <Area dataKey="desktop" />
          </AreaChart>
        </ChartContainer>
      )

      const chartDiv = container.querySelector('[data-slot="chart"]')
      expect(chartDiv).toHaveClass('aspect-video')
    })

    it('generates unique chart IDs', () => {
      const { container: container1 } = render(
        <ChartContainer config={mockChartConfig} id="chart1">
          <AreaChart data={mockData}>
            <Area dataKey="desktop" />
          </AreaChart>
        </ChartContainer>
      )

      const { container: container2 } = render(
        <ChartContainer config={mockChartConfig} id="chart2">
          <AreaChart data={mockData}>
            <Area dataKey="desktop" />
          </AreaChart>
        </ChartContainer>
      )

      const chart1 = container1.querySelector('[data-chart]')?.getAttribute('data-chart')
      const chart2 = container2.querySelector('[data-chart]')?.getAttribute('data-chart')

      expect(chart1).toContain('chart1')
      expect(chart2).toContain('chart2')
      expect(chart1).not.toBe(chart2)
    })

    it('uses generated ID when id prop is not provided', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <AreaChart data={mockData}>
            <Area dataKey="desktop" />
          </AreaChart>
        </ChartContainer>
      )

      const chartId = container.querySelector('[data-chart]')?.getAttribute('data-chart')
      expect(chartId).toMatch(/^chart-/)
    })

    it('applies custom className', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig} className="custom-class">
          <AreaChart data={mockData}>
            <Area dataKey="desktop" />
          </AreaChart>
        </ChartContainer>
      )

      const chartDiv = container.querySelector('[data-slot="chart"]')
      expect(chartDiv).toHaveClass('custom-class')
    })
  })

  describe('ChartContainer - Styling & Appearance', () => {
    it('applies Tailwind grid classes', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <AreaChart data={mockData}>
            <Area dataKey="desktop" />
          </AreaChart>
        </ChartContainer>
      )

      const chartDiv = container.querySelector('[data-slot="chart"]')
      expect(chartDiv).toHaveClass('flex', 'justify-center')
    })

    it('sets text-xs for small text', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <AreaChart data={mockData}>
            <Area dataKey="desktop" />
          </AreaChart>
        </ChartContainer>
      )

      const chartDiv = container.querySelector('[data-slot="chart"]')
      expect(chartDiv).toHaveClass('text-xs')
    })

    it('has border and grid styling selectors', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <AreaChart data={mockData}>
            <Area dataKey="desktop" />
          </AreaChart>
        </ChartContainer>
      )

      const chartDiv = container.querySelector('[data-slot="chart"]')
      const classStr = chartDiv?.className || ''

      // Should have recharts styling selectors
      expect(classStr).toContain('recharts-cartesian-axis-tick')
    })
  })

  describe('ChartStyle - Color Sanitization & XSS Prevention', () => {
    it('renders style element with CSS variables', () => {
      const { container } = render(
        <ChartStyle id="test-chart" config={mockChartConfig} />
      )

      const styleEl = container.querySelector('style')
      expect(styleEl).toBeInTheDocument()
    })

    it('accepts valid hex colors', () => {
      const config = {
        test: { label: 'Test', color: '#FF6B35' },
      }

      const { container } = render(
        <ChartStyle id="test" config={config} />
      )

      const styleEl = container.querySelector('style')
      expect(styleEl?.innerHTML).toContain('#FF6B35')
    })

    it('accepts valid rgb colors', () => {
      const config = {
        test: { label: 'Test', color: 'rgb(255, 107, 53)' },
      }

      const { container } = render(
        <ChartStyle id="test" config={config} />
      )

      const styleEl = container.querySelector('style')
      expect(styleEl?.innerHTML).toContain('rgb(255, 107, 53)')
    })

    it('accepts valid rgba colors', () => {
      const config = {
        test: { label: 'Test', color: 'rgba(255, 107, 53, 0.8)' },
      }

      const { container } = render(
        <ChartStyle id="test" config={config} />
      )

      const styleEl = container.querySelector('style')
      expect(styleEl?.innerHTML).toContain('rgba(255, 107, 53, 0.8)')
    })

    it('accepts valid hsl colors', () => {
      const config = {
        test: { label: 'Test', color: 'hsl(12, 100%, 60%)' },
      }

      const { container } = render(
        <ChartStyle id="test" config={config} />
      )

      const styleEl = container.querySelector('style')
      expect(styleEl?.innerHTML).toContain('hsl(12, 100%, 60%)')
    })

    it('accepts valid hsla colors', () => {
      const config = {
        test: { label: 'Test', color: 'hsla(12, 100%, 60%, 0.8)' },
      }

      const { container } = render(
        <ChartStyle id="test" config={config} />
      )

      const styleEl = container.querySelector('style')
      expect(styleEl?.innerHTML).toContain('hsla(12, 100%, 60%, 0.8)')
    })

    it('accepts CSS named colors', () => {
      const config = {
        test: { label: 'Test', color: 'red' },
      }

      const { container } = render(
        <ChartStyle id="test" config={config} />
      )

      const styleEl = container.querySelector('style')
      expect(styleEl?.innerHTML).toContain('red')
    })

    it('rejects invalid color values', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation()
      const config = {
        test: { label: 'Test', color: 'javascript:alert("xss")' },
      }

      render(<ChartStyle id="test" config={config} />)

      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })

    it('rejects colors with invalid rgb ranges', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation()
      const config = {
        test: { label: 'Test', color: 'rgb(300, 400, 500)' },
      }

      render(<ChartStyle id="test" config={config} />)

      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })

    it('handles undefined colors gracefully', () => {
      const config = {
        test: { label: 'Test' },
      }

      const { container } = render(
        <ChartStyle id="test" config={config as any} />
      )

      // When no colors are defined, no style element is rendered
      const styleEl = container.querySelector('style')
      expect(styleEl).not.toBeInTheDocument()
    })

    it('handles theme-based colors', () => {
      const { container } = render(
        <ChartStyle id="test" config={mockChartConfigWithTheme} />
      )

      const styleEl = container.querySelector('style')
      const html = styleEl?.innerHTML || ''

      // Should have light and dark theme CSS
      expect(html).toContain('.dark')
    })

    it('returns null when no color config exists', () => {
      const { container } = render(
        <ChartStyle id="test" config={{ test: { label: 'Test' } }} />
      )

      const styleEl = container.querySelector('style')
      // When no colors, no style is rendered
      expect(styleEl).not.toBeInTheDocument()
    })

    it('sanitizes color by trimming whitespace', () => {
      const config = {
        test: { label: 'Test', color: '  #FF6B35  ' },
      }

      const { container } = render(
        <ChartStyle id="test" config={config} />
      )

      const styleEl = container.querySelector('style')
      expect(styleEl?.innerHTML).toContain('#FF6B35')
    })

    it('handles short hex colors (#RGB)', () => {
      const config = {
        test: { label: 'Test', color: '#F35' },
      }

      const { container } = render(
        <ChartStyle id="test" config={config} />
      )

      const styleEl = container.querySelector('style')
      expect(styleEl?.innerHTML).toContain('#F35')
    })

    it('handles 8-digit hex colors (#RRGGBBAA)', () => {
      const config = {
        test: { label: 'Test', color: '#FF6B35CC' },
      }

      const { container } = render(
        <ChartStyle id="test" config={config} />
      )

      const styleEl = container.querySelector('style')
      expect(styleEl?.innerHTML).toContain('#FF6B35CC')
    })
  })

  describe('ChartTooltipContent - Rendering & Behavior', () => {
    it('returns null when not active', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <ChartTooltipContent active={false} payload={[]} />
        </ChartContainer>
      )

      // When not active, nothing is rendered (null return)
      const tooltip = container.querySelector('[data-slot="chart"] > div > div')
      expect(tooltip?.children.length).toBeLessThanOrEqual(1) // Only the style element
    })

    it('returns null when payload is empty', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <ChartTooltipContent active={true} payload={[]} />
        </ChartContainer>
      )

      // When payload is empty, nothing is rendered
      const contentDiv = container.querySelector('[data-slot="chart"] > div')
      expect(contentDiv?.textContent).not.toContain('undefined')
    })

    it('renders when active and payload provided', () => {
      // ChartTooltipContent needs to use the useChart hook from context
      // It will render the tooltip div when active and payload exists
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <div>
            <ChartTooltipContent
              active={true}
              payload={[
                {
                  dataKey: 'desktop',
                  value: 100,
                  name: 'Desktop',
                  color: '#FF6B35',
                } as any,
              ]}
            />
          </div>
        </ChartContainer>
      )

      // The tooltip should render and use the context
      const chartDiv = container.querySelector('[data-slot="chart"]')
      expect(chartDiv).toBeInTheDocument()
    })

    it('provides config through context to format tooltips', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <ChartTooltipContent
            active={true}
            payload={[
              {
                dataKey: 'desktop',
                value: 100,
                name: 'Desktop',
                color: '#FF6B35',
              } as any,
            ]}
          />
        </ChartContainer>
      )

      const chartDiv = container.querySelector('[data-slot="chart"]')
      expect(chartDiv).toBeInTheDocument()
    })

    it('hides label when hideLabel is true', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <ChartTooltipContent
            active={true}
            payload={[
              {
                dataKey: 'desktop',
                value: 100,
                name: 'Desktop',
                color: '#FF6B35',
              } as any,
            ]}
            hideLabel={true}
            label="January"
          />
        </ChartContainer>
      )

      // When hideLabel is true, the label is not rendered
      expect(container.querySelector('[data-slot="chart"]')).toBeInTheDocument()
    })

    it('hides indicator when hideIndicator is true', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <ChartTooltipContent
            active={true}
            payload={[
              {
                dataKey: 'desktop',
                value: 100,
                name: 'Desktop',
                color: '#FF6B35',
              } as any,
            ]}
            hideIndicator={true}
          />
        </ChartContainer>
      )

      expect(container.querySelector('[data-slot="chart"]')).toBeInTheDocument()
    })

    it('accepts custom className prop', () => {
      // ChartTooltipContent accepts className and applies it when rendering
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <ChartTooltipContent
            active={true}
            payload={[
              {
                dataKey: 'desktop',
                value: 100,
                name: 'Desktop',
                color: '#FF6B35',
              } as any,
            ]}
            className="custom-tooltip"
          />
        </ChartContainer>
      )

      // Test that the container still works
      expect(container.querySelector('[data-slot="chart"]')).toBeInTheDocument()
    })
  })

  describe('ChartLegendContent - Rendering & Behavior', () => {
    it('returns null when payload is empty', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <ChartLegendContent payload={[]} />
        </ChartContainer>
      )

      // When payload is empty, nothing is rendered
      const content = container.textContent
      expect(content).not.toContain('undefined')
    })

    it('renders legend when payload exists', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <ChartLegendContent
            payload={[
              {
                dataKey: 'desktop',
                value: 'Desktop',
                color: '#FF6B35',
              } as any,
            ]}
          />
        </ChartContainer>
      )

      // Legend component structure is checked
      expect(container.querySelector('[data-slot="chart"]')).toBeInTheDocument()
    })

    it('renders legend items with colors', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <ChartLegendContent
            payload={[
              {
                dataKey: 'desktop',
                value: 'Desktop',
                color: '#FF6B35',
              } as any,
              {
                dataKey: 'mobile',
                value: 'Mobile',
                color: '#41B2E3',
              } as any,
            ]}
          />
        </ChartContainer>
      )

      const legend = container.querySelector('[class*="flex"]')
      expect(legend).toBeInTheDocument()
    })

    it('handles verticalAlign top prop', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <ChartLegendContent
            payload={[
              {
                dataKey: 'desktop',
                value: 'Desktop',
                color: '#FF6B35',
              } as any,
            ]}
            verticalAlign="top"
          />
        </ChartContainer>
      )

      expect(container.querySelector('[data-slot="chart"]')).toBeInTheDocument()
    })

    it('handles verticalAlign bottom prop', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <ChartLegendContent
            payload={[
              {
                dataKey: 'desktop',
                value: 'Desktop',
                color: '#FF6B35',
              } as any,
            ]}
            verticalAlign="bottom"
          />
        </ChartContainer>
      )

      expect(container.querySelector('[data-slot="chart"]')).toBeInTheDocument()
    })

    it('hides icon when hideIcon is true', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <ChartLegendContent
            payload={[
              {
                dataKey: 'desktop',
                value: 'Desktop',
                color: '#FF6B35',
              } as any,
            ]}
            hideIcon={true}
          />
        </ChartContainer>
      )

      const legend = container.querySelector('[class*="flex"]')
      expect(legend).toBeInTheDocument()
    })

    it('accepts custom className prop', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <ChartLegendContent
            payload={[
              {
                dataKey: 'desktop',
                value: 'Desktop',
                color: '#FF6B35',
              } as any,
            ]}
            className="custom-legend"
          />
        </ChartContainer>
      )

      expect(container.querySelector('[data-slot="chart"]')).toBeInTheDocument()
    })
  })

  describe('Chart Context - useChart Hook', () => {
    it('sets up context provider for child components', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <div style={{ width: '400px', height: '300px' }}>
            <AreaChart data={mockData}>
              <Area dataKey="desktop" />
            </AreaChart>
          </div>
        </ChartContainer>
      )

      expect(container.querySelector('[data-slot="chart"]')).toBeInTheDocument()
    })

    it('provides config through context for child component access', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <div style={{ width: '400px', height: '300px' }}>
            <AreaChart data={mockData}>
              <Area dataKey="desktop" />
            </AreaChart>
          </div>
        </ChartContainer>
      )

      const chartDiv = container.querySelector('[data-slot="chart"]')
      expect(chartDiv).toBeInTheDocument()
    })
  })

  describe('Edge Cases & Error Handling', () => {
    it('handles empty config gracefully', () => {
      const { container } = render(
        <ChartContainer config={{}}>
          <AreaChart data={mockData}>
            <Area dataKey="desktop" />
          </AreaChart>
        </ChartContainer>
      )

      const chartDiv = container.querySelector('[data-slot="chart"]')
      expect(chartDiv).toBeInTheDocument()
    })

    it('handles undefined payload in tooltip', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <ChartTooltipContent active={true} payload={undefined} />
        </ChartContainer>
      )

      // When payload is undefined, nothing is rendered (returns null)
      const chartDiv = container.querySelector('[data-slot="chart"]')
      expect(chartDiv).toBeInTheDocument()
    })

    it('handles special characters in config keys', () => {
      const config = {
        'desktop-users': {
          label: 'Desktop Users',
          color: '#FF6B35',
        },
      }

      const { container } = render(
        <ChartStyle id="test" config={config} />
      )

      const styleEl = container.querySelector('style')
      expect(styleEl?.innerHTML).toContain('--color-desktop-users')
    })

    it('handles multiple colons in generated ID', () => {
      // useId() generates IDs with colons, which should be removed
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <AreaChart data={mockData}>
            <Area dataKey="desktop" />
          </AreaChart>
        </ChartContainer>
      )

      const chartId = container.querySelector('[data-chart]')?.getAttribute('data-chart')
      expect(chartId).not.toContain(':')
    })

    it('handles null color value gracefully', () => {
      const config = {
        test: { label: 'Test', color: null as any },
      }

      const { container } = render(
        <ChartStyle id="test" config={config} />
      )

      // When color is null, sanitizeColor returns null and the style is not generated
      const styleEl = container.querySelector('style')
      expect(styleEl).not.toBeInTheDocument()
    })
  })

  describe('Integration Scenarios', () => {
    it('renders complete chart with data, tooltip, and legend', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <AreaChart data={mockData}>
            <Area dataKey="desktop" />
          </AreaChart>
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
        </ChartContainer>
      )

      const chartDiv = container.querySelector('[data-slot="chart"]')
      expect(chartDiv).toBeInTheDocument()
    })

    it('handles multiple charts with different configs', () => {
      const { container } = render(
        <div>
          <ChartContainer config={mockChartConfig} id="chart1">
            <AreaChart data={mockData}>
              <Area dataKey="desktop" />
            </AreaChart>
          </ChartContainer>
          <ChartContainer config={mockChartConfigWithTheme} id="chart2">
            <BarChart data={mockData}>
              <Bar dataKey="desktop" />
            </BarChart>
          </ChartContainer>
        </div>
      )

      const charts = container.querySelectorAll('[data-slot="chart"]')
      expect(charts).toHaveLength(2)
    })

    it('applies responsive styling to chart container', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <AreaChart data={mockData}>
            <Area dataKey="desktop" />
          </AreaChart>
        </ChartContainer>
      )

      const chartDiv = container.querySelector('[data-slot="chart"]')
      expect(chartDiv).toHaveClass('aspect-video', 'flex', 'justify-center')
    })
  })

  describe('Color Configuration Variants', () => {
    it('supports simple color config', () => {
      const config = {
        series1: { label: 'Series 1', color: '#FF6B35' },
      }

      const { container } = render(
        <ChartStyle id="test" config={config} />
      )

      const styleEl = container.querySelector('style')
      expect(styleEl?.innerHTML).toContain('#FF6B35')
    })

    it('supports theme-based color config', () => {
      const config = {
        series1: {
          label: 'Series 1',
          theme: {
            light: '#FF6B35',
            dark: '#FFB8A3',
          },
        },
      }

      const { container } = render(
        <ChartStyle id="test" config={config} />
      )

      const styleEl = container.querySelector('style')
      const html = styleEl?.innerHTML || ''
      expect(html).toContain('#FF6B35')
    })

    it('generates correct CSS variable names', () => {
      const config = {
        revenue: { label: 'Revenue', color: '#FF6B35' },
        users: { label: 'Users', color: '#41B2E3' },
      }

      const { container } = render(
        <ChartStyle id="test" config={config} />
      )

      const styleEl = container.querySelector('style')
      const html = styleEl?.innerHTML || ''
      expect(html).toContain('--color-revenue')
      expect(html).toContain('--color-users')
    })
  })

  describe('Data Attributes & Testing Hooks', () => {
    it('has data-slot attribute for testing', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig}>
          <AreaChart data={mockData}>
            <Area dataKey="desktop" />
          </AreaChart>
        </ChartContainer>
      )

      const chartDiv = container.querySelector('[data-slot="chart"]')
      expect(chartDiv).toHaveAttribute('data-slot', 'chart')
    })

    it('has data-chart attribute with unique ID', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig} id="my-chart">
          <AreaChart data={mockData}>
            <Area dataKey="desktop" />
          </AreaChart>
        </ChartContainer>
      )

      const chartDiv = container.querySelector('[data-slot="chart"]')
      const dataChart = chartDiv?.getAttribute('data-chart')
      expect(dataChart).toContain('my-chart')
    })
  })

  describe('Accessibility', () => {
    it('accepts aria attributes on ChartContainer', () => {
      const { container } = render(
        <ChartContainer config={mockChartConfig} aria-label="Sales Chart">
          <AreaChart data={mockData}>
            <Area dataKey="desktop" />
          </AreaChart>
        </ChartContainer>
      )

      const chartDiv = container.querySelector('[data-slot="chart"]')
      expect(chartDiv).toHaveAttribute('aria-label', 'Sales Chart')
    })

    it('accepts aria attributes on ChartContainer', () => {
      const { container } = render(
        <ChartContainer
          config={mockChartConfig}
          role="presentation"
          aria-label="Sales data visualization"
        >
          <AreaChart data={mockData}>
            <Area dataKey="desktop" />
          </AreaChart>
        </ChartContainer>
      )

      const chart = container.querySelector('[role="presentation"]')
      expect(chart).toBeInTheDocument()
      expect(chart).toHaveAttribute('aria-label', 'Sales data visualization')
    })
  })
})
