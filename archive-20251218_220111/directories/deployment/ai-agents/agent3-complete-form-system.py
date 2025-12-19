#!/usr/bin/env python3
"""
Agent 3: Complete Form System Builder
Uses Gemini 1.5 Pro API to build complete form component system with 15+ input types
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path
import subprocess
import google.generativeai as genai

# Configuration
AGENT_NAME = "Agent 3: Complete Form System Builder"
LLM_MODEL = "gemini-1.5-pro"
OUTPUT_FILE = "src/components/forms/FormComponents.tsx"
COMMIT_MESSAGE = "feat: Add complete form component system\n\n🤖 Generated with Gemini via AI Agent\n\nCo-Authored-By: Gemini <noreply@google.com>"

def log(message):
    """Log with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}", flush=True)

def main():
    log(f"Starting {AGENT_NAME}")
    log(f"Using model: {LLM_MODEL}")
    log(f"Output file: {OUTPUT_FILE}")

    # Check API key
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        log("ERROR: GEMINI_API_KEY not found")
        sys.exit(1)

    # Configure Gemini
    genai.configure(api_key=api_key)

    # Define the comprehensive prompt
    prompt = """You are an expert React, TypeScript, and form systems developer. Create a production-ready, comprehensive form component library with 15+ input types and advanced validation.

**Component Name**: FormComponents

**File**: src/components/forms/FormComponents.tsx

**Requirements**:

1. **Input Components** (15+ types):
   - TextInput (with prefix/suffix, clear button)
   - NumberInput (with step buttons, min/max, formatting)
   - EmailInput (with validation feedback)
   - PasswordInput (with show/hide toggle, strength meter)
   - TextArea (with auto-resize, character count)
   - DatePicker (with calendar popup, date range)
   - DateRangePicker (start/end dates)
   - TimePicker (with AM/PM or 24h format)
   - DateTimePicker (combined date and time)
   - Select (with search/filter)
   - Combobox (searchable dropdown with custom options)
   - MultiSelect (with chips, select all, clear all)
   - RadioGroup (horizontal/vertical layout)
   - CheckboxGroup (with indeterminate state)
   - Switch (toggle with label)
   - Slider (single value and range)
   - FileUpload (drag-and-drop, preview, multi-file)
   - ColorPicker (with presets and custom colors)
   - RichTextEditor (markdown support, toolbar)
   - PhoneInput (with country code picker)
   - URLInput (with validation)

2. **Common Props for All Inputs**:
```typescript
interface BaseInputProps {
  label?: string;
  name: string;
  value?: any;
  defaultValue?: any;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  error?: string | boolean;
  helperText?: string;
  loading?: boolean;
  onChange?: (value: any) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  className?: string;
  // Validation
  validate?: (value: any) => string | undefined | Promise<string | undefined>;
  validateOn?: 'blur' | 'change' | 'submit';
  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
  // Visual
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outlined' | 'filled' | 'underlined';
}
```

3. **Validation System**:
   - Built-in validators: required, email, url, min, max, pattern, minLength, maxLength
   - Custom validators (sync and async)
   - Real-time validation feedback
   - Cross-field validation support
   - Validation debouncing for performance
   - Error message customization

4. **Form Integration**:
   - Compatible with react-hook-form
   - Works standalone without form library
   - Built-in state management option
   - Form context for shared state

5. **Advanced Features**:
   - Dark mode support via Tailwind CSS
   - Loading states (skeleton, spinner)
   - Dirty state tracking
   - Touch state tracking
   - Focus management
   - Keyboard navigation
   - Copy/paste support
   - Auto-complete integration
   - Field dependencies (show/hide based on other fields)

6. **File Upload Features**:
   - Drag-and-drop zone
   - File preview (images, PDFs)
   - Multi-file selection
   - File size validation
   - File type validation
   - Progress indicators
   - Remove/replace files

7. **Rich Text Editor Features**:
   - Markdown support
   - Toolbar (bold, italic, underline, lists, links)
   - Preview mode
   - Syntax highlighting for code blocks
   - Image upload
   - Character/word count

8. **Accessibility**:
   - ARIA labels and descriptions
   - Keyboard navigation (Tab, Enter, Arrow keys, Escape)
   - Screen reader support
   - Focus indicators
   - Error announcements
   - Label associations

9. **Styling**:
   - Tailwind CSS for all styling
   - Consistent design system
   - Radix UI primitives where applicable
   - Custom theme support
   - Animation and transitions

10. **Example Usage**:
```typescript
import { TextInput, Select, DatePicker, FileUpload } from '@/components/forms/FormComponents';

<TextInput
  label="Full Name"
  name="fullName"
  required
  validate={(value) => value.length < 2 ? "Name too short" : undefined}
  error={errors.fullName}
/>

<Select
  label="Department"
  name="department"
  options={departments}
  searchable
  required
/>

<DateRangePicker
  label="Project Duration"
  name="duration"
  onChange={(range) => setDuration(range)}
/>

<FileUpload
  label="Attachments"
  name="files"
  accept="image/*,.pdf"
  multiple
  maxSize={10485760} // 10MB
  onUpload={(files) => handleUpload(files)}
/>
```

**Code Quality**:
- Production-ready with comprehensive error handling
- Full TypeScript support (no 'any' unless necessary)
- JSDoc comments for all components
- Proper input sanitization (prevent XSS)
- Parameterized operations (no string concatenation for security)
- Clean, readable code
- Proper React patterns (controlled components, memoization)

**Dependencies** (use what's in package.json):
- @radix-ui/react-* primitives
- react-hook-form
- date-fns
- lucide-react (icons)
- tailwindcss

**Output Format**:
Provide ONLY the complete TypeScript code. No explanations, no markdown, just the raw .tsx file content with all 15+ input components.
"""

    log("Sending request to Gemini API...")

    try:
        # Create model
        model = genai.GenerativeModel(LLM_MODEL)

        # Generate content
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=16000,
                temperature=0.2,
            )
        )

        # Extract code from response
        code = response.text

        # Clean up code (remove markdown if present)
        if "```" in code:
            import re
            code_blocks = re.findall(r'```(?:typescript|tsx|javascript|jsx)?\n(.*?)\n```', code, re.DOTALL)
            if code_blocks:
                code = code_blocks[0]

        log(f"Received {len(code)} characters of code")

        # Create output directory if it doesn't exist
        output_path = Path(OUTPUT_FILE)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Write code to file
        log(f"Writing code to {OUTPUT_FILE}...")
        with open(OUTPUT_FILE, 'w') as f:
            f.write(code)

        log("Code written successfully")

        # Git operations
        log("Adding file to git...")
        subprocess.run(["git", "add", OUTPUT_FILE], check=True)

        log("Creating commit...")
        subprocess.run(["git", "commit", "-m", COMMIT_MESSAGE], check=True)

        log("Pushing to repository...")
        subprocess.run(["git", "push"], check=True)

        log(f"{AGENT_NAME} completed successfully!")
        log(f"File: {OUTPUT_FILE}")
        log(f"Commit: {COMMIT_MESSAGE.split(chr(10))[0]}")

        # Write completion status
        with open("agent3-status.json", 'w') as f:
            json.dump({
                "agent": AGENT_NAME,
                "status": "completed",
                "output_file": OUTPUT_FILE,
                "timestamp": datetime.now().isoformat(),
                "code_length": len(code)
            }, f, indent=2)

    except Exception as e:
        log(f"ERROR: {str(e)}")
        import traceback
        log(traceback.format_exc())

        # Write error status
        with open("agent3-status.json", 'w') as f:
            json.dump({
                "agent": AGENT_NAME,
                "status": "failed",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }, f, indent=2)

        sys.exit(1)

if __name__ == "__main__":
    main()
