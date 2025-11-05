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

| **Non-Functional Requirement** | **Location in Git** |
| ------------------------------ | ------------------- |
| _To be implemented_             | _Pending_           |

### 3.2. Test Verification and Logs

_(Placeholder for non-functional requirement tests)_

**Note:** Non-functional requirement tests (e.g., performance, security, scalability) are not yet implemented. These should be added to test:
- Response time requirements
- Data security (authentication, authorization)
- Load handling
- Error recovery
- Other non-functional requirements as specified in the project requirements

---

## 4. Front-end Test Specification

### 4.1. Location in Git of Front-end Test Suite

**Test Files:**

- _To be documented when frontend tests are implemented_

**Test Status:** _Pending_

### 4.2. Tests for Use Case [X]

_(Placeholder for frontend use case tests)_

### 4.3. Tests for Use Case [Y]

_(Placeholder for frontend use case tests)_

### 4.4. How to Run All Frontend Tests

_(Placeholder for frontend test execution instructions)_

### 4.5. Frontend Code Modifications for Testing

_(Placeholder for test tags and modifications)_

### 4.6. Test Coverage Summary

_(Placeholder for frontend test coverage table)_

### 4.7. Continuous Integration

**GitHub Actions Workflow:** `.github/workflows/android-ui-tests.yml` (or similar)

**Status:** _To be documented when CI is set up_

---

## 5. Automated Code Review Results

### 5.1. Commit Hash Where Codacy Ran

`[Insert Commit SHA here]`

**Note:** Codacy or similar automated code review tool needs to be configured and run on the codebase.

### 5.2. Unfixed Issues per Codacy Category

_(Placeholder for screenshots of Codacy's Category Breakdown table in Overview)_

### 5.3. Unfixed Issues per Codacy Code Pattern

_(Placeholder for screenshots of Codacy's Issues page)_

### 5.4. Justifications for Unfixed Issues

_(Placeholder for justifications)_

**Format for each issue:**

- **Code Pattern: [Pattern Name]**

  1. **Issue**
     - **Location in Git:** `[file path]#L[line number]`
     - **Justification:** [Explanation of why this issue is not fixed or is acceptable]

  2. ...
