/**
 * Security Tests for CodeViewer Component
 * Tests XSS protection and sanitization
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CodeViewer } from '../CodeViewer';
import { XSS_TEST_PAYLOADS, isPayloadSanitized } from './xss-test-payloads';
import { DocumentMetadata } from '@/lib/documents/types';
import DOMPurify from 'dompurify';

// Mock document
const createMockDocument = (content: string): DocumentMetadata => ({
  id: 'test-doc-1',
  name: 'test.js',
  type: 'code',
  size: content.length,
  url: `data:text/plain;base64,${btoa(content)}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  mimeType: 'text/javascript',
});

describe('CodeViewer - XSS Protection', () => {
  beforeEach(() => {
    // Reset DOMPurify hooks before each test
    DOMPurify.removeAllHooks();
  });

  describe('Basic XSS Payload Protection', () => {
    it('should sanitize basic script tags', async () => {
      const maliciousCode = '<script>alert("XSS")</script>';
      const document = createMockDocument(maliciousCode);

      const { container } = render(<CodeViewer document={document} />);

      await waitFor(() => {
        const codeContent = container.querySelector('pre');
        expect(codeContent).toBeTruthy();
        const html = codeContent?.innerHTML || '';
        expect(html).not.toContain('<script>');
        expect(html).not.toContain('alert(');
      });
    });

    it('should sanitize img tags with onerror', async () => {
      const maliciousCode = '<img src=x onerror=alert(1)>';
      const document = createMockDocument(maliciousCode);

      const { container } = render(<CodeViewer document={document} />);

      await waitFor(() => {
        const codeContent = container.querySelector('pre');
        const html = codeContent?.innerHTML || '';
        expect(html).not.toContain('onerror');
        expect(html).not.toContain('<img');
      });
    });

    it('should sanitize javascript: protocol in links', async () => {
      const maliciousCode = '<a href="javascript:alert(1)">click</a>';
      const document = createMockDocument(maliciousCode);

      const { container } = render(<CodeViewer document={document} />);

      await waitFor(() => {
        const codeContent = container.querySelector('pre');
        const html = codeContent?.innerHTML || '';
        expect(html).not.toContain('javascript:');
        expect(html).not.toContain('href=');
      });
    });
  });

  describe('Comprehensive XSS Payload Testing', () => {
    XSS_TEST_PAYLOADS.forEach(({ name, payload, expected }) => {
      it(`should sanitize: ${name}`, async () => {
        const document = createMockDocument(payload);
        const { container } = render(<CodeViewer document={document} />);

        await waitFor(() => {
          const codeContent = container.querySelector('pre');
          expect(codeContent).toBeTruthy();

          const html = codeContent?.innerHTML || '';

          // Use our sanitization checker
          expect(
            isPayloadSanitized(html),
            `Failed to sanitize ${name}: ${expected}`
          ).toBe(true);

          // Verify no script execution
          expect(html).not.toMatch(/<script[\s\S]*?>/i);
          expect(html).not.toMatch(/javascript:/i);
          expect(html).not.toMatch(/on\w+\s*=/i);
        });
      });
    });
  });

  describe('DOMPurify Configuration', () => {
    it('should only allow span and br tags', () => {
      const html = '<span>safe</span><div>unsafe</div><script>bad</script>';
      const sanitized = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['span', 'br'],
        ALLOWED_ATTR: ['class'],
        ALLOW_DATA_ATTR: false,
      });

      expect(sanitized).toContain('<span>');
      expect(sanitized).not.toContain('<div>');
      expect(sanitized).not.toContain('<script>');
    });

    it('should only allow class attribute', () => {
      const html = '<span class="safe" onclick="alert(1)" data-bad="evil">text</span>';
      const sanitized = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['span'],
        ALLOWED_ATTR: ['class'],
        ALLOW_DATA_ATTR: false,
      });

      expect(sanitized).toContain('class="safe"');
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('data-bad');
    });

    it('should strip all event handlers', () => {
      const eventHandlers = [
        'onclick', 'onerror', 'onload', 'onmouseover',
        'onfocus', 'onblur', 'onchange', 'onsubmit',
      ];

      eventHandlers.forEach((handler) => {
        const html = `<span ${handler}="alert(1)">text</span>`;
        const sanitized = DOMPurify.sanitize(html, {
          ALLOWED_TAGS: ['span'],
          ALLOWED_ATTR: ['class'],
        });

        expect(sanitized).not.toContain(handler);
      });
    });
  });

  describe('Edge Cases and Complex Attacks', () => {
    it('should handle nested malicious tags', async () => {
      const maliciousCode = '<<script>script>alert(1)<</script>/script>';
      const document = createMockDocument(maliciousCode);

      const { container } = render(<CodeViewer document={document} />);

      await waitFor(() => {
        const codeContent = container.querySelector('pre');
        const html = codeContent?.innerHTML || '';
        expect(html).not.toContain('<script>');
      });
    });

    it('should handle polyglot XSS attempts', async () => {
      const polyglot = 'javascript:/*--></title></style></textarea></script></xmp><svg/onload=alert(1)//>';
      const document = createMockDocument(polyglot);

      const { container } = render(<CodeViewer document={document} />);

      await waitFor(() => {
        const codeContent = container.querySelector('pre');
        const html = codeContent?.innerHTML || '';
        expect(html).not.toContain('javascript:');
        expect(html).not.toContain('onload=');
        expect(html).not.toContain('<svg');
      });
    });

    it('should handle mixed case script tags', async () => {
      const maliciousCode = '<ScRiPt>alert(1)</ScRiPt>';
      const document = createMockDocument(maliciousCode);

      const { container } = render(<CodeViewer document={document} />);

      await waitFor(() => {
        const codeContent = container.querySelector('pre');
        const html = codeContent?.innerHTML || '';
        expect(html.toLowerCase()).not.toContain('<script>');
      });
    });
  });

  describe('Safe Code Rendering', () => {
    it('should correctly render legitimate JavaScript code', async () => {
      const legitCode = `
function greet(name) {
  const message = "Hello, " + name;
  return message;
}
      `.trim();

      const document = createMockDocument(legitCode);
      const { container } = render(<CodeViewer document={document} />);

      await waitFor(() => {
        const codeContent = container.querySelector('pre');
        expect(codeContent).toBeTruthy();

        // Should contain the function text
        expect(codeContent?.textContent).toContain('function');
        expect(codeContent?.textContent).toContain('greet');
        expect(codeContent?.textContent).toContain('Hello');

        // Should have syntax highlighting
        const spans = codeContent?.querySelectorAll('span');
        expect(spans && spans.length > 0).toBe(true);
      });
    });

    it('should preserve whitespace and formatting', async () => {
      const code = 'const x = 1;\n  const y = 2;\n    const z = 3;';
      const document = createMockDocument(code);

      const { container } = render(<CodeViewer document={document} />);

      await waitFor(() => {
        const rows = container.querySelectorAll('tbody tr');
        expect(rows.length).toBe(3);
      });
    });
  });

  describe('Performance and Memory Safety', () => {
    it('should handle large code files without crashing', async () => {
      const largeCode = 'console.log("test");\n'.repeat(10000);
      const document = createMockDocument(largeCode);

      expect(() => {
        render(<CodeViewer document={document} />);
      }).not.toThrow();
    });

    it('should handle empty code', async () => {
      const document = createMockDocument('');
      const { container } = render(<CodeViewer document={document} />);

      await waitFor(() => {
        const table = container.querySelector('table');
        expect(table).toBeTruthy();
      });
    });
  });
});
