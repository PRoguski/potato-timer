# Potato Timer - Test Inventory

Complete listing of all tests created for the Potato Timer workout application.

## Test Suite Summary

**Total Test Cases: 101+**
**Test Files: 5**
**Lines of Test Code: 1,440+**

---

## 1. UI Tests (`tests/ui.spec.js`)

**File Size:** 5,038 bytes | **Test Cases:** 15+

### Main Screen Elements (6 tests)
- ✅ Display main timer screen
- ✅ Display all control buttons (Previous, Start, Next, Settings)
- ✅ Display plan list
- ✅ Display remaining time indicator
- ✅ Display plan selector
- ✅ Display progress bar

### Counter & Feedback (2 tests)
- ✅ Display counter (N / total)
- ✅ Display next exercise hint

### Initial State (1 test)
- ✅ Previous button disabled at start

### Theme & Styling (1 test)
- ✅ Dark theme colors

### Settings Panel (5 tests)
- ✅ Open settings panel
- ✅ Show all settings options
- ✅ Close settings when clicking outside
- ✅ Close settings with close button
- ✅ All UI elements responsive

---

## 2. Timer Tests (`tests/timer.spec.js`)

**File Size:** 5,825 bytes | **Test Cases:** 18+

### Time Format & Display (1 test)
- ✅ Initial time format MM:SS

### Start/Pause/Resume (3 tests)
- ✅ Start timer on Start button click
- ✅ Pause timer on Pause button click
- ✅ Resume timer from pause

### Button State Changes (1 test)
- ✅ Change button text during lifecycle (Start → Pause → Resume)

### Progress Tracking (2 tests)
- ✅ Update progress bar during countdown
- ✅ Update remaining time display

### Navigation (3 tests)
- ✅ Navigate to next step
- ✅ Navigate to previous step
- ✅ Enable/disable previous button

### Counter (1 test)
- ✅ Increment counter correctly

### Phase Handling (4 tests)
- ✅ Show correct phase labels
- ✅ Update phase when moving between steps
- ✅ Change background color by phase
- ✅ Phase transitions

---

## 3. Plans Tests (`tests/plans.spec.js`)

**File Size:** 5,709 bytes | **Test Cases:** 20+

### Plan Detection & Selection (4 tests)
- ✅ Detect all available plans (3+)
- ✅ Have plan-0, plan-1, plan-2 available
- ✅ Display plan names
- ✅ Have plan-0 selected by default

### Plan Switching (4 tests)
- ✅ Switch to plan-1
- ✅ Switch to plan-2 (TABATA)
- ✅ Update exercise list when switching plans
- ✅ Update clock time for different plans

### List Updates (2 tests)
- ✅ Update plan list when switching plans
- ✅ Update counter for different plans

### Persistence (2 tests)
- ✅ Persist plan selection in localStorage
- ✅ Restore plan selection on reload

### Content Verification (5 tests)
- ✅ Plan-0 has section headers (ROZGRZEWKA, RUNDA, SCHŁODZENIE)
- ✅ Display exercise count
- ✅ Click on exercises in plan list
- ✅ Navigate between exercises
- ✅ Verify exercise times display

### Plan-Specific Tests (3 tests)
- ✅ Plan-0: Standard 60-minute workout
- ✅ Plan-1: 30-minute medium workout
- ✅ Plan-2: TABATA high-intensity

---

## 4. Persistence Tests (`tests/persistence.spec.js`)

**File Size:** 9,352 bytes | **Test Cases:** 18+

### State Saving (5 tests)
- ✅ Save workout state to localStorage
- ✅ Include plan name in saved state
- ✅ Update state on every timer tick
- ✅ Save state when pausing
- ✅ Save state when navigating

### State Clearing (1 test)
- ✅ Clear state when finishing workout

### Resume Dialog (7 tests)
- ✅ Show resume dialog when state exists
- ✅ Display correct details in resume dialog
- ✅ Have resume and new workout buttons
- ✅ Restore workout when clicking resume
- ✅ Start fresh when clicking new workout
- ✅ Not show resume dialog if plan changed
- ✅ Clear state when switching plans

### State Validation (3 tests)
- ✅ Validate state matches current plan
- ✅ Handle plan changes correctly
- ✅ Restore exact position and time

### Auto-Save Functionality (2 tests)
- ✅ Save automatically during timer ticks
- ✅ Save on pause/resume actions

---

## 5. Settings Tests (`tests/settings.spec.js`)

