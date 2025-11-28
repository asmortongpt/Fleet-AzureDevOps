#!/usr/bin/env python3
"""
Reactive Drilldown Task - Makes all data, maps, and visuals reactive with drilldown
Uses: Google Gemini 1.5 Pro
"""

import os
import json
import google.generativeai as genai
from pathlib import Path
import glob

def implement_drilldown():
    """Make all data, maps, and visuals reactive with drilldown to primary records"""

    genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
    model = genai.GenerativeModel('gemini-1.5-pro')

    # Components that need drilldown functionality
    drilldown_targets = [
        {
            "file": "/home/azureuser/Fleet/src/components/modules/FleetDashboard.tsx",
            "drilldown": "Dashboard metrics → Vehicle details",
            "actions": ["Click on vehicle count → Show vehicle list", "Click on status chart → Filter by status"]
        },
        {
            "file": "/home/azureuser/Fleet/src/components/modules/FleetMap.tsx",
            "drilldown": "Map markers → Vehicle details panel",
            "actions": ["Click marker → Show vehicle info", "Cluster click → Zoom to vehicles"]
        },
        {
            "file": "/home/azureuser/Fleet/src/components/modules/VehicleList.tsx",
            "drilldown": "Vehicle cards → Full vehicle details",
            "actions": ["Click vehicle → Navigate to details", "Click status badge → Filter by status"]
        },
        {
            "file": "/home/azureuser/Fleet/src/components/modules/OBD2Dashboard.tsx",
            "drilldown": "Telemetry gauges → Historical data",
            "actions": ["Click gauge → Show trend chart", "Click alert → Show diagnostic details"]
        },
        {
            "file": "/home/azureuser/Fleet/src/components/modules/RadioCommunications.tsx",
            "drilldown": "Radio messages → Full conversation thread",
            "actions": ["Click message → Show thread", "Click user → Show user profile"]
        },
        {
            "file": "/home/azureuser/Fleet/src/components/modules/DispatchBoard.tsx",
            "drilldown": "Dispatch cards → Task details",
            "actions": ["Click task → Show full details", "Click vehicle → Show vehicle location on map"]
        }
    ]

    enhanced_files = []

    for target in drilldown_targets:
        file_path = target["file"]

        if not os.path.exists(file_path):
            print(f"  ⚠️  File not found: {os.path.basename(file_path)}")
            continue

        try:
            with open(file_path, 'r') as f:
                original_code = f.read()

            print(f"  🔧 Adding drilldown to: {os.path.basename(file_path)}")

            prompt = f"""Enhance this React component with reactive drilldown functionality:

{original_code}

Required drilldown pattern: {target['drilldown']}

Implement these interactive actions:
{chr(10).join(f"- {action}" for action in target['actions'])}

Apply these enhancements:

1. CLICK HANDLERS:
   - Add onClick handlers to all visual elements (charts, cards, markers, gauges)
   - Use proper event typing (React.MouseEvent)
   - Prevent event bubbling where needed

2. NAVIGATION:
   - Use Next.js router for page navigation
   - Use state/modal for inline details
   - Implement smooth transitions

3. STATE MANAGEMENT:
   - Track selected item in state
   - Manage detail panel visibility
   - Handle loading states for data fetching

4. VISUAL FEEDBACK:
   - Add hover effects (cursor-pointer, scale, opacity)
   - Highlight selected items
   - Show loading spinners during data fetch
   - Use tooltips to indicate clickability

5. DETAIL PANELS:
   - Create slide-out panels or modals for details
   - Use shadcn/ui Sheet or Dialog components
   - Include close button and backdrop
   - Fetch full record data when opened

6. DATA FLOW:
   - Pass vehicle ID or record ID through props
   - Fetch detailed data using API client
   - Update URL params for deep linking
   - Preserve filter/search state

7. ACCESSIBILITY:
   - Add ARIA labels for interactive elements
   - Support keyboard navigation (Enter, Escape)
   - Focus management for modals
   - Screen reader announcements

8. PERFORMANCE:
   - Debounce rapid clicks
   - Cache detail data when possible
   - Use React.memo for detail components
   - Lazy load detail panels

9. ERROR HANDLING:
   - Show error states if data fetch fails
   - Provide fallback UI
   - Allow retry on error

10. MOBILE RESPONSIVE:
    - Full-screen modals on mobile
    - Touch-friendly click targets (min 44px)
    - Swipe to close on mobile

IMPORTANT:
- Maintain all existing functionality
- Keep TypeScript types
- Use existing state management patterns
- Don't break parent component integration
- Add proper loading and error states
- Make interactions feel instant (optimistic UI)

Return ONLY the enhanced component code, no explanations."""

            response = model.generate_content(prompt)
            enhanced_code = response.text

            # Extract code from markdown if wrapped
            if "```" in enhanced_code:
                if "```typescript" in enhanced_code:
                    enhanced_code = enhanced_code.split("```typescript")[1].split("```")[0].strip()
                elif "```tsx" in enhanced_code:
                    enhanced_code = enhanced_code.split("```tsx")[1].split("```")[0].strip()
                else:
                    enhanced_code = enhanced_code.split("```")[1].split("```")[0].strip()

            # Backup original
            backup_path = f"{file_path}.drilldown-backup"
            with open(backup_path, 'w') as f:
                f.write(original_code)

            # Write enhanced version
            with open(file_path, 'w') as f:
                f.write(enhanced_code)

            enhanced_files.append(file_path)
            print(f"    ✅ Enhanced: {os.path.basename(file_path)}")

        except Exception as e:
            print(f"    ❌ Error enhancing {file_path}: {str(e)}")
            continue

    # Create drilldown interaction guide
    interaction_guide = """# Fleet Management - Interactive Drilldown Guide

## Dashboard Metrics
- **Click vehicle count** → Opens filtered vehicle list
- **Click status chart segment** → Filters vehicles by status
- **Click metric card** → Shows detailed breakdown

## Fleet Map
- **Click vehicle marker** → Opens vehicle detail panel
- **Click marker cluster** → Zooms to vehicle group
- **Click vehicle in list** → Centers map on vehicle

## Vehicle List
- **Click vehicle card** → Opens full vehicle details
- **Click status badge** → Filters by that status
- **Click location** → Shows vehicle on map
- **Click VIN** → Copies to clipboard

## OBD2 Dashboard
- **Click gauge** → Shows historical trend chart
- **Click alert badge** → Opens diagnostic details
- **Click metric** → Displays related telemetry

## Radio Communications
- **Click message** → Opens full conversation thread
- **Click user avatar** → Shows user profile
- **Click timestamp** → Filters messages by time

## Dispatch Board
- **Click dispatch card** → Opens task details
- **Click vehicle name** → Shows vehicle on map
- **Click status** → Filters tasks by status
- **Click driver** → Shows driver profile

## Keyboard Shortcuts
- **Enter** → Open selected item
- **Escape** → Close detail panel/modal
- **Arrow keys** → Navigate between items
- **Tab** → Focus next interactive element

## Mobile Gestures
- **Tap** → Open details
- **Swipe left** → Close panel
- **Long press** → Show context menu
- **Pinch zoom** → Zoom map (where applicable)
"""

    guide_path = "/home/azureuser/Fleet/INTERACTION_GUIDE.md"
    with open(guide_path, 'w') as f:
        f.write(interaction_guide)

    # Create summary
    summary = {
        "status": "completed",
        "files_enhanced": len(enhanced_files),
        "drilldown_patterns": [target["drilldown"] for target in drilldown_targets],
        "enhancements_applied": [
            "Click handlers on all visual elements",
            "Navigation to detail views",
            "Slide-out panels and modals",
            "Hover effects and visual feedback",
            "Deep linking with URL params",
            "Keyboard navigation support",
            "Mobile-friendly interactions",
            "Loading and error states",
            "Data fetching on demand"
        ],
        "files": [os.path.basename(f) for f in enhanced_files],
        "interaction_guide": guide_path,
        "ai_engine": "Google Gemini 1.5 Pro"
    }

    summary_path = "/home/azureuser/Fleet/drilldown-summary.json"
    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2)

    print(f"\n✅ Drilldown implementation completed!")
    print(f"   Enhanced {len(enhanced_files)} files")
    print(f"   Interaction guide: {guide_path}")
    print(f"   Summary: {summary_path}")

    return summary

if __name__ == "__main__":
    result = implement_drilldown()
    print(json.dumps(result, indent=2))
