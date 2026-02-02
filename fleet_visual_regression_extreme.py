#!/usr/bin/env python3
"""
Fleet CTA - EXTREME Visual Regression Testing
Demonstrates 50%+ pixel changes with full-screen visual modifications
"""

import asyncio
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageChops
import numpy as np
from playwright.async_api import async_playwright
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5174"
OUTPUT_DIR = Path(__file__).parent / "tests" / "visual"
SNAPSHOTS_DIR = OUTPUT_DIR / "snapshots-extreme"
DIFFS_DIR = OUTPUT_DIR / "diffs-extreme"

# Create output directories
SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)
DIFFS_DIR.mkdir(parents=True, exist_ok=True)

# Test routes
ROUTES = [
    {"name": "Home Page", "path": "/"},
    {"name": "Fleet Hub", "path": "/fleet"},
    {"name": "Analytics Dashboard", "path": "/analytics"},
]


async def introduce_extreme_visual_change(page):
    """
    Inject MASSIVE full-screen visual changes that will affect 50%+ of pixels
    - Full viewport overlay with bright colors
    - Animated gradients
    - Large text overlays
    - Complete DOM manipulation
    """
    await page.evaluate("""() => {
        // Create full-screen overlay that covers EVERYTHING
        const overlay = document.createElement('div');
        overlay.id = 'extreme-visual-regression-overlay';
        overlay.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 999999 !important;
            pointer-events: none !important;
            background: repeating-linear-gradient(
                45deg,
                rgba(255, 0, 255, 0.7) 0px,
                rgba(255, 0, 255, 0.7) 50px,
                rgba(0, 255, 255, 0.7) 50px,
                rgba(0, 255, 255, 0.7) 100px,
                rgba(255, 255, 0, 0.7) 100px,
                rgba(255, 255, 0, 0.7) 150px
            ) !important;
            animation: rotate-gradient 3s linear infinite !important;
        `;

        // Add massive text overlay
        const textOverlay = document.createElement('div');
        textOverlay.style.cssText = `
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) rotate(-15deg) !important;
            font-size: 120px !important;
            font-weight: 900 !important;
            color: #FF0000 !important;
            text-shadow:
                0 0 20px #FFFF00,
                0 0 40px #FF00FF,
                0 0 60px #00FFFF,
                10px 10px 0 #000000 !important;
            z-index: 1000000 !important;
            pointer-events: none !important;
            white-space: nowrap !important;
        `;
        textOverlay.textContent = '🔥 VISUAL REGRESSION DETECTED 🔥';

        // Add giant border around everything
        const borderOverlay = document.createElement('div');
        borderOverlay.style.cssText = `
            position: fixed !important;
            top: 20px !important;
            left: 20px !important;
            right: 20px !important;
            bottom: 20px !important;
            border: 40px solid #FF0000 !important;
            z-index: 999998 !important;
            pointer-events: none !important;
            box-shadow:
                inset 0 0 100px rgba(255, 255, 0, 0.8),
                0 0 100px rgba(255, 0, 255, 0.8) !important;
        `;

        // Append overlays
        document.body.appendChild(overlay);
        document.body.appendChild(textOverlay);
        document.body.appendChild(borderOverlay);

        // Modify ALL existing elements
        document.querySelectorAll('*').forEach(el => {
            if (el.id === 'extreme-visual-regression-overlay') return;

            // Add bright backgrounds to all elements
            const currentBg = window.getComputedStyle(el).backgroundColor;
            if (currentBg === 'rgba(0, 0, 0, 0)' || currentBg === 'transparent') {
                el.style.backgroundColor = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
            }

            // Add random colored borders
            el.style.border = `${Math.random() * 10 + 5}px solid rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;

            // Transform elements randomly
            el.style.transform = `rotate(${Math.random() * 10 - 5}deg) scale(${0.9 + Math.random() * 0.2})`;
        });

        // Change body background
        document.body.style.background = `
            radial-gradient(circle at 20% 50%, #FF0000 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, #00FF00 0%, transparent 50%),
            radial-gradient(circle at 50% 80%, #0000FF 0%, transparent 50%),
            linear-gradient(135deg, #FF00FF 0%, #FFFF00 100%)
        `;
    }""")

    # Wait for animations to settle
    await page.wait_for_timeout(500)


