#!/usr/bin/env python3
"""
Kimi K2.5 App Review Script
Uses Moonshot AI's Kimi K2.5 vision model to analyze Fleet CTA app screenshots
"""

import os
import sys
from openai import OpenAI
from pathlib import Path
import json

# Initialize Kimi K2.5 via Hugging Face Router
client = OpenAI(
    base_url="https://router.huggingface.co/v1",
    api_key=os.environ.get("HUGGINGFACE_API_KEY") or os.environ.get("HF_TOKEN"),
)

def analyze_screenshot(image_path: str, context: str = "") -> dict:
    """
    Analyze a screenshot using Kimi K2.5 vision model

    Args:
        image_path: Local path to screenshot or URL
        context: Additional context about what this screenshot shows

    Returns:
        dict with analysis results
    """

    # Determine if image_path is URL or local file
    if image_path.startswith("http"):
        image_url = image_path
    else:
        # For local files, we need to convert to base64 or host them
        # For now, we'll use a placeholder - in production you'd upload to CDN
        print(f"⚠️  Local file support requires base64 encoding: {image_path}")
        return None

    print(f"🔍 Analyzing: {context or image_path}")

    # Build the analysis prompt
    prompt = f"""Analyze this Fleet Management System screenshot and provide:

1. **UI/UX Assessment** (1-10 score):
   - Visual design quality
   - Layout and spacing
   - Color scheme effectiveness
   - Typography and readability
   - Accessibility considerations

2. **Functionality Review**:
   - What features are visible?
   - Are controls intuitive and well-placed?
   - Is information hierarchy clear?
   - Any confusing or cluttered areas?

3. **Recommendations**:
   - Top 3 improvements
   - Quick wins for better UX
   - Any critical issues to fix

4. **Strengths**:
   - What works well?
   - Best practices being followed

Context: {context if context else 'Fleet management dashboard screenshot'}

Provide analysis in JSON format with keys: ui_score, functionality, recommendations, strengths"""

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
                                "url": image_url
                            }
                        }
                    ]
                }
            ],
            temperature=0.7,
            max_tokens=2000
        )

        response = completion.choices[0].message.content
        print(f"✅ Analysis complete\n")

        return {
            "image": image_path,
            "context": context,
            "analysis": response,
            "raw_response": completion.choices[0].message
        }

    except Exception as e:
        print(f"❌ Error analyzing screenshot: {e}")
        return {
            "image": image_path,
            "error": str(e)
        }

def review_fleet_app(screenshot_urls: list = None):
    """
    Review the Fleet CTA app using multiple screenshots

    Args:
        screenshot_urls: List of screenshot URLs to analyze
    """

    # Default screenshots from the app (replace with actual URLs)
    if not screenshot_urls:
        screenshot_urls = [
            {
                "url": "http://localhost:5173",  # Live app - needs screenshot first
                "context": "Fleet Dashboard - Main Overview"
            }
        ]

    print("🚀 Starting Kimi K2.5 App Review\n")
    print("=" * 60)

    results = []

    for idx, screenshot in enumerate(screenshot_urls, 1):
        if isinstance(screenshot, dict):
            url = screenshot.get("url")
            context = screenshot.get("context", "")
        else:
            url = screenshot
            context = ""

        print(f"\n📸 Screenshot {idx}/{len(screenshot_urls)}")
        result = analyze_screenshot(url, context)

        if result:
            results.append(result)

            # Print analysis
            print("\n" + "─" * 60)
            print(result.get("analysis", "No analysis available"))
            print("─" * 60)

        print("\n")

    # Save results
    output_file = "kimi-review-results.json"
    with open(output_file, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\n✅ Review complete! Results saved to {output_file}")
    print(f"📊 Analyzed {len(results)} screenshots")

    return results

def review_live_app():
    """
    Take screenshots of the running app and review them
    """
    print("🎯 Live App Review Mode\n")
    print("This requires:")
    print("1. App running on http://localhost:5173")
    print("2. Playwright to capture screenshots")
    print("3. Screenshot upload to accessible URL")
    print("\nImplementing screenshot capture...\n")

    # TODO: Integrate with Playwright to capture screenshots
    # For now, provide manual instructions

    print("📋 Manual Review Process:")
    print("1. Open http://localhost:5173 in your browser")
    print("2. Take screenshots of key pages")
    print("3. Upload to imgur.com or similar")
    print("4. Call review_fleet_app() with the URLs")

    return None

# Example usage with a test image
def test_kimi_vision():
    """Test Kimi K2.5 with a sample image"""
    print("🧪 Testing Kimi K2.5 Vision Capabilities\n")

    test_image = "https://cdn.britannica.com/61/93061-050-99147DCE/Statue-of-Liberty-Island-New-York-Bay.jpg"

    completion = client.chat.completions.create(
        model="moonshotai/Kimi-K2.5:novita",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Describe this image in one sentence."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": test_image
                        }
                    }
                ]
            }
        ],
    )

    print(f"✅ Test successful!")
    print(f"Response: {completion.choices[0].message.content}\n")
    return True

if __name__ == "__main__":
    # Check for API key
    api_key = os.environ.get("HUGGINGFACE_API_KEY") or os.environ.get("HF_TOKEN")

    if not api_key:
        print("❌ Error: HUGGINGFACE_API_KEY or HF_TOKEN environment variable not set")
        print("\nSet it with:")
        print("  export HF_TOKEN='your-token-here'")
        sys.exit(1)

    print("🤖 Fleet CTA App Review with Kimi K2.5\n")

    # Run test first
    print("Step 1: Testing Kimi K2.5 connection...")
    if test_kimi_vision():
        print("\nStep 2: Ready to review Fleet app!")
        print("\nUsage:")
        print("  python kimi-app-review.py")
        print("\nTo review with URLs:")
        print("  from kimi_app_review import review_fleet_app")
        print("  review_fleet_app([")
        print("      {'url': 'https://...', 'context': 'Login page'},")
        print("      {'url': 'https://...', 'context': 'Dashboard'},")
        print("  ])")

        # Example: Review with placeholder
        print("\n" + "=" * 60)
        print("Would you like to proceed with live app review? (requires manual screenshot URLs)")
        print("=" * 60)
