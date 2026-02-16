import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useThemeContext } from '../ThemeProvider'
import { ReactNode } from 'react'

const TestComponent = () => {
  const { theme, setTheme, resolvedTheme } = useThemeContext()

  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <div data-testid="resolved-theme">{resolvedTheme}</div>
      <div data-testid="root-class">{document.documentElement.className}</div>
      <button onClick={() => setTheme('light')} data-testid="set-light">Light</button>
      <button onClick={() => setTheme('dark')} data-testid="set-dark">Dark</button>
      <button onClick={() => setTheme('system')} data-testid="set-system">System</button>
    </div>
  )
}

const renderWithThemeProvider = (component: ReactNode, defaultTheme?: 'light' | 'dark' | 'system') => {
  return render(
    <ThemeProvider defaultTheme={defaultTheme}>
      {component}
    </ThemeProvider>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset document classes
    document.documentElement.className = ''
    // Reset matchMedia mock
    vi.clearAllMocks()
  })

  it('should render children', () => {
    renderWithThemeProvider(<div>Test Content</div>)
    expect(screen.getByText('Test Content')).toBeTruthy()
  })

  it('should initialize with default dark theme', () => {
    renderWithThemeProvider(<TestComponent />)
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark')
  })

  it('should initialize with custom default theme', () => {
    renderWithThemeProvider(<TestComponent />, 'light')
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
  })

  it('should add theme class to document root', async () => {
    renderWithThemeProvider(<TestComponent />)
    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  it('should switch from dark to light theme', async () => {
    const user = userEvent.setup()
    renderWithThemeProvider(<TestComponent />)

    const lightButton = screen.getByTestId('set-light')
    await user.click(lightButton)

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
      expect(document.documentElement.classList.contains('light')).toBe(true)
    })
  })

  it('should switch from light to dark theme', async () => {
    const user = userEvent.setup()
    renderWithThemeProvider(<TestComponent />, 'light')

    const darkButton = screen.getByTestId('set-dark')
    await user.click(darkButton)

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  it('should persist theme preference to localStorage', async () => {
    const user = userEvent.setup()
    const storageKey = 'test-theme'
    render(
      <ThemeProvider storageKey={storageKey}>
        <TestComponent />
      </ThemeProvider>
    )

    const lightButton = screen.getByTestId('set-light')
    await user.click(lightButton)

    await waitFor(() => {
      expect(localStorage.getItem(storageKey)).toBe('light')
    })
  })

  it('should restore theme from localStorage on mount', () => {
    const storageKey = 'test-theme'
    localStorage.setItem(storageKey, 'light')

    renderWithThemeProvider(
      <ThemeProvider storageKey={storageKey}>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
  })

  it('should support system theme preference', async () => {
    const mockMatchMedia = vi.fn(() => ({
      matches: true, // Prefer dark
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    })

    renderWithThemeProvider(<TestComponent />, 'system')

    await waitFor(() => {
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark')
    })
  })

  it('should listen for system theme preference changes', async () => {
    let changeHandler: ((e: MediaQueryListEvent) => void) | null = null

    const mockMatchMedia = vi.fn(() => ({
      matches: false, // Start with light
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') changeHandler = handler
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    })

    renderWithThemeProvider(<TestComponent />, 'system')

    await waitFor(() => {
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light')
    })

    // Simulate system preference change
    if (changeHandler) {
      changeHandler({
        matches: true,
        media: '(prefers-color-scheme: dark)',
      } as MediaQueryListEvent)

      await waitFor(() => {
        expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark')
      })
    }
  })

  it('should remove old theme classes before adding new ones', async () => {
    const user = userEvent.setup()
    renderWithThemeProvider(<TestComponent />)

    // Should have 'dark' initially
    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    // Switch to light
    const lightButton = screen.getByTestId('set-light')
    await user.click(lightButton)

    await waitFor(() => {
      expect(document.documentElement.classList.contains('light')).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  it('should update data-appearance attribute', async () => {
    const user = userEvent.setup()
    renderWithThemeProvider(<TestComponent />)

    const lightButton = screen.getByTestId('set-light')
    await user.click(lightButton)

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-appearance')).toBe('light')
    })
  })

  it('should throw error when useThemeContext is used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error
    console.error = vi.fn()

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useThemeContext must be used within a ThemeProvider')

    console.error = originalError
  })
})