def calculate_pixel_diff_extreme(img1_path, img2_path, diff_output_path):
    """Calculate pixel-by-pixel difference with LOWER threshold for more detection"""
    img1 = Image.open(img1_path).convert('RGB')
    img2 = Image.open(img2_path).convert('RGB')

    # Resize if different sizes
    if img1.size != img2.size:
        img2 = img2.resize(img1.size)

    # Calculate difference with LOWER threshold (1 pixel instead of 10)
    diff = ImageChops.difference(img1, img2)

    # Create highlighted diff with 1-pixel sensitivity
    diff_data = np.array(diff)
    mask = np.any(diff_data > 1, axis=2)  # LOWER threshold = more detected changes

    # Create visualization
    diff_viz = np.array(img1).copy()
    diff_viz[mask] = [255, 0, 0]  # Highlight differences in bright red

    # Create side-by-side comparison
    width, height = img1.size
    comparison = Image.new('RGB', (width * 3, height))
    comparison.paste(img1, (0, 0))
    comparison.paste(img2, (width, 0))
    comparison.paste(Image.fromarray(diff_viz), (width * 2, 0))

    # Add labels
    draw = ImageDraw.Draw(comparison)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 60)
    except:
        font = ImageFont.load_default()

    draw.text((40, 40), "BEFORE", fill=(0, 255, 0), font=font)
    draw.text((width + 40, 40), "AFTER (EXTREME CHANGES)", fill=(255, 255, 0), font=font)
    draw.text((width * 2 + 40, 40), "DIFF (Red = Changed)", fill=(255, 0, 0), font=font)

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


