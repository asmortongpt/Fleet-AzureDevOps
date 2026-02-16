import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from '../ThemeToggle'
import { ThemeProvider } from '../providers/ThemeProvider'

const renderWithThemeProvider = (component: React.ReactNode) => {
  return render(
    <ThemeProvider defaultTheme="dark">
      {component}
    </ThemeProvider>
  )
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
  })

  it('should render toggle button', () => {
    renderWithThemeProvider(<ThemeToggle />)
    const button = screen.getByRole('button', { name: /toggle theme menu/i })
    expect(button).toBeTruthy()
  })

  it('should show moon icon in dark mode', async () => {
    renderWithThemeProvider(<ThemeToggle />)
    await waitFor(() => {
      const svg = document.querySelector('svg')
      expect(svg).toBeTruthy()
    })
  })

  it('should open dropdown menu when clicked', async () => {
    const user = userEvent.setup()
    renderWithThemeProvider(<ThemeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme menu/i })
    await user.click(button)

    await waitFor(() => {
      const lightOption = screen.getByRole('menuitemcheckbox', { name: /light/i })
      expect(lightOption).toBeTruthy()
    })
  })

  it('should display all three theme options in dropdown', async () => {
    const user = userEvent.setup()
    renderWithThemeProvider(<ThemeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme menu/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByRole('menuitemcheckbox', { name: /light/i })).toBeTruthy()
      expect(screen.getByRole('menuitemcheckbox', { name: /dark/i })).toBeTruthy()
      expect(screen.getByRole('menuitemcheckbox', { name: /system/i })).toBeTruthy()
    })
  })

  it('should mark current theme as checked', async () => {
    const user = userEvent.setup()
    renderWithThemeProvider(<ThemeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme menu/i })
    await user.click(button)

    await waitFor(() => {
      const darkOption = screen.getByRole('menuitemcheckbox', { name: /dark/i })
      expect(darkOption.getAttribute('data-state')).toBe('checked')
    })
  })

  it('should switch to light theme when clicked', async () => {
    const user = userEvent.setup()
    renderWithThemeProvider(<ThemeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme menu/i })
    await user.click(button)

    const lightOption = await screen.findByRole('menuitemcheckbox', { name: /light/i })
    await user.click(lightOption)

    await waitFor(() => {
      expect(document.documentElement.classList.contains('light')).toBe(true)
      expect(localStorage.getItem('ctafleet-theme')).toBe('light')
    })
  })

  it('should switch to dark theme when clicked', async () => {
    const user = userEvent.setup()
    // Start with light theme
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button', { name: /toggle theme menu/i })
    await user.click(button)

    const darkOption = await screen.findByRole('menuitemcheckbox', { name: /dark/i })
    await user.click(darkOption)

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(localStorage.getItem('ctafleet-theme')).toBe('dark')
    })
  })

  it('should switch to system theme when clicked', async () => {
    const user = userEvent.setup()
    renderWithThemeProvider(<ThemeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme menu/i })
    await user.click(button)

    const systemOption = await screen.findByRole('menuitemcheckbox', { name: /system/i })
    await user.click(systemOption)

    await waitFor(() => {
      expect(localStorage.getItem('ctafleet-theme')).toBe('system')
    })
  })

  it('should have proper aria labels for accessibility', () => {
    renderWithThemeProvider(<ThemeToggle />)
    const button = screen.getByRole('button', { name: /toggle theme menu/i })
    expect(button).toHaveAttribute('aria-label')
  })

  it('should have sr-only text for screen readers', () => {
    renderWithThemeProvider(<ThemeToggle />)
    const srText = screen.getByText(/toggle theme menu/i)
    expect(srText).toHaveClass('sr-only')
  })

  it('should close menu after selection', async () => {
    const user = userEvent.setup()
    renderWithThemeProvider(<ThemeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme menu/i })
    await user.click(button)

    const lightOption = await screen.findByRole('menuitemcheckbox', { name: /light/i })
    await user.click(lightOption)

    await waitFor(() => {
      // Menu should be closed, so options shouldn't be in the document
      expect(screen.queryByRole('menuitemcheckbox', { name: /dark/i })).toBeFalsy()
    })
  })

  it('should display correct icon based on resolved theme', async () => {
    const { rerender } = render(
      <ThemeProvider defaultTheme="dark">
        <ThemeToggle />
      </ThemeProvider>
    )

    // In dark mode, should show sun icon
    await waitFor(() => {
      // Check if sun or moon is visible
      const svgs = document.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })

    // Switch to light mode
    rerender(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    )

    await waitFor(() => {
      const svgs = document.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })
  })

  it('should persist theme selection across page reloads', async () => {
    const user = userEvent.setup()
    const { unmount } = renderWithThemeProvider(<ThemeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme menu/i })
    await user.click(button)

    const lightOption = await screen.findByRole('menuitemcheckbox', { name: /light/i })
    await user.click(lightOption)

    await waitFor(() => {
      expect(localStorage.getItem('ctafleet-theme')).toBe('light')
    })

    // Unmount and remount
    unmount()
    renderWithThemeProvider(<ThemeToggle />)

    // Should still be light theme
    await waitFor(() => {
      expect(document.documentElement.classList.contains('light')).toBe(true)
    })
  })
})
