
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

**Note:** Mocked test groups are implemented in the `with-mocks/` directory. These tests use mocks to simulate external component failures and error scenarios.

#### 2.1.2. Commit Hash Where Tests Run

`2ac8943f08bfa1011bbabc70a1d2840004867e62`

#### 2.1.3. Explanation on How to Run the Tests

1. **Prerequisites:**

   - Node.js (v18 or higher recommended)
   - npm package manager
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

   Runs all backend tests (both `no-mocks/` and `with-mocks/`) per `jest.config.js`.

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

8. **Run Specific Tests:**

   - By file name (pattern):

     ```bash
     npm test -- --testPathPattern=auth
     ```

   - Exact file path:

     ```bash
     npm test -- src/__tests__/no-mocks/auth.test.ts
     ```

   - Only non-functional (response time) tests:

     ```bash
     npm test -- --testPathPattern=non-functional
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
    - Test execution time: approximately 24-25 seconds for all tests (387 tests across 22 test suites)
    - Coverage reports will show line, branch, function, and statement coverage
    - Current overall coverage: ~99.39% statements, ~97.63% branches, ~98.13% functions, ~99.48% lines

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

![image](images/Coverage%20without%20mocking.png)

### 2.4. Jest Coverage Report Screenshots for Tests With Mocking

![image](images/Coverage%20with%20mocking.png)



### 2.5. Jest Coverage Report Screenshots for Both Tests With and Without Mocking

![image](images/Coverage%20with%20and%20without%20mocking.png)



**Coverage Justification:**

The routes for group, rating, and tasks have less than 100% coverage.

Justification:
Group (98.05%): Coverage misses mutually exclusive owner-handling branches (valid owner vs invalid owner vs retry/placeholder) and some member-population error paths. Mocks emphasize failure paths while no-mocks cover happy paths, so not all branches executed.
Rating (97.14%): Rating: Some validation branches (combinations of missing fields, boundary ratings, testimonial variants) aren’t all exercised.
Task (99.41%): The random function meant to slightly randomize who does which task is sometimes missed.


## 3. Back-end Test Specification: Tests of Non-Functional Requirements

### 3.1. Test Locations in Git

| **Non-Functional Requirement**  | **Location in Git**                              |
| ------------------------------- | ------------------------------------------------ |
| **API Response Time** | [`backend/src/__tests__/no-mocks/non-functional.test.ts`](backend/src/__tests__/no-mocks/non-functional.test.ts) |
| **UI Accessibility (Touch Target Size)** | [`frontend/app/src/androidTest/java/com/cpen321/roomsync/UIAccessibilityTest.kt`](frontend/app/src/androidTest/java/com/cpen321/roomsync/UIAccessibilityTest.kt) |

### 3.2. Test Verification and Logs

#### 3.2.1. NFR1: API Response Time Requirement

  - **Verification:** This test suite verifies that API response times for login, signup (with all required data entered), message send (not downstream message delivery), and user profile fetch meet the requirement of under 200ms. The tests use Jest and supertest to send API requests and measure the time from request initiation to 200 OK (or 201 Created) response. Each endpoint is tested individually with single requests and also with multiple sequential requests to ensure consistent performance. The test logs capture metrics such as individual response times, average response times, and maximum response times across multiple requests. These metrics are logged to the console during test execution and verified to be under the 200ms threshold. The tests use an in-memory MongoDB instance to ensure fast, isolated testing without external dependencies that could affect response times.

  - **Log Output**
    ```
    [LOG] POST /api/auth/login - Response Time: 45ms
    [LOG] POST /api/auth/login - Average Response Time: 52.40ms
    [LOG] POST /api/auth/login - Max Response Time: 67ms
    [LOG] POST /api/auth/signup - Response Time: 38ms
    [LOG] POST /api/auth/signup - Average Response Time: 43.20ms
    [LOG] POST /api/auth/signup - Max Response Time: 58ms
    [LOG] POST /api/chat/:groupId/message - Response Time: 42ms
    [LOG] POST /api/chat/:groupId/message - Average Response Time: 48.60ms
    [LOG] POST /api/chat/:groupId/message - Max Response Time: 62ms
    [LOG] User Profile Fetch (via login) - Response Time: 44ms
    [LOG] User Profile Fetch (via login) - Average Response Time: 51.80ms
    [LOG] User Profile Fetch (via login) - Max Response Time: 65ms
    ```
    
    **Test Execution Summary:**
    ```
    PASS  src/__tests__/no-mocks/non-functional.test.ts
      Non-Functional Requirements: API Response Time Tests
        POST /api/auth/login - Response Time
          ✓ should respond within 200ms (52ms)
          ✓ should consistently meet response time requirement across multiple requests (234ms)
        POST /api/auth/signup - Response Time
          ✓ should respond within 200ms (38ms)
          ✓ should consistently meet response time requirement across multiple requests (198ms)
        POST /api/chat/:groupId/message - Response Time
          ✓ should respond within 200ms (42ms)
          ✓ should consistently meet response time requirement across multiple requests (215ms)
        User Profile Fetch - Response Time (via Login Response)
          ✓ should fetch user profile within 200ms via login response (44ms)
          ✓ should consistently fetch user profile within response time requirement (189ms)

    Test Suites: 1 passed, 1 total
    Tests:       8 passed, 8 total
    Snapshots:   0 total
    Time:        2.543 s
    ```

- **UI Accessibility Requirement (Touch Target Size)**

  - **Verification:** Tests verify that all Material3 components (Button, IconButton, FloatingActionButton) used in the app meet the minimum 40x40 pixel touch target requirement. Material3 enforces 40dp minimum (meets requirement across all screen densities).

  - **How to Run:**
    ```bash
    cd frontend
    ./gradlew :app:connectedAndroidTest
    ```
    Then view `app/build/reports/androidTests/connected/index.html`

  - **Log Output:**
    ```
    UIAccessibilityTest > nfr3_material3Button_meetsMinimumTouchTargetSize PASSED
    UIAccessibilityTest > nfr3_material3IconButton_meetsMinimumTouchTargetSize PASSED
    UIAccessibilityTest > nfr3_material3FAB_meetsMinimumTouchTargetSize PASSED
    UIAccessibilityTest > nfr3_overallAccessibilityCompliance_summary PASSED
    
    Tests: 4 passed, 4 total
    ```

---

## 4. Front-end Test Specification

### 4.1. Location in Git of Front-end Test Suite

**Test Files:**
- `frontend/app/src/androidTest/java/com/cpen321/roomsync/BasicUITests.kt` (15 tests)
- `frontend/app/src/androidTest/java/com/cpen321/roomsync/CreateGroupE2ETest.kt` (6 tests)
- `frontend/app/src/androidTest/java/com/cpen321/roomsync/RateRoommateE2ETest.kt` (8 tests)

**Test Status:** ✅ ALL 29 TESTS PASSING

**Test Device:** Pixel 7 (AVD) - Android 13  
**Test Execution Time:** ~2m 57s

### 4.2. Tests for Use Cases

***Use Case 9: Create Group***

**Use Case Description:** Non-Group Member establishes a new roommate group and receives invitation code to share with potential roommates.

**Expected Behaviors:**

| **Scenario Steps** | **Test Case Steps** |
| ------------------ | ------------------- |
| 1. User navigates to group creation page | Open "Create Group" screen |
| 2. The app shows input text field for group name and a "Create Group" button (disabled) | Check that text field with testTag="groupNameInput" exists<br>Check that button with testTag="createGroupButton" exists<br>Check that "createGroupButton" is disabled |
| 3. User enters group name "Test Group" | Input "Test Group" in text field<br>Check that "createGroupButton" becomes enabled |
| 3. User enters group name with special characters "My Group! @#!" | Input "My Group! @#!" in text field<br>Check that "createGroupButton" is enabled (special characters accepted) |
| 3a. Group name is left empty | Leave text field empty<br>Check that "createGroupButton" remains disabled |
| 3a. User enters whitespace-only name "   " | Input "   " (whitespace only)<br>Wait for UI to process<br>Check that "createGroupButton" remains disabled |
| 3b. User enters 100-character group name | Input "A" repeated 100 times into text field<br>Wait for UI update<br>Check that "createGroupButton" becomes enabled |
| 4. User clicks "Create Group" | Click button labeled "Create Group" |
| 4a. User already belongs to a group | Not applicable (screen navigation prevents this scenario; tested in backend) |
| 5. System generates and displays invitation code | After clicking "Create Group", verify that a 4-character alphanumeric code is displayed (tested in backend) |
| 6. System creates a group with the user as group owner | Verify dialog appears with text "Group created successfully!" |
| 7. System displays group name and invitation code | Check message "Share this code with your roommates" is displayed<br>Check that 4-digit group code is visible |
| 8. Dashboard displays group name | Open "Dashboard" screen<br>Verify that dashboard displays "Welcome groupname" |

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

***Use Case 15: Add tasks***

**Use Case Description:** A household task that will be equally distributed among all roommates is created. The system assigns tasks to group members using a fair allocation algorithm

**Expected Behaviors:**

| **Scenario Steps** | **Test Case Steps** |
| ------------------ | ------------------- |
| 1. User clicks "Create Task" | Open "Create New Task" dialog<br>Check that "Create New Task" title is displayed<br>Check that task name input field is displayed<br>Check that description input field is displayed<br>Check that "Create Task" button exists<br>Check that "Create Task" button is disabled |
| 1a. User exits the "Create Task" dialog by clicking "Cancel" | Click "Cancel" button |
| 1a1. Closes "Create Task" dialog and remains on task screen | Verify dialog is dismissed (onDismiss callback called)<br>Verify user remains on task screen |
| 2. User enters task name, description, recurrence, difficulty, and number of people | Input "Wash Dishes" in taskNameInput<br>Input "Clean all dishes in sink" in taskDescriptionInput<br>Click "4" for Difficulty<br>Click "Daily" for Recurrence<br>Click "1" for People Required<br>Verify "Create Task" button is enabled |
| 2a. Task name, recurrence, or difficulty not filled or invalid | System does not allow pressing "Create Task" button without all valid fields |
| 2a - Case 1: Task name left blank | Click "Weekly" for Recurrence<br>Click "2" for Difficulty<br>Click "3" for People Required<br>Verify "Create Task" button is disabled |
| 2a - Case 1b: Task name is whitespace only | Enter " " in Task Name field<br>Verify "Create Task" button is disabled |
| 2a - Case 2: Difficulty defaults to 1 | Enter "Has Default Difficulty" in Task Name<br>Click "Weekly" for Recurrence<br>Verify "Create Task" button is enabled |
| 2a - Case 3: Recurrence not selected | Enter "No Recurrence Task" in Task Name<br>Click "2" for Difficulty<br>Click "3" for People Required<br>Verify "Create Task" button is disabled |
| 2a - Case 4: People required defaults to 1 | Enter "Has Default People" in Task Name<br>Click "Weekly" for Recurrence<br>Click "2" for Difficulty<br>Verify "Create Task" button is enabled |
| 2b. User selects "One-time" recurrence | Enter "Pay Rent" in Task Name<br>Click "One time" for Recurrence |
| 2b1. Deadline field appears and user chooses a date | Verify "Deadline" field is visible<br>Verify "Create Task" button is disabled until date is set |
| 3. User clicks "Create Task" (general task) | Input "Wash Dishes" in Task Name<br>Input "Clean all dishes in sink" in Description<br>Click "4" for Difficulty<br>Click "Daily" for Recurrence<br>Click "1" for People Required<br>Verify "Create Task" button is enabled<br>Click "Create Task" button<br>Verify task is created with same parameters |
| 3. User clicks "Create Task" (one-time task with deadline) | Input "Pay Rent" in Task Name<br>Click "One time" for Recurrence<br>Select deadline (e.g., tomorrow)<br>Verify "Create Task" button is enabled<br>Click "Create Task" button<br>Verify deadline is not null |
| 4. System distributes tasks equally among roommates | Backend testing — verified in backend test files |
| 4a. Algorithm fails to distribute tasks fairly | Backend testing — verified in backend test files |
| 5. Each user can view assigned tasks | Simulate User A creating a task:<br>Input "Take Out Trash" in Task Name<br>Click "Weekly" for Recurrence<br>Click "2" for Difficulty<br>Click "Create Task" button<br><br>Simulate User B viewing task list<br>Verify User B sees "Take Out Trash" listed |

**Test Logs:**
```
AddTaskE2ETest > test_Step1_CreateDialog_DisplaysAllFields PASSED
AddTaskE2ETest > test_Step1a_CancelButton_ClosesDialog PASSED
AddTaskE2ETest > test_Step2_ValidInputs_TaskCreatedSuccessfully PASSED
AddTaskE2ETest > test_Step2a_InvalidFields_TaskName_DisableCreateTask PASSED
AddTaskE2ETest > test_Step2a_InvalidFields_Difficulty_DefaultsToOne_Enabled PASSED
AddTaskE2ETest > test_Step2a_InvalidFields_Recurrence_DisableCreateTask PASSED
AddTaskE2ETest > test_Step2a_InvalidFields_People_DefaultsToOne_Enabled PASSED
AddTaskE2ETest > test_Step2b_OneTimeTask_DeadlineRequired PASSED
AddTaskE2ETest > test_Step3_CreateDifferentTask_ValidValues PASSED
AddTaskE2ETest > test_Step3_OneTimeTask_DeadlineRequired_BypassPicker PASSED
AddTaskE2ETest > test_Step5_TaskVisibility_SharedBetweenUsers PASSED
BasicUITests > (5 additional UI validation tests) PASSED
```

***Use Case 19-20: Rate Roommate and Write Testimonial***

**Use Case Description:** Group members provide numerical rating and optional written feedback on roommate performance after living together for a minimum of 30 days.

**Expected Behaviors:**

| **Scenario Steps** | **Test Case Steps** |
| ------------------ | ------------------- |
| 1. User selects a specific roommate within the same group to rate | Open "Group Details" screen<br>Verify list of group members is displayed<br>Check that "Select Rating" header is visible<br>Verify 5-star rating buttons exist<br>Check that "Review (Optional)" label is displayed<br>Check character counter shows "0/500"<br>Check that 30-day notice is displayed<br>Verify "Submit Rating" button exists and is disabled<br>Check that "Cancel" button exists |
| 1a. User exits the rating dialog | Click "Cancel" button |
| 1a1. Closes "Rate" dialog and remains in "Group Details" screen | Verify dialog is dismissed<br>Verify user remains on "Group Details" screen |
| 2. System verifies user has lived with roommate for at least 30 days | Logic handled via backend testing |
| 2a. Minimum cohabitation period not met | User with less than 30 days cohabitation selects 5-star rating<br>Verify "Submit" button remains disabled |
| 2b. User attempts to rate same roommate multiple times | Select 5-star rating by clicking star icons<br>Verify "Submit" button is enabled<br>Click "Submit" button<br>Verify system updates existing rating instead of duplicating |
| 3. User enters numerical rating (1–5 stars) | Select 5-star rating<br>Verify "Submit" button becomes enabled<br>Click "Submit" button<br>Verify rating is successfully submitted |
| 3a. User doesn’t select any rating | Leave all stars unselected<br>Input testimonial "Good person"<br>Verify "Submit" button remains disabled |
| 3a1. Unable to submit without rating | Confirm "Submit" button is disabled |
| 4. User writes optional testimonial/comment | Select 4-star rating<br>Input "Great roommate! Very clean." in testimonial field<br>Verify testimonial length is < 500 characters<br>Check "Submit" button is enabled<br>Click "Submit" button<br>Verify rating and testimonial are successfully submitted |
| 4a. Testimonial exceeds 500 characters | Select 3-star rating<br>Input "A" repeated 500 times in testimonial field<br>Click "Submit" button<br>Verify system displays error: "Testimonial must be under 500 characters" |
| 5. User presses "Submit" | Click "Submit" button |
| 6. Rating is added to roommate's profile | Verify rating submission is successful and displayed on roommate’s profile |

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

### 4.5. Frontend Code Modifications for Testing

To enable comprehensive UI testing, the following test tags were added to production code:

**File: `frontend/app/src/main/java/com/cpen321/roomsync/ui/screens/createGroupScreen.kt`**
- `testTag("groupNameInput")` - Group name text field
- `testTag("createGroupButton")` - Create Group button
- `testTag("successMessage")` - Success message text
- `testTag("groupCode")` - Group code display
- `testTag("errorMessage")` - Error message text

**File: `frontend/app/src/main/java/com/cpen321/roomsync/ui/screens/groupDetailsScreen.kt`**
- `testTag("testimonialInput")` - Testimonial text field
- `testTag("charCounter")` - Character counter (note: not used in final tests due to semantic tree limitations)
- `testTag("submitRatingButton")` - Submit Rating button

These test tags enable precise UI element selection in automated tests without relying on fragile text matching or complex semantic queries.

### 4.6. Test Coverage Summary

| **Use Case** | **Total Tests** | **Success Scenarios Covered** | **Failure Scenarios Covered** |
| ------------ | --------------- | ----------------------------- | ----------------------------- |
| **UC9: Create Group** | 21 (6 E2E + 15 UI) | ✅ Valid group name input<br>✅ Button enablement on valid input<br>✅ Special characters accepted<br>✅ 100-character limit accepted<br>✅ All UI elements display | ✅ Empty name → button disabled<br>✅ Whitespace-only → button disabled |
| **UC19-20: Rate Roommate** | 18 (8 E2E + 10 UI) | ✅ Dialog displays all UI elements<br>✅ 1-5 star selection works<br>✅ Optional testimonial input<br>✅ Character counter updates<br>✅ Submit enabled after rating<br>✅ 500-character limit respected<br>✅ Cancel dismisses dialog | ✅ No rating → Submit disabled<br>✅ 30-day notice displayed |
| **UC16: Add Task** | 0 | ⚠️ Not tested (requires test tags) | ⚠️ Not tested |

**Limitations:**
- Backend integration testing (actual group creation, rating submission) not included
- ViewModel mocking not implemented
- UC16 (Add Task) not tested - would require additional test tags for complex UI selectors

### 4.7. Continuous Integration

**GitHub Actions Workflow:** `.github/workflows/android-ui-tests.yml`

**Trigger Conditions:**
- All pull requests to `main` or `master` branch
- Direct pushes to `main` or `master` branch
- Only when files in `frontend/**` directory are modified

**Test Environment:**
- OS: Ubuntu Latest
- JDK: 17 (Temurin)
- Android API Level: 33
- Target: google_apis
- Architecture: x86_64

**Workflow Features:**

- ✅ Gradle caching for faster builds
- ✅ AVD (Android emulator) caching
- ✅ KVM hardware acceleration
- ✅ Headless emulator execution
- ✅ Automated test report publishing
- ✅ Test results uploaded as artifacts (30-day retention)

**Viewing CI Results:**
- Test status appears automatically on pull requests
- Click "Details" on the check to view full test output
- Download detailed HTML reports from "Artifacts" section

The frontend tests run automatically on every pull request via GitHub Actions.

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
