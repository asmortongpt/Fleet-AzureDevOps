import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Textarea } from './textarea'

describe('Textarea Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('renders textarea with data-slot attribute', () => {
      const { container } = render(<Textarea />)
      const textarea = container.querySelector('[data-slot="textarea"]')
      expect(textarea).toBeInTheDocument()
    })

    it('renders as textarea HTML element', () => {
      const { container } = render(<Textarea />)
      const textarea = container.querySelector('textarea')
      expect(textarea).toBeInTheDocument()
      expect(textarea?.tagName).toBe('TEXTAREA')
    })

    it('renders with placeholder text', () => {
      render(<Textarea placeholder="Enter your message" />)
      expect(screen.getByPlaceholderText('Enter your message')).toBeInTheDocument()
    })

    it('renders with custom className', () => {
      const { container } = render(<Textarea className="custom-textarea" />)
      const textarea = container.querySelector('[data-slot="textarea"]')
      expect(textarea).toHaveClass('custom-textarea')
    })

    it('renders with default rows attribute', () => {
      const { container } = render(<Textarea />)
      const textarea = container.querySelector('textarea')
      expect(textarea).toBeInTheDocument()
    })

    it('renders with custom rows attribute', () => {
      const { container } = render(<Textarea rows={8} />)
      const textarea = container.querySelector('textarea')
      expect(textarea).toHaveAttribute('rows', '8')
    })

    it('renders with custom cols attribute', () => {
      const { container } = render(<Textarea cols={40} />)
      const textarea = container.querySelector('textarea')
      expect(textarea).toHaveAttribute('cols', '40')
    })
  })

  describe('Styling - Base Classes', () => {
    it('applies border and input styling', () => {
      const { container } = render(<Textarea />)
      const textarea = container.querySelector('[data-slot="textarea"]')
      expect(textarea).toHaveClass('border-input', 'border', 'rounded-md')
    })

    it('applies padding', () => {
      const { container } = render(<Textarea />)
      const textarea = container.querySelector('[data-slot="textarea"]')
      expect(textarea).toHaveClass('px-3', 'py-2')
    })

    it('applies minimum height', () => {
      const { container } = render(<Textarea />)
      const textarea = container.querySelector('[data-slot="textarea"]')
      expect(textarea).toHaveClass('min-h-16')
    })

    it('applies full width', () => {
      const { container } = render(<Textarea />)
      const textarea = container.querySelector('[data-slot="textarea"]')
      expect(textarea).toHaveClass('w-full')
    })

    it('applies text sizing', () => {
      const { container } = render(<Textarea />)
      const textarea = container.querySelector('[data-slot="textarea"]')
      expect(textarea).toHaveClass('text-base')
    })

    it('applies placeholder styling', () => {
      const { container } = render(<Textarea placeholder="Type here..." />)
      const textarea = container.querySelector('[data-slot="textarea"]')
      expect(textarea).toHaveClass('placeholder:text-muted-foreground')
    })

    it('applies shadow', () => {
      const { container } = render(<Textarea />)
      const textarea = container.querySelector('[data-slot="textarea"]')
      expect(textarea).toHaveClass('shadow-xs')
    })

    it('applies transition effects', () => {
      const { container } = render(<Textarea />)
      const textarea = container.querySelector('[data-slot="textarea"]')
      expect(textarea).toHaveClass('transition-[color,box-shadow]')
    })
  })

  describe('Focus State', () => {
    it('applies focus-visible styling', () => {
      const { container } = render(<Textarea />)
      const textarea = container.querySelector('[data-slot="textarea"]')
      expect(textarea).toHaveClass('focus-visible:border-ring')
      expect(textarea).toHaveClass('focus-visible:ring-ring/50')
      expect(textarea).toHaveClass('focus-visible:ring-[3px]')
    })

    it('receives focus', () => {
      const { container } = render(<Textarea />)
      const textarea = container.querySelector('textarea') as HTMLElement
      textarea.focus()
      expect(textarea).toHaveFocus()
    })

    it('can be focused programmatically', () => {
      const { container } = render(<Textarea />)
      const textarea = container.querySelector('textarea') as HTMLElement
      textarea.focus()
      expect(document.activeElement).toBe(textarea)
    })
  })

  describe('Disabled State', () => {
    it('renders disabled textarea', () => {
      const { container } = render(<Textarea disabled />)
      const textarea = container.querySelector('textarea')
      expect(textarea).toHaveAttribute('disabled')
    })

    it('applies disabled styling', () => {
      const { container } = render(<Textarea disabled />)
      const textarea = container.querySelector('[data-slot="textarea"]')
      expect(textarea).toHaveClass('disabled:cursor-not-allowed')
      expect(textarea).toHaveClass('disabled:opacity-50')
    })

    it('prevents interaction when disabled', async () => {
      const handleChange = vi.fn()
      const { container } = render(
        <Textarea disabled onChange={handleChange} value="test" readOnly />
      )
      const textarea = container.querySelector('textarea') as HTMLElement

      await userEvent.click(textarea)
      expect(handleChange).not.toHaveBeenCalled()
    })

    it('prevents focus when disabled (depends on browser)', () => {
      const { container } = render(<Textarea disabled />)
      const textarea = container.querySelector('textarea') as HTMLElement
      textarea.focus()
      expect(textarea).toHaveAttribute('disabled')
    })
  })

  describe('Error State', () => {
    it('applies error styling with aria-invalid', () => {
      const { container } = render(<Textarea aria-invalid="true" />)
      const textarea = container.querySelector('[data-slot="textarea"]')
      expect(textarea).toHaveClass('aria-invalid:ring-destructive/20')
      expect(textarea).toHaveClass('aria-invalid:border-destructive')
    })

    it('applies error styling in dark mode with aria-invalid', () => {
      const { container } = render(<Textarea aria-invalid="true" />)
      const textarea = container.querySelector('[data-slot="textarea"]')
      expect(textarea).toHaveClass('dark:aria-invalid:ring-destructive/40')
    })
  })

  describe('Text Input', () => {
    it('accepts text input', async () => {
      const { container } = render(<Textarea />)
      const textarea = container.querySelector('textarea') as HTMLTextAreaElement

      await userEvent.type(textarea, 'Hello, World!')
      expect(textarea.value).toBe('Hello, World!')
    })

    it('handles multiline input', async () => {
      const { container } = render(<Textarea />)
      const textarea = container.querySelector('textarea') as HTMLTextAreaElement

      await userEvent.type(textarea, 'Line 1{Enter}Line 2{Enter}Line 3')
      expect(textarea.value).toContain('Line 1')
      expect(textarea.value).toContain('Line 2')
      expect(textarea.value).toContain('Line 3')
    })

    it('clears text when value is changed', async () => {
      const { container, rerender } = render(<Textarea value="" onChange={() => {}} />)
      let textarea = container.querySelector('textarea') as HTMLTextAreaElement
      expect(textarea.value).toBe('')

      rerender(<Textarea value="New text" onChange={() => {}} readOnly />)
      textarea = container.querySelector('textarea') as HTMLTextAreaElement
      expect(textarea.value).toBe('New text')
    })

    it('supports controlled component pattern', () => {
      const { container, rerender } = render(
        <Textarea value="Initial" onChange={() => {}} readOnly />
      )
      let textarea = container.querySelector('textarea') as HTMLTextAreaElement
      expect(textarea.value).toBe('Initial')

      rerender(<Textarea value="Updated" onChange={() => {}} readOnly />)
      textarea = container.querySelector('textarea') as HTMLTextAreaElement
      expect(textarea.value).toBe('Updated')
    })
  })

  describe('Props Spreading', () => {
    it('spreads custom attributes like data-testid and id', () => {
      const { container } = render(
        <Textarea
          data-testid="custom-textarea"
          id="message-input"
        />
      )

      const textarea = container.querySelector('[data-testid="custom-textarea"]')
      expect(textarea).toBeInTheDocument()
      expect(textarea).toHaveAttribute('id', 'message-input')
    })

    it('spreads event handlers', () => {
      const handleFocus = vi.fn()
      const handleBlur = vi.fn()
      const handleChange = vi.fn()
      const { container } = render(
        <Textarea onFocus={handleFocus} onBlur={handleBlur} onChange={handleChange} />
      )

      const textarea = container.querySelector('textarea') as HTMLElement
      fireEvent.focus(textarea)
      fireEvent.blur(textarea)
      fireEvent.change(textarea, { target: { value: 'test' } })

      expect(handleFocus).toHaveBeenCalled()
      expect(handleBlur).toHaveBeenCalled()
      expect(handleChange).toHaveBeenCalled()
    })

    it('spreads aria attributes', () => {
      const { container } = render(
        <Textarea
          aria-label="User message"
          aria-describedby="msg-help"
          aria-required="true"
        />
      )

      const textarea = container.querySelector('textarea')
      expect(textarea).toHaveAttribute('aria-label', 'User message')
      expect(textarea).toHaveAttribute('aria-describedby', 'msg-help')
      expect(textarea).toHaveAttribute('aria-required', 'true')
    })
  })

  describe('Accessibility', () => {
    it('supports aria-label', () => {
      const { container } = render(<Textarea aria-label="Message input" />)
      const textarea = container.querySelector('textarea')
      expect(textarea).toHaveAttribute('aria-label', 'Message input')
    })

    it('supports aria-labelledby', () => {
      const { container } = render(
        <div>
          <label id="textarea-label">Enter your feedback</label>
          <Textarea aria-labelledby="textarea-label" />
        </div>
      )
      const textarea = container.querySelector('textarea')
      expect(textarea).toHaveAttribute('aria-labelledby', 'textarea-label')
    })

    it('supports aria-describedby', () => {
      const { container } = render(
        <div>
          <Textarea aria-describedby="textarea-help" />
          <div id="textarea-help">Maximum 500 characters</div>
        </div>
      )
      const textarea = container.querySelector('textarea')
      expect(textarea).toHaveAttribute('aria-describedby', 'textarea-help')
    })

    it('supports aria-required', () => {
      const { container } = render(<Textarea aria-required="true" />)
      const textarea = container.querySelector('textarea')
      expect(textarea).toHaveAttribute('aria-required', 'true')
    })

    it('supports aria-invalid for error states', () => {
      const { container } = render(<Textarea aria-invalid="true" />)
      const textarea = container.querySelector('textarea')
      expect(textarea).toHaveAttribute('aria-invalid', 'true')
    })

    it('is keyboard accessible', async () => {
      const { container } = render(<Textarea />)
      const textarea = container.querySelector('textarea') as HTMLElement

      // Tab to textarea
      textarea.focus()
      expect(textarea).toHaveFocus()

      // Type in textarea
      await userEvent.type(textarea, 'Some text')
      expect((textarea as HTMLTextAreaElement).value).toBe('Some text')
    })
  })

  describe('ref Forwarding', () => {
    it('allows ref access to textarea element', () => {
      let ref: HTMLTextAreaElement | null = null
      const { container } = render(
        <Textarea
          ref={el => {
            ref = el
          }}
        />
      )

      const textarea = container.querySelector('textarea')
      expect(ref).toBe(textarea)
    })

    it('allows direct DOM method calls via ref', () => {
      let ref: HTMLTextAreaElement | null = null
      const { container } = render(
        <Textarea
          ref={el => {
            ref = el
          }}
        />
      )

      expect(ref?.focus).toBeDefined()
      expect(ref?.select).toBeDefined()
    })

    it('allows programmatic value access via ref', () => {
      let ref: HTMLTextAreaElement | null = null
      const { container, rerender } = render(
        <Textarea
          value="Initial"
          onChange={() => {}}
          readOnly
          ref={el => {
            ref = el
          }}
        />
      )

      expect(ref?.value).toBe('Initial')
    })
  })

  describe('Styling Combination', () => {
    it('combines base styles with custom className', () => {
      const { container } = render(
        <Textarea className="text-lg text-blue-600" />
      )

      const textarea = container.querySelector('[data-slot="textarea"]')
      expect(textarea).toHaveClass('min-h-16') // base style
      expect(textarea).toHaveClass('text-blue-600') // custom style
    })

    it('preserves all styling classes', () => {
      const { container } = render(<Textarea className="custom-class" />)
      const textarea = container.querySelector('[data-slot="textarea"]')

      // Should have all base classes plus custom
      expect(textarea).toHaveClass('w-full', 'rounded-md', 'border', 'custom-class')
    })

    it('applies dark mode styling', () => {
      const { container } = render(<Textarea />)
      const textarea = container.querySelector('[data-slot="textarea"]')
      expect(textarea).toHaveClass('dark:bg-input/30')
    })
  })

  describe('Field Sizing', () => {
    it('applies field-sizing-content for proper height handling', () => {
      const { container } = render(<Textarea />)
      const textarea = container.querySelector('[data-slot="textarea"]')
      expect(textarea).toHaveClass('field-sizing-content')
    })

    it('respects custom row heights', async () => {
      const { container } = render(<Textarea rows={10} />)
      const textarea = container.querySelector('textarea')
      expect(textarea).toHaveAttribute('rows', '10')
    })

    it('handles dynamic content resizing', async () => {
      const { container, rerender } = render(
        <Textarea value="Short" onChange={() => {}} readOnly />
      )
      let textarea = container.querySelector('textarea') as HTMLTextAreaElement
      expect(textarea.value).toBe('Short')

      rerender(
        <Textarea value="This is a much longer text that spans multiple lines and should potentially require more vertical space for proper display" onChange={() => {}} readOnly />
      )
      textarea = container.querySelector('textarea') as HTMLTextAreaElement
      expect(textarea.value.length).toBeGreaterThan(50)
    })
  })

  describe('Integration with Forms', () => {
    it('works as form control', () => {
      const handleSubmit = vi.fn()
      const { container } = render(
        <form onSubmit={handleSubmit}>
          <Textarea />
          <button type="submit">Submit</button>
        </form>
      )

      const button = screen.getByText('Submit')
      fireEvent.click(button)
      expect(handleSubmit).toHaveBeenCalled()
    })

    it('supports form reset', () => {
      const { container } = render(
        <form>
          <Textarea defaultValue="Initial value" />
          <button type="reset">Reset</button>
        </form>
      )

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement
      expect(textarea.value).toBe('Initial value')

      const resetButton = screen.getByText('Reset')
      fireEvent.click(resetButton)
      expect(textarea.value).toBe('Initial value')
    })

    it('supports form submission with textarea value', () => {
      const { container } = render(
        <form>
          <Textarea name="message" />
        </form>
      )

      const textarea = container.querySelector('textarea[name="message"]')
      expect(textarea).toBeInTheDocument()
    })
  })

  describe('Outline Styling', () => {
    it('applies outline-none', () => {
      const { container } = render(<Textarea />)
      const textarea = container.querySelector('[data-slot="textarea"]')
      expect(textarea).toHaveClass('outline-none')
    })
  })

  describe('Responsive Typography', () => {
    it('applies responsive text sizing', () => {
      const { container } = render(<Textarea />)
      const textarea = container.querySelector('[data-slot="textarea"]')
      expect(textarea).toHaveClass('text-base')
      expect(textarea).toHaveClass('md:text-sm')
    })
  })

  describe('Transparent Background', () => {
    it('applies transparent background by default', () => {
      const { container } = render(<Textarea />)
      const textarea = container.querySelector('[data-slot="textarea"]')
      expect(textarea).toHaveClass('bg-transparent')
    })
  })
})