async def run_extreme_visual_regression():
    """Run extreme visual regression tests"""
    print("\n" + "="*80)
    print("🔥 EXTREME VISUAL REGRESSION TESTING - 50%+ Pixel Changes 🔥")
    print("="*80 + "\n")

    results = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})

        for route in ROUTES:
            route_name = route["name"].lower().replace(" ", "-")
            print(f"\n{'='*80}")
            print(f"📸 Testing: {route['name']} ({route['path']})")
            print(f"{'='*80}")

            # Navigate to route
            await page.goto(f"{BASE_URL}{route['path']}", wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(1000)

            # Close any modals
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(200)

            # BEFORE screenshot
            before_path = SNAPSHOTS_DIR / f"before-{route_name}.png"
            print(f"  ✓ Capturing BEFORE screenshot...")
            await page.screenshot(path=before_path, full_page=True)

            # Introduce EXTREME changes
            print(f"  🔥 Introducing EXTREME visual changes (full-screen overlays)...")
            await introduce_extreme_visual_change(page)

            # AFTER screenshot
            after_path = SNAPSHOTS_DIR / f"after-{route_name}.png"
            print(f"  ✓ Capturing AFTER screenshot...")
            await page.screenshot(path=after_path, full_page=True)

            # Generate diff
            diff_path = DIFFS_DIR / f"diff-{route_name}.png"
            print(f"  🔍 Generating pixel-by-pixel difference analysis...")
            diff_stats = calculate_pixel_diff_extreme(before_path, after_path, diff_path)

            print(f"  📊 Results:")
            print(f"     • Total pixels: {diff_stats['total_pixels']:,}")
            print(f"     • Changed pixels: {diff_stats['changed_pixels']:,}")
            print(f"     • Percent changed: {diff_stats['percent_changed']}%")
            print(f"     • Visual regression: {'❌ DETECTED' if diff_stats['has_regression'] else '✅ NONE'}")

            result = {
                **route,
                "before": str(before_path.name),
                "after": str(after_path.name),
                "diff": str(diff_path.name),
                **diff_stats
            }
            results.append(result)

            # Reload page for next test
            await page.reload(wait_until="networkidle")

        await browser.close()

    # Generate HTML report
    generate_extreme_html_report(results)

    print("\n" + "="*80)
    print("✅ EXTREME Visual Regression Testing Complete!")
    print("="*80)
    print(f"\n📄 Results:")
    print(f"   • Total routes tested: {len(results)}")
    print(f"   • Regressions detected: {sum(1 for r in results if r['has_regression'])}")
    print(f"   • Average pixel change: {sum(r['percent_changed'] for r in results) / len(results):.2f}%")
    print(f"   • Report: {OUTPUT_DIR / 'VISUAL_REGRESSION_EXTREME.html'}")


def generate_extreme_html_report(results):
    """Generate interactive HTML report for extreme visual regression"""
    total_changed = sum(r["changed_pixels"] for r in results)
    avg_percent = sum(r["percent_changed"] for r in results) / len(results)
    regressions = sum(1 for r in results if r["has_regression"])

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fleet CTA - EXTREME Visual Regression Testing (50%+ Changes)</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #FF0000 0%, #FF00FF 50%, #0000FF 100%);
            padding: 40px 20px;
            min-height: 100vh;
        }}
        .container {{
            max-width: 1600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 30px 100px rgba(0,0,0,0.5);
            overflow: hidden;
        }}
        header {{
            background: linear-gradient(135deg, #FF0000 0%, #FF6B00 100%);
            color: white;
            padding: 60px;
            text-align: center;
        }}
        h1 {{
            font-size: 3.5rem;
            margin-bottom: 20px;
            text-shadow: 0 4px 20px rgba(0,0,0,0.5);
            animation: pulse 2s ease-in-out infinite;
        }}
        @keyframes pulse {{
            0%, 100% {{ transform: scale(1); }}
            50% {{ transform: scale(1.05); }}
        }}
        .subtitle {{
            font-size: 1.5rem;
            opacity: 0.95;
            font-weight: 600;
        }}
        .stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
            padding: 60px;
            background: #000;
        }}
        .stat-card {{
            background: linear-gradient(135deg, #FF00FF 0%, #FF0000 100%);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(255,0,255,0.5);
            text-align: center;
            color: white;
            transition: transform 0.3s ease;
        }}
        .stat-card:hover {{ transform: translateY(-10px) scale(1.05); }}
        .stat-number {{
            font-size: 4rem;
            font-weight: bold;
            margin-bottom: 15px;
            text-shadow: 0 2px 10px rgba(0,0,0,0.5);
        }}
        .stat-label {{
            font-size: 1.1rem;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: 600;
        }}
        .results {{
            padding: 60px;
        }}
        .result-item {{
            margin-bottom: 80px;
            background: linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%);
            border-radius: 20px;
            padding: 50px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            border: 5px solid #FF0000;
        }}
        .result-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 5px solid #FF0000;
        }}
        .result-title {{
            font-size: 2.5rem;
            font-weight: 800;
            color: #FF0000;
            text-transform: uppercase;
        }}
        .regression-badge {{
            padding: 15px 30px;
            border-radius: 30px;
            font-weight: 800;
            font-size: 1.2rem;
            text-transform: uppercase;
            background: #FF0000;
            color: white;
            box-shadow: 0 5px 20px rgba(255,0,0,0.5);
        }}
        .diff-stats {{
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
            margin-bottom: 40px;
        }}
        .diff-stat {{
            background: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            border: 3px solid #FF00FF;
        }}
        .diff-stat-value {{
            font-size: 2.5rem;
            font-weight: bold;
            color: #FF0000;
        }}
        .diff-stat-label {{
            color: #000;
            font-size: 1rem;
            margin-top: 10px;
            font-weight: 600;
        }}
        .comparison-image {{
            width: 100%;
            border-radius: 15px;
            box-shadow: 0 15px 50px rgba(255,0,0,0.3);
            cursor: pointer;
            transition: transform 0.3s ease;
            border: 5px solid #FF00FF;
        }}
        .comparison-image:hover {{
            transform: scale(1.02);
        }}
        .methodology {{
            background: linear-gradient(135deg, #FF0000 0%, #FF6B00 100%);
            padding: 60px;
            margin: 60px;
            border-radius: 20px;
            color: white;
            border: 5px solid #FFD700;
        }}
        .methodology h2 {{
            margin-bottom: 30px;
            font-size: 2.5rem;
        }}
        .methodology ul {{
            list-style-position: inside;
            line-height: 2.2;
            font-size: 1.2rem;
        }}
        .methodology li {{
            margin-bottom: 20px;
        }}
        .methodology strong {{ color: #FFD700; }}
        footer {{
            text-align: center;
            padding: 50px;
            background: #000;
            color: white;
        }}
        footer p {{ font-size: 1.3rem; }}
        .lightbox {{
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.98);
            z-index: 10000;
            justify-content: center;
            align-items: center;
            padding: 40px;
        }}
        .lightbox.active {{ display: flex; }}
        .lightbox img {{
            max-width: 95%;
            max-height: 95%;
            border-radius: 10px;
            border: 5px solid #FF0000;
        }}
        .lightbox-close {{
            position: absolute;
            top: 30px;
            right: 50px;
            color: #FF0000;
            font-size: 5rem;
            cursor: pointer;
            font-weight: 300;
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🔥 EXTREME Visual Regression Testing 🔥</h1>
            <p class="subtitle">50%+ Pixel Changes - Full-Screen Overlay Demonstration</p>
            <p style="margin-top: 15px; opacity: 0.9; font-size: 1.1rem;">Generated: {datetime.now().strftime("%B %d, %Y at %H:%M:%S")}</p>
        </header>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">{len(results)}</div>
                <div class="stat-label">Routes Tested</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">{regressions}</div>
                <div class="stat-label">Regressions Detected</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">{total_changed:,}</div>
                <div class="stat-label">Total Changed Pixels</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">{avg_percent:.1f}%</div>
                <div class="stat-label">Avg. Pixel Difference</div>
            </div>
        </div>

        <div class="methodology">
            <h2>🔥 EXTREME Testing Methodology - How We Achieved 50%+ Changes</h2>
            <ul>
                <li><strong>Full-Screen Overlays:</strong> Injected fixed-position overlays covering entire viewport</li>
                <li><strong>Animated Gradients:</strong> Repeating diagonal stripes (magenta, cyan, yellow) at 70% opacity</li>
                <li><strong>Giant Text Overlays:</strong> 120px text with multi-color shadow effects centered on screen</li>
                <li><strong>Complete DOM Manipulation:</strong> Every element gets random colored backgrounds and borders</li>
                <li><strong>40px Red Borders:</strong> Giant red border around entire viewport with glowing shadows</li>
                <li><strong>Lower Threshold:</strong> 1-pixel sensitivity (vs previous 10-pixel) detects subtle changes</li>
                <li><strong>Rainbow Background:</strong> Radial gradients (red, green, blue) overlaid on linear gradient</li>
                <li><strong>Random Transforms:</strong> All elements randomly rotated (-5° to +5°) and scaled (0.9x to 1.1x)</li>
            </ul>
        </div>

        <div class="results">
            <h2 style="font-size: 3rem; margin-bottom: 50px; color: #FF0000; text-align: center;">🔍 Extreme Regression Analysis</h2>

"""

    for result in results:
        regression_status = "REGRESSION DETECTED" if result["has_regression"] else "NO REGRESSION"

        html += f"""
            <div class="result-item">
                <div class="result-header">
                    <div>
                        <div class="result-title">{result['name']}</div>
                        <div style="color: #666; font-family: monospace; font-size: 1.2rem; margin-top: 10px;">{result['path']}</div>
                    </div>
                    <div class="regression-badge">🔥 {regression_status}</div>
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

                <img src="diffs-extreme/{result['diff']}" alt="{result['name']} comparison" class="comparison-image" onclick="openLightbox(this.src)">
            </div>
"""

    html += """
        </div>

        <footer>
            <p>🔥 EXTREME Pixel-by-Pixel Visual Regression Testing - 50%+ Changes Demonstrated</p>
            <p style="margin-top: 20px; opacity: 0.8;">Python + Playwright + PIL + NumPy - Advanced Image Diff Analysis</p>
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

    report_path = OUTPUT_DIR / "VISUAL_REGRESSION_EXTREME.html"
    report_path.write_text(html)
    print(f"\n📄 HTML Report generated: {report_path}")


if __name__ == "__main__":
    asyncio.run(run_extreme_visual_regression())
