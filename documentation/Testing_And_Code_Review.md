
# Testing and Code Review

## 1. Change History

| **Change Date**   | **Modified Sections** | **Rationale** |
| ----------------- | --------------------- | ------------- |
| November 5, 2025  | Section 2.2 - GitHub Actions Configuration | Added GitHub Actions workflow for automated backend testing on pull requests and main branch pushes |

---

## 2. Back-end Test Specification: APIs

### 2.1. Locations of Back-end Tests and Instructions to Run Them

#### 2.1.1. Tests

| **Interface**                      | **Describe Group Location, No Mocks**                                                                           | **Describe Group Location, With Mocks** | **Mocked Components** |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------- | --------------------- |
| **POST /api/auth/signup**          | [`backend/src/__tests__/no-mocks/auth.test.ts#L61`](backend/src/__tests__/no-mocks/auth.test.ts#L61)          | _Pending Implementation_                | Google OAuth API, User DB |
| **POST /api/auth/login**           | [`backend/src/__tests__/no-mocks/auth.test.ts#L61`](backend/src/__tests__/no-mocks/auth.test.ts#L61)          | _Pending Implementation_                | Google OAuth API, User DB |
| **GET /api/user/**                 | [`backend/src/__tests__/no-mocks/user.test.ts#L22`](backend/src/__tests__/no-mocks/user.test.ts#L22)           | _Pending Implementation_                | User DB, Group DB, Message DB |
| **PUT /api/user/users/profile**    | [`backend/src/__tests__/no-mocks/user.test.ts#L22`](backend/src/__tests__/no-mocks/user.test.ts#L22)           | _Pending Implementation_                | User DB |
| **PUT /api/user/users/optionalProfile** | [`backend/src/__tests__/no-mocks/user.test.ts#L22`](backend/src/__tests__/no-mocks/user.test.ts#L22)        | _Pending Implementation_                | User DB |
| **DELETE /api/user/users/me**      | [`backend/src/__tests__/no-mocks/user.test.ts#L22`](backend/src/__tests__/no-mocks/user.test.ts#L22)           | _Pending Implementation_                | User DB, Group DB |
| **PUT /api/user/users/report**     | [`backend/src/__tests__/no-mocks/user.test.ts#L22`](backend/src/__tests__/no-mocks/user.test.ts#L22)           | _Pending Implementation_                | User DB, Group DB, Message DB |
| **POST /api/group**                | [`backend/src/__tests__/no-mocks/group.test.ts#L21`](backend/src/__tests__/no-mocks/group.test.ts#L21)         | _Pending Implementation_                | Group DB, User DB |
| **GET /api/group**                 | [`backend/src/__tests__/no-mocks/group.test.ts#L21`](backend/src/__tests__/no-mocks/group.test.ts#L21)         | _Pending Implementation_                | Group DB, User DB |
| **POST /api/group/join**           | [`backend/src/__tests__/no-mocks/group.test.ts#L21`](backend/src/__tests__/no-mocks/group.test.ts#L21)         | _Pending Implementation_                | Group DB, User DB |
| **DELETE /api/group/leave**        | [`backend/src/__tests__/no-mocks/group.test.ts#L21`](backend/src/__tests__/no-mocks/group.test.ts#L21)         | _Pending Implementation_                | Group DB, User DB |
| **PUT /api/group/transfer-ownership/:newOwnerId** | [`backend/src/__tests__/no-mocks/group.test.ts#L21`](backend/src/__tests__/no-mocks/group.test.ts#L21)  | _Pending Implementation_                | Group DB, User DB |
| **DELETE /api/group/member/:memberId** | [`backend/src/__tests__/no-mocks/group.test.ts#L21`](backend/src/__tests__/no-mocks/group.test.ts#L21)    | _Pending Implementation_                | Group DB, User DB |
| **POST /api/task**                 | [`backend/src/__tests__/no-mocks/task.test.ts#L22`](backend/src/__tests__/no-mocks/task.test.ts#L22)           | _Pending Implementation_                | Task DB, Group DB, User DB |
| **GET /api/task**                  | [`backend/src/__tests__/no-mocks/task.test.ts#L22`](backend/src/__tests__/no-mocks/task.test.ts#L22)           | _Pending Implementation_                | Task DB, Group DB |
| **GET /api/task/my-tasks**         | [`backend/src/__tests__/no-mocks/task.test.ts#L22`](backend/src/__tests__/no-mocks/task.test.ts#L22)           | _Pending Implementation_                | Task DB, Group DB |
| **PUT /api/task/:id/status**       | [`backend/src/__tests__/no-mocks/task.test.ts#L22`](backend/src/__tests__/no-mocks/task.test.ts#L22)           | _Pending Implementation_                | Task DB |
| **POST /api/task/:id/assign**      | [`backend/src/__tests__/no-mocks/task.test.ts#L22`](backend/src/__tests__/no-mocks/task.test.ts#L22)           | _Pending Implementation_                | Task DB, Group DB, User DB |
| **POST /api/task/assign-weekly**   | [`backend/src/__tests__/no-mocks/task.test.ts#L22`](backend/src/__tests__/no-mocks/task.test.ts#L22)         | _Pending Implementation_                | Task DB, Group DB |
| **GET /api/task/week/:weekStart**  | [`backend/src/__tests__/no-mocks/task.test.ts#L22`](backend/src/__tests__/no-mocks/task.test.ts#L22)           | _Pending Implementation_                | Task DB, Group DB |
| **GET /api/task/date/:date**       | [`backend/src/__tests__/no-mocks/task.test.ts#L22`](backend/src/__tests__/no-mocks/task.test.ts#L22)           | _Pending Implementation_                | Task DB, Group DB |
| **DELETE /api/task/:id**           | [`backend/src/__tests__/no-mocks/task.test.ts#L22`](backend/src/__tests__/no-mocks/task.test.ts#L22)           | _Pending Implementation_                | Task DB, Group DB |
| **GET /api/chat/:groupId/messages** | [`backend/src/__tests__/no-mocks/chat.test.ts#L38`](backend/src/__tests__/no-mocks/chat.test.ts#L38)         | _Pending Implementation_                | Message DB, Group DB, Socket.IO |
| **POST /api/chat/:groupId/message** | [`backend/src/__tests__/no-mocks/chat.test.ts#L38`](backend/src/__tests__/no-mocks/chat.test.ts#L38)         | _Pending Implementation_                | Message DB, Group DB, Socket.IO |
| **POST /api/chat/:groupId/poll**   | [`backend/src/__tests__/no-mocks/chat.test.ts#L38`](backend/src/__tests__/no-mocks/chat.test.ts#L38)           | _Pending Implementation_                | Message DB, Group DB, Socket.IO |
| **POST /api/chat/:groupId/poll/:messageId/vote** | [`backend/src/__tests__/no-mocks/chat.test.ts#L38`](backend/src/__tests__/no-mocks/chat.test.ts#L38) | _Pending Implementation_                | Message DB, Group DB |
| **DELETE /api/chat/:groupId/message/:messageId** | [`backend/src/__tests__/no-mocks/chat.test.ts#L38`](backend/src/__tests__/no-mocks/chat.test.ts#L38)   | _Pending Implementation_                | Message DB, Group DB |
| **POST /api/rating**               | [`backend/src/__tests__/no-mocks/rating.test.ts#L22`](backend/src/__tests__/no-mocks/rating.test.ts#L22)       | _Pending Implementation_                | Rating DB, Group DB, User DB |
| **GET /api/rating/:userId**        | [`backend/src/__tests__/no-mocks/rating.test.ts#L22`](backend/src/__tests__/no-mocks/rating.test.ts#L22)       | _Pending Implementation_                | Rating DB, User DB |
| **GET /api/rating/user/:userId/group/:groupId** | [`backend/src/__tests__/no-mocks/rating.test.ts#L22`](backend/src/__tests__/no-mocks/rating.test.ts#L22) | _Pending Implementation_                | Rating DB, Group DB, User DB |
| **GET /api/health**                | [`backend/src/__tests__/no-mocks/health.test.ts#L26`](backend/src/__tests__/no-mocks/health.test.ts#L26)       | _Pending Implementation_                | MongoDB Connection |
| **Authentication Middleware**     | [`backend/src/__tests__/no-mocks/middleware.test.ts#L22`](backend/src/__tests__/no-mocks/middleware.test.ts#L22) | _Pending Implementation_                | JWT Token, User DB |
| **AuthService**                    | [`backend/src/__tests__/no-mocks/services.test.ts#L10`](backend/src/__tests__/no-mocks/services.test.ts#L10)   | _Pending Implementation_                | User DB, JWT Token |

**Note:** Mocked test groups are currently pending implementation. The `with-mocks/` directory exists but is empty. Mocked tests will be implemented separately.

#### 2.1.2. Commit Hash Where Tests Run

`2ac8943f08bfa1011bbabc70a1d2840004867e62`

#### 2.1.3. Explanation on How to Run the Tests

1. **Prerequisites:**

   - Node.js (v18 or higher recommended)
   - npm or yarn package manager
   - MongoDB (optional - tests use in-memory MongoDB via `mongodb-memory-server`)

2. **Clone the Repository:**

   - Open your terminal and run:

     ```bash
     git clone <your-repository-url>
     cd Cpen321-group-project
     ```

3. **Navigate to Backend Directory:**

   ```bash
   cd backend
   ```

4. **Install Dependencies:**

   ```bash
   npm install
   ```

5. **Run All Tests (Without Coverage):**

   ```bash
   npm test
   ```

   This will run all test files in the `src/__tests__/no-mocks/` directory.

6. **Run Tests with Coverage Report:**

   ```bash
   npm run test:coverage
   ```

   This will:
   - Execute all tests
   - Generate coverage reports in the `coverage/` directory
   - Display coverage summary in the terminal
   - Generate HTML coverage reports in `coverage/lcov-report/index.html`

7. **Run Tests in Watch Mode:**

   ```bash
   npm run test:watch
   ```

   This will run tests in watch mode, automatically re-running tests when files change.

8. **Run Specific Test File:**

   ```bash
   npm test -- auth.test.ts
   ```

   Or to run a specific test file with pattern matching:

   ```bash
   npm test -- --testPathPattern=auth
   ```

9. **View Coverage Reports:**

   After running `npm run test:coverage`, open the HTML coverage report:

   ```bash
   # On macOS/Linux
   open coverage/lcov-report/index.html

   # On Windows
   start coverage/lcov-report/index.html
   ```

   Or navigate to `backend/coverage/lcov-report/index.html` in your web browser.

10. **Test Environment:**

    - Tests use an in-memory MongoDB instance via `mongodb-memory-server`
    - No external MongoDB connection is required
    - Tests are isolated and do not affect any production database
    - Each test file has its own database setup and teardown

11. **Expected Test Output:**

    - All tests should pass (some may fail at this milestone but must pass by final release)
    - Test execution time: approximately 30-60 seconds for all tests
    - Coverage reports will show line, branch, function, and statement coverage

12. **Troubleshooting:**

    - If tests fail due to timeout, increase timeout in `jest.config.js` (currently set to 30000ms)
    - If MongoDB memory server fails to start, ensure you have sufficient system memory
    - If port conflicts occur, ensure no other MongoDB instances are running on default ports

### 2.2. GitHub Actions Configuration Location

**Status:** GitHub Actions workflow is configured and active.

**Location:** `.github/workflows/backend-tests.yml`

**Workflow Details:**
- **Triggers:**
  - Pull requests to any branch (when backend files change)
  - Pushes to main branch (when backend files change)
- **Test Execution:**
  - Runs `npm test` for all backend tests
  - Runs `npm run test:coverage` to generate coverage reports
- **Artifacts:**
  - Uploads coverage reports as workflow artifacts
  - Reports retained for 30 days
- **Environment:**
  - Uses Node.js v18
  - Runs on Ubuntu latest
  - Uses npm ci for faster, reproducible dependency installation

### 2.3. Jest Coverage Report Screenshots for Tests Without Mocking

_(Placeholder for Jest coverage screenshot without mocking)_

**Instructions for Generating Screenshot:**

1. Run: `cd backend && npm run test:coverage`
2. Open `backend/coverage/lcov-report/index.html` in a browser
3. Take a screenshot of the coverage summary table showing:
   - Individual file coverage percentages
   - Overall coverage statistics (Statements, Branches, Functions, Lines)
4. Include both the summary table and individual file breakdown

### 2.4. Jest Coverage Report Screenshots for Tests With Mocking

_(Placeholder for Jest coverage screenshot with mocking)_

**Note:** Mocked tests are pending implementation. Once mocked tests are added in the `with-mocks/` directory, this section should be updated with:

1. Instructions to run only mocked tests
2. Screenshot of coverage report when running mocked tests only
3. Coverage may be lower as mocked tests focus on error handling scenarios

### 2.5. Jest Coverage Report Screenshots for Both Tests With and Without Mocking

_(Placeholder for Jest coverage screenshot both with and without mocking)_

**Instructions for Generating Screenshot:**

1. Run all tests (both no-mocks and with-mocks):
   ```bash
   cd backend
   npm run test:coverage
   ```
2. Open `backend/coverage/lcov-report/index.html` in a browser
3. Take a screenshot showing combined coverage
4. Expected: High coverage (ideally 90%+ for most files)
5. If coverage is less than 100%, document the reasons in the justification below

**Coverage Justification:**

_(To be filled after generating coverage reports)_

- List any files with less than 100% coverage
- Explain why certain code paths are not covered (e.g., error handlers, edge cases that are difficult to test, deprecated code paths)
- Note any intentional exclusions (as configured in `jest.config.js`)

---


## 3. Back-end Test Specification: Tests of Non-Functional Requirements

### 3.1. Test Locations in Git

| **Non-Functional Requirement**  | **Location in Git**                              |
| ------------------------------- | ------------------------------------------------ |
| **Performance (Response Time)** | [`tests/nonfunctional/response_time.test.js`](#) |
| **Chat Data Security**          | [`tests/nonfunctional/chat_security.test.js`](#) |
| **Non-Functional Requirement** | **Location in Git** |
| ------------------------------ | ------------------- |
| _To be implemented_             | _Pending_           |

### 3.2. Test Verification and Logs

- **Performance (Response Time)**

  - **Verification:** This test suite simulates multiple concurrent API calls using Jest along with a load-testing utility to mimic real-world user behavior. The focus is on key endpoints such as user login and study group search to ensure that each call completes within the target response time of 2 seconds under normal load. The test logs capture metrics such as average response time, maximum response time, and error rates. These logs are then analyzed to identify any performance bottlenecks, ensuring the system can handle expected traffic without degradation in user experience.
  - **Log Output**
    ```
    [Placeholder for response time test logs]
    ```
_(Placeholder for non-functional requirement tests)_

- **Chat Data Security**
  - **Verification:** ...
  - **Log Output**
    ```
    [Placeholder for chat security test logs]
    ```
**Note:** Non-functional requirement tests (e.g., performance, security, scalability) are not yet implemented. These should be added to test:
- Response time requirements
- Data security (authentication, authorization)
- Load handling
- Error recovery
- Other non-functional requirements as specified in the project requirements

---

## 4. Front-end Test Specification

### 4.1. Location in Git of Front-end Test Suite:
### 4.1. Location in Git of Front-end Test Suite

**Test Files:**
- `frontend/app/src/androidTest/java/com/cpen321/roomsync/BasicUITests.kt` (15 tests)
- `frontend/app/src/androidTest/java/com/cpen321/roomsync/CreateGroupE2ETest.kt` (6 tests)
- `frontend/app/src/androidTest/java/com/cpen321/roomsync/RateRoommateE2ETest.kt` (8 tests)

**Test Status:** ✅ ALL 29 TESTS PASSING

**Test Device:** Pixel 7 (AVD) - Android 13  
**Test Execution Time:** ~2m 57s

### 4.2. Tests for Use Case 9: Create Group

**Use Case Description:** Non-Group Member establishes a new roommate group and receives invitation code to share with potential roommates.

**Expected Behaviors:**

| **Scenario Steps** | **Test Case Steps** |
| ------------------ | ------------------- |
| 1. User navigates to group creation page | Open "Create Group" screen using ComposeTestRule |
| 2. The app shows text field and "Create Group" button disabled | Check that "Enter Group Name:" title is displayed<br>Check that text field with testTag="groupNameInput" exists<br>Check that button with testTag="createGroupButton" exists<br>Check that "Create Group" button is disabled |
| 2a. Group name is left empty | Check that "Create Group" button remains disabled |
| 2a. User enters whitespace-only name "   " | Input "   " in text field<br>Check that "Create Group" button is disabled |
| 3. User enters valid group name "Test Group" | Input "Test Group" in text field<br>Check that "Create Group" button is enabled |
| 3. User enters group name with special characters | Input "My Group! @#$"<br>Check that button is enabled (special chars accepted) |
| 3. User enters 100-character group name | Input 100-character string<br>Check that button is enabled (max length accepted) |

**Test Logs:**
```
CreateGroupE2ETest > test_UC9_Step1_2_ScreenDisplaysCorrectly PASSED
CreateGroupE2ETest > test_UC9_Step3_ValidGroupName_ButtonEnabled PASSED
CreateGroupE2ETest > test_UC9_Scenario2a_EmptyGroupName_ButtonDisabled PASSED
CreateGroupE2ETest > test_UC9_Scenario2a_WhitespaceOnly_ButtonDisabled PASSED
CreateGroupE2ETest > test_UC9_SpecialCharacters_Accepted PASSED
CreateGroupE2ETest > test_UC9_MaxLength100Characters_Accepted PASSED
BasicUITests > (5 additional UI validation tests) PASSED
```

### 4.3. Tests for Use Case 19-20: Rate Roommate and Write Testimonial

**Use Case Description:** Group members provide numerical rating and optional written feedback on roommate performance after living together for a minimum of 30 days.

**Expected Behaviors:**

| **Scenario Steps** | **Test Case Steps** |
| ------------------ | ------------------- |
| 5. Rating dialog opens showing member's name | Set up Rating dialog with member name<br>Check that "Rate [Member Name]" title is displayed |
| 5. Dialog shows rating interface | Check that "Select Rating" header is displayed<br>Check that 5 star buttons exist |
| 7. Dialog shows testimonial field | Check that "Review (Optional)" label exists<br>Check that testimonial input field exists |
| 7. Character counter shows 0/500 | Check that "0/500" is displayed |
| 8. 30-day requirement notice is displayed | Check that 30-day notice text is displayed |
| 9. Submit button is disabled (no rating) | Check that "Submit Rating" button is disabled initially |
| 9. Cancel button exists | Check that "Cancel" button is displayed |
| 6. User selects 5-star rating | Click on 5th star button |
| 9. Submit button becomes enabled | Check that "Submit Rating" button is enabled<br>Click "Submit Rating" button<br>Verify rating=5 was submitted |
| 6-7-9. User selects 4 stars and writes testimonial | Click on 4th star<br>Input "Great roommate! Very clean." in testimonial field<br>Check character counter shows "27/500"<br>Click "Submit Rating"<br>Verify rating=4 and testimonial were submitted |
| 9a. User does not select rating | Do NOT select any star<br>Input testimonial text<br>Check that "Submit Rating" button remains disabled |
| Boundary: 1-star minimum rating | Click on 1st star<br>Submit and verify rating=1 |
| Boundary: 5-star maximum rating | Click on 5th star<br>Submit and verify rating=5 |
| Boundary: 500-character testimonial | Select rating<br>Input exactly 500 characters<br>Submit and verify 500 characters accepted |
| Cancel dismisses dialog | Click "Cancel" button<br>Verify onDismiss callback was called |

**Test Logs:**
```
RateRoommateE2ETest > test_UC19_20_Step5_8_RatingDialogDisplaysCorrectly PASSED
RateRoommateE2ETest > test_UC19_20_Step6_9_SelectRatingAndSubmit PASSED
RateRoommateE2ETest > test_UC19_20_Step6_7_9_RatingWithTestimonial PASSED
RateRoommateE2ETest > test_UC19_20_Scenario9a_NoRatingSelected_SubmitDisabled PASSED
RateRoommateE2ETest > test_UC19_20_Testimonial500Characters_Accepted PASSED
RateRoommateE2ETest > test_UC19_20_MinimumRating_1Star PASSED
RateRoommateE2ETest > test_UC19_20_MaximumRating_5Stars PASSED
RateRoommateE2ETest > test_UC19_20_CancelButton_DismissesDialog PASSED
BasicUITests > (10 additional UI validation tests) PASSED
```

### 4.4. How to Run All Frontend Tests
- _To be documented when frontend tests are implemented_

**Prerequisites:**
- Android device or emulator must be connected and running (API 26+)
- Run `adb devices` to verify device is connected

**Command:**
```bash
cd frontend
./gradlew :app:connectedAndroidTest
```

**Actual Test Execution Results:**
```
Starting 29 tests on Pixel_7(AVD) - 13
Pixel_7(AVD) - 13 Tests 1/29 completed. (0 skipped) (0 failed)
Pixel_7(AVD) - 13 Tests 3/29 completed. (0 skipped) (0 failed)
Pixel_7(AVD) - 13 Tests 6/29 completed. (0 skipped) (0 failed)
Pixel_7(AVD) - 13 Tests 10/29 completed. (0 skipped) (0 failed)
Pixel_7(AVD) - 13 Tests 15/29 completed. (0 skipped) (0 failed)
Pixel_7(AVD) - 13 Tests 20/29 completed. (0 skipped) (0 failed)
Pixel_7(AVD) - 13 Tests 25/29 completed. (0 skipped) (0 failed)
Finished 29 tests on Pixel_7(AVD) - 13

BUILD SUCCESSFUL in 2m 57s
62 actionable tasks: 5 executed, 57 up-to-date
```

✅ **Result: All 29 tests PASSED (0 failed, 0 skipped)**

**View Detailed Test Report:**
Open `frontend/app/build/reports/androidTests/connected/index.html` in a web browser.
**Test Status:** _Pending_

### 4.5. Frontend Code Modifications for Testing

To enable comprehensive UI testing, the following test tags were added to production code:
### 4.2. Tests for Use Case [X]

**File: `frontend/app/src/main/java/com/cpen321/roomsync/ui/screens/createGroupScreen.kt`**
- `testTag("groupNameInput")` - Group name text field
- `testTag("createGroupButton")` - Create Group button
- `testTag("successMessage")` - Success message text
- `testTag("groupCode")` - Group code display
- `testTag("errorMessage")` - Error message text
_(Placeholder for frontend use case tests)_

**File: `frontend/app/src/main/java/com/cpen321/roomsync/ui/screens/groupDetailsScreen.kt`**
- `testTag("testimonialInput")` - Testimonial text field
- `testTag("charCounter")` - Character counter (note: not used in final tests due to semantic tree limitations)
- `testTag("submitRatingButton")` - Submit Rating button
### 4.3. Tests for Use Case [Y]

These test tags enable precise UI element selection in automated tests without relying on fragile text matching or complex semantic queries.

### 4.6. Test Coverage Summary
_(Placeholder for frontend use case tests)_

| **Use Case** | **Total Tests** | **Success Scenarios Covered** | **Failure Scenarios Covered** |
| ------------ | --------------- | ----------------------------- | ----------------------------- |
| **UC9: Create Group** | 21 (6 E2E + 15 UI) | ✅ Valid group name input<br>✅ Button enablement on valid input<br>✅ Special characters accepted<br>✅ 100-character limit accepted<br>✅ All UI elements display | ✅ Empty name → button disabled<br>✅ Whitespace-only → button disabled |
| **UC19-20: Rate Roommate** | 18 (8 E2E + 10 UI) | ✅ Dialog displays all UI elements<br>✅ 1-5 star selection works<br>✅ Optional testimonial input<br>✅ Character counter updates<br>✅ Submit enabled after rating<br>✅ 500-character limit respected<br>✅ Cancel dismisses dialog | ✅ No rating → Submit disabled<br>✅ 30-day notice displayed |
| **UC16: Add Task** | 0 | ⚠️ Not tested (requires test tags) | ⚠️ Not tested |
### 4.4. How to Run All Frontend Tests

**Limitations:**
- Backend integration testing (actual group creation, rating submission) not included
- ViewModel mocking not implemented
- UC16 (Add Task) not tested - would require additional test tags for complex UI selectors
_(Placeholder for frontend test execution instructions)_

### 4.7. Continuous Integration
### 4.5. Frontend Code Modifications for Testing

**GitHub Actions Workflow:** `.github/workflows/android-ui-tests.yml`
_(Placeholder for test tags and modifications)_

The frontend tests run automatically on every pull request via GitHub Actions.
### 4.6. Test Coverage Summary

**Trigger Conditions:**
- All pull requests to `main` or `master` branch
- Direct pushes to `main` or `master` branch
- Only when files in `frontend/**` directory are modified
_(Placeholder for frontend test coverage table)_

**Test Environment:**
- OS: Ubuntu Latest
- JDK: 17 (Temurin)
- Android API Level: 33
- Target: google_apis
- Architecture: x86_64
### 4.7. Continuous Integration

**Workflow Features:**
- ✅ Gradle caching for faster builds
- ✅ AVD (Android emulator) caching
- ✅ KVM hardware acceleration
- ✅ Headless emulator execution
- ✅ Automated test report publishing
- ✅ Test results uploaded as artifacts (30-day retention)
**GitHub Actions Workflow:** `.github/workflows/android-ui-tests.yml` (or similar)

**Viewing CI Results:**
- Test status appears automatically on pull requests
- Click "Details" on the check to view full test output
- Download detailed HTML reports from "Artifacts" section
**Status:** _To be documented when CI is set up_

---

@@ -263,6 +284,8 @@ The frontend tests run automatically on every pull request via GitHub Actions.

`[Insert Commit SHA here]`

**Note:** Codacy or similar automated code review tool needs to be configured and run on the codebase.

### 5.2. Unfixed Issues per Codacy Category

_(Placeholder for screenshots of Codacy's Category Breakdown table in Overview)_
@@ -273,13 +296,14 @@ _(Placeholder for screenshots of Codacy's Issues page)_

### 5.4. Justifications for Unfixed Issues

- **Code Pattern: [Usage of Deprecated Modules](#)**
_(Placeholder for justifications)_

  1. **Issue**
**Format for each issue:**

     - **Location in Git:** [`src/services/chatService.js#L31`](#)
     - **Justification:** ...
- **Code Pattern: [Pattern Name]**

  2. ...
  1. **Issue**
     - **Location in Git:** `[file path]#L[line number]`
     - **Justification:** [Explanation of why this issue is not fixed or is acceptable]

- ...
  2. ...
