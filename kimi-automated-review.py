#!/usr/bin/env python3
"""
Automated Fleet CTA App Review with Kimi K2.5
Captures screenshots using Playwright and analyzes them with AI
"""

import os
import sys
import base64
from pathlib import Path
from openai import OpenAI
from playwright.sync_api import sync_playwright
import json
from datetime import datetime

# Initialize Kimi K2.5
client = OpenAI(
    base_url="https://router.huggingface.co/v1",
    api_key=os.environ.get("HUGGINGFACE_API_KEY") or os.environ.get("HF_TOKEN"),
)

# Pages to review
PAGES_TO_REVIEW = [
    {"url": "http://localhost:5173/login", "name": "Login Page", "wait": 2000},
    {"url": "http://localhost:5173", "name": "Main Dashboard", "wait": 3000},
    {"url": "http://localhost:5173/fleet", "name": "Fleet Hub", "wait": 3000},
    {"url": "http://localhost:5173/drivers", "name": "Drivers Hub", "wait": 3000},
    {"url": "http://localhost:5173/maintenance", "name": "Maintenance Hub", "wait": 3000},
]

def capture_screenshots():
    """Capture screenshots of all key pages"""
    print("📸 Capturing screenshots with Playwright...\n")

    screenshots = []
    output_dir = Path("kimi-review-screenshots")
    output_dir.mkdir(exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()

        for idx, page_info in enumerate(PAGES_TO_REVIEW, 1):
            print(f"[{idx}/{len(PAGES_TO_REVIEW)}] {page_info['name']}...")

            try:
                # Navigate to page
                page.goto(page_info['url'], wait_until='networkidle', timeout=15000)

                # Wait for page to settle
                page.wait_for_timeout(page_info.get('wait', 2000))

                # Take screenshot
                screenshot_path = output_dir / f"{idx:02d}_{page_info['name'].lower().replace(' ', '_')}.png"
                page.screenshot(path=str(screenshot_path), full_page=True)

                # Convert to base64 for API
                with open(screenshot_path, "rb") as f:
                    img_data = base64.b64encode(f.read()).decode('utf-8')

                screenshots.append({
                    "name": page_info['name'],
                    "url": page_info['url'],
                    "path": str(screenshot_path),
                    "base64": img_data,
                    "index": idx
                })

                print(f"  ✅ Saved: {screenshot_path}")

            except Exception as e:
                print(f"  ❌ Error: {e}")
                continue

        browser.close()

    print(f"\n✅ Captured {len(screenshots)} screenshots\n")
    return screenshots

def analyze_with_kimi(screenshot_data: dict) -> dict:
    """Analyze a screenshot using Kimi K2.5"""

    name = screenshot_data['name']
    print(f"🔍 Analyzing: {name}...")

    prompt = f"""You are an expert UI/UX reviewer analyzing a Fleet Management System.

**Page**: {name}

**Analysis Required**:

1. **UI/UX Score** (1-10): Rate the overall design quality
2. **Visual Design**:
   - Layout and spacing
   - Color scheme
   - Typography
   - Visual hierarchy
   - Accessibility

3. **Functionality**:
   - What features are visible?
   - Are controls intuitive?
   - Information architecture
   - Any confusing elements?

4. **Top 3 Recommendations**: Specific improvements
5. **Strengths**: What works well?
6. **Critical Issues**: Anything that must be fixed?

Provide detailed, actionable feedback. Be specific about locations and elements."""

    try:
        completion = client.chat.completions.create(
            model="moonshotai/Kimi-K2.5:novita",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{screenshot_data['base64']}"
                            }
                        }
                    ]
                }
            ],
            temperature=0.7,
            max_tokens=3000
        )

        analysis = completion.choices[0].message.content
        print(f"  ✅ Analysis complete\n")

        return {
            "page": name,
            "url": screenshot_data['url'],
            "screenshot": screenshot_data['path'],
            "analysis": analysis,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        print(f"  ❌ Error: {e}\n")
        return {
            "page": name,
            "error": str(e)
        }

def generate_report(results: list):
    """Generate comprehensive review report"""

    print("📊 Generating Report...\n")

    # Save JSON results
    json_file = f"kimi-review-{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(json_file, "w") as f:
        json.dump(results, f, indent=2)

    # Generate Markdown report
    md_file = json_file.replace('.json', '.md')

    with open(md_file, "w") as f:
        f.write(f"# Fleet CTA App Review - Kimi K2.5 AI Analysis\n\n")
        f.write(f"**Date**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"**Model**: Moonshot AI Kimi K2.5 (Vision)\n")
        f.write(f"**Pages Analyzed**: {len(results)}\n\n")
        f.write("---\n\n")

        for idx, result in enumerate(results, 1):
            if 'error' in result:
                f.write(f"## {idx}. {result['page']} ❌\n\n")
                f.write(f"**Error**: {result['error']}\n\n")
                continue

            f.write(f"## {idx}. {result['page']}\n\n")
            f.write(f"**URL**: `{result['url']}`\n")
            f.write(f"**Screenshot**: `{result['screenshot']}`\n\n")
            f.write(f"### AI Analysis\n\n")
            f.write(f"{result['analysis']}\n\n")
            f.write("---\n\n")

        # Summary
        f.write("## Summary\n\n")
        f.write(f"- **Total Pages Reviewed**: {len(results)}\n")
        f.write(f"- **Successful Analyses**: {len([r for r in results if 'error' not in r])}\n")
        f.write(f"- **Errors**: {len([r for r in results if 'error' in r])}\n\n")
        f.write("## Next Steps\n\n")
        f.write("1. Review AI recommendations\n")
        f.write("2. Prioritize critical issues\n")
        f.write("3. Implement quick wins\n")
        f.write("4. Plan UX improvements\n")

    print(f"✅ Reports generated:")
    print(f"   - JSON: {json_file}")
    print(f"   - Markdown: {md_file}\n")

    return md_file

def main():
    """Main execution"""

    print("=" * 70)
    print("🤖 Fleet CTA Automated App Review with Kimi K2.5")
    print("=" * 70)
    print()

    # Check API key
    api_key = os.environ.get("HUGGINGFACE_API_KEY") or os.environ.get("HF_TOKEN")
    if not api_key:
        print("❌ Error: HUGGINGFACE_API_KEY or HF_TOKEN not set")
        print("\nSet with:")
        print("  export HF_TOKEN='hf_...'")
        sys.exit(1)

    print("✅ API Key found")
    print(f"✅ Will analyze {len(PAGES_TO_REVIEW)} pages\n")

    # Step 1: Capture screenshots
    screenshots = capture_screenshots()

    if not screenshots:
        print("❌ No screenshots captured. Is the app running on localhost:5173?")
        sys.exit(1)

    # Step 2: Analyze with Kimi
    print("🤖 Starting AI Analysis...\n")
    results = []

    for screenshot in screenshots:
        result = analyze_with_kimi(screenshot)
        results.append(result)

        # Print analysis
        if 'analysis' in result:
            print("─" * 70)
            print(result['analysis'])
            print("─" * 70)
            print()

    # Step 3: Generate report
    report_file = generate_report(results)

    print("=" * 70)
    print("✅ Review Complete!")
    print("=" * 70)
    print(f"\n📄 Open the report: {report_file}\n")

if __name__ == "__main__":
    main()
