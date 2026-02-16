import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { createRef } from 'react'
import { Input, SearchInput } from './input'

describe('Input Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('renders input with data-slot attribute', () => {
      const { container } = render(<Input />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toBeInTheDocument()
    })

    it('renders as HTML input element', () => {
      const { container } = render(<Input />)
      const input = container.querySelector('input')
      expect(input?.tagName).toBe('INPUT')
    })

    it('renders with default type', () => {
      const { container } = render(<Input />)
      const input = container.querySelector('input') as HTMLInputElement
      expect(input.type).toBe('text')
    })

    it('renders with custom type', () => {
      const { container } = render(<Input type="email" />)
      const input = container.querySelector('input') as HTMLInputElement
      expect(input.type).toBe('email')
    })

    it('renders with placeholder text', () => {
      render(<Input placeholder="Enter text..." />)
      const input = screen.getByPlaceholderText('Enter text...')
      expect(input).toBeInTheDocument()
    })

    it('renders with custom className', () => {
      const { container } = render(<Input className="custom-class" />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('custom-class')
    })
  })

  describe('Styling - Base Classes', () => {
    it('applies base height styling', () => {
      const { container } = render(<Input />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('h-11')
    })

    it('applies width and sizing', () => {
      const { container } = render(<Input />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('w-full', 'min-w-0')
    })

    it('applies rounded border styling', () => {
      const { container } = render(<Input />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('rounded-md', 'border')
    })

    it('applies padding', () => {
      const { container } = render(<Input />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('px-2', 'py-2.5')
    })

    it('applies text size styling', () => {
      const { container } = render(<Input />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('text-sm')
    })

    it('applies border color', () => {
      const { container } = render(<Input />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('border-border/50')
    })

    it('applies shadow', () => {
      const { container } = render(<Input />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('shadow-sm')
    })

    it('applies smooth transitions', () => {
      const { container } = render(<Input />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('transition-all', 'duration-200', 'ease-out')
    })
  })

  describe('Focus State', () => {
    it('applies focus styling', () => {
      const { container } = render(<Input />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('focus:outline-none')
      expect(input).toHaveClass('focus:border-primary/50')
      expect(input).toHaveClass('focus:ring-2')
      expect(input).toHaveClass('focus:ring-primary/20')
      expect(input).toHaveClass('focus:shadow-md')
    })

    it('receives focus', () => {
      render(<Input />)
      const input = screen.getByDisplayValue('') as HTMLInputElement
      input.focus()
      expect(input).toHaveFocus()
    })

    it('can be focused programmatically', () => {
      const ref = createRef<HTMLInputElement>()
      const { container } = render(<Input ref={ref} />)
      ref.current?.focus()
      expect(ref.current).toHaveFocus()
    })
  })

  describe('Hover State', () => {
    it('applies hover styling', () => {
      const { container } = render(<Input />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('hover:border-border')
    })
  })

  describe('Disabled State', () => {
    it('renders disabled input', () => {
      render(<Input disabled />)
      const input = screen.getByDisplayValue('') as HTMLInputElement
      expect(input).toBeDisabled()
    })

    it('applies disabled styling', () => {
      const { container } = render(<Input disabled />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('disabled:pointer-events-none')
      expect(input).toHaveClass('disabled:cursor-not-allowed')
      expect(input).toHaveClass('disabled:opacity-50')
    })

    it('prevents interaction when disabled', async () => {
      const handleChange = vi.fn()
      render(<Input disabled onChange={handleChange} />)
      const input = screen.getByDisplayValue('') as HTMLInputElement

      await userEvent.type(input, 'text')
      expect(handleChange).not.toHaveBeenCalled()
    })
  })

  describe('Error State', () => {
    it('renders with error prop', () => {
      const { container } = render(<Input error />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toBeInTheDocument()
    })

    it('applies error styling', () => {
      const { container } = render(<Input error />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('border-destructive/50')
      expect(input).toHaveClass('focus:border-destructive')
      expect(input).toHaveClass('focus:ring-destructive/20')
    })

    it('applies error styling without error prop using aria-invalid', () => {
      const { container } = render(<Input aria-invalid="true" />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('aria-invalid:border-destructive/50')
    })
  })

  describe('Input Types', () => {
    it('renders text input', () => {
      const { container } = render(<Input type="text" />)
      const input = container.querySelector('input') as HTMLInputElement
      expect(input.type).toBe('text')
    })

    it('renders email input', () => {
      const { container } = render(<Input type="email" />)
      const input = container.querySelector('input') as HTMLInputElement
      expect(input.type).toBe('email')
    })

    it('renders password input', () => {
      const { container } = render(<Input type="password" />)
      const input = container.querySelector('input') as HTMLInputElement
      expect(input.type).toBe('password')
    })

    it('renders number input', () => {
      const { container } = render(<Input type="number" />)
      const input = container.querySelector('input') as HTMLInputElement
      expect(input.type).toBe('number')
    })

    it('renders date input', () => {
      const { container } = render(<Input type="date" />)
      const input = container.querySelector('input') as HTMLInputElement
      expect(input.type).toBe('date')
    })

    it('renders file input with custom styling', () => {
      const { container } = render(<Input type="file" />)
      const input = container.querySelector('input')
      expect(input).toHaveClass('file:text-foreground')
      expect(input).toHaveClass('file:inline-flex')
      expect(input).toHaveClass('file:h-8')
    })

    it('renders search input type', () => {
      const { container } = render(<Input type="search" />)
      const input = container.querySelector('input') as HTMLInputElement
      expect(input.type).toBe('search')
    })

    it('renders tel input', () => {
      const { container } = render(<Input type="tel" />)
      const input = container.querySelector('input') as HTMLInputElement
      expect(input.type).toBe('tel')
    })

    it('renders url input', () => {
      const { container } = render(<Input type="url" />)
      const input = container.querySelector('input') as HTMLInputElement
      expect(input.type).toBe('url')
    })
  })

  describe('Interactions', () => {
    it('accepts user input', async () => {
      render(<Input />)
      const input = screen.getByDisplayValue('') as HTMLInputElement

      await userEvent.type(input, 'hello world')
      expect(input.value).toBe('hello world')
    })

    it('calls onChange callback', async () => {
      const handleChange = vi.fn()
      render(<Input onChange={handleChange} />)
      const input = screen.getByDisplayValue('') as HTMLInputElement

      await userEvent.type(input, 'test')
      expect(handleChange).toHaveBeenCalled()
    })

    it('calls onFocus callback', () => {
      const handleFocus = vi.fn()
      render(<Input onFocus={handleFocus} />)
      const input = screen.getByDisplayValue('') as HTMLInputElement

      fireEvent.focus(input)
      expect(handleFocus).toHaveBeenCalled()
    })

    it('calls onBlur callback', () => {
      const handleBlur = vi.fn()
      render(<Input onBlur={handleBlur} />)
      const input = screen.getByDisplayValue('') as HTMLInputElement

      fireEvent.focus(input)
      fireEvent.blur(input)
      expect(handleBlur).toHaveBeenCalled()
    })

    it('calls onKeyDown callback', () => {
      const handleKeyDown = vi.fn()
      render(<Input onKeyDown={handleKeyDown} />)
      const input = screen.getByDisplayValue('') as HTMLInputElement

      fireEvent.keyDown(input, { key: 'Enter' })
      expect(handleKeyDown).toHaveBeenCalled()
    })
  })

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = createRef<HTMLInputElement>()
      render(<Input ref={ref} />)
      expect(ref.current).toBeInstanceOf(HTMLInputElement)
    })

    it('allows direct DOM access via ref', () => {
      const ref = createRef<HTMLInputElement>()
      render(<Input ref={ref} defaultValue="test" />)
      expect(ref.current?.value).toBe('test')
    })

    it('allows programmatic value setting via ref', () => {
      const ref = createRef<HTMLInputElement>()
      render(<Input ref={ref} />)
      if (ref.current) {
        ref.current.value = 'programmatically set'
        fireEvent.change(ref.current)
      }
      expect(ref.current?.value).toBe('programmatically set')
    })
  })

  describe('Accessibility', () => {
    it('is an input element', () => {
      render(<Input />)
      const input = screen.getByDisplayValue('')
      expect((input as HTMLInputElement).tagName).toBe('INPUT')
    })

    it('supports aria-label', () => {
      render(<Input aria-label="Email address" />)
      const input = screen.getByLabelText('Email address')
      expect(input).toBeInTheDocument()
    })

    it('supports aria-describedby', () => {
      render(
        <div>
          <Input aria-describedby="error-message" />
          <div id="error-message">This field is required</div>
        </div>
      )
      const input = screen.getByDisplayValue('')
      expect(input).toHaveAttribute('aria-describedby', 'error-message')
    })

    it('supports aria-invalid for error states', () => {
      render(<Input aria-invalid="true" />)
      const input = screen.getByDisplayValue('')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('supports aria-required', () => {
      render(<Input required aria-required="true" />)
      const input = screen.getByDisplayValue('')
      expect(input).toHaveAttribute('aria-required', 'true')
    })
  })

  describe('Selection Styling', () => {
    it('applies selection styling', () => {
      const { container } = render(<Input />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('selection:bg-primary/20')
      expect(input).toHaveClass('selection:text-foreground')
    })
  })

  describe('Placeholder Styling', () => {
    it('applies placeholder styling', () => {
      const { container } = render(<Input />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('placeholder:text-muted-foreground/60')
    })
  })

  describe('Dark Mode', () => {
    it('applies dark mode background styling', () => {
      const { container } = render(<Input />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('dark:bg-card/50')
      expect(input).toHaveClass('dark:hover:bg-card/70')
      expect(input).toHaveClass('dark:focus:bg-card/80')
    })
  })

  describe('Props Spreading', () => {
    it('spreads standard HTML attributes', () => {
      render(
        <Input
          data-testid="custom-input"
          id="email-field"
          name="email"
          defaultValue="test@example.com"
        />
      )

      const input = screen.getByTestId('custom-input') as HTMLInputElement
      expect(input).toHaveAttribute('id', 'email-field')
      expect(input).toHaveAttribute('name', 'email')
      expect(input.value).toBe('test@example.com')
    })

    it('supports required attribute', () => {
      render(<Input required />)
      const input = screen.getByDisplayValue('')
      expect(input).toHaveAttribute('required')
    })

    it('supports autoComplete attribute', () => {
      render(<Input autoComplete="email" />)
      const input = screen.getByDisplayValue('')
      expect(input).toHaveAttribute('autoComplete', 'email')
    })

    it('supports minLength attribute', () => {
      render(<Input minLength={5} />)
      const input = screen.getByDisplayValue('')
      expect(input).toHaveAttribute('minLength', '5')
    })

    it('supports maxLength attribute', () => {
      render(<Input maxLength={20} />)
      const input = screen.getByDisplayValue('')
      expect(input).toHaveAttribute('maxLength', '20')
    })
  })
})

describe('SearchInput Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('renders search input with data-slot attribute', () => {
      const { container } = render(<SearchInput />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toBeInTheDocument()
    })

    it('renders as search type input', () => {
      const { container } = render(<SearchInput />)
      const input = container.querySelector('input') as HTMLInputElement
      expect(input.type).toBe('search')
    })

    it('renders with search-specific styling', () => {
      const { container } = render(<SearchInput />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('h-11')
      expect(input).toHaveClass('w-full')
    })

    it('renders with icon padding on left', () => {
      const { container } = render(<SearchInput />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('pl-10', 'pr-2')
    })

    it('renders with placeholder', () => {
      render(<SearchInput placeholder="Search..." />)
      const input = screen.getByPlaceholderText('Search...')
      expect(input).toBeInTheDocument()
    })

    it('renders with custom className', () => {
      const { container } = render(<SearchInput className="custom-search" />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('custom-search')
    })
  })

  describe('Styling - Base Classes', () => {
    it('applies base height and width', () => {
      const { container } = render(<SearchInput />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('h-11', 'w-full')
    })

    it('applies rounded border styling', () => {
      const { container } = render(<SearchInput />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('rounded-md', 'border')
    })

    it('applies search-specific padding for icon space', () => {
      const { container } = render(<SearchInput />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('pl-10', 'pr-2', 'py-2.5')
    })

    it('applies smooth transitions', () => {
      const { container } = render(<SearchInput />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('transition-all', 'duration-200', 'ease-out')
    })

    it('applies shadow', () => {
      const { container } = render(<SearchInput />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('shadow-sm')
    })
  })

  describe('Focus State', () => {
    it('applies focus styling', () => {
      const { container } = render(<SearchInput />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('focus:outline-none')
      expect(input).toHaveClass('focus:border-primary/50')
      expect(input).toHaveClass('focus:ring-2')
      expect(input).toHaveClass('focus:ring-primary/20')
      expect(input).toHaveClass('focus:shadow-md')
      expect(input).toHaveClass('focus:bg-background')
    })

    it('receives focus', () => {
      render(<SearchInput />)
      const input = screen.getByDisplayValue('') as HTMLInputElement
      input.focus()
      expect(input).toHaveFocus()
    })
  })

  describe('Hover State', () => {
    it('applies hover styling', () => {
      const { container } = render(<SearchInput />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('hover:border-border')
      expect(input).toHaveClass('hover:bg-muted/30')
    })
  })

  describe('Search-specific Features', () => {
    it('hides webkit search cancel button styling', () => {
      const { container } = render(<SearchInput />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('[&::-webkit-search-cancel-button]:appearance-none')
    })
  })

  describe('Dark Mode', () => {
    it('applies dark mode styling', () => {
      const { container } = render(<SearchInput />)
      const input = container.querySelector('[data-slot="input"]')
      expect(input).toHaveClass('dark:bg-muted/30')
      expect(input).toHaveClass('dark:hover:bg-muted/50')
      expect(input).toHaveClass('dark:focus:bg-muted/40')
    })
  })

  describe('Interactions', () => {
    it('accepts search input', async () => {
      render(<SearchInput />)
      const input = screen.getByDisplayValue('') as HTMLInputElement

      await userEvent.type(input, 'search query')
      expect(input.value).toBe('search query')
    })

    it('calls onChange callback', async () => {
      const handleChange = vi.fn()
      render(<SearchInput onChange={handleChange} />)
      const input = screen.getByDisplayValue('') as HTMLInputElement

      await userEvent.type(input, 'test')
      expect(handleChange).toHaveBeenCalled()
    })
  })

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = createRef<HTMLInputElement>()
      render(<SearchInput ref={ref} />)
      expect(ref.current).toBeInstanceOf(HTMLInputElement)
    })

    it('allows direct DOM access via ref', () => {
      const ref = createRef<HTMLInputElement>()
      render(<SearchInput ref={ref} defaultValue="test search" />)
      expect(ref.current?.value).toBe('test search')
    })
  })

  describe('Accessibility', () => {
    it('supports aria-label', () => {
      render(<SearchInput aria-label="Search products" />)
      const input = screen.getByLabelText('Search products')
      expect(input).toBeInTheDocument()
    })

    it('supports required attribute', () => {
      render(<SearchInput required />)
      const input = screen.getByDisplayValue('')
      expect(input).toHaveAttribute('required')
    })
  })

  describe('Props Spreading', () => {
    it('spreads standard HTML attributes', () => {
      render(
        <SearchInput
          data-testid="search-field"
          id="main-search"
          name="search"
          placeholder="Search..."
        />
      )

      const input = screen.getByTestId('search-field') as HTMLInputElement
      expect(input).toHaveAttribute('id', 'main-search')
      expect(input).toHaveAttribute('name', 'search')
    })

    it('supports autoComplete attribute', () => {
      render(<SearchInput autoComplete="off" />)
      const input = screen.getByDisplayValue('')
      expect(input).toHaveAttribute('autoComplete', 'off')
    })
  })
})
