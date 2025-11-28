#!/usr/bin/env python3
"""
ENHANCED PHYSICAL BUTTON PTT ORCHESTRATOR
Implements PTT with user-selectable buttons that works OUTSIDE the app
(backgrounded, screen locked, app closed)
"""
import asyncio
import json
import os
import time
from datetime import datetime
from typing import Dict, List, Any
import aiohttp

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')

class EnhancedPTTOrchestrator:
    """Orchestrates enhanced PTT with background operation"""

    def __init__(self):
        self.results = []
        self.start_time = time.time()
        self.output_dir = "orchestration/enhanced_ptt_output"
        os.makedirs(self.output_dir, exist_ok=True)

    async def call_openai_gpt4(self, prompt: str, task_name: str) -> Dict[str, Any]:
        """Call OpenAI GPT-4 Turbo"""
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "gpt-4-turbo",
            "messages": [
                {"role": "system", "content": "You are an expert iOS developer specializing in background audio, CallKit, and AVFoundation. Generate production-ready Swift code."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 4000
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=payload, timeout=aiohttp.ClientTimeout(total=120)) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return {
                            "success": True,
                            "content": data["choices"][0]["message"]["content"],
                            "model": "gpt-4-turbo",
                            "task": task_name
                        }
                    else:
                        error_text = await resp.text()
                        return {
                            "success": False,
                            "error": f"HTTP {resp.status}: {error_text}",
                            "model": "gpt-4-turbo",
                            "task": task_name
                        }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "model": "gpt-4-turbo",
                "task": task_name
            }

    async def execute_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a single task"""
        print(f"\n{'='*60}")
        print(f"🚀 Starting: {task['name']}")
        print(f"🤖 Using: {task['agent']}")
        print(f"{'='*60}")

        start = time.time()
        result = await self.call_openai_gpt4(task['prompt'], task['name'])
        duration = time.time() - start
        result['duration'] = duration
        result['category'] = task['category']

        if result.get('success'):
            output_file = f"{self.output_dir}/{task['filename']}"
            with open(output_file, 'w') as f:
                f.write(result['content'])
            result['output_file'] = output_file
            print(f"✅ Completed in {duration:.2f}s")
        else:
            print(f"❌ Failed: {result.get('error', 'Unknown error')}")

        return result

    async def run_all_tasks(self):
        """Execute all enhanced PTT tasks"""

        tasks = [
            {
                "name": "Enhanced Physical Button PTT with Background Support",
                "category": "ptt_enhanced",
                "agent": "gpt-4-turbo",
                "filename": "EnhancedPhysicalButtonPTTService.swift",
                "prompt": """Create ENHANCED Physical Button PTT that works OUTSIDE the app:

