# RoomSync Android UI Tests

This directory contains end-to-end UI tests for the RoomSync Android application using Jetpack Compose Testing APIs and UI Automator.

## Test Structure

The test suite covers three major features of the RoomSync application, corresponding to the formal use case specifications in the Requirements and Design document:

### 1. CreateGroupTest.kt
**Use Case 9: Create Group**

Tests the group creation functionality including:
- Valid group name input and button enablement
- Empty group name validation (button disabled)
- Whitespace-only name validation
- Special characters acceptance
- Maximum group name length (100 characters)
- UI element presence and layout
- Text field focus and input functionality

**Total Test Methods:** 7

### 2. AddTaskTest.kt
**Use Case 16: Add Task**

Tests the task creation functionality including:
- Complete task creation with all required fields
- Empty task name validation
- One-time task deadline requirement
- Difficulty levels (1-5)
- All recurrence options (one-time, daily, weekly, bi-weekly, monthly)
- Required people selection (1-10)
- Optional description field
- Cancel functionality
- Optional member assignment

**Total Test Methods:** 12

### 3. RateRoommateTest.kt
**Use Case 19-20: Rate Roommate and Write Testimonial**

Tests the roommate rating functionality including:
- Rating selection (1-5 stars)
- Optional testimonial input
- 500-character testimonial limit
- Character counter functionality
- Rating requirement validation (button disabled without rating)
- 30-day cohabitation notice display
- Cancel functionality
- All UI elements presence

**Total Test Methods:** 12

## Running the Tests

### Prerequisites
- Android device or emulator running Android API 26+
- All dependencies installed via `./gradlew build`

### Run All Tests
```bash
cd frontend
./gradlew :app:connectedAndroidTest
```

### Run Specific Test Class
```bash
# Create Group tests
./gradlew :app:connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.cpen321.roomsync.CreateGroupTest

# Add Task tests
./gradlew :app:connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.cpen321.roomsync.AddTaskTest

# Rate Roommate tests
./gradlew :app:connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.cpen321.roomsync.RateRoommateTest
```

### Run Individual Test Method
```bash
./gradlew :app:connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.cpen321.roomsync.CreateGroupTest#testCreateGroup_ValidGroupName_Success
```

## Test Framework

### Technologies Used
- **Jetpack Compose Testing API** (`androidx.compose.ui:ui-test-junit4:*`)
  - Provides `ComposeTestRule` for testing Compose UIs
  - Semantic matchers for finding and asserting on composables
  - Actions for simulating user interactions

- **UI Automator** (`androidx.test.uiautomator:uiautomator:2.3.0`)
  - For cross-app UI testing (if needed for future tests)
  - Device-level interactions

- **JUnit 4** (`androidx.test.ext:junit:*`)
  - Test runner framework
  - `@Test`, `@Before`, `@After` annotations

### Test Pattern

Each test follows the **Arrange-Act-Assert (AAA)** pattern:

```kotlin
@Test
fun testExample() {
    // Arrange - Set up the UI
    composeTestRule.setContent {
        RoomSyncTheme {
            ScreenUnderTest()
        }
    }

    // Act - Perform user actions
    composeTestRule
        .onNodeWithText("Button")
        .performClick()

    // Assert - Verify expected behavior
    composeTestRule
        .onNodeWithText("Expected Text")
        .assertIsDisplayed()
}
```

## Test Coverage

### Success Scenarios
All tests cover the main success scenario paths defined in the formal use case specifications, including:
- Valid input acceptance
- Proper button state management
- Successful navigation and state updates

### Failure Scenarios
All tests cover the failure scenarios defined in the formal use case specifications, including:
- Empty/invalid input validation
- Missing required field validation
- Character limit enforcement
- Button state validation (disabled when conditions not met)

## Important Notes

1. **ViewModel Mocking**: Some tests that require backend integration (e.g., actual group creation, task assignment) are noted but not fully implemented. These would require ViewModel mocking or a test backend server.

2. **Isolation**: Each test is independent and does not rely on the state from other tests. The UI is set up fresh for each test method.

3. **UI Thread**: Compose tests automatically handle synchronization with the UI thread, so no manual waits are needed in most cases.

4. **Semantic Tree**: Tests use Compose's semantic tree for finding UI elements, which is more robust than traditional view hierarchies.

## Extending the Tests

To add new tests:

1. Create a new test file in this directory
2. Annotate the class with `@RunWith(AndroidJUnit4::class)`
3. Add a `ComposeTestRule`:
   ```kotlin
   @get:Rule
   val composeTestRule = createComposeRule()
   ```
4. Write test methods following the AAA pattern
5. Update the documentation in `Testing_And_Code_Review.md`

## Troubleshooting

### Tests Not Finding Elements
- Ensure the correct text is used (case-sensitive)
- Check if elements have proper semantic properties
- Use `printToLog()` to debug the semantic tree:
  ```kotlin
  composeTestRule.onRoot().printToLog("TAG")
  ```

### Tests Failing Intermittently
- Add `composeTestRule.waitForIdle()` before assertions
- Check for race conditions in async operations
- Ensure proper synchronization with coroutines

### Device/Emulator Issues
- Ensure device is unlocked
- Disable animations in Developer Options for more reliable tests
- Check that the app is installed correctly

## References

- [Jetpack Compose Testing Documentation](https://developer.android.com/jetpack/compose/testing)
- [UI Automator Documentation](https://developer.android.com/training/testing/other-components/ui-automator)
- [Testing Guide for Android](https://developer.android.com/training/testing)
- [Requirements and Design Document](../../../../../../../documentation/Requirements_and_Design.md)
- [Testing and Code Review Document](../../../../../../../documentation/Testing_And_Code_Review.md)

