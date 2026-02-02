#!/usr/bin/env python3
"""
Fleet CTA - Advanced Visual Regression Testing Demo
Demonstrates pixel-perfect visual comparison with real diff generation
"""

import asyncio
import base64
import json
import os
from pathlib import Path
from playwright.async_api import async_playwright
from PIL import Image, ImageChops, ImageDraw, ImageFont
import numpy as np
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5174"
SNAPSHOTS_DIR = Path("tests/visual/snapshots-demo")
DIFFS_DIR = Path("tests/visual/diffs")
REPORT_PATH = Path("tests/visual/VISUAL_REGRESSION_DEMO.html")

# Ensure directories exist
SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)
DIFFS_DIR.mkdir(parents=True, exist_ok=True)

# Routes to test
ROUTES = [
    {"path": "/", "name": "Home Page"},
    {"path": "/fleet", "name": "Fleet Hub"},
    {"path": "/analytics", "name": "Analytics Dashboard"},
]

async def capture_screenshot(page, route_path, filename):
    """Capture a full-page screenshot"""
    await page.goto(f"{BASE_URL}{route_path}", wait_until="networkidle", timeout=30000)
    await page.wait_for_timeout(1000)

    # Close any modals
    await page.keyboard.press("Escape")
    await page.wait_for_timeout(200)

    screenshot_path = SNAPSHOTS_DIR / filename
    await page.screenshot(path=str(screenshot_path), full_page=True)
    return screenshot_path

def calculate_pixel_diff(img1_path, img2_path, diff_output_path):
    """Calculate pixel-by-pixel difference between two images"""
    img1 = Image.open(img1_path).convert('RGB')
    img2 = Image.open(img2_path).convert('RGB')

    # Resize if different sizes
    if img1.size != img2.size:
        img2 = img2.resize(img1.size)

    # Calculate difference
    diff = ImageChops.difference(img1, img2)

    # Create highlighted diff
    diff_data = np.array(diff)
    mask = np.any(diff_data > 10, axis=2)  # Threshold for differences

    # Create visualization
    diff_viz = np.array(img1).copy()
    diff_viz[mask] = [255, 0, 0]  # Highlight differences in red

    # Create side-by-side comparison
    width, height = img1.size
    comparison = Image.new('RGB', (width * 3, height))
    comparison.paste(img1, (0, 0))
    comparison.paste(img2, (width, 0))
    comparison.paste(Image.fromarray(diff_viz), (width * 2, 0))

    # Add labels
    draw = ImageDraw.Draw(comparison)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 40)
    except:
        font = ImageFont.load_default()

    draw.text((20, 20), "BEFORE", fill=(255, 255, 255), font=font)
    draw.text((width + 20, 20), "AFTER", fill=(255, 255, 255), font=font)
    draw.text((width * 2 + 20, 20), "DIFF (Red = Changed)", fill=(255, 0, 0), font=font)

    comparison.save(diff_output_path)

    # Calculate statistics
    total_pixels = mask.size
    changed_pixels = np.sum(mask)
    percent_changed = (changed_pixels / total_pixels) * 100

    return {
        "total_pixels": int(total_pixels),
        "changed_pixels": int(changed_pixels),
        "percent_changed": round(percent_changed, 3),
        "has_regression": percent_changed > 0.1
    }

async def introduce_visual_change(page):
    """Inject CSS to introduce MASSIVE visible changes for demo"""
    await page.add_style_tag(content="""
        /* DRAMATIC VISUAL CHANGES FOR DEMO */
        * {
            border: 5px solid red !important;
        }
        body {
            background: linear-gradient(45deg, #FF0000 0%, #00FF00 50%, #0000FF 100%) !important;
        }
        h1, h2, h3, h4, h5, h6 {
            color: yellow !important;
            background: black !important;
            padding: 20px !important;
            transform: rotate(-5deg) !important;
            font-size: 4rem !important;
        }
        button, .btn {
            background: magenta !important;
            color: cyan !important;
            transform: scale(2) rotate(15deg) !important;
            border: 10px dashed lime !important;
        }
        .card, .stat-card, div[class*="card"] {
            background: repeating-linear-gradient(
                45deg,
                #FF00FF,
                #FF00FF 10px,
                #00FFFF 10px,
                #00FFFF 20px
            ) !important;
            transform: skew(-10deg) !important;
        }
        nav, header {
            background: orange !important;
            transform: translateY(50px) !important;
        }
        table, .table {
            border: 20px solid purple !important;
            background: yellow !important;
        }
    """)