CRITICAL REQUIREMENTS:
1. Works when app is BACKGROUNDED
2. Works when screen is LOCKED
3. Works when app is CLOSED (background audio mode)
4. User can choose which button to use (Volume Up, Volume Down, or BOTH)
5. NO headphone button (user doesn't want it)
6. Persistent settings stored in UserDefaults
7. CallKit integration for locked screen operation
8. Background audio session with proper interruption handling

BUTTON OPTIONS (User Selectable):
- Volume Up Only
- Volume Down Only
- Both Volume Buttons (either one triggers PTT)
- Disabled (on-screen button only)

BACKGROUND OPERATION:
- Use AVAudioSession background audio mode
- CallKit audio session for locked screen
- Background task for PTT processing
- Proper audio session interruption handling
- Resume after phone calls or other audio interruptions

IMPLEMENTATION DETAILS:
- MPVolumeView for volume button interception
- KVO on outputVolume
- Reset volume immediately (no visible change)
- CallKit CXProvider for background PTT
- Background modes: audio, voip
- Proper lifecycle management (app delegate integration)
- Battery-efficient (minimal CPU when idle)

USER SETTINGS:
- Settings screen with button selection picker
- Enable/disable physical button PTT
- Test button to verify it works
- Info text explaining how it works
- Warning about CallKit permission

ERROR HANDLING:
- Handle microphone permission denied
- Handle audio session failures
- Handle CallKit permission denied
- Graceful degradation if background modes not enabled
- User-friendly error messages

Include complete Swift code with CallKit, AVAudioSession, and SwiftUI settings view."""
            },
            {
                "name": "PTT Settings View with Button Selection",
                "category": "settings_ui",
                "agent": "gpt-4-turbo",
                "filename": "PTTSettingsView.swift",
                "prompt": """Create SwiftUI settings view for Physical Button PTT:

UI COMPONENTS:
1. Enable/Disable Toggle
   - Master switch for physical button PTT
   - Shows warning if disabled

2. Button Selection Picker
   - Volume Up Only
   - Volume Down Only
   - Both Volume Buttons
   - On-Screen Button Only (disables physical buttons)

3. Test Button
   - "Test Your Selection" button
   - Shows alert when button press detected
   - Helps user verify configuration works

4. Background Operation Status
   - Shows if CallKit is enabled
   - Shows if background audio is enabled
   - Shows if microphone permission granted
   - Link to Settings app if permissions missing

5. Instructions Section
   - How to use physical button PTT
   - Works even when screen is locked
   - Works when app is backgrounded
   - Battery impact information

6. Troubleshooting
   - If PTT not working, check permissions
   - Restart app after changing settings
   - Contact support button

DESIGN:
- Clean iOS Settings app style
- Form with sections
- SF Symbols icons
- Proper spacing and padding
- Accessibility labels
- Dark mode support

INTEGRATION:
- Read/write from UserDefaults
- Notify EnhancedPhysicalButtonPTTService of changes
- Restart PTT service when settings change
- Request permissions when enabled

Include complete SwiftUI code with all components."""
            },
            {
                "name": "CallKit Integration for Locked Screen PTT",
                "category": "callkit",
                "agent": "gpt-4-turbo",
                "filename": "PTTCallKitProvider.swift",
                "prompt": """Create CallKit integration for PTT that works on locked screen:

REQUIREMENTS:
1. CXProvider for PTT "calls"
2. Shows PTT UI on locked screen
3. Volume buttons work when locked
4. Display current PTT channel name
5. Show speaking/listening status
6. Handle incoming phone calls (pause PTT)
7. Resume PTT after call ends
8. Proper audio session management

CALLKIT FEATURES:
- CXProviderConfiguration with PTT branding
- Custom ringtone for PTT notifications
- Lock screen caller ID shows channel name
- Call hold/resume for real phone calls
- Multiple "calls" for multiple PTT channels
- Proper call state management

AUDIO SESSION:
- Configure for VoIP category
- Allow Bluetooth audio
- Mix with other audio when appropriate
- Handle interruptions (phone calls, Siri, etc.)
- Restore audio session after interruption

LOCKED SCREEN BEHAVIOR:
- Show "Fleet PTT - Dispatch Channel" on lock screen
- Volume buttons trigger PTT even when locked
- Visual feedback on lock screen (mic icon)
- Answer/hang up buttons control PTT connection
- Swipe to open app shows full PTT interface

LIFECYCLE:
- Start provider when app launches
- Register for PTT events
- Create/end calls based on PTT state
- Handle system kill (save state, restart)
- Background refresh for persistent connection

Include complete Swift code with CXProvider, CXProviderDelegate, and audio session management."""
            },
            {
                "name": "Background Audio Manager for PTT",
                "category": "background_audio",
                "agent": "gpt-4-turbo",
                "filename": "PTTBackgroundAudioManager.swift",
                "prompt": """Create Background Audio Manager for continuous PTT operation:

REQUIREMENTS:
1. Maintain WebRTC connection in background
2. Keep audio session active when backgrounded
3. Process volume button events in background
4. Minimize battery usage
5. Handle app suspension/resume
6. Restore state after background eviction

AUDIO SESSION CONFIGURATION:
- Category: AVAudioSession.Category.playAndRecord
- Mode: AVAudioSession.Mode.voiceChat
- Options: .allowBluetooth, .allowBluetoothA2DP, .mixWithOthers
- Activate/deactivate appropriately
- Handle route changes (headphones plugged/unplugged)

BACKGROUND MODES:
- Audio (for continuous PTT audio)
- VoIP (for receiving PTT notifications)
- Background fetch (for state sync)

BATTERY OPTIMIZATION:
- Idle timeout after 30 minutes of inactivity
- Reduce polling frequency when in background
- Suspend non-critical tasks
- Use significant location changes (not continuous GPS)

STATE PRESERVATION:
- Save current PTT channel
- Save connection state
- Save button configuration
- Restore on app relaunch
- Handle state restoration after crash

NOTIFICATION SUPPORT:
- Local notifications for PTT events
- "Someone is talking in Dispatch channel"
- Tap notification to return to app
- Badge count for unread PTT messages

LIFECYCLE MANAGEMENT:
- applicationDidEnterBackground
- applicationWillEnterForeground
- applicationDidBecomeActive
- Handle UIApplication state transitions

Include complete Swift code with AVAudioSession, background task management, and state restoration."""
            },
            {
                "name": "Info.plist Configuration for Background PTT",
                "category": "configuration",
                "agent": "gpt-4-turbo",
                "filename": "INFO_PLIST_PTT_CONFIG.xml",
                "prompt": """Create complete Info.plist configuration for background PTT:

REQUIRED KEYS:

1. Background Modes:
   - audio (for continuous PTT audio)
   - voip (for CallKit integration)
   - fetch (for state sync)
   - remote-notification (for PTT events)

2. Usage Descriptions:
   - NSMicrophoneUsageDescription
   - NSBluetoothAlwaysUsageDescription (for Bluetooth headsets)
   - NSBluetoothPeripheralUsageDescription

3. Audio Session:
   - UIBackgroundModes
   - Required background audio

4. CallKit:
   - iOS deployment target 13.0+
   - CallKit framework

5. Capabilities:
   - Push notifications
   - Background modes
   - Audio, AirPlay, and Picture in Picture

Include complete XML configuration ready to paste into Info.plist."""
            },
            {
                "name": "Comprehensive PTT Integration Tests",
                "category": "testing",
                "agent": "gpt-4-turbo",
                "filename": "EnhancedPTTIntegrationTests.swift",
                "prompt": """Create comprehensive tests for enhanced background PTT:

TEST SCENARIOS:

1. Button Press Detection
   - Volume up triggers PTT
   - Volume down triggers PTT
   - Both buttons work when "Both" selected
   - Only selected button works
   - Disabled buttons don't trigger PTT

2. Background Operation
   - PTT works when app backgrounded
   - PTT works when screen locked
   - Volume resets properly in background
   - Audio session maintains in background

3. CallKit Integration
   - CXProvider configured correctly
   - Locked screen shows PTT UI
   - Incoming call pauses PTT
   - PTT resumes after call ends

4. Settings Persistence
   - Button selection saved
   - Settings restored on app launch
   - Settings sync across app restarts

5. Permission Handling
   - Microphone permission requested
   - Graceful degradation if denied
   - CallKit permission handling

6. Audio Session
   - Audio session activates correctly
   - Route changes handled (headphones)
   - Interruptions handled (Siri, calls)
   - Session restored after interruption

7. Battery Impact
   - CPU usage minimal when idle
   - No excessive wake locks
   - Background refresh efficient

8. Edge Cases
   - Rapid button presses
   - App killed by system
   - Low memory conditions
   - Network disconnection during PTT

Include complete XCTest code with mocks and async testing."""
            },
            {
                "name": "Enhanced PTT Deployment Guide",
                "category": "documentation",
                "agent": "gpt-4-turbo",
                "filename": "ENHANCED_PTT_DEPLOYMENT_GUIDE.md",
                "prompt": """Create deployment guide for enhanced background PTT:

SECTIONS:

1. Overview
   - Physical button PTT that works OUTSIDE the app
   - User-selectable buttons (Volume Up/Down/Both)
   - Works when backgrounded, locked, or closed
   - CallKit integration for locked screen

2. Prerequisites
   - iOS 14.0+ required
   - Background modes enabled
   - CallKit framework added
   - Proper Info.plist configuration

3. Info.plist Setup
   - Required background modes
   - Usage descriptions
   - Audio session configuration
   - Step-by-step instructions

4. App Capabilities
   - Enable Background Modes
   - Enable Push Notifications
   - Add Audio, VoIP modes
   - Screenshots of Xcode settings

5. User Settings
   - How to access PTT settings
   - How to choose button preference
   - How to test configuration
   - How to enable/disable

6. Testing Procedures
   - Test with app in foreground
   - Test with app backgrounded
   - Test with screen locked
   - Test with app force-closed
   - Test after device reboot

7. Troubleshooting
   - PTT not working when locked
   - Volume changing instead of PTT
   - Audio session errors
   - CallKit permission denied
   - Background audio not working

8. Best Practices
   - Inform users about battery usage
   - Guide users through permission setup
   - Provide clear instructions
   - Monitor for audio interruptions

9. Battery Optimization
   - Expected battery impact
   - How to minimize usage
   - Idle timeout configuration
   - Background refresh limits

10. Known Limitations
    - iOS volume HUD briefly appears
    - Cannot completely hide volume change
    - CallKit required for locked screen
    - Background fetch limits

Include step-by-step instructions with code examples and screenshots."""
            }
        ]

        print(f"\n{'='*60}")
        print(f"🚀 ENHANCED PTT ORCHESTRATOR")
        print(f"{'='*60}")
        print(f"Total Tasks: {len(tasks)}")
        print(f"Focus: Background operation + User-selectable buttons")
        print(f"Output Directory: {self.output_dir}")
        print(f"{'='*60}\n")

        # Execute all tasks
        for task in tasks:
            result = await self.execute_task(task)
            self.results.append(result)
            await asyncio.sleep(1)  # Brief pause between tasks

        # Generate report
        self.generate_report()

    def generate_report(self):
        """Generate completion report"""
        total_duration = time.time() - self.start_time
        successful = [r for r in self.results if r.get('success')]
        failed = [r for r in self.results if not r.get('success')]

        report = {
            "timestamp": datetime.now().isoformat(),
            "total_tasks": len(self.results),
            "successful": len(successful),
            "failed": len(failed),
            "total_duration_seconds": total_duration,
            "results": self.results
        }

        report_file = f"{self.output_dir}/enhanced_ptt_report.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)

        print(f"\n{'='*60}")
        print(f"📊 ENHANCED PTT - FINAL REPORT")
        print(f"{'='*60}")
        print(f"✅ Successful: {len(successful)}/{len(self.results)}")
        print(f"❌ Failed: {len(failed)}/{len(self.results)}")
        print(f"⏱️  Total Duration: {total_duration:.2f}s")
        print(f"\n📁 All outputs saved to: {self.output_dir}/")
        print(f"📋 Full report: {report_file}")
        print(f"{'='*60}\n")

async def main():
    orchestrator = EnhancedPTTOrchestrator()
    await orchestrator.run_all_tasks()

if __name__ == "__main__":
    asyncio.run(main())
