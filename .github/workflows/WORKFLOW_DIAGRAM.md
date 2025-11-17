# Playwright CI/CD Workflow Diagram

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    TRIGGER EVENTS                            │
├─────────────────────────────────────────────────────────────┤
│  Pull Request  │  Push to Main  │  Nightly  │  Manual       │
│  to main       │                │  2 AM UTC │  Trigger      │
└────────┬───────────────┬────────────┬────────────┬───────────┘
         │               │            │            │
         └───────────────┴────────────┴────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │   Server Health Check             │
         │   - Verify http://68.220.148.2    │
         │   - 5 retry attempts              │
         │   - 5 second intervals            │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │   Parallel Test Execution         │
         │   (3 Shards)                      │
         ├───────────────────────────────────┤
         │  ┌─────────────────────────────┐  │
         │  │  Shard 1: Tests 1-41        │  │
         │  │  - Chromium browser         │  │
         │  │  - 1 retry on failure       │  │
         │  │  - ~5 min execution         │  │
         │  └─────────────────────────────┘  │
         │  ┌─────────────────────────────┐  │
         │  │  Shard 2: Tests 42-82       │  │
         │  │  - Chromium browser         │  │
         │  │  - 1 retry on failure       │  │
         │  │  - ~5 min execution         │  │
         │  └─────────────────────────────┘  │
         │  ┌─────────────────────────────┐  │
         │  │  Shard 3: Tests 83-122      │  │
         │  │  - Chromium browser         │  │
         │  │  - 1 retry on failure       │  │
         │  │  - ~5 min execution         │  │
         │  └─────────────────────────────┘  │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │   Artifact Collection             │
         │   (Per Shard)                     │
         ├───────────────────────────────────┤
         │  - Test results                   │
         │  - Screenshots (on failure)       │
         │  - Videos (on failure)            │
         │  - Traces (on failure)            │
         │  - HTML reports                   │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │   Merge Reports                   │
         │   - Combine all shard results     │
         │   - Generate unified HTML report  │
         │   - Create JSON summary           │
         │   - Generate JUnit XML            │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │   Generate Summary                │
         │   - Test statistics               │
         │   - Pass/fail counts              │
         │   - GitHub Step Summary           │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │   Publish Results                 │
         ├───────────────────────────────────┤
         │  ✓ Upload artifacts (7-30 days)   │
         │  ✓ Post PR comment (if PR)        │
         │  ✓ Update status checks           │
         │  ✓ Send notifications (optional)  │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │   Check Critical Tests            │
         │   - Fail build if tests failed    │
         │   - Block merge if on PR          │
         └───────────────────────────────────┘
```

## Detailed Shard Execution Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      SHARD EXECUTION                              │
└──────────────────────────────────────────────────────────────────┘

Each Shard (1, 2, 3) runs independently in parallel:

  1. Setup Environment
     ├─ Checkout code
     ├─ Setup Node.js 20.x
     ├─ Install npm dependencies (cached)
     └─ Install Playwright browsers

  2. Run Tests
     ├─ Execute test subset (shard X/3)
     ├─ Capture screenshots on failure
     ├─ Record video on failure
     ├─ Generate trace on failure
     └─ Retry failed tests (1 attempt)

  3. Collect Artifacts
     ├─ playwright-report/
     ├─ test-results/
     │   ├─ screenshots/
     │   ├─ videos/
     │   └─ traces/
     └─ results.json

  4. Upload to GitHub
     ├─ playwright-results-shard-X (7 days)
     ├─ playwright-traces-shard-X (7 days, if failed)
     └─ playwright-videos-shard-X (7 days, if failed)
```

## Test Suite Distribution

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEST DISTRIBUTION                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Shard 1 (Tests 1-41)          │  Shard 2 (Tests 42-82)         │
│  ├─ 00-smoke-tests (12)        │  ├─ 04-tools-modules (14)      │
│  ├─ 01-main-modules (15)       │  ├─ 05-workflows (12)          │
│  ├─ 02-management (14/18)      │  ├─ 06-form-validation (10)    │
│  └─ Total: 41 tests            │  ├─ 07-accessibility (8)       │
│                                │  └─ Total: 41 tests            │
│                                                                  │
│  Shard 3 (Tests 83-122)                                         │
│  ├─ 02-management (4/18)                                        │
│  ├─ 03-procurement (16)                                         │
│  ├─ 08-performance (7)                                          │
│  ├─ 09-security (6)                                             │
│  ├─ 10-load-testing (4)                                         │
│  └─ Total: 40 tests                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Artifact Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARTIFACT LIFECYCLE                            │
└─────────────────────────────────────────────────────────────────┘

Test Execution
     │
     ├─── Results Generated ────────────────────────┐
     │                                              │
     ├─── Screenshots (on failure) ─────────────────┤
     │                                              │
     ├─── Videos (on failure) ──────────────────────┤
     │                                              │
     └─── Traces (on failure) ──────────────────────┤
                                                    │
                                                    ▼
                                    ┌───────────────────────────┐
                                    │  Upload to GitHub         │
                                    │  Actions Artifacts        │
                                    └───────────┬───────────────┘
                                                │
                    ┌───────────────────────────┼───────────────────────────┐
                    │                           │                           │
                    ▼                           ▼                           ▼
        ┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
        │  Per-Shard        │     │  Merged Reports   │     │  Test Results     │
        │  Artifacts        │     │  (Combined)       │     │  (JSON/XML)       │
        │                   │     │                   │     │                   │
        │  7 days           │     │  30 days          │     │  30 days          │
        └───────────────────┘     └───────────────────┘     └───────────────────┘
                    │                           │                           │
                    └───────────────────────────┴───────────────────────────┘
                                                │
                                                ▼
                                    ┌───────────────────────────┐
                                    │  Available for Download   │
                                    │  - Via Actions UI         │
                                    │  - Via GitHub CLI         │
                                    │  - Via API                │
                                    └───────────────────────────┘
