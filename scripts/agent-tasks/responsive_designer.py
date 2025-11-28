#!/usr/bin/env python3
"""
Responsive Designer Task - Ensures responsive design across all screen sizes
Uses: OpenAI GPT-4 Turbo
"""

import os
import json
import openai
from pathlib import Path
import glob

def make_responsive():
    """Ensure responsive design across all screen sizes"""

    openai.api_key = os.getenv('OPENAI_API_KEY')

    # Find all component files
    component_files = glob.glob("/home/azureuser/Fleet/src/components/**/*.tsx", recursive=True)

    print(f"📋 Making {len(component_files)} components responsive")

    responsive_files = []
    breakpoints_used = {
        "sm": "640px - Small devices",
        "md": "768px - Medium devices (tablets)",
        "lg": "1024px - Large devices (desktops)",
        "xl": "1280px - Extra large devices",
        "2xl": "1536px - 2X Extra large devices"
    }

    for file_path in component_files:
        try:
            with open(file_path, 'r') as f:
                content = f.read()

            # Skip if already responsive or too small
            if len(content) < 300:
                continue

            # Check if component needs responsive improvements
            needs_responsive = True
            if all(bp in content for bp in ["sm:", "md:", "lg:"]):
                needs_responsive = False

            if not needs_responsive:
                continue

            print(f"  🔧 Making responsive: {os.path.basename(file_path)}")

            prompt = f"""Make this React component fully responsive across all screen sizes:

{content}

Apply responsive design patterns:

1. BREAKPOINTS (Tailwind):
   - Mobile first: base styles for mobile
   - sm: (640px+) Small tablets
   - md: (768px+) Tablets
   - lg: (1024px+) Desktops
   - xl: (1280px+) Large desktops
   - 2xl: (1536px+) Ultra-wide screens

2. LAYOUT:
   - Use flex or grid with responsive columns
   - Mobile: 1 column (grid-cols-1)
   - Tablet: 2 columns (md:grid-cols-2)
   - Desktop: 3-4 columns (lg:grid-cols-3 xl:grid-cols-4)
   - Full-width on mobile, constrained on desktop

3. TYPOGRAPHY:
   - Base: text-sm or text-base
   - Tablet: md:text-base
   - Desktop: lg:text-lg
   - Headings scale up with screen size

4. SPACING:
   - Compact padding on mobile (p-2, p-4)
   - More breathing room on desktop (md:p-6, lg:p-8)
   - Responsive gaps (gap-2 md:gap-4 lg:gap-6)

5. NAVIGATION:
   - Hamburger menu on mobile
   - Full navigation on desktop
   - Sticky headers that adapt

6. IMAGES & MEDIA:
   - Use aspect-ratio for consistent sizing
   - Responsive image sizes (w-full md:w-1/2 lg:w-1/3)
   - Lazy loading for performance

7. FORMS:
   - Full-width inputs on mobile
   - Multi-column forms on desktop
   - Touch-friendly targets (min-h-12)

8. TABLES:
   - Card layout on mobile
   - Scrollable tables on tablet
   - Full tables on desktop
   - Or use responsive table patterns

9. MODALS/DIALOGS:
   - Full-screen on mobile
   - Centered with max-width on desktop
   - Appropriate padding for each size

10. HIDE/SHOW:
    - Use hidden md:block for desktop-only
    - Use md:hidden for mobile-only
    - Swap components based on screen size

11. TOUCH TARGETS:
    - Minimum 44px (h-11 or min-h-11) for mobile
    - Adequate spacing between clickable elements
    - Larger buttons on mobile

12. PERFORMANCE:
    - Use responsive images with srcset
    - Conditional rendering for complex components
    - Lazy load off-screen content

IMPORTANT:
- Mobile-first approach (base styles for mobile)
- Test at all breakpoints mentally
- Maintain functionality across sizes
- Keep TypeScript types
- Don't break existing component APIs
- Ensure touch-friendly on mobile
- Keep loading states responsive too

Return ONLY the responsive component code, no explanations."""

            response = openai.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are an expert in responsive web design using Tailwind CSS and React."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
            )

            responsive_code = response.choices[0].message.content

            # Extract code from markdown if wrapped
            if "```" in responsive_code:
                if "```typescript" in responsive_code:
                    responsive_code = responsive_code.split("```typescript")[1].split("```")[0].strip()
                elif "```tsx" in responsive_code:
                    responsive_code = responsive_code.split("```tsx")[1].split("```")[0].strip()
                else:
                    parts = responsive_code.split("```")
                    for i, part in enumerate(parts):
                        if i % 2 == 1:
                            responsive_code = part
                            if responsive_code.startswith("typescript") or responsive_code.startswith("tsx"):
                                responsive_code = "\n".join(responsive_code.split("\n")[1:])
                            break

            # Backup original
            backup_path = f"{file_path}.responsive-backup"
            with open(backup_path, 'w') as f:
                f.write(content)

            # Write responsive version
            with open(file_path, 'w') as f:
                f.write(responsive_code)

            responsive_files.append(file_path)
            print(f"    ✅ Made responsive: {os.path.basename(file_path)}")

        except Exception as e:
            print(f"    ❌ Error making responsive {file_path}: {str(e)}")
            continue

    # Create responsive design guide
    design_guide = f"""# Fleet Management - Responsive Design Guide

## Breakpoints
{chr(10).join(f"- **{bp}**: {desc}" for bp, desc in breakpoints_used.items())}

## Layout Patterns

### Mobile (< 640px)
- Single column layouts
- Stacked navigation
- Full-width cards
- Compact spacing (p-2, p-4)
- Hamburger menus

### Tablet (640px - 1024px)
- 2-column grids
- Side navigation or tabs
- Moderate spacing (p-4, p-6)
- Hybrid navigation

### Desktop (1024px+)
- 3-4 column grids
- Full navigation bars
- Generous spacing (p-6, p-8)
- Multi-panel layouts
- Sidebar + main content

## Component Adaptations

### Dashboard
- Mobile: Stacked metric cards
- Tablet: 2x2 grid
- Desktop: 4-column grid with sidebar

### Fleet Map
- Mobile: Full-screen with overlay controls
- Tablet: Map with side panel
- Desktop: Map with expandable side panel + top bar

### Vehicle List
- Mobile: Full-width cards, scroll vertically
- Tablet: 2-column grid
- Desktop: Table view or 3-column grid

### Forms
- Mobile: Stacked fields, full-width
- Tablet: 2-column layout for related fields
- Desktop: Multi-column with logical grouping

### Modals
- Mobile: Full-screen overlay
- Tablet: 80% width, centered
- Desktop: Max-width 600px-800px, centered

## Touch Targets
- **Minimum size**: 44x44px (iOS guideline)
- **Recommended**: 48x48px (Material Design)
- **Spacing**: 8px minimum between targets

## Typography Scale
- **Mobile**: text-sm to text-base
- **Tablet**: text-base to text-lg
- **Desktop**: text-lg to text-xl
- **Headings**: Scale 1.25x per breakpoint

## Testing Checklist
- [ ] Test at 375px (iPhone SE)
- [ ] Test at 768px (iPad)
- [ ] Test at 1024px (iPad Pro landscape)
- [ ] Test at 1920px (Desktop)
- [ ] Test at 2560px (4K)
- [ ] Portrait and landscape orientations
- [ ] Touch interactions on mobile
- [ ] Mouse/keyboard on desktop

## Performance
- Use `hidden md:block` wisely (doesn't save rendering)
- Consider conditional rendering for heavy components
- Lazy load images and videos
- Responsive images with srcset
- Throttle resize events if needed
"""

    guide_path = "/home/azureuser/Fleet/RESPONSIVE_DESIGN_GUIDE.md"
    with open(guide_path, 'w') as f:
        f.write(design_guide)

    # Create summary
    summary = {
        "status": "completed",
        "files_made_responsive": len(responsive_files),
        "breakpoints": breakpoints_used,
        "patterns_applied": [
            "Mobile-first approach",
            "Responsive grid layouts",
            "Adaptive typography",
            "Screen-size specific components",
            "Touch-friendly interactions",
            "Responsive spacing and padding",
            "Conditional visibility (hide/show)",
            "Responsive images and media",
            "Adaptive navigation patterns"
        ],
        "files": [os.path.basename(f) for f in responsive_files],
        "design_guide": guide_path,
        "ai_engine": "OpenAI GPT-4 Turbo"
    }

    summary_path = "/home/azureuser/Fleet/responsive-summary.json"
    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2)

    print(f"\n✅ Responsive design implementation completed!")
    print(f"   Made {len(responsive_files)} files responsive")
    print(f"   Design guide: {guide_path}")
    print(f"   Summary: {summary_path}")

    return summary

if __name__ == "__main__":
    result = make_responsive()
    print(json.dumps(result, indent=2))
