#!/usr/bin/env python3
"""
Simple Feature Generator for Fleet Management App
Generates SwiftUI views one at a time with immediate output
"""

import os
import sys
from openai import OpenAI

# Initialize OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def read_context_files():
    """Read existing Swift files for code style context"""
    context = []
    sample_files = [
        "App/DashboardView.swift",
        "App/VehiclesView.swift"
    ]

    for filepath in sample_files:
        try:
            with open(filepath, 'r') as f:
                content = f.read()[:800]  # First 800 chars
                context.append(f"=== Example from {filepath} ===\n{content}\n")
        except:
            pass

    return "\n".join(context)

def generate_swift_view(feature_name, description, complexity="medium"):
    """Generate a production-ready SwiftUI view"""

    context = read_context_files()

    prompt = f"""Generate a complete, production-ready SwiftUI view for a Fleet Management iOS app.

Feature: {feature_name}
Description: {description}
Complexity: {complexity}

CRITICAL REQUIREMENTS:
1. SECURITY FIRST - All inputs validated, SQL parameterized ($1, $2), no hardcoded secrets
2. Follow SwiftUI best practices and Apple HIG
3. Use MVVM architecture with @StateObject ViewModel
4. Include error handling and loading states
5. Professional UI with proper spacing, SF Symbols icons, iOS design patterns
6. Accessibility labels for VoiceOver
7. Support iPhone and iPad (responsive layout)
8. Include comprehensive documentation comments

Context from existing codebase:
{context}

Generate ONLY the Swift code (no markdown, no explanations). Include:
- Import statements
- View struct conforming to View protocol
- ViewModel class (ObservableObject) if needed
- Professional UI using Lists, Forms, Cards as appropriate
- Preview provider for Xcode Canvas
- Security-first code (parameterized queries, input validation)

Make it look professional, production-ready, and aligned with existing app style!"""

    print(f"🚀 Generating {feature_name}...")

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert Swift/SwiftUI iOS developer specializing in enterprise fleet management applications. Generate production-ready, secure, well-documented code."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=4000
        )

        code = response.choices[0].message.content

        # Clean any markdown formatting
        if code.startswith("```swift"):
            code = code[7:]
        if code.startswith("```"):
            code = code[3:]
        if code.endswith("```"):
            code = code[:-3]
        code = code.strip()

        # Remove any trailing explanations after the code
        if "#endif" in code:
            # Find last occurrence of #endif and trim everything after it
            last_endif = code.rfind("#endif")
            code = code[:last_endif + 6].strip()

        return code

    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def save_to_file(feature_name, code):
    """Save generated code to file"""
    os.makedirs("App/Views/Generated", exist_ok=True)
    filepath = f"App/Views/Generated/{feature_name}.swift"

    with open(filepath, 'w') as f:
        f.write(code)

    print(f"✅ Saved to {filepath}")
    print(f"📊 Code length: {len(code)} characters\n")

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 simple_feature_generator.py <feature_name> <description> [complexity]")
        print("Example: python3 simple_feature_generator.py TripTrackingView 'Real-time GPS tracking and trip logging' medium")
        sys.exit(1)

    feature_name = sys.argv[1]
    description = sys.argv[2]
    complexity = sys.argv[3] if len(sys.argv) > 3 else "medium"

    code = generate_swift_view(feature_name, description, complexity)

    if code:
        save_to_file(feature_name, code)
        print("✅ SUCCESS!")
    else:
        print("❌ FAILED!")
        sys.exit(1)

if __name__ == "__main__":
    main()