```

## PR Comment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PR COMMENT WORKFLOW                           │
└─────────────────────────────────────────────────────────────────┘

Pull Request Created/Updated
           │
           ▼
    Workflow Triggered
           │
           ▼
    Tests Execute
           │
           ▼
    Results Merged
           │
           ▼
    Parse JSON Results
    ├─ Total tests
    ├─ Passed count
    ├─ Failed count
    └─ Pass rate %
           │
           ▼
    Format Comment
    ├─ Status emoji (✅/❌)
    ├─ Results table
    ├─ Links to artifacts
    └─ Workflow run link
           │
           ▼
    Check for Existing Comment
           │
           ├─ Found ──────> Update Comment
           │
           └─ Not Found ──> Create Comment
                              │
                              ▼
                    Comment Posted to PR
```

## Notification Flow (Optional)

```
┌─────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION FLOW                             │
└─────────────────────────────────────────────────────────────────┘

Test Failure Detected
           │
           ├─── Is Nightly Run? ───> Yes ──┐
           │                                │
           └─── Is Push to Main? ──> Yes ──┤
                                            │
                                            ▼
                              ┌──────────────────────────┐
                              │  Notification Job        │
                              │  Triggered               │
                              └──────────┬───────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
         ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
         │  GitHub Email    │ │  Slack Message   │ │  Discord Webhook │
         │  (Built-in)      │ │  (Optional)      │ │  (Optional)      │
         └──────────────────┘ └──────────────────┘ └──────────────────┘
```

## Timeline Example

```
┌─────────────────────────────────────────────────────────────────┐
│                    TYPICAL RUN TIMELINE                          │
└─────────────────────────────────────────────────────────────────┘

00:00 ━━━━━━━━━━━━━━ Workflow Triggered
00:01 ━━━━━━━━━━━━━━ Checkout & Setup
00:02 ━━━━━━━━━━━━━━ Install Dependencies (cached)
00:03 ━━━━━━━━━━━━━━ Install Playwright Browsers
00:04 ━━━━━━━━━━━━━━ Verify Server Health
00:05 ━━┳━━━━━━━━━━━ Start Parallel Test Execution
      ┃
      ┣━ Shard 1 ━━━━━━━━━━━━━━━━━━━━━━━━━━┓
      ┃                                     ┃
      ┣━ Shard 2 ━━━━━━━━━━━━━━━━━━━━━━━━━━┫ (Parallel)
      ┃                                     ┃
      ┗━ Shard 3 ━━━━━━━━━━━━━━━━━━━━━━━━━━┛

00:10 ━━━━━━━━━━━━━━ All Shards Complete
00:11 ━━━━━━━━━━━━━━ Merge Reports
00:12 ━━━━━━━━━━━━━━ Generate Summary
00:13 ━━━━━━━━━━━━━━ Upload Artifacts
00:14 ━━━━━━━━━━━━━━ Post PR Comment
00:15 ━━━━━━━━━━━━━━ Check Critical Tests
00:15 ━━━━━━━━━━━━━━ Workflow Complete ✅

Total Time: ~15 minutes
```

## Success/Failure Paths

```
┌─────────────────────────────────────────────────────────────────┐
│                    DECISION TREE                                 │
└─────────────────────────────────────────────────────────────────┘

                    Test Execution
                          │
                ┌─────────┴─────────┐
                │                   │
         All Tests Pass      Some Tests Fail
                │                   │
                ▼                   ▼
        ┌───────────────┐   ┌───────────────┐
        │ ✅ Success    │   │ ❌ Failure    │
        └───────┬───────┘   └───────┬───────┘
                │                   │
                ├─ PR: ✅ Approved  ├─ PR: ❌ Blocked
                ├─ Artifacts: Yes  ├─ Artifacts: Yes
                ├─ Comment: ✅     ├─ Comment: ❌
                └─ Merge: Allowed  ├─ Traces: Yes
                                   ├─ Videos: Yes
                                   ├─ Notify: Yes
                                   └─ Merge: Blocked
```

## Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYSTEM INTEGRATIONS                           │
└─────────────────────────────────────────────────────────────────┘

GitHub Actions Workflow
         │
         ├─────> GitHub API (Comments, Status Checks)
         │
         ├─────> Production Server (http://68.220.148.2)
         │
         ├─────> Artifact Storage (GitHub Actions)
         │
         ├─────> NPM Registry (Dependencies)
         │
         ├─────> Playwright CDN (Browser Binaries)
         │
         └─────> Optional: Slack/Discord/Email (Notifications)
```

## Legend

```
Symbol Meanings:
━━━  Process flow / Timeline
│    Vertical connection
├─   Branch/Fork
└─   End of branch
┌─┐  Box/Container
┳┻   Split/Join
✅   Success
❌   Failure
⚠️   Warning
```