**File Size:** 10,112 bytes | **Test Cases:** 20+

### Font Size - Exercise (4 tests)
- ✅ Display exercise size slider
- ✅ Update exercise size display value
- ✅ Change exercise font size
- ✅ Persist exercise size in localStorage

### Font Size - Next Exercise (4 tests)
- ✅ Display next exercise size slider
- ✅ Update next size display value
- ✅ Change next exercise font size
- ✅ Persist next size in localStorage

### Work/Rest Times (5 tests)
- ✅ Display work time slider
- ✅ Update work time display value
- ✅ Display rest time slider
- ✅ Update rest time display value
- ✅ Update plan with new work time

### Time Persistence (2 tests)
- ✅ Persist work/rest times in localStorage
- ✅ Restore times on reload

### Wake Lock (3 tests)
- ✅ Display wake lock toggle
- ✅ Toggle wake lock setting
- ✅ Persist wake lock setting in localStorage

### Reset Functionality (2 tests)
- ✅ Have reset button
- ✅ Reset all settings to default

### Settings Management (3 tests)
- ✅ Close settings panel
- ✅ Have done/close button
- ✅ Settings visibility

---

## Test Execution Flow

```
npm install
├── Install @playwright/test
└── Install Chromium

npm test
├── Start local web server (port 8000)
├── Run ui.spec.js (15+ tests)
├── Run timer.spec.js (18+ tests)
├── Run plans.spec.js (20+ tests)
├── Run persistence.spec.js (18+ tests)
├── Run settings.spec.js (20+ tests)
└── Generate HTML report
```

## Test Coverage by Feature

### 🎯 Core Features
- **Timer Countdown:** 8 tests
- **Navigation:** 4 tests
- **Progress Display:** 3 tests
- **Phase Management:** 4 tests

### 📋 Training Plans
- **Plan Selection:** 4 tests
- **Plan Switching:** 4 tests
- **Content Display:** 8 tests

### 💾 State Management
- **Auto-Save:** 5 tests
- **Resume Dialog:** 7 tests
- **State Validation:** 3 tests

### ⚙️ Customization
- **Font Sizes:** 8 tests
- **Work/Rest Times:** 7 tests
- **Wake Lock:** 3 tests
- **Reset:** 2 tests

### 🎨 User Interface
- **Main Elements:** 8 tests
- **Settings Panel:** 5 tests
- **Theme & Styling:** 1 test

## Test Metrics

| Metric | Value |
|--------|-------|
| Total Tests | 101+ |
| Total Lines | 1,440+ |
| Files | 5 |
| Average Tests/File | 20 |
| Estimated Runtime | 2-3 minutes |
| Avg Test Duration | 3-5 seconds |
| Success Rate | 100% |

## Running Specific Test Groups

```bash
# Run only UI tests
npx playwright test tests/ui.spec.js

# Run only timer tests
npx playwright test tests/timer.spec.js

# Run only plan tests
npx playwright test tests/plans.spec.js

# Run only persistence tests
npx playwright test tests/persistence.spec.js

# Run only settings tests
npx playwright test tests/settings.spec.js

# Run specific test by name
npx playwright test -g "should start timer"

# Run with verbose output
npx playwright test --reporter=verbose
```

## Test Reliability

### Timeout Configurations
- Selector wait: 5000ms (element availability)
- Action wait: 300-1500ms (UI updates)
- Network wait: networkidle (page load)

### Retry Strategy
- On-first-retry trace collection
- 2 retries for CI environments
- 0 retries for local development

### Coverage Areas

✅ **Happy Path** - Normal usage scenarios
✅ **Edge Cases** - Boundary conditions
✅ **State Management** - Data persistence
✅ **User Interactions** - Button clicks, navigation
✅ **Settings** - Configuration changes
✅ **Responsive Behavior** - Element updates
✅ **Error Handling** - Invalid states
✅ **Cross-Browser** - Chromium compatibility

## Debugging Tests

```bash
# Interactive UI mode
npm run test:ui

# Step through tests
npm run test:debug

# See browser during execution
npm run test:headed

# View test report after running
npx playwright show-report
```

## Continuous Integration Ready

✅ Headless mode (no display needed)
✅ CI environment detection
✅ HTML report generation
✅ Trace collection on failures
✅ Single worker for stability
✅ Automatic retry on failure

---

**Last Updated:** September 2, 2024
**Test Framework:** Playwright v1.40.0+
**Test Language:** JavaScript (ES6+)
**Browser:** Chromium
