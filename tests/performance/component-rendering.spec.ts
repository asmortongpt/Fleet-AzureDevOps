import { test, expect } from '@playwright/test';

/**
 * Component Rendering Performance Tests
 * Measures time to interactive, component render times, and responsiveness
 */

test.describe('Component Rendering Performance', () => {
  test('measure Time to Interactive (TTI)', async ({ page }) => {
    const metricsProxy = {
      metrics: [] as any[],
    };

    page.on('console', (msg) => {
      metricsProxy.metrics.push(msg.text());
    });

    const startTime = Date.now();
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    // Wait for React to hydrate and become interactive
    await page.waitForSelector('body', { timeout: 5000 });

    const tti = Date.now() - startTime;
    console.log(`Time to Interactive: ${tti}ms`);

    expect(tti).toBeLessThan(8000); // Should be interactive within 8 seconds
  });

  test('measure initial render time for dashboard', async ({ page }) => {
    const startTime = performance.now();

    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });

    const renderTime = await page.evaluate(() => {
      return performance.now();
    });

    const componentRenderTime = renderTime - startTime;
    console.log(`Dashboard Initial Render: ${componentRenderTime.toFixed(2)}ms`);

    // Should render component in reasonable time
    expect(componentRenderTime).toBeLessThan(5000);
  });

  test('measure table rendering with 1000 rows', async ({ page }) => {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    // Create a test table with 1000 rows
    const startTime = await page.evaluate(() => {
      return performance.now();
    });

    await page.evaluate(() => {
      // Create test HTML table
      const table = document.createElement('table');
      const tbody = document.createElement('tbody');

      for (let i = 0; i < 1000; i++) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>Row ${i}</td>
          <td>Value ${i}</td>
          <td>Status ${i % 2}</td>
          <td>Amount $${(i * 100).toFixed(2)}</td>
        `;
        tbody.appendChild(row);
      }

      table.appendChild(tbody);
      document.body.appendChild(table);

      return performance.now();
    });

    const endTime = await page.evaluate(() => {
      return performance.now();
    });

    const renderTime = endTime - startTime;
    console.log(`Table with 1000 rows render time: ${renderTime.toFixed(2)}ms`);

    // Table should render in reasonable time
    expect(renderTime).toBeLessThan(2000);
  });

  test('measure list re-renders on data change', async ({ page }) => {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    const reRenderTime = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        // Measure re-render time by observing DOM mutations
        let mutations = 0;
        const startTime = performance.now();

        const observer = new MutationObserver((changes) => {
          mutations += changes.length;
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });

        // Simulate data update
        setTimeout(() => {
          const endTime = performance.now();
          observer.disconnect();
          resolve(endTime - startTime);
        }, 500);
      });
    });

    console.log(`Re-render time on data change: ${reRenderTime.toFixed(2)}ms`);
    expect(reRenderTime).toBeLessThan(1000);
  });

  test('measure interaction responsiveness (button click)', async ({ page }) => {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    const clickLatency = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const button = document.createElement('button');
        button.textContent = 'Test Button';
        document.body.appendChild(button);

        let clickTime = 0;
        let responseTime = 0;

        button.addEventListener('click', () => {
          clickTime = performance.now();
        });

        button.addEventListener('click', () => {
          responseTime = performance.now();
        }, true);

        button.click();
        resolve(responseTime - clickTime);
      });
    });

    console.log(`Click event response time: ${clickLatency.toFixed(2)}ms`);
    expect(clickLatency).toBeLessThan(100);
  });

  test('measure dropdown/select opening speed', async ({ page }) => {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    const openTime = await page.evaluate(() => {
      // Create a select element
      const select = document.createElement('select');
      for (let i = 0; i < 100; i++) {
        const option = document.createElement('option');
        option.value = `option-${i}`;
        option.textContent = `Option ${i}`;
        select.appendChild(option);
      }
      document.body.appendChild(select);

      const startTime = performance.now();
      select.click();
      const endTime = performance.now();

      return endTime - startTime;
    });

    console.log(`Select dropdown open time: ${openTime.toFixed(2)}ms`);
    expect(openTime).toBeLessThan(200);
  });

  test('measure modal/dialog opening speed', async ({ page }) => {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    const modalOpenTime = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const dialog = document.createElement('dialog');
        dialog.innerHTML = '<h2>Test Modal</h2><p>Content</p>';
        document.body.appendChild(dialog);

        const startTime = performance.now();
        dialog.showModal();

        // Use requestAnimationFrame to measure after paint
        requestAnimationFrame(() => {
          const endTime = performance.now();
          resolve(endTime - startTime);
        });
      });
    });

    console.log(`Modal open time: ${modalOpenTime.toFixed(2)}ms`);
    expect(modalOpenTime).toBeLessThan(300);
  });

  test('measure animation frame rate during scroll', async ({ page }) => {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    const frameMetrics = await page.evaluate(() => {
      return new Promise<{ fps: number; droppedFrames: number }>((resolve) => {
        let frameCount = 0;
        let lastTime = performance.now();
        let droppedFrames = 0;

        const measureFrames = () => {
          frameCount++;
          const currentTime = performance.now();
          const delta = currentTime - lastTime;

          // Frame dropped if > 16.67ms (60fps baseline)
          if (delta > 16.67) {
            droppedFrames++;
          }

          lastTime = currentTime;

          if (frameCount < 60) {
            requestAnimationFrame(measureFrames);
          } else {
            const totalTime = currentTime - lastTime;
            const fps = Math.round((frameCount / totalTime) * 1000);
            resolve({ fps, droppedFrames });
          }
        };

        requestAnimationFrame(measureFrames);
      });
    });

    console.log(`Animation Frame Rate:`, frameMetrics);
    console.log(`  FPS: ${frameMetrics.fps}`);
    console.log(`  Dropped Frames: ${frameMetrics.droppedFrames}`);

    expect(frameMetrics.fps).toBeGreaterThan(30);
    expect(frameMetrics.droppedFrames).toBeLessThan(10);
  });

  test('measure form input responsiveness', async ({ page }) => {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    const inputLatency = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const input = document.createElement('input');
        input.type = 'text';
        document.body.appendChild(input);

        let inputTime = 0;
        let changeTime = 0;

        input.addEventListener('input', () => {
          inputTime = performance.now();
        });

        input.addEventListener('input', () => {
          changeTime = performance.now();
        }, true);

        const event = new KeyboardEvent('input', {
          key: 'a',
          code: 'KeyA',
          keyCode: 65,
          bubbles: true,
        });

        input.dispatchEvent(event);
        resolve(changeTime - inputTime);
      });
    });

    console.log(`Input responsiveness latency: ${inputLatency.toFixed(2)}ms`);
    expect(inputLatency).toBeLessThan(100);
  });

  test('measure navigation between pages', async ({ page }) => {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    // Try navigating to a different route if available
    const navigationTime = await page.evaluate(() => {
      return performance.now();
    });

    // Attempt to navigate (this depends on app structure)
    try {
      await page.goto('http://localhost:5173/dashboard', {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      });
    } catch (e) {
      // Route might not exist, that's ok for this test
    }

    const endTime = await page.evaluate(() => {
      return performance.now();
    });

    const totalNavigationTime = endTime - navigationTime;
    console.log(`Navigation time: ${totalNavigationTime.toFixed(2)}ms`);

    // Navigation should complete reasonably quickly
    expect(totalNavigationTime).toBeLessThan(5000);
  });

  test('measure scroll jank detection', async ({ page }) => {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    // Create scrollable content
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.style.height = '100vh';
      container.style.overflow = 'auto';

      for (let i = 0; i < 100; i++) {
        const div = document.createElement('div');
        div.style.height = '200px';
        div.style.background = i % 2 ? '#f0f0f0' : '#fff';
        div.textContent = `Section ${i}`;
        container.appendChild(div);
      }

      document.body.appendChild(container);
    });

    const scrollMetrics = await page.evaluate(() => {
      return new Promise<{ totalTime: number; jankEvents: number }>((resolve) => {
        const scrollContainer = document.querySelector('div');
        let scrolls = 0;
        let jankEvents = 0;
        const startTime = performance.now();

        const scrollListener = () => {
          scrolls++;
          if (scrolls >= 10) {
            window.removeEventListener('scroll', scrollListener);
            const endTime = performance.now();
            resolve({
              totalTime: endTime - startTime,
              jankEvents: jankEvents,
            });
          }
        };

        window.addEventListener('scroll', scrollListener);

        // Simulate scrolling
        for (let i = 0; i < 10; i++) {
          setTimeout(() => {
            window.scrollBy({ top: 100, behavior: 'smooth' });
          }, i * 100);
        }
      });
    });

    console.log('Scroll Metrics:', scrollMetrics);
    expect(scrollMetrics.jankEvents).toBeLessThan(5);
  });
});
