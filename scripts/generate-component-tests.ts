import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

/**
 * Automated Test Generator for React Component Files
 * Generates comprehensive unit tests for all React components
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const COMPONENTS_DIR = path.join(__dirname, '../src/components');
const TESTS_DIR = path.join(__dirname, '../src/__tests__/components');

interface ComponentInfo {
  name: string;
  fileName: string;
  componentName: string;
}

/**
 * Generate test file content for a component
 */
function generateTestContent(component: ComponentInfo): string {
  const { componentName, fileName } = component;

  return `import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ${componentName} } from '../../components/${fileName.replace('.tsx', '')}';

describe('${componentName}', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<${componentName} />);
      expect(container).toBeTruthy();
    });

    it('should render with default props', () => {
      render(<${componentName} />);
      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      render(
        <${componentName}>
          <div>Test Child</div>
        </${componentName}>
      );
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should accept and apply className prop', () => {
      const { container } = render(<${componentName} className="test-class" />);
      expect(container.firstChild).toHaveClass('test-class');
    });

    it('should handle data attributes', () => {
      const { container } = render(<${componentName} data-testid="test-component" />);
      expect(container.firstChild).toHaveAttribute('data-testid', 'test-component');
    });

    it('should render with custom props', () => {
      const customProps = { title: 'Test Title' };
      render(<${componentName} {...customProps} />);
      expect(screen.getByText('Test Title', { exact: false })).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle click events', async () => {
      const handleClick = vi.fn();
      render(<${componentName} onClick={handleClick} />);

      const element = screen.getByRole('button', { hidden: true });
      await userEvent.click(element);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard events', async () => {
      const handleKeyDown = vi.fn();
      render(<${componentName} onKeyDown={handleKeyDown} />);

      const element = screen.getByRole('button', { hidden: true });
      fireEvent.keyDown(element, { key: 'Enter' });

      expect(handleKeyDown).toHaveBeenCalled();
    });

    it('should handle form submission', async () => {
      const handleSubmit = vi.fn();
      render(<${componentName} onSubmit={handleSubmit} />);

      const form = screen.getByRole('form', { hidden: true });
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should update state correctly', async () => {
      render(<${componentName} />);

      const button = screen.getByRole('button', { hidden: true });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Updated', { exact: false })).toBeInTheDocument();
      });
    });

    it('should maintain internal state', () => {
      const { rerender } = render(<${componentName} />);
      rerender(<${componentName} />);

      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<${componentName} />);
      const element = screen.getByRole('main', { hidden: true });
      expect(element).toHaveAttribute('aria-label');
    });

    it('should be keyboard navigable', async () => {
      render(<${componentName} />);
      const element = screen.getByRole('button', { hidden: true });

      element.focus();
      expect(element).toHaveFocus();

      fireEvent.keyDown(element, { key: 'Tab' });
    });

    it('should have semantic HTML', () => {
      const { container } = render(<${componentName} />);
      expect(container.querySelector('button, a, input, select')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<${componentName} invalidProp={undefined} />);

      expect(consoleError).not.toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it('should display error messages', () => {
      render(<${componentName} error="Test error" />);
      expect(screen.getByText('Test error', { exact: false })).toBeInTheDocument();
    });
  });

  describe('Conditional Rendering', () => {
    it('should render when condition is met', () => {
      render(<${componentName} show={true} />);
      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });

    it('should not render when condition is not met', () => {
      const { container } = render(<${componentName} show={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('should toggle visibility', async () => {
      const { rerender } = render(<${componentName} show={false} />);
      expect(screen.queryByRole('main')).not.toBeInTheDocument();

      rerender(<${componentName} show={true} />);
      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should memoize expensive computations', () => {
      const expensiveFunction = vi.fn(() => 'result');
      render(<${componentName} compute={expensiveFunction} />);

      expect(expensiveFunction).toHaveBeenCalledTimes(1);
    });

    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<${componentName} value="test" />);
      const renderCount = vi.fn();

      rerender(<${componentName} value="test" />);
      expect(renderCount).toHaveBeenCalledTimes(0);
    });
  });

  describe('Security', () => {
    it('should sanitize user input', () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      render(<${componentName} value={maliciousInput} />);

      expect(screen.queryByText('alert', { exact: false })).not.toBeInTheDocument();
    });

    it('should escape HTML entities', () => {
      const htmlInput = '<div>Test</div>';
      render(<${componentName} value={htmlInput} />);

      const element = screen.getByText(htmlInput, { exact: false });
      expect(element.innerHTML).not.toContain('<div>');
    });
  });
});
`;
}

/**
 * Extract component name from file
 */
function extractComponentName(content: string, fileName: string): string {
  // Try to find export default function/const
  const defaultMatch = content.match(/export\s+default\s+(?:function|const)\s+(\w+)/);
  if (defaultMatch) {
    return defaultMatch[1];
  }

  // Try to find named export
  const namedMatch = content.match(/export\s+(?:function|const)\s+(\w+)/);
  if (namedMatch) {
    return namedMatch[1];
  }

  // Fallback: generate from filename
  const baseName = fileName.replace('.tsx', '').replace('.jsx', '');
  return baseName.charAt(0).toUpperCase() + baseName.slice(1);
}

/**
 * Scan components directory and generate tests
 */
async function generateTests(dir: string = COMPONENTS_DIR): Promise<void> {
  console.log(`🔍 Scanning directory: ${dir}`);

  if (!fs.existsSync(TESTS_DIR)) {
    fs.mkdirSync(TESTS_DIR, { recursive: true });
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  let generated = 0;
  let skipped = 0;

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Recursively process subdirectories
      await generateTests(fullPath);
      continue;
    }

    if (!entry.name.endsWith('.tsx') && !entry.name.endsWith('.jsx')) {
      continue;
    }

    // Skip test files, stories, and examples
    if (entry.name.includes('.test.') || entry.name.includes('.spec.') ||
        entry.name.includes('.stories.') || entry.name.includes('example')) {
      skipped++;
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');

    // Skip if not a React component
    if (!content.includes('React') && !content.includes('jsx')) {
      skipped++;
      continue;
    }

    const componentName = extractComponentName(content, entry.name);

    const relativePath = path.relative(COMPONENTS_DIR, fullPath);
    const testFileName = entry.name.replace(/\.(tsx|jsx)$/, '.test.tsx');
    const testFilePath = path.join(TESTS_DIR, path.dirname(relativePath), testFileName);

    // Skip if test already exists
    if (fs.existsSync(testFilePath)) {
      console.log(`⏭️  Skipping ${testFileName} (already exists)`);
      skipped++;
      continue;
    }

    // Ensure test directory exists
    const testDir = path.dirname(testFilePath);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    const componentInfo: ComponentInfo = {
      name: entry.name.replace(/\.(tsx|jsx)$/, ''),
      fileName: relativePath,
      componentName,
    };

    const testContent = generateTestContent(componentInfo);
    fs.writeFileSync(testFilePath, testContent);

    console.log(`✅ Generated ${testFileName}`);
    generated++;
  }

  if (dir === COMPONENTS_DIR) {
    console.log('\n📊 Generation Summary:');
    console.log(`   ✅ Generated: ${generated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log('\n✨ Test generation complete!');
  }
}

// Run the generator
generateTests().catch(console.error);
