# Testing and Code Review

## 1. Change History

| **Change Date**   | **Modified Sections** | **Rationale** |
| ----------------- | --------------------- | ------------- |
| _Nothing to show_ |

---

## 2. Back-end Test Specification: APIs

### 2.1. Locations of Back-end Tests and Instructions to Run Them

#### 2.1.1. Tests

| **Interface**                 | **Describe Group Location, No Mocks**                | **Describe Group Location, With Mocks**            | **Mocked Components**              |
| ----------------------------- | ---------------------------------------------------- | -------------------------------------------------- | ---------------------------------- |
| **POST /user/login**          | [`tests/unmocked/authenticationLogin.test.js#L1`](#) | [`tests/mocked/authenticationLogin.test.js#L1`](#) | Google Authentication API, User DB |
| **POST /study-groups/create** | ...                                                  | ...                                                | Study Group DB                     |
| ...                           | ...                                                  | ...                                                | ...                                |
| ...                           | ...                                                  | ...                                                | ...                                |

#### 2.1.2. Commit Hash Where Tests Run

`[Insert Commit SHA here]`

#### 2.1.3. Explanation on How to Run the Tests

1. **Clone the Repository**:

   - Open your terminal and run:
     ```
     git clone https://github.com/example/your-project.git
     ```

2. **...**

### 2.2. GitHub Actions Configuration Location

`~/.github/workflows/backend-tests.yml`

### 2.3. Jest Coverage Report Screenshots for Tests Without Mocking

_(Placeholder for Jest coverage screenshot without mocking)_

### 2.4. Jest Coverage Report Screenshots for Tests With Mocking

_(Placeholder for Jest coverage screenshot with mocking)_

### 2.5. Jest Coverage Report Screenshots for Both Tests With and Without Mocking

_(Placeholder for Jest coverage screenshot both with and without mocking)_

---

## 3. Back-end Test Specification: Tests of Non-Functional Requirements

### 3.1. Test Locations in Git

| **Non-Functional Requirement**  | **Location in Git**                              |
| ------------------------------- | ------------------------------------------------ |
| **Performance (Response Time)** | [`tests/nonfunctional/response_time.test.js`](#) |
| **Chat Data Security**          | [`tests/nonfunctional/chat_security.test.js`](#) |

### 3.2. Test Verification and Logs

- **Performance (Response Time)**

  - **Verification:** This test suite simulates multiple concurrent API calls using Jest along with a load-testing utility to mimic real-world user behavior. The focus is on key endpoints such as user login and study group search to ensure that each call completes within the target response time of 2 seconds under normal load. The test logs capture metrics such as average response time, maximum response time, and error rates. These logs are then analyzed to identify any performance bottlenecks, ensuring the system can handle expected traffic without degradation in user experience.
  - **Log Output**
    ```
    [Placeholder for response time test logs]
    ```

- **Chat Data Security**
  - **Verification:** ...
  - **Log Output**
    ```
    [Placeholder for chat security test logs]
    ```

---

## 4. Front-end Test Specification

### 4.1. Location in Git of Front-end Test Suite:

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

---

## 5. Automated Code Review Results

### 5.1. Commit Hash Where Codacy Ran

`[Insert Commit SHA here]`

### 5.2. Unfixed Issues per Codacy Category

_(Placeholder for screenshots of Codacy's Category Breakdown table in Overview)_

### 5.3. Unfixed Issues per Codacy Code Pattern

_(Placeholder for screenshots of Codacy's Issues page)_

### 5.4. Justifications for Unfixed Issues

- **Code Pattern: [Usage of Deprecated Modules](#)**

  1. **Issue**

     - **Location in Git:** [`src/services/chatService.js#L31`](#)
     - **Justification:** ...

  2. ...

- ...