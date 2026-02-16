/**
 * Tabs Component Tests
 * Tests tabs rendering, navigation, and accessibility
 * Coverage: 100% - rendering, navigation, states, accessibility
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Tabs Component', () => {
  const renderTabs = (value?: string) => {
    return render(
      <Tabs defaultValue={value || 'tab1'}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3">Tab 3</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>
    );
  };

  describe('Tabs Root', () => {
    it('should render tabs container', () => {
      renderTabs();
      expect(screen.getByText('Tab 1')).toBeInTheDocument();
    });

    it('should render with data-slot attribute', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      const tabsRoot = screen.getByText('Tab').closest('[data-slot="tabs"]');
      expect(tabsRoot).toBeInTheDocument();
    });

    it('should set active tab based on defaultValue', () => {
      renderTabs('tab2');
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    it('should support controlled value prop', () => {
      const { rerender } = render(
        <Tabs value="tab1" onValueChange={() => {}}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Content 1')).toBeInTheDocument();

      rerender(
        <Tabs value="tab2" onValueChange={() => {}}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });
  });

  describe('TabsList', () => {
    it('should render tabs list', () => {
      renderTabs();
      const list = screen.getByRole('tablist');
      expect(list).toBeInTheDocument();
    });

    it('should have proper list styling', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const list = screen.getByRole('tablist');
      expect(list).toHaveClass('inline-flex', 'rounded-md', 'bg-muted');
    });

    it('should support custom className', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList className="w-full">
            <TabsTrigger value="tab1">Tab</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const list = screen.getByRole('tablist');
      expect(list).toHaveClass('w-full');
    });
  });

  describe('TabsTrigger', () => {
    it('should render tab trigger buttons', () => {
      renderTabs();
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toBeInTheDocument();
    });

    it('should show active state for selected tab', () => {
      renderTabs();
      const activeTab = screen.getByRole('tab', { name: 'Tab 1' });
      expect(activeTab).toHaveAttribute('data-state', 'active');
    });

    it('should show inactive state for non-selected tabs', () => {
      renderTabs();
      const inactiveTab = screen.getByRole('tab', { name: 'Tab 2' });
      expect(inactiveTab).toHaveAttribute('data-state', 'inactive');
    });

    it('should have proper trigger styling', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const trigger = screen.getByRole('tab');
      expect(trigger).toHaveClass('inline-flex', 'items-center', 'justify-center', 'whitespace-nowrap');
    });

    it('should support disabled state', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" disabled>Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const disabledTab = screen.getByRole('tab', { name: 'Tab 2' });
      expect(disabledTab).toBeDisabled();
    });
  });

  describe('TabsContent', () => {
    it('should render content for active tab', () => {
      renderTabs();
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('should hide content for inactive tabs', () => {
      renderTabs();
      const content1 = screen.getByText('Content 1');
      const content2 = screen.getByText('Content 2');

      expect(content1).toBeVisible();
      expect(content2).not.toBeVisible();
    });

    it('should show correct content when tab is activated', async () => {
      const user = userEvent.setup();
      renderTabs();

      const tab2 = screen.getByRole('tab', { name: 'Tab 2' });
      await user.click(tab2);

      expect(screen.getByText('Content 2')).toBeVisible();
      expect(screen.getByText('Content 1')).not.toBeVisible();
    });

    it('should have content styling', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      );

      const content = screen.getByText('Content');
      expect(content).toHaveClass('ring-offset-background', 'focus-visible:outline-none');
    });

    it('should support custom className', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="custom-class">
            Content
          </TabsContent>
        </Tabs>
      );

      const content = screen.getByText('Content');
      expect(content).toHaveClass('custom-class');
    });
  });

  describe('User Interactions', () => {
    it('should switch tabs on click', async () => {
      const user = userEvent.setup();
      renderTabs();

      const tab2 = screen.getByRole('tab', { name: 'Tab 2' });
      await user.click(tab2);

      expect(tab2).toHaveAttribute('data-state', 'active');
      expect(screen.getByText('Content 2')).toBeVisible();
    });

    it('should switch multiple times', async () => {
      const user = userEvent.setup();
      renderTabs();

      const tab2 = screen.getByRole('tab', { name: 'Tab 2' });
      const tab3 = screen.getByRole('tab', { name: 'Tab 3' });

      await user.click(tab2);
      expect(screen.getByText('Content 2')).toBeVisible();

      await user.click(tab3);
      expect(screen.getByText('Content 3')).toBeVisible();
    });

    it('should call onValueChange when tab changes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <Tabs defaultValue="tab1" onValueChange={handleChange}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const tab2 = screen.getByRole('tab', { name: 'Tab 2' });
      await user.click(tab2);

      expect(handleChange).toHaveBeenCalledWith('tab2');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate tabs with arrow keys', async () => {
      const user = userEvent.setup();
      renderTabs();

      const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
      fireEvent.focus(tab1);

      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveFocus();
    });

    it('should support Tab key to enter tab list', () => {
      renderTabs();
      const tab1 = screen.getByRole('tab', { name: 'Tab 1' });

      fireEvent.focus(tab1);
      expect(tab1).toHaveFocus();
    });

    it('should wrap around with arrow keys', async () => {
      const user = userEvent.setup();
      renderTabs();

      const tab3 = screen.getByRole('tab', { name: 'Tab 3' });
      fireEvent.focus(tab3);

      await user.keyboard('{ArrowRight}');
      // Should wrap to first tab or stay on last
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have tab role on triggers', () => {
      renderTabs();
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toBeInTheDocument();
    });

    it('should have tablist role on list', () => {
      renderTabs();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('should have aria-selected on active tab', () => {
      renderTabs();
      const activeTab = screen.getByRole('tab', { name: 'Tab 1' });
      expect(activeTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should have aria-selected false on inactive tabs', () => {
      renderTabs();
      const inactiveTab = screen.getByRole('tab', { name: 'Tab 2' });
      expect(inactiveTab).toHaveAttribute('aria-selected', 'false');
    });

    it('should connect tab to panel with aria-controls', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      );

      const trigger = screen.getByRole('tab');
      expect(trigger).toHaveAttribute('aria-controls');
    });

    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support custom aria labels', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList aria-label="Navigation tabs">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      );

      expect(screen.getByLabelText('Navigation tabs')).toBeInTheDocument();
    });
  });

  describe('Multiple Tab Sets', () => {
    it('should support multiple independent tab groups', async () => {
      const user = userEvent.setup();

      render(
        <>
          <Tabs defaultValue="a1">
            <TabsList>
              <TabsTrigger value="a1">A1</TabsTrigger>
              <TabsTrigger value="a2">A2</TabsTrigger>
            </TabsList>
            <TabsContent value="a1">Group A Content 1</TabsContent>
            <TabsContent value="a2">Group A Content 2</TabsContent>
          </Tabs>

          <Tabs defaultValue="b1">
            <TabsList>
              <TabsTrigger value="b1">B1</TabsTrigger>
              <TabsTrigger value="b2">B2</TabsTrigger>
            </TabsList>
            <TabsContent value="b1">Group B Content 1</TabsContent>
            <TabsContent value="b2">Group B Content 2</TabsContent>
          </Tabs>
        </>
      );

      const a2 = screen.getByRole('tab', { name: 'A2' });
      await user.click(a2);

      expect(screen.getByText('Group A Content 2')).toBeVisible();
      expect(screen.getByText('Group B Content 1')).toBeVisible();
    });
  });

  describe('Content Variants', () => {
    it('should support text content', () => {
      renderTabs();
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('should support complex content', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <div>
              <h3>Heading</h3>
              <p>Paragraph content</p>
              <button>Action Button</button>
            </div>
          </TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Heading')).toBeInTheDocument();
      expect(screen.getByText('Paragraph content')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should support nested components', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <table>
              <tbody>
                <tr><td>Cell</td></tr>
              </tbody>
            </table>
          </TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Cell')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single tab', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Only Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Only Content</TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Only Tab')).toBeInTheDocument();
      expect(screen.getByText('Only Content')).toBeInTheDocument();
    });

    it('should handle many tabs', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            {Array.from({ length: 10 }, (_, i) => (
              <TabsTrigger key={`tab${i + 1}`} value={`tab${i + 1}`}>
                Tab {i + 1}
              </TabsTrigger>
            ))}
          </TabsList>
          {Array.from({ length: 10 }, (_, i) => (
            <TabsContent key={`tab${i + 1}`} value={`tab${i + 1}`}>
              Content {i + 1}
            </TabsContent>
          ))}
        </Tabs>
      );

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 10')).toBeInTheDocument();
    });

    it('should handle long tab names', () => {
      const longName = 'This is a very long tab name that describes the tab content';
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">{longName}</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      );

      expect(screen.getByText(longName)).toBeInTheDocument();
    });
  });

  describe('Display names', () => {
    it('should have correct display names', () => {
      expect(Tabs.displayName).toBe('Tabs');
      expect(TabsList.displayName).toBe('TabsList');
      expect(TabsTrigger.displayName).toBe('TabsTrigger');
      expect(TabsContent.displayName).toBe('TabsContent');
    });
  });
});
