#!/usr/bin/env python3
"""
Agent 5: Storybook Documentation Builder
Uses GPT-4 Turbo API to create comprehensive Storybook documentation
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path
import subprocess
from openai import OpenAI

# Configuration
AGENT_NAME = "Agent 5: Storybook Documentation Builder"
LLM_MODEL = "gpt-4-turbo-preview"
COMMIT_MESSAGE = "docs: Add Storybook documentation for all components\n\n🤖 Generated with GPT-4 via AI Agent\n\nCo-Authored-By: GPT-4 <noreply@openai.com>"

def log(message):
    """Log with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}", flush=True)

def main():
    log(f"Starting {AGENT_NAME}")
    log(f"Using model: {LLM_MODEL}")

    # Check API key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        log("ERROR: OPENAI_API_KEY not found")
        sys.exit(1)

    # Initialize OpenAI client
    client = OpenAI(api_key=api_key)

    # Step 1: Create Storybook configuration
    log("Step 1: Creating Storybook configuration...")

    config_prompt = """Create a complete Storybook 8 configuration for a React TypeScript project (Fleet Management System).

**Files to Create**:

1. `.storybook/main.ts` - Main Storybook configuration
2. `.storybook/preview.tsx` - Global decorators and parameters
3. `.storybook/manager.ts` - Storybook manager customization

**Requirements**:

1. **Main Configuration**:
   - Stories location: src/**/*.stories.tsx
   - Addons: actions, links, essentials, interactions, a11y, docs
   - Framework: @storybook/react-vite
   - TypeScript support
   - Vite builder for fast HMR

2. **Preview Configuration**:
   - Light and dark theme support
   - Tailwind CSS integration
   - Global decorators for theme provider
   - Viewport configurations (mobile, tablet, desktop)
   - Actions configuration
   - Docs configuration

3. **Manager Configuration**:
   - Custom branding for Fleet Management System
   - Theme customization
   - Sidebar configuration

Provide complete configuration as JSON with file paths as keys and content as values.
Format: {"filepath": "content"}"""

    try:
        # Generate Storybook configuration
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[{
                "role": "system",
                "content": "You are an expert in Storybook configuration and React development."
            }, {
                "role": "user",
                "content": config_prompt
            }],
            max_tokens=4000,
            temperature=0.2
        )

        config_content = response.choices[0].message.content

        # Extract JSON
        import re
        json_match = re.search(r'\{.*\}', config_content, re.DOTALL)
        if json_match:
            configs = json.loads(json_match.group())

            # Write configuration files
            for filepath, content in configs.items():
                output_path = Path(filepath)
                output_path.parent.mkdir(parents=True, exist_ok=True)

                # Clean content if it has markdown
                if "```" in content:
                    code_blocks = re.findall(r'```(?:typescript|tsx|javascript|jsx)?\n(.*?)\n```', content, re.DOTALL)
                    if code_blocks:
                        content = code_blocks[0]

                log(f"  Writing {filepath}...")
                with open(filepath, 'w') as f:
                    f.write(content)

        log("✓ Storybook configuration created")

        # Step 2: Install Storybook dependencies (add to package.json)
        log("Step 2: Checking Storybook dependencies...")

        # Read package.json
        with open('package.json', 'r') as f:
            package_data = json.load(f)

        # Check if Storybook is already in devDependencies
        dev_deps = package_data.get('devDependencies', {})

        if '@storybook/react-vite' not in dev_deps:
            log("  Storybook not found, adding note to install...")
            with open('STORYBOOK_INSTALL_INSTRUCTIONS.md', 'w') as f:
                f.write("""# Storybook Installation Instructions

Run the following command to install Storybook dependencies:

```bash
npm install --save-dev @storybook/react-vite@latest \\
  @storybook/addon-essentials@latest \\
  @storybook/addon-interactions@latest \\
  @storybook/addon-links@latest \\
  @storybook/addon-a11y@latest \\
  @storybook/blocks@latest \\
  @storybook/test@latest \\
  storybook@latest
```

Then run:
```bash
npm run storybook
```
""")
        else:
            log("  Storybook dependencies already installed")

        # Step 3: Create story files for key components
        log("Step 3: Creating story files for components...")

        # Components to document
        components = [
            ("src/components/tables/EnterpriseDataTable.tsx", "Tables"),
            ("src/components/charts/ChartLibrary.tsx", "Charts"),
            ("src/components/forms/FormComponents.tsx", "Forms"),
            ("src/components/shared/DataTable.tsx", "Shared"),
            ("src/components/ThemeToggle.tsx", "UI"),
            ("src/components/LoadingSpinner.tsx", "UI"),
            ("src/components/StatusIndicator.tsx", "UI"),
        ]

        story_files = []

        for component_path, category in components:
            if not os.path.exists(component_path):
                log(f"  Skipping {component_path} (not found)")
                continue

            component_name = Path(component_path).stem
            story_path = component_path.replace('.tsx', '.stories.tsx')

            log(f"  Creating story for {component_name}...")

            story_prompt = f"""Create a comprehensive Storybook story file for the component: {component_name}

**Story File**: {story_path}

**Requirements**:

1. **Meta Configuration**:
   - Title: "{category}/{component_name}"
   - Component import
   - Tags: autodocs
   - Parameters for docs

2. **Stories**:
   - Default story
   - All possible variants/states
   - Interactive examples with controls
   - Edge cases (loading, error, empty states)
   - Accessibility examples

3. **Args Configuration**:
   - All props as args
   - Realistic default values
   - Control types (text, boolean, select, etc.)

4. **Documentation**:
   - Component description
   - Props documentation
   - Usage examples

5. **Accessibility**:
   - Include accessibility checks
   - ARIA examples

**Example Structure**:
```typescript
import type {{ Meta, StoryObj }} from '@storybook/react';
import {{ {component_name} }} from './{component_name}';

const meta: Meta<typeof {component_name}> = {{
  title: '{category}/{component_name}',
  component: {component_name},
  tags: ['autodocs'],
  parameters: {{
    docs: {{
      description: {{
        component: 'Component description here',
      }},
    }},
  }},
}};

export default meta;
type Story = StoryObj<typeof {component_name}>;

export const Default: Story = {{
  args: {{
    // props
  }},
}};

// More stories...
```

Provide ONLY the complete story file content. No explanations."""

            try:
                story_response = client.chat.completions.create(
                    model=LLM_MODEL,
                    messages=[{
                        "role": "system",
                        "content": "You are an expert in Storybook and component documentation."
                    }, {
                        "role": "user",
                        "content": story_prompt
                    }],
                    max_tokens=3000,
                    temperature=0.2
                )

                story_content = story_response.choices[0].message.content

                # Clean content
                if "```" in story_content:
                    code_blocks = re.findall(r'```(?:typescript|tsx)?\n(.*?)\n```', story_content, re.DOTALL)
                    if code_blocks:
                        story_content = code_blocks[0]

                # Write story file
                story_file_path = Path(story_path)
                story_file_path.parent.mkdir(parents=True, exist_ok=True)

                with open(story_path, 'w') as f:
                    f.write(story_content)

                story_files.append(story_path)
                log(f"    ✓ Created {story_path}")

            except Exception as e:
                log(f"    ✗ Failed to create story for {component_name}: {str(e)}")

        log(f"✓ Created {len(story_files)} story files")

        # Step 4: Create introduction page
        log("Step 4: Creating Storybook introduction...")

        intro_path = "src/stories/Introduction.mdx"
        Path(intro_path).parent.mkdir(parents=True, exist_ok=True)

        intro_content = """import { Meta } from '@storybook/blocks';

<Meta title="Introduction" />

# Fleet Management System - Component Library

Welcome to the Fleet Management System component library documentation.

## Overview

This Storybook contains comprehensive documentation for all components in the Fleet Management System, including:

- **Tables**: Enterprise-grade data tables with sorting, filtering, and export
- **Charts**: 15+ chart types for data visualization
- **Forms**: Complete form system with 15+ input types and validation
- **Shared Components**: Reusable UI components
- **UI Elements**: Common UI components (buttons, indicators, etc.)

## Getting Started

Browse the components in the sidebar to see examples, props, and usage documentation.

## Features

- 🎨 **Dark Mode**: All components support light and dark themes
- ♿ **Accessibility**: WCAG 2.1 AA compliant
- 📱 **Responsive**: Mobile-first design
- 🚀 **Performance**: Optimized for large datasets
- 🔧 **Customizable**: Extensive prop-based customization

## Development

To run Storybook locally:

```bash
npm run storybook
```

To build Storybook:

```bash
npm run build-storybook
```
"""

        with open(intro_path, 'w') as f:
            f.write(intro_content)

        log("✓ Introduction created")

        # Git operations
        log("Committing changes to git...")

        # Add all Storybook files
        subprocess.run(["git", "add", ".storybook/", "src/stories/", "*.md"], check=True)

        # Add story files
        if story_files:
            subprocess.run(["git", "add"] + story_files, check=True)

        subprocess.run(["git", "commit", "-m", COMMIT_MESSAGE], check=True)
        subprocess.run(["git", "push"], check=True)

        log(f"{AGENT_NAME} completed successfully!")
        log(f"  Configuration files: .storybook/")
        log(f"  Story files: {len(story_files)}")
        log(f"  Introduction: {intro_path}")

        # Write completion status
        with open("agent5-status.json", 'w') as f:
            json.dump({
                "agent": AGENT_NAME,
                "status": "completed",
                "story_files_created": len(story_files),
                "timestamp": datetime.now().isoformat()
            }, f, indent=2)

    except Exception as e:
        log(f"ERROR: {str(e)}")
        import traceback
        log(traceback.format_exc())

        # Write error status
        with open("agent5-status.json", 'w') as f:
            json.dump({
                "agent": AGENT_NAME,
                "status": "failed",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }, f, indent=2)

        sys.exit(1)

if __name__ == "__main__":
    main()
