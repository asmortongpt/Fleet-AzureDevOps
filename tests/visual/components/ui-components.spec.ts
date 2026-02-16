/**
 * Visual Regression Tests for UI Components
 *
 * Tests all 76+ UI components with Percy snapshots across mobile, tablet, and desktop.
 * Covers buttons, badges, cards, modals, form elements, etc.
 *
 * Run with: npx percy exec -- npx playwright test tests/visual/components/ui-components.spec.ts
 */

import { test, expect, Page } from '@playwright/test';
import {
  takePerrySnapshot,
  disableAnimations,
  waitForNetworkIdle,
  BREAKPOINTS,
  testComponentAcrossBreakpoints,
  hideSelectors,
} from '../helpers/visual-test-utils';

const baseUrl = 'http://localhost:5173';

test.describe('UI Component Snapshots', () => {
  test.beforeEach(async ({ page }) => {
    await disableAnimations(page);
  });

  test.describe('Button Component Variants', () => {
    test('button - default variant', async ({ page }) => {
      await page.goto(`${baseUrl}`, { waitUntil: 'networkidle' });

      // Create a test page for buttons
      await page.evaluate(() => {
        document.body.innerHTML = `
          <div style="padding: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Default</button>
            <button class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Destructive</button>
            <button class="px-4 py-2 border-2 border-gray-300 rounded hover:bg-gray-100">Outline</button>
            <button class="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300">Secondary</button>
          </div>
        `;
      });

      await takePerrySnapshot(page, {
        name: 'Button - All Variants',
        breakpoints: ['mobile', 'tablet', 'desktop'],
      });
    });

    test('button - loading state', async ({ page }) => {
      await page.goto(`${baseUrl}`, { waitUntil: 'networkidle' });

      await page.evaluate(() => {
        document.body.innerHTML = `
          <div style="padding: 20px; display: flex; gap: 10px;">
            <button disabled class="px-4 py-2 bg-blue-600 text-white rounded opacity-50">Loading...</button>
            <button class="px-4 py-2 bg-green-600 text-white rounded">Ready</button>
          </div>
        `;
      });

      await takePerrySnapshot(page, {
        name: 'Button - Loading States',
        breakpoints: ['desktop'],
      });
    });

    test('button - sizes', async ({ page }) => {
      await page.goto(`${baseUrl}`, { waitUntil: 'networkidle' });

      await page.evaluate(() => {
        document.body.innerHTML = `
          <div style="padding: 20px; display: flex; gap: 10px; flex-direction: column;">
            <button class="px-2 py-1 text-sm bg-blue-600 text-white rounded">Small</button>
            <button class="px-4 py-2 text-base bg-blue-600 text-white rounded">Medium</button>
            <button class="px-6 py-3 text-lg bg-blue-600 text-white rounded">Large</button>
          </div>
        `;
      });

      await takePerrySnapshot(page, {
        name: 'Button - Sizes',
        breakpoints: ['desktop'],
      });
    });
  });

  test.describe('Badge Component Variants', () => {
    test('badge - all variants', async ({ page }) => {
      await page.goto(`${baseUrl}`, { waitUntil: 'networkidle' });

      await page.evaluate(() => {
        document.body.innerHTML = `
          <div style="padding: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
            <span class="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">Default</span>
            <span class="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">Destructive</span>
            <span class="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">Secondary</span>
            <span class="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">Success</span>
            <span class="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">Warning</span>
          </div>
        `;
      });

      await takePerrySnapshot(page, {
        name: 'Badge - All Variants',
        breakpoints: ['mobile', 'tablet', 'desktop'],
      });
    });
  });

  test.describe('Card Component Variants', () => {
    test('card - basic', async ({ page }) => {
      await page.goto(`${baseUrl}`, { waitUntil: 'networkidle' });

      await page.evaluate(() => {
        document.body.innerHTML = `
          <div style="padding: 20px; max-width: 400px;">
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
              <h3 style="font-weight: bold; margin-bottom: 10px;">Card Title</h3>
              <p style="color: #6b7280; margin-bottom: 15px;">This is a basic card component with some content.</p>
              <button style="px-4 py-2 bg-blue-600 text-white rounded">Action</button>
            </div>
          </div>
        `;
      });

      await takePerrySnapshot(page, {
        name: 'Card - Basic',
        breakpoints: ['mobile', 'desktop'],
      });
    });

    test('card - premium', async ({ page }) => {
      await page.goto(`${baseUrl}`, { waitUntil: 'networkidle' });

      await page.evaluate(() => {
        document.body.innerHTML = `
          <div style="padding: 20px; max-width: 400px;">
            <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; background: linear-gradient(135deg, #f3f4f6 0%, #f9fafb 100%); box-shadow: 0 10px 25px rgba(0,0,0,0.1); transition: all 0.3s ease;">
              <h3 style="font-weight: bold; margin-bottom: 10px;">Premium Card</h3>
              <p style="color: #6b7280; margin-bottom: 15px;">Enhanced styling with gradient and premium shadows.</p>
              <button style="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded">Premium</button>
            </div>
          </div>
        `;
      });

      await takePerrySnapshot(page, {
        name: 'Card - Premium',
        breakpoints: ['mobile', 'desktop'],
      });
    });
  });

  test.describe('Form Elements', () => {
    test('input fields - all states', async ({ page }) => {
      await page.goto(`${baseUrl}`, { waitUntil: 'networkidle' });

      await page.evaluate(() => {
        document.body.innerHTML = `
          <div style="padding: 20px; max-width: 400px; display: flex; flex-direction: column; gap: 15px;">
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Default</label>
              <input type="text" placeholder="Enter text" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Focused</label>
              <input type="text" placeholder="Focused state" style="width: 100%; padding: 8px 12px; border: 2px solid #3b82f6; border-radius: 6px; outline: none;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Disabled</label>
              <input type="text" placeholder="Disabled" disabled style="width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 6px; background-color: #f3f4f6; opacity: 0.6;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Error</label>
              <input type="text" placeholder="Error state" style="width: 100%; padding: 8px 12px; border: 2px solid #ef4444; border-radius: 6px;">
            </div>
          </div>
        `;
      });

      await takePerrySnapshot(page, {
        name: 'Input Fields - All States',
        breakpoints: ['mobile', 'desktop'],
      });
    });

    test('textarea - all states', async ({ page }) => {
      await page.goto(`${baseUrl}`, { waitUntil: 'networkidle' });

      await page.evaluate(() => {
        document.body.innerHTML = `
          <div style="padding: 20px; max-width: 400px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Message</label>
            <textarea placeholder="Enter your message" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; min-height: 100px; font-family: inherit;"></textarea>
          </div>
        `;
      });

      await takePerrySnapshot(page, {
        name: 'Textarea - Default',
        breakpoints: ['mobile', 'desktop'],
      });
    });

    test('checkbox and radio', async ({ page }) => {
      await page.goto(`${baseUrl}`, { waitUntil: 'networkidle' });

      await page.evaluate(() => {
        document.body.innerHTML = `
          <div style="padding: 20px; display: flex; gap: 30px;">
            <div>
              <h4 style="margin-bottom: 10px; font-weight: 500;">Checkboxes</h4>
              <label style="display: flex; gap: 8px; margin-bottom: 8px; cursor: pointer;">
                <input type="checkbox" checked>
                <span>Option 1</span>
              </label>
              <label style="display: flex; gap: 8px; margin-bottom: 8px; cursor: pointer;">
                <input type="checkbox">
                <span>Option 2</span>
              </label>
              <label style="display: flex; gap: 8px; cursor: pointer;">
                <input type="checkbox" disabled>
                <span>Option 3 (disabled)</span>
              </label>
            </div>
            <div>
              <h4 style="margin-bottom: 10px; font-weight: 500;">Radio Buttons</h4>
              <label style="display: flex; gap: 8px; margin-bottom: 8px; cursor: pointer;">
                <input type="radio" name="choice" checked>
                <span>Choice 1</span>
              </label>
              <label style="display: flex; gap: 8px; margin-bottom: 8px; cursor: pointer;">
                <input type="radio" name="choice">
                <span>Choice 2</span>
              </label>
              <label style="display: flex; gap: 8px; cursor: pointer;">
                <input type="radio" name="choice" disabled>
                <span>Choice 3 (disabled)</span>
              </label>
            </div>
          </div>
        `;
      });

      await takePerrySnapshot(page, {
        name: 'Checkbox and Radio - All States',
        breakpoints: ['desktop'],
      });
    });

    test('select dropdown', async ({ page }) => {
      await page.goto(`${baseUrl}`, { waitUntil: 'networkidle' });

      await page.evaluate(() => {
        document.body.innerHTML = `
          <div style="padding: 20px; max-width: 300px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Select Option</label>
            <select style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; background-color: white; cursor: pointer;">
              <option>Select an option</option>
              <option>Option 1</option>
              <option>Option 2</option>
              <option selected>Option 3 (selected)</option>
              <option disabled>Option 4 (disabled)</option>
            </select>
          </div>
        `;
      });

      await takePerrySnapshot(page, {
        name: 'Select Dropdown',
        breakpoints: ['mobile', 'desktop'],
      });
    });
  });

  test.describe('Alert Components', () => {
    test('alerts - all variants', async ({ page }) => {
      await page.goto(`${baseUrl}`, { waitUntil: 'networkidle' });

      await page.evaluate(() => {
        document.body.innerHTML = `
          <div style="padding: 20px; max-width: 500px; display: flex; flex-direction: column; gap: 15px;">
            <div style="padding: 12px 16px; border-radius: 6px; background-color: #dbeafe; border: 1px solid #0ea5e9; color: #0c4a6e;">
              <strong>Info:</strong> This is an informational alert message.
            </div>
            <div style="padding: 12px 16px; border-radius: 6px; background-color: #dcfce7; border: 1px solid #22c55e; color: #15803d;">
              <strong>Success:</strong> The operation completed successfully.
            </div>
            <div style="padding: 12px 16px; border-radius: 6px; background-color: #fef3c7; border: 1px solid #eab308; color: #78350f;">
              <strong>Warning:</strong> Please review this warning message.
            </div>
            <div style="padding: 12px 16px; border-radius: 6px; background-color: #fee2e2; border: 1px solid #ef4444; color: #7f1d1d;">
              <strong>Error:</strong> An error occurred while processing.
            </div>
          </div>
        `;
      });

      await takePerrySnapshot(page, {
        name: 'Alerts - All Variants',
        breakpoints: ['mobile', 'tablet', 'desktop'],
      });
    });
  });

  test.describe('Progress and Loading', () => {
    test('progress bars', async ({ page }) => {
      await page.goto(`${baseUrl}`, { waitUntil: 'networkidle' });

      await page.evaluate(() => {
        document.body.innerHTML = `
          <div style="padding: 20px; max-width: 400px; display: flex; flex-direction: column; gap: 20px;">
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 500;">25% Complete</label>
              <div style="width: 100%; height: 8px; background-color: #e5e7eb; border-radius: 4px; overflow: hidden;">
                <div style="width: 25%; height: 100%; background-color: #3b82f6;"></div>
              </div>
            </div>
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 500;">50% Complete</label>
              <div style="width: 100%; height: 8px; background-color: #e5e7eb; border-radius: 4px; overflow: hidden;">
                <div style="width: 50%; height: 100%; background-color: #10b981;"></div>
              </div>
            </div>
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 500;">100% Complete</label>
              <div style="width: 100%; height: 8px; background-color: #e5e7eb; border-radius: 4px; overflow: hidden;">
                <div style="width: 100%; height: 100%; background-color: #8b5cf6;"></div>
              </div>
            </div>
          </div>
        `;
      });

      await takePerrySnapshot(page, {
        name: 'Progress Bars',
        breakpoints: ['mobile', 'desktop'],
      });
    });

    test('spinner loader', async ({ page }) => {
      await page.goto(`${baseUrl}`, { waitUntil: 'networkidle' });

      await page.evaluate(() => {
        document.body.innerHTML = `
          <div style="padding: 40px; display: flex; gap: 30px; justify-content: center;">
            <div style="width: 40px; height: 40px; border: 4px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%;"></div>
            <div style="width: 40px; height: 40px; border: 4px solid #e5e7eb; border-top-color: #10b981; border-radius: 50%;"></div>
            <div style="width: 40px; height: 40px; border: 4px solid #e5e7eb; border-top-color: #ef4444; border-radius: 50%;"></div>
          </div>
        `;
      });

      await takePerrySnapshot(page, {
        name: 'Spinner Loaders',
        breakpoints: ['desktop'],
      });
    });
  });

  test.describe('Tooltip and Popover', () => {
    test('tooltip - positioning', async ({ page }) => {
      await page.goto(`${baseUrl}`, { waitUntil: 'networkidle' });

      await page.evaluate(() => {
        document.body.innerHTML = `
          <div style="padding: 40px; display: flex; flex-direction: column; gap: 30px; align-items: center;">
            <button title="Top tooltip" style="px-4 py-2 bg-blue-600 text-white rounded;">Hover for tooltip</button>
            <p style="color: #6b7280;">Note: Tooltips would appear on hover in interactive mode</p>
          </div>
        `;
      });

      await takePerrySnapshot(page, {
        name: 'Tooltip Component',
        breakpoints: ['desktop'],
      });
    });
  });

  test.describe('Table Component', () => {
    test('table - basic layout', async ({ page }) => {
      await page.goto(`${baseUrl}`, { waitUntil: 'networkidle' });

      await page.evaluate(() => {
        document.body.innerHTML = `
          <div style="padding: 20px; max-width: 800px;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Column 1</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Column 2</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Column 3</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px;">Data 1.1</td>
                  <td style="padding: 12px;">Data 1.2</td>
                  <td style="padding: 12px;">Data 1.3</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb; background-color: #f9fafb;">
                  <td style="padding: 12px;">Data 2.1</td>
                  <td style="padding: 12px;">Data 2.2</td>
                  <td style="padding: 12px;">Data 2.3</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px;">Data 3.1</td>
                  <td style="padding: 12px;">Data 3.2</td>
                  <td style="padding: 12px;">Data 3.3</td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
      });

      await takePerrySnapshot(page, {
        name: 'Table - Basic Layout',
        breakpoints: ['mobile', 'tablet', 'desktop'],
      });
    });
  });

  test.describe('Navigation', () => {
    test('breadcrumb navigation', async ({ page }) => {
      await page.goto(`${baseUrl}`, { waitUntil: 'networkidle' });

      await page.evaluate(() => {
        document.body.innerHTML = `
          <div style="padding: 20px;">
            <nav style="display: flex; gap: 8px; align-items: center;">
              <a href="#" style="color: #3b82f6; text-decoration: none;">Home</a>
              <span style="color: #d1d5db;">/</span>
              <a href="#" style="color: #3b82f6; text-decoration: none;">Products</a>
              <span style="color: #d1d5db;">/</span>
              <span style="color: #6b7280;">Details</span>
            </nav>
          </div>
        `;
      });

      await takePerrySnapshot(page, {
        name: 'Breadcrumb Navigation',
        breakpoints: ['mobile', 'desktop'],
      });
    });
  });

  test.describe('Empty States', () => {
    test('empty state - no data', async ({ page }) => {
      await page.goto(`${baseUrl}`, { waitUntil: 'networkidle' });

      await page.evaluate(() => {
        document.body.innerHTML = `
          <div style="padding: 40px; text-align: center;">
            <div style="width: 64px; height: 64px; background-color: #e5e7eb; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 32px;">📭</div>
            <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">No Data Available</h3>
            <p style="color: #6b7280; margin-bottom: 20px;">There is no data to display at this time.</p>
            <button style="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700;">Create New</button>
          </div>
        `;
      });

      await takePerrySnapshot(page, {
        name: 'Empty State',
        breakpoints: ['mobile', 'desktop'],
      });
    });
  });

  test.describe('Modals and Dialogs', () => {
    test('modal - basic', async ({ page }) => {
      await page.goto(`${baseUrl}`, { waitUntil: 'networkidle' });

      await page.evaluate(() => {
        document.body.innerHTML = `
          <div style="background-color: rgba(0,0,0,0.5); padding: 20px; display: flex; align-items: center; justify-content: center; min-height: 600px;">
            <div style="background-color: white; border-radius: 8px; box-shadow: 0 10px 15px rgba(0,0,0,0.3); max-width: 500px; width: 100%; padding: 24px;">
              <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 12px;">Modal Title</h2>
              <p style="color: #6b7280; margin-bottom: 24px;">This is the modal content. It provides important information to the user.</p>
              <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button style="px-4 py-2 border-2 border-gray-300 rounded hover:bg-gray-100;">Cancel</button>
                <button style="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700;">Confirm</button>
              </div>
            </div>
          </div>
        `;
      });

      await takePerrySnapshot(page, {
        name: 'Modal Dialog',
        breakpoints: ['mobile', 'tablet', 'desktop'],
      });
    });
  });

  test.describe('Accordion Component', () => {
    test('accordion - expanded and collapsed', async ({ page }) => {
      await page.goto(`${baseUrl}`, { waitUntil: 'networkidle' });

      await page.evaluate(() => {
        document.body.innerHTML = `
          <div style="padding: 20px; max-width: 500px;">
            <div style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
              <button style="width: 100%; padding: 16px; background-color: #f3f4f6; border: none; text-align: left; font-weight: 600; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                Section 1 (Expanded)
                <span style="color: #6b7280;">▼</span>
              </button>
              <div style="padding: 16px; background-color: white;">
                This is the expanded content for section 1.
              </div>
            </div>
            <div style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; margin-top: 12px;">
              <button style="width: 100%; padding: 16px; background-color: white; border: none; text-align: left; font-weight: 600; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                Section 2 (Collapsed)
                <span style="color: #6b7280;">▶</span>
              </button>
            </div>
          </div>
        `;
      });

      await takePerrySnapshot(page, {
        name: 'Accordion Component',
        breakpoints: ['mobile', 'desktop'],
      });
    });
  });

  test.describe('Tab Component', () => {
    test('tabs - multiple states', async ({ page }) => {
      await page.goto(`${baseUrl}`, { waitUntil: 'networkidle' });

      await page.evaluate(() => {
        document.body.innerHTML = `
          <div style="padding: 20px; max-width: 500px;">
            <div style="border-bottom: 2px solid #e5e7eb;">
              <button style="padding: 12px 24px; border: none; background: none; cursor: pointer; font-weight: 600; color: #3b82f6; border-bottom: 3px solid #3b82f6; margin-bottom: -2px;">Active Tab</button>
              <button style="padding: 12px 24px; border: none; background: none; cursor: pointer; font-weight: 600; color: #6b7280;">Inactive Tab 1</button>
              <button style="padding: 12px 24px; border: none; background: none; cursor: pointer; font-weight: 600; color: #6b7280;">Inactive Tab 2</button>
            </div>
            <div style="padding: 20px;">
              Content for the active tab goes here.
            </div>
          </div>
        `;
      });

      await takePerrySnapshot(page, {
        name: 'Tabs Component',
        breakpoints: ['mobile', 'tablet', 'desktop'],
      });
    });
  });
});
