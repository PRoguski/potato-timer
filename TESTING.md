# Potato Timer - Testing Guide

Comprehensive test suite for the Polish-language workout timer application built with Playwright.

## Installation

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests with UI (interactive mode)
```bash
npm run test:ui
```

### Run tests in debug mode
```bash
npm run test:debug
```

### Run tests in headed mode (see browser window)
```bash
npm run test:headed
```

### Run only Chromium tests
```bash
npm run test:chromium
```

## Test Structure

### UI Tests (`tests/ui.spec.js`)
- Main interface elements visibility
- Control buttons functionality
- Plan list display
- Remaining time indicator
- Plan selector visibility
- Progress bar display
- Counter display
- Next exercise hint
- Previous button disabled state
- Dark theme colors
- Settings panel open/close

**25+ test cases** covering UI elements and panel interactions.

### Timer Tests (`tests/timer.spec.js`)
- Initial time format (MM:SS)
- Start/pause/resume functionality
- Progress bar updates
- Button text changes during lifecycle
- Counter increment
- Navigation (next/previous)
- Remaining time calculations
- Phase transitions and labels
- Background color changes by phase

**18+ test cases** covering timer operations.

### Plans Tests (`tests/plans.spec.js`)
- Plan detection (plan-0, plan-1, plan-2)
- Plan name display
- Default plan selection
- Plan switching
- Exercise list updates
- Clock time updates
- Plan list updates
- Plan persistence in localStorage
- Plan restoration on reload
- Plan content verification (sections, headers)
- Exercise navigation

**20+ test cases** covering training plan selection and management.

### Persistence Tests (`tests/persistence.spec.js`)
- Workout state saving to localStorage
- State updates on timer ticks
- State saving on pause/resume
- State saving on navigation
- Resume dialog appearance
- Resume dialog details display
- Resume button restoration
- New workout button reset
- Plan change clearing state
- Incorrect plan handling

**18+ test cases** covering state persistence and resume functionality.

### Settings Tests (`tests/settings.spec.js`)
- Font size sliders (exercise, next)
- Work/rest time sliders
- Settings display updates
- Font size persistence
- Work/rest time persistence
- Wake Lock toggle
- Settings restoration on reload
- Reset button functionality
- Default values restoration
- Settings panel open/close

**20+ test cases** covering settings and preferences.

## Total Test Coverage

**101+ test cases** across 5 test files covering:
- ✅ User Interface (UI elements, visibility, interactions)
- ✅ Timer Functionality (start, pause, resume, countdown)
- ✅ Training Plans (selection, switching, content)
- ✅ State Persistence (save, resume, recovery)
- ✅ User Settings (preferences, customization)

## Test Results

After running tests, HTML report is generated in `playwright-report/`.

### View test report:
```bash
npx playwright show-report
```

## Continuous Integration

For CI/CD pipelines, tests run with:
- Limited retries (2 retries on failure)
- Single worker (sequential)
- Full trace on first retry
- HTML report for debugging

Configure via `playwright.config.js`.

## Key Features Tested

### ✅ Core Workout Timer
- Accurate MM:SS countdown
- Pause/resume during workout
- Step navigation (next/previous)
- Exercise and rest periods
- Phase transitions (warmup → exercises → cooldown)

### ✅ Training Plans
- Multiple workout plans (60min, 30min, TABATA)
- Dynamic plan loading
- Plan switching without stopping
- Accurate exercise and time display

### ✅ State Persistence
- Auto-save workout progress
- Resume from pause on page reload
- Reset to new workout option
- Plan validation (no resume if plan changed)

### ✅ Customization
- Adjustable font sizes
- Configurable work/rest duration
- Wake Lock API integration
- Settings persistence

### ✅ User Experience
- Dark theme optimized
- Mobile responsive
- Accessibility features
- No external dependencies

## Troubleshooting

### Tests fail on startup
- Ensure web server is running: `python3 -m http.server 8000`
- Check that port 8000 is available
- Clear browser cache: `rm -rf ~/.cache/ms-playwright/`

### Resume dialog not appearing
- Clear localStorage: Open DevTools → Application → Storage → Clear All
- Verify state is being saved during workout

### Settings not persisting
- Check browser localStorage is enabled
- Ensure JavaScript is running
- Try incognito mode (private window)

### Timing issues
- Increase `waitForTimeout` values for slower systems
- Run tests individually with `test.only()`
- Check system CPU usage

## Development Workflow

### Running during development
```bash
npm run test:headed
```
Shows browser window for visual debugging.

### Debugging specific test
```bash
npx playwright test tests/timer.spec.js -g "should start timer"
```

### Watch mode (re-run on file change)
```bash
npm test -- --watch
```

## Writing New Tests

Add new test files in `tests/` directory following this pattern:

```javascript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#selector', { timeout: 5000 });
  });

  test('should do something', async ({ page }) => {
    const element = await page.locator('#element');
    await expect(element).toBeVisible();
  });
});
```

## Performance Notes

- Full test suite runs in ~2-3 minutes
- Average test execution: 3-5 seconds per test
- No external API dependencies (all offline)
- Minimal system resource usage

## License

MIT - See LICENSE file