async def main():
    print("=" * 80)
    print("FLEET CTA - ADVANCED VISUAL REGRESSION TESTING")
    print("=" * 80)
    print()

    results = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()

        for route in ROUTES:
            print(f"\n📸 Testing: {route['name']} ({route['path']})")
            print("-" * 80)

            # Capture BEFORE screenshot
            print("  ✓ Capturing BEFORE screenshot...")
            before_path = await capture_screenshot(
                page,
                route['path'],
                f"before-{route['name'].lower().replace(' ', '-')}.png"
            )

            # Introduce visual change
            print("  ⚠️  Introducing intentional visual changes (for demo)...")
            await introduce_visual_change(page)
            await page.wait_for_timeout(500)

            # Capture AFTER screenshot
            print("  ✓ Capturing AFTER screenshot...")
            after_path = await capture_screenshot(
                page,
                route['path'],
                f"after-{route['name'].lower().replace(' ', '-')}.png"
            )

            # Generate diff
            print("  🔍 Generating pixel-by-pixel difference analysis...")
            diff_filename = f"diff-{route['name'].lower().replace(' ', '-')}.png"
            diff_path = DIFFS_DIR / diff_filename

            diff_stats = calculate_pixel_diff(before_path, after_path, diff_path)

            result = {
                **route,
                "before": str(before_path.name),
                "after": str(after_path.name),
                "diff": str(diff_path.name),
                **diff_stats
            }
            results.append(result)

            print(f"  📊 Results:")
            print(f"     • Total pixels: {diff_stats['total_pixels']:,}")
            print(f"     • Changed pixels: {diff_stats['changed_pixels']:,}")
            print(f"     • Percent changed: {diff_stats['percent_changed']:.3f}%")
            print(f"     • Visual regression: {'❌ DETECTED' if diff_stats['has_regression'] else '✅ NONE'}")

        await browser.close()

    # Generate HTML report
    print("\n" + "=" * 80)
    print("📄 Generating interactive HTML report...")
    generate_html_report(results)
    print(f"✅ Report saved to: {REPORT_PATH}")
    print("=" * 80)

    return results

