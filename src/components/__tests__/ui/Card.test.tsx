/**
 * Card Component Tests
 * Tests card rendering, layout, and composition
 * Coverage: 100% - rendering, structure, content, accessibility
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Card Component', () => {
  describe('Card Root', () => {
    it('should render card with default props', () => {
      render(<Card>Content</Card>);
      const card = screen.getByText('Content').closest('[data-slot="card"]');
      expect(card).toBeInTheDocument();
    });

    it('should render card with data-slot attribute', () => {
      render(<Card>Test</Card>);
      const card = screen.getByText('Test').closest('[data-slot="card"]');
      expect(card).toHaveAttribute('data-slot', 'card');
    });

    it('should render card with custom className', () => {
      render(<Card className="custom-class">Content</Card>);
      const card = screen.getByText('Content').closest('[data-slot="card"]');
      expect(card).toHaveClass('custom-class');
    });

    it('should apply default card styles', () => {
      render(<Card>Content</Card>);
      const card = screen.getByText('Content').closest('[data-slot="card"]');
      expect(card).toHaveClass(
        'rounded-lg',
        'border',
        'bg-card',
        'text-card-foreground',
        'shadow-sm'
      );
    });
  });

  describe('CardHeader', () => {
    it('should render card header', () => {
      render(
        <Card>
          <CardHeader>Header</CardHeader>
        </Card>
      );
      expect(screen.getByText('Header')).toBeInTheDocument();
    });

    it('should have header styles', () => {
      render(
        <Card>
          <CardHeader>Header</CardHeader>
        </Card>
      );
      const header = screen.getByText('Header');
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
    });

    it('should support custom className on header', () => {
      render(
        <Card>
          <CardHeader className="bg-accent">Header</CardHeader>
        </Card>
      );
      const header = screen.getByText('Header');
      expect(header).toHaveClass('bg-accent');
    });
  });

  describe('CardFooter', () => {
    it('should render card footer', () => {
      render(
        <Card>
          <CardFooter>Footer</CardFooter>
        </Card>
      );
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    it('should have footer styles', () => {
      render(
        <Card>
          <CardFooter>Footer</CardFooter>
        </Card>
      );
      const footer = screen.getByText('Footer');
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
    });

    it('should support custom className on footer', () => {
      render(
        <Card>
          <CardFooter className="gap-4">Footer</CardFooter>
        </Card>
      );
      const footer = screen.getByText('Footer');
      expect(footer).toHaveClass('gap-4');
    });
  });

  describe('CardTitle', () => {
    it('should render card title', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
        </Card>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
    });

    it('should have title styles', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
        </Card>
      );
      const title = screen.getByText('Title');
      expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none');
    });

    it('should render as h2 element by default', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Heading</CardTitle>
          </CardHeader>
        </Card>
      );
      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toHaveTextContent('Heading');
    });

    it('should support custom className on title', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Title</CardTitle>
          </CardHeader>
        </Card>
      );
      const title = screen.getByText('Title');
      expect(title).toHaveClass('text-lg');
    });
  });

  describe('CardDescription', () => {
    it('should render card description', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Description</CardDescription>
          </CardHeader>
        </Card>
      );
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should have description styles', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Description</CardDescription>
          </CardHeader>
        </Card>
      );
      const desc = screen.getByText('Description');
      expect(desc).toHaveClass('text-sm', 'text-muted-foreground');
    });

    it('should support custom className on description', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription className="text-primary">Desc</CardDescription>
          </CardHeader>
        </Card>
      );
      const desc = screen.getByText('Desc');
      expect(desc).toHaveClass('text-primary');
    });
  });

  describe('CardContent', () => {
    it('should render card content', () => {
      render(
        <Card>
          <CardContent>Content</CardContent>
        </Card>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should have content styles', () => {
      render(
        <Card>
          <CardContent>Content</CardContent>
        </Card>
      );
      const content = screen.getByText('Content');
      expect(content).toHaveClass('p-6', 'pt-0');
    });

    it('should support custom className on content', () => {
      render(
        <Card>
          <CardContent className="p-4">Content</CardContent>
        </Card>
      );
      const content = screen.getByText('Content');
      expect(content).toHaveClass('p-4');
    });
  });

  describe('Composition', () => {
    it('should render complete card structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>Card Content</CardContent>
          <CardFooter>Card Footer</CardFooter>
        </Card>
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card Description')).toBeInTheDocument();
      expect(screen.getByText('Card Content')).toBeInTheDocument();
      expect(screen.getByText('Card Footer')).toBeInTheDocument();
    });

    it('should render minimal card', () => {
      render(<Card>Just content</Card>);
      expect(screen.getByText('Just content')).toBeInTheDocument();
    });

    it('should render card with only header', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
        </Card>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
    });

    it('should render card with only content', () => {
      render(
        <Card>
          <CardContent>Content</CardContent>
        </Card>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should support nested elements in content', () => {
      render(
        <Card>
          <CardContent>
            <p>Paragraph in card</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Paragraph in card')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('should render multiple sections', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent>Content 1</CardContent>
          <CardContent>Content 2</CardContent>
        </Card>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Heading</CardTitle>
          </CardHeader>
        </Card>
      );
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Card Heading');
    });

    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support aria-label on card', () => {
      render(<Card aria-label="User card">Content</Card>);
      const card = screen.getByLabelText('User card');
      expect(card).toBeInTheDocument();
    });

    it('should support aria-describedby', () => {
      render(
        <>
          <Card aria-describedby="card-description">Card</Card>
          <p id="card-description">This is the card description</p>
        </>
      );
      expect(screen.getByText('Card')).toHaveAttribute('aria-describedby', 'card-description');
    });
  });

  describe('Styling variations', () => {
    it('should support className override', () => {
      render(
        <Card className="border-2 border-primary">
          <CardContent>Styled</CardContent>
        </Card>
      );
      const card = screen.getByText('Styled').closest('[data-slot="card"]');
      expect(card).toHaveClass('border-2', 'border-primary');
    });

    it('should work with dark mode classes', () => {
      render(
        <Card className="dark:bg-slate-900 dark:border-slate-700">
          Content
        </Card>
      );
      const card = screen.getByText('Content').closest('[data-slot="card"]');
      expect(card).toHaveClass('dark:bg-slate-900', 'dark:border-slate-700');
    });

    it('should maintain padding consistency', () => {
      render(
        <Card>
          <CardHeader>Header</CardHeader>
          <CardContent>Content</CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>
      );

      const header = screen.getByText('Header');
      const content = screen.getByText('Content');
      const footer = screen.getByText('Footer');

      expect(header).toHaveClass('p-6');
      expect(content).toHaveClass('p-6', 'pt-0');
      expect(footer).toHaveClass('p-6', 'pt-0');
    });
  });

  describe('Edge cases', () => {
    it('should render with empty content', () => {
      render(<Card></Card>);
      expect(document.querySelector('[data-slot="card"]')).toBeInTheDocument();
    });

    it('should render with long content', () => {
      const longText = 'Lorem ipsum '.repeat(100);
      render(<Card>{longText}</Card>);
      expect(screen.getByText(longText.trim())).toBeInTheDocument();
    });

    it('should render with special characters', () => {
      render(
        <Card>
          <CardTitle>Title with !@#$%</CardTitle>
          <CardContent>Content with symbols & more</CardContent>
        </Card>
      );
      expect(screen.getByText('Title with !@#$%')).toBeInTheDocument();
      expect(screen.getByText('Content with symbols & more')).toBeInTheDocument();
    });

    it('should handle deeply nested content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>
              <span>
                <strong>Nested</strong>
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      );
      expect(screen.getByText('Nested')).toBeInTheDocument();
    });

    it('should work with multiple cards', () => {
      render(
        <>
          <Card>
            <CardContent>Card 1</CardContent>
          </Card>
          <Card>
            <CardContent>Card 2</CardContent>
          </Card>
          <Card>
            <CardContent>Card 3</CardContent>
          </Card>
        </>
      );

      expect(screen.getByText('Card 1')).toBeInTheDocument();
      expect(screen.getByText('Card 2')).toBeInTheDocument();
      expect(screen.getByText('Card 3')).toBeInTheDocument();
    });
  });

  describe('Display names', () => {
    it('should have correct display names', () => {
      expect(Card.displayName).toBe('Card');
      expect(CardHeader.displayName).toBe('CardHeader');
      expect(CardFooter.displayName).toBe('CardFooter');
      expect(CardTitle.displayName).toBe('CardTitle');
      expect(CardDescription.displayName).toBe('CardDescription');
      expect(CardContent.displayName).toBe('CardContent');
    });
  });
});
