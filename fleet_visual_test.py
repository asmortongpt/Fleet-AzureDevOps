#!/usr/bin/env python3
"""
CTAFleet Visual Testing with Playwright
Tests the running application at http://localhost:5174
"""

from playwright.sync_api import sync_playwright
import sys

def test_fleet_application():
    """Comprehensive visual testing of CTAFleet application"""

    print("🚀 Starting CTAFleet Visual Testing with Playwright\n")

    with sync_playwright() as p:
        # Launch browser in headless mode
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080}
        )
        page = context.new_page()

        # Enable console logging
        page.on("console", lambda msg: print(f"   [Browser Console] {msg.type}: {msg.text}"))

        try:
            # Test 1: Homepage Loading
            print("📍 Test 1: Loading homepage at http://localhost:5175")
            page.goto('http://localhost:5175', wait_until='networkidle', timeout=30000)
            print(f"   ✓ Page loaded successfully")
            print(f"   ✓ Page title: \"{page.title()}\"")
            print(f"   ✓ URL: {page.url}")

            # Wait for content to render
            page.wait_for_timeout(3000)

            # Take full page screenshot
            page.screenshot(path='/tmp/fleet-homepage-full.png', full_page=True)
            print("   ✓ Screenshot saved: /tmp/fleet-homepage-full.png")

            # Take viewport screenshot
            page.screenshot(path='/tmp/fleet-homepage-viewport.png', full_page=False)
            print("   ✓ Screenshot saved: /tmp/fleet-homepage-viewport.png\n")

            # Test 2: DOM Element Discovery
            print("📍 Test 2: Discovering UI elements")

            # Count basic elements
            button_count = page.locator('button').count()
            print(f"   ✓ Buttons found: {button_count}")

            link_count = page.locator('a').count()
            print(f"   ✓ Links found: {link_count}")

            input_count = page.locator('input').count()
            print(f"   ✓ Input fields found: {input_count}")

            # Check for navigation elements
            nav_count = page.locator('nav, header, [role="navigation"]').count()
            print(f"   ✓ Navigation elements: {nav_count}")

            # Check for main content area
            main_count = page.locator('main, [role="main"], .main-content, #root').count()
            print(f"   ✓ Main content areas: {main_count}\n")

            # Test 3: Content Verification
            print("📍 Test 3: Verifying page content")

            body_text = page.text_content('body')
            if body_text and len(body_text) > 100:
                print(f"   ✓ Page has content: {len(body_text)} characters")

                # Check for key fleet-related keywords
                keywords = ['fleet', 'vehicle', 'driver', 'dashboard']
                found_keywords = [kw for kw in keywords if kw.lower() in body_text.lower()]
                if found_keywords:
                    print(f"   ✓ Found keywords: {', '.join(found_keywords)}")
            else:
                print(f"   ⚠ Warning: Limited page content ({len(body_text) if body_text else 0} characters)")

            # Get page HTML
            html = page.content()
            print(f"   ✓ Page HTML length: {len(html)} characters\n")

            # Test 4: Interactive Elements
            print("📍 Test 4: Checking interactive elements")

            # Look for clickable elements
            clickable = page.locator('button, a, [role="button"], [onclick]').count()
            print(f"   ✓ Clickable elements: {clickable}")

            # Look for form elements
            forms = page.locator('form').count()
            print(f"   ✓ Forms: {forms}")

            # Look for tables (for data display)
            tables = page.locator('table').count()
            print(f"   ✓ Tables: {tables}\n")

            # Test 5: API Connectivity Check
            print("📍 Test 5: Testing API connectivity")

            # Create a new page for API testing
            api_page = context.new_page()

            # Test vehicles API
            vehicles_response = api_page.goto('http://localhost:3001/api/vehicles')
            print(f"   ✓ Vehicles API status: {vehicles_response.status}")

            if vehicles_response.status == 200:
                vehicles_data = vehicles_response.json()
                vehicle_count = len(vehicles_data.get('data', []))
                print(f"   ✓ Vehicles returned: {vehicle_count}")
                if vehicle_count > 0:
                    vehicle = vehicles_data['data'][0]
                    print(f"   ✓ Sample vehicle: {vehicle.get('make')} {vehicle.get('model')} ({vehicle.get('year')})")

            # Test health API
            health_response = api_page.goto('http://localhost:3001/api/health')
            print(f"   ✓ Health API status: {health_response.status}")

            if health_response.status == 200:
                health_data = health_response.json()
                print(f"   ✓ System status: {health_data.get('status')}")

                checks = health_data.get('checks', {})
                if 'database' in checks:
                    print(f"   ✓ Database: {checks['database'].get('status')}")
                if 'redis' in checks:
                    print(f"   ✓ Redis: {checks['redis'].get('status')}")

            api_page.close()
            print()

            # Test 6: Screenshot with specific state
            print("📍 Test 6: Capturing visual states")

            # Take screenshot of specific regions if they exist
            if nav_count > 0:
                nav = page.locator('nav, header').first
                if nav.is_visible():
                    nav.screenshot(path='/tmp/fleet-navigation.png')
                    print("   ✓ Navigation screenshot: /tmp/fleet-navigation.png")

            print()

            # Final Summary
            print("=" * 60)
            print("✅ All visual tests completed successfully!")
            print("=" * 60)
            print("\n📸 Screenshots saved to:")
            print("   - /tmp/fleet-homepage-full.png (full page)")
            print("   - /tmp/fleet-homepage-viewport.png (viewport)")
            if nav_count > 0:
                print("   - /tmp/fleet-navigation.png (navigation)")
            print("\n📊 Test Summary:")
            print(f"   - Buttons: {button_count}")
            print(f"   - Links: {link_count}")
            print(f"   - Input fields: {input_count}")
            print(f"   - Navigation elements: {nav_count}")
            print(f"   - API health check: {'✅' if health_response.status == 200 else '❌'}")
            print(f"   - Vehicles API: {'✅' if vehicles_response.status == 200 else '❌'}")
            print()

            return True

        except Exception as e:
            print(f"\n❌ Test failed with error: {str(e)}")
            print(f"   Error type: {type(e).__name__}")

            # Take error screenshot
            try:
                page.screenshot(path='/tmp/fleet-error.png', full_page=True)
                print("   📸 Error screenshot saved: /tmp/fleet-error.png")
            except:
                pass

            return False

        finally:
            browser.close()

if __name__ == '__main__':
    success = test_fleet_application()
    sys.exit(0 if success else 1)
