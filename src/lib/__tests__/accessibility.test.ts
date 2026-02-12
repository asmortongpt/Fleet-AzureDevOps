/**
 * Accessibility Utilities Test Suite
 * Tests for WCAG AAA compliance helpers
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  KeyboardKeys,
  handleKeyboardNavigation,
  checkColorContrast,
  getAccessibleFieldProps,
  getAccessibleTableProps,
  aria,
  useScreenReaderAnnouncement,
} from '../accessibility';

describe('Accessibility Utilities', () => {
  describe('KeyboardKeys Constants', () => {
    it('should have all standard keyboard keys defined', () => {
      expect(KeyboardKeys.ENTER).toBe('Enter');
      expect(KeyboardKeys.SPACE).toBe(' ');
      expect(KeyboardKeys.ESCAPE).toBe('Escape');
      expect(KeyboardKeys.TAB).toBe('Tab');
      expect(KeyboardKeys.ARROW_UP).toBe('ArrowUp');
      expect(KeyboardKeys.ARROW_DOWN).toBe('ArrowDown');
      expect(KeyboardKeys.ARROW_LEFT).toBe('ArrowLeft');
      expect(KeyboardKeys.ARROW_RIGHT).toBe('ArrowRight');
      expect(KeyboardKeys.HOME).toBe('Home');
      expect(KeyboardKeys.END).toBe('End');
    });
  });

  describe('handleKeyboardNavigation', () => {
    it('should call onEnter when Enter key is pressed', () => {
      const onEnter = vi.fn();
      const event = { key: 'Enter', preventDefault: vi.fn() } as any;

      handleKeyboardNavigation(event, { onEnter });

      expect(onEnter).toHaveBeenCalled();
    });

    it('should call onSpace and prevent default when Space key is pressed', () => {
      const onSpace = vi.fn();
      const event = { key: ' ', preventDefault: vi.fn() } as any;

      handleKeyboardNavigation(event, { onSpace });

      expect(onSpace).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should call onEscape when Escape key is pressed', () => {
      const onEscape = vi.fn();
      const event = { key: 'Escape', preventDefault: vi.fn() } as any;

      handleKeyboardNavigation(event, { onEscape });

      expect(onEscape).toHaveBeenCalled();
    });

    it('should call onArrowUp and prevent default when ArrowUp is pressed', () => {
      const onArrowUp = vi.fn();
      const event = { key: 'ArrowUp', preventDefault: vi.fn() } as any;

      handleKeyboardNavigation(event, { onArrowUp });

      expect(onArrowUp).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should call onArrowDown and prevent default when ArrowDown is pressed', () => {
      const onArrowDown = vi.fn();
      const event = { key: 'ArrowDown', preventDefault: vi.fn() } as any;

      handleKeyboardNavigation(event, { onArrowDown });

      expect(onArrowDown).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should not call any handler for unhandled keys', () => {
      const handlers = {
        onEnter: vi.fn(),
        onSpace: vi.fn(),
        onEscape: vi.fn(),
      };
      const event = { key: 'a', preventDefault: vi.fn() } as any;

      handleKeyboardNavigation(event, handlers);

      expect(handlers.onEnter).not.toHaveBeenCalled();
      expect(handlers.onSpace).not.toHaveBeenCalled();
      expect(handlers.onEscape).not.toHaveBeenCalled();
    });
  });

  describe('checkColorContrast', () => {
    it('should pass WCAG AAA for black on white', () => {
      const result = checkColorContrast('#000000', '#FFFFFF');
      expect(result.wcagAAA).toBe(true);
      expect(result.wcagAA).toBe(true);
      expect(result.ratio).toBeGreaterThan(7);
    });

    it('should pass WCAG AAA for white on black', () => {
      const result = checkColorContrast('#FFFFFF', '#000000');
      expect(result.wcagAAA).toBe(true);
      expect(result.wcagAA).toBe(true);
      expect(result.ratio).toBeGreaterThan(7);
    });

    it('should fail WCAG AAA for low contrast colors', () => {
      const result = checkColorContrast('#777777', '#888888');
      expect(result.wcagAAA).toBe(false);
      expect(result.ratio).toBeLessThan(7);
    });

    it('should return correct ratio for medium contrast', () => {
      const result = checkColorContrast('#595959', '#FFFFFF');
      expect(result.ratio).toBeGreaterThan(4.5);
      expect(result.wcagAA).toBe(true);
    });
  });

  describe('getAccessibleFieldProps', () => {
    it('should generate correct props for basic field', () => {
      const props = getAccessibleFieldProps({
        id: 'test-field',
        label: 'Test Field',
      });

      expect(props.field.id).toBe('test-field');
      expect(props.field['aria-invalid']).toBe(false);
      expect(props.field['aria-required']).toBeUndefined();
      expect(props.label.htmlFor).toBe('test-field');
    });

    it('should mark field as invalid when error is present', () => {
      const props = getAccessibleFieldProps({
        id: 'test-field',
        label: 'Test Field',
        error: 'This field is required',
      });

      expect(props.field['aria-invalid']).toBe(true);
      expect(props.field['aria-describedby']).toContain('test-field-error');
      expect(props.error?.id).toBe('test-field-error');
      expect(props.error?.role).toBe('alert');
    });

    it('should mark field as required', () => {
      const props = getAccessibleFieldProps({
        id: 'test-field',
        label: 'Test Field',
        required: true,
      });

      expect(props.field['aria-required']).toBe(true);
    });

    it('should mark field as disabled', () => {
      const props = getAccessibleFieldProps({
        id: 'test-field',
        label: 'Test Field',
        disabled: true,
      });

      expect(props.field['aria-disabled']).toBe(true);
    });

    it('should include description in aria-describedby', () => {
      const props = getAccessibleFieldProps({
        id: 'test-field',
        label: 'Test Field',
        description: 'This is a helpful description',
      });

      expect(props.field['aria-describedby']).toContain('test-field-description');
      expect(props.description?.id).toBe('test-field-description');
    });

    it('should combine error and description in aria-describedby', () => {
      const props = getAccessibleFieldProps({
        id: 'test-field',
        label: 'Test Field',
        error: 'Error message',
        description: 'Description',
      });

      const describedBy = props.field['aria-describedby'];
      expect(describedBy).toContain('test-field-error');
      expect(describedBy).toContain('test-field-description');
    });
  });

  describe('getAccessibleTableProps', () => {
    it('should generate correct table props', () => {
      const props = getAccessibleTableProps({
        caption: 'Fleet Vehicles',
      });

      expect(props.table.role).toBe('table');
      expect(props.table['aria-label']).toBe('Fleet Vehicles');
    });

    it('should generate correct column header props', () => {
      const props = getAccessibleTableProps({
        caption: 'Fleet Vehicles',
        sortable: true,
        sortColumn: 'name',
        sortDirection: 'asc',
      });

      const nameColumn = props.columnHeader('name');
      expect(nameColumn.role).toBe('columnheader');
      expect(nameColumn.scope).toBe('col');
      expect(nameColumn['aria-sort']).toBe('ascending');

      const otherColumn = props.columnHeader('status');
      expect(otherColumn['aria-sort']).toBe('none');
    });

    it('should handle descending sort', () => {
      const props = getAccessibleTableProps({
        caption: 'Fleet Vehicles',
        sortable: true,
        sortColumn: 'name',
        sortDirection: 'desc',
      });

      const nameColumn = props.columnHeader('name');
      expect(nameColumn['aria-sort']).toBe('descending');
    });
  });

  describe('aria helpers', () => {
    describe('aria.button', () => {
      it('should generate basic button attributes', () => {
        const attrs = aria.button({ label: 'Submit' });
        expect(attrs['aria-label']).toBe('Submit');
      });

      it('should include aria-expanded for expandable buttons', () => {
        const attrs = aria.button({ label: 'Menu', expanded: true });
        expect(attrs['aria-expanded']).toBe(true);
      });

      it('should include aria-pressed for toggle buttons', () => {
        const attrs = aria.button({ label: 'Toggle', pressed: true });
        expect(attrs['aria-pressed']).toBe(true);
      });

      it('should include aria-disabled for disabled buttons', () => {
        const attrs = aria.button({ label: 'Submit', disabled: true });
        expect(attrs['aria-disabled']).toBe(true);
      });
    });

    describe('aria.link', () => {
      it('should generate basic link attributes', () => {
        const attrs = aria.link({ label: 'Home' });
        expect(attrs['aria-label']).toBe('Home');
      });

      it('should mark current page', () => {
        const attrs = aria.link({ label: 'Dashboard', current: true });
        expect(attrs['aria-current']).toBe('page');
      });

      it('should indicate external links', () => {
        const attrs = aria.link({ label: 'Documentation', external: true });
        expect(attrs['aria-label']).toContain('opens in new tab');
      });
    });

    describe('aria.dialog', () => {
      it('should generate dialog attributes', () => {
        const attrs = aria.dialog({ label: 'Confirm Delete' });
        expect(attrs.role).toBe('dialog');
        expect(attrs['aria-label']).toBe('Confirm Delete');
        expect(attrs['aria-modal']).toBe(true);
      });

      it('should support non-modal dialogs', () => {
        const attrs = aria.dialog({ label: 'Info', modal: false });
        expect(attrs['aria-modal']).toBe(false);
      });
    });

    describe('aria.status', () => {
      it('should generate status attributes with default live region', () => {
        const attrs = aria.status({});
        expect(attrs.role).toBe('status');
        expect(attrs['aria-live']).toBe('polite');
        expect(attrs['aria-atomic']).toBe(true);
      });

      it('should support custom live region', () => {
        const attrs = aria.status({ live: 'assertive' });
        expect(attrs['aria-live']).toBe('assertive');
      });
    });

    describe('aria.alert', () => {
      it('should generate alert attributes', () => {
        const attrs = aria.alert({});
        expect(attrs.role).toBe('alert');
        expect(attrs['aria-live']).toBe('assertive');
        expect(attrs['aria-atomic']).toBe(true);
      });
    });
  });

  describe('useScreenReaderAnnouncement', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should announce a message', async () => {
      const { result } = renderHook(() => useScreenReaderAnnouncement());

      act(() => {
        result.current.announce('Test announcement');
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.announcement).toBe('Test announcement');
      expect(result.current.ariaLive).toBe('polite');
    });

    it('should support assertive announcements', async () => {
      const { result } = renderHook(() => useScreenReaderAnnouncement());

      act(() => {
        result.current.announce('Urgent message', 'assertive');
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.announcement).toBe('Urgent message');
      expect(result.current.ariaLive).toBe('assertive');
    });

    it('should clear announcement before setting new one', async () => {
      const { result } = renderHook(() => useScreenReaderAnnouncement());

      act(() => {
        result.current.announce('First message');
      });

      expect(result.current.announcement).toBe('');

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.announcement).toBe('First message');
    });
  });
});
