# Backend Test Suite

This directory contains automated tests for the RoomSync backend API using Jest.

## Test Structure

All tests use a real in-memory MongoDB database (via `mongodb-memory-server`) and do not use mocking. These tests:
- Use actual database operations
- Verify complete integration flows
- Test real API endpoints with authentication
- Provide high confidence in system behavior

## Test Organization

Each API endpoint has corresponding test files in the `no-mocks/` directory:
- `auth.test.ts` - Authentication endpoints (signup, login)
- `user.test.ts` - User profile management
- `group.test.ts` - Group creation and management
- `task.test.ts` - Task management
- `chat.test.ts` - Chat/messaging functionality
- `rating.test.ts` - User rating system
- `health.test.ts` - Health check endpoint

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Test Annotations

Each test includes annotations documenting:
- **Input**: What data is sent to the API
- **Expected Status Code**: HTTP status code expected
- **Expected Output**: Structure of the response
- **Expected Behavior**: What should happen

## Coverage

The Jest configuration is set up to report coverage for:
- All `.ts` files in `src/`
- Excluding type definitions, index files, and configuration

Coverage reports are generated in the `coverage/` directory.

## Setup

The test setup (`setup.ts`) configures:
- In-memory MongoDB instance
- Database cleanup between tests
- Proper teardown after all tests

## Notes

- Authentication tokens are generated using the same JWT secret as production
- Tests use MongoDB Memory Server for isolated database testing
- All tests are configured with a 30-second timeout
- Tests use real database operations without mocking external dependencies

## Troubleshooting

### Tests Fail After Pulling from GitHub

If tests work when you zip the project but fail after pulling from GitHub, try these steps:

1. **Clean install dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **MongoDB Memory Server Binary Download:**
   - On first run, `mongodb-memory-server` downloads MongoDB binaries automatically
   - This requires internet connection and may take a few minutes
   - If download fails, check your network/firewall settings
   - Binaries are cached in `node_modules/.cache/mongodb-memory-server/` or system temp directory

3. **Ensure all files are tracked:**
   ```bash
   git ls-files | grep -E "(jest.config|setup.ts|package.json)"
   ```
   These files MUST be tracked in git for tests to work.

4. **Check Node.js version:**
   - Ensure you're using Node.js version compatible with the project
   - Check `package.json` for required Node version

5. **Run tests with verbose output:**
   ```bash
   npm test -- --verbose
   ```
   This will show detailed error messages if MongoDB binary download fails.