def generate_html_report(results):
    """Generate a professional HTML report with diff visualizations"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fleet CTA - Visual Regression Testing Report (REAL PIXEL COMPARISON)</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            padding: 40px 20px;
            min-height: 100vh;
        }}
        .container {{
            max-width: 1600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 80px rgba(0,0,0,0.4);
            overflow: hidden;
        }}
        header {{
            background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
            color: white;
            padding: 50px;
            text-align: center;
        }}
        h1 {{
            font-size: 3rem;
            margin-bottom: 15px;
            text-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }}
        .subtitle {{
            font-size: 1.3rem;
            opacity: 0.95;
            font-weight: 500;
        }}
        .timestamp {{
            margin-top: 15px;
            opacity: 0.9;
            font-size: 1rem;
        }}
        .stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 25px;
            padding: 50px;
            background: #f8f9fa;
        }}
        .stat-card {{
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            text-align: center;
            transition: transform 0.3s ease;
        }}
        .stat-card:hover {{ transform: translateY(-5px); }}
        .stat-number {{
            font-size: 3.5rem;
            font-weight: bold;
            margin-bottom: 10px;
        }}
        .stat-number.success {{ color: #10b981; }}
        .stat-number.danger {{ color: #ef4444; }}
        .stat-number.warning {{ color: #f59e0b; }}
        .stat-number.info {{ color: #3b82f6; }}
        .stat-label {{
            color: #6b7280;
            font-size: 1rem;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            font-weight: 600;
        }}
        .results {{
            padding: 50px;
        }}
        .result-item {{
            margin-bottom: 60px;
            background: #f9fafb;
            border-radius: 15px;
            padding: 40px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }}
        .result-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #e5e7eb;
        }}
        .result-title {{
            font-size: 2rem;
            font-weight: 700;
            color: #111827;
        }}
        .result-path {{
            color: #6b7280;
            font-family: 'Courier New', monospace;
            font-size: 1.1rem;
        }}
        .regression-badge {{
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: 700;
            font-size: 1rem;
            text-transform: uppercase;
        }}
        .regression-badge.detected {{
            background: #fee2e2;
            color: #991b1b;
        }}
        .regression-badge.none {{
            background: #d1fae5;
            color: #065f46;
        }}
        .diff-stats {{
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }}
        .diff-stat {{
            background: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }}
        .diff-stat-value {{
            font-size: 2rem;
            font-weight: bold;
            color: #1f2937;
        }}
        .diff-stat-label {{
            color: #6b7280;
            font-size: 0.9rem;
            margin-top: 5px;
        }}
        .comparison-image {{
            width: 100%;
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.15);
            cursor: pointer;
            transition: transform 0.3s ease;
        }}
        .comparison-image:hover {{
            transform: scale(1.02);
        }}
        .methodology {{
            background: #eff6ff;
            padding: 50px;
            margin: 50px;
            border-radius: 15px;
            border-left: 6px solid #3b82f6;
        }}
        .methodology h2 {{
            color: #1e40af;
            margin-bottom: 25px;
            font-size: 2rem;
        }}
        .methodology ul {{
            list-style-position: inside;
            color: #1f2937;
            line-height: 2;
            font-size: 1.1rem;
        }}
        .methodology li {{
            margin-bottom: 15px;
        }}
        .methodology strong {{ color: #1e40af; }}
        footer {{
            text-align: center;
            padding: 40px;
            background: #111827;
            color: white;
        }}
        footer p {{ font-size: 1.1rem; }}
        .lightbox {{
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.95);
            z-index: 1000;
            justify-content: center;
            align-items: center;
            padding: 40px;
        }}
        .lightbox.active {{ display: flex; }}
        .lightbox img {{
            max-width: 95%;
            max-height: 95%;
            border-radius: 10px;
        }}
        .lightbox-close {{
            position: absolute;
            top: 30px;
            right: 50px;
            color: white;
            font-size: 4rem;
            cursor: pointer;
            font-weight: 300;
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🎯 Advanced Visual Regression Testing</h1>
            <p class="subtitle">Pixel-Perfect Diff Detection & Analysis</p>
            <p class="timestamp">Generated: {datetime.now().strftime('%B %d, %Y at %H:%M:%S')}</p>
        </header>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number success">{len(results)}</div>
                <div class="stat-label">Routes Tested</div>
            </div>
            <div class="stat-card">
                <div class="stat-number danger">{sum(1 for r in results if r['has_regression'])}</div>
                <div class="stat-label">Regressions Detected</div>
            </div>
            <div class="stat-card">
                <div class="stat-number warning">{sum(r['changed_pixels'] for r in results):,}</div>
                <div class="stat-label">Total Changed Pixels</div>
            </div>
            <div class="stat-card">
                <div class="stat-number info">{round(sum(r['percent_changed'] for r in results) / len(results), 2)}%</div>
                <div class="stat-label">Avg. Pixel Difference</div>
            </div>
        </div>

        <div class="methodology">
            <h2>✅ Real Visual Regression Testing - How It Works</h2>
            <ul>
                <li><strong>Baseline Capture:</strong> Full-page screenshots taken of each route in pristine state</li>
                <li><strong>Intentional Changes:</strong> CSS modifications applied to simulate UI regressions</li>
                <li><strong>Pixel-by-Pixel Analysis:</strong> Every pixel compared between BEFORE and AFTER states</li>
                <li><strong>Diff Visualization:</strong> Red highlighting shows exact pixels that changed</li>
                <li><strong>Statistical Analysis:</strong> Precise metrics on total vs. changed pixels</li>
                <li><strong>Side-by-Side Comparison:</strong> Visual evidence of BEFORE | AFTER | DIFF</li>
                <li><strong>Automated Detection:</strong> Threshold-based regression flagging (>0.1% change)</li>
            </ul>
        </div>

        <div class="results">
            <h2 style="font-size: 2.5rem; margin-bottom: 40px; color: #111827;">🔍 Detailed Regression Analysis</h2>
"""

    for result in results:
        regression_class = "detected" if result['has_regression'] else "none"
        regression_text = "❌ REGRESSION DETECTED" if result['has_regression'] else "✅ NO REGRESSION"

        html += f"""
            <div class="result-item">
                <div class="result-header">
                    <div>
                        <div class="result-title">{result['name']}</div>
                        <div class="result-path">{result['path']}</div>
                    </div>
                    <div class="regression-badge {regression_class}">{regression_text}</div>
                </div>

                <div class="diff-stats">
                    <div class="diff-stat">
                        <div class="diff-stat-value">{result['total_pixels']:,}</div>
                        <div class="diff-stat-label">Total Pixels</div>
                    </div>
                    <div class="diff-stat">
                        <div class="diff-stat-value">{result['changed_pixels']:,}</div>
                        <div class="diff-stat-label">Changed Pixels</div>
                    </div>
                    <div class="diff-stat">
                        <div class="diff-stat-value">{result['percent_changed']:.3f}%</div>
                        <div class="diff-stat-label">Percent Changed</div>
                    </div>
                </div>

                <img src="diffs/{result['diff']}" alt="{result['name']} comparison" class="comparison-image" onclick="openLightbox(this.src)">
            </div>
"""

    html += """
        </div>

        <footer>
            <p>✅ Real Pixel-by-Pixel Visual Regression Testing</p>
            <p style="margin-top: 15px; opacity: 0.8;">Python + Playwright + PIL - Advanced Image Diff Analysis</p>
        </footer>
    </div>

    <div class="lightbox" id="lightbox" onclick="closeLightbox()">
        <span class="lightbox-close">&times;</span>
        <img id="lightbox-img" src="" alt="Full size comparison">
    </div>

    <script>
        function openLightbox(src) {
            document.getElementById('lightbox').classList.add('active');
            document.getElementById('lightbox-img').src = src;
        }
        function closeLightbox() {
            document.getElementById('lightbox').classList.remove('active');
        }
    </script>
</body>
</html>
"""

    REPORT_PATH.write_text(html)

if __name__ == "__main__":
    results = asyncio.run(main())
    print("\n✅ Visual regression testing complete!")
    print(f"\n📊 Summary:")
    print(f"   • Routes tested: {len(results)}")
    print(f"   • Regressions detected: {sum(1 for r in results if r['has_regression'])}")
    print(f"   • Total changed pixels: {sum(r['changed_pixels'] for r in results):,}")
    print(f"\n🌐 View report: open {REPORT_PATH}")
