# GitHub Actions Workflows

This directory contains CI/CD workflows for the RoomSync project.

## Frontend Android UI Testing Workflows

We have **two workflow options** for running Android UI tests. Choose based on your needs:

### Option 1: android-ui-tests.yml (Recommended for PR Reviews)
**File:** `android-ui-tests.yml`

**What it does:**
- Runs each test suite separately in individual emulator sessions
- CreateGroupTest → AddTaskTest → RateRoommateTest (sequential)

**Pros:**
- ✅ Better isolation - if one test suite fails, others still run
- ✅ Easier to identify which specific test suite failed
- ✅ More granular reporting

**Cons:**
- ⚠️ Slower - requires multiple emulator startups
- ⚠️ Uses more GitHub Actions minutes

**Best for:**
- Pull request reviews where you need detailed feedback
- Debugging specific test failures
- When you want to see exactly which test suite has issues

### Option 2: android-ui-tests-all.yml (Faster, Lower Resource Usage)
**File:** `android-ui-tests-all.yml`

**What it does:**
- Runs all tests in a single emulator session
- Executes `./gradlew :app:connectedAndroidTest` once

**Pros:**
- ✅ Faster execution - only one emulator startup
- ✅ Lower resource usage - fewer GitHub Actions minutes
- ✅ Simpler workflow

**Cons:**
- ⚠️ Less granular - harder to identify which test suite failed
- ⚠️ All tests stop if emulator fails

**Best for:**
- Quick validation before merging
- Development branches with limited Actions minutes
- When you just need to know if all tests pass

## Current Configuration

**Currently Active:** Both workflows are enabled but triggered by different file patterns.

**Recommendation:** Choose ONE workflow to use and disable the other by renaming it (e.g., add `.disabled` extension).

To disable a workflow:
```bash
# Disable the individual test suite workflow
mv .github/workflows/android-ui-tests.yml .github/workflows/android-ui-tests.yml.disabled

# OR disable the all-in-one workflow
mv .github/workflows/android-ui-tests-all.yml .github/workflows/android-ui-tests-all.yml.disabled
```

## Workflow Triggers

Both workflows trigger on:
- **Pull Requests** to `main` or `master` branches
- **Pushes** to `main` or `master` branches
- Only when files in `frontend/**` are modified

## Test Environment

- **OS:** Ubuntu Latest
- **JDK:** 17 (Temurin)
- **Android API Level:** 33
- **Target:** google_apis
- **Architecture:** x86_64
- **Emulator Options:** Headless, no audio, no animations

## Viewing Results

### In Pull Requests
- Check status shows up automatically on PR
- Click "Details" to see full test output
- Failed tests show in the "Checks" tab

### Test Reports
- Navigate to Actions → Select workflow run
- Download artifacts:
  - `android-test-results` - JUnit XML results
  - `android-test-reports` - HTML test reports
- View inline test report in "Summary" section

## Optimizations

Both workflows include:
- ✅ **Gradle Caching** - Speeds up dependency downloads
- ✅ **AVD Caching** - Reuses Android emulator snapshots
- ✅ **KVM Acceleration** - Hardware-accelerated emulation
- ✅ **Path Filtering** - Only runs when frontend code changes

## Troubleshooting

### Tests Timeout
- Increase timeout in workflow (currently defaults to 360 minutes)
- Add `timeout-minutes: 30` to test steps

### Emulator Fails to Start
- Check API level compatibility
- Try different `target` (e.g., `default` instead of `google_apis`)
- Check emulator logs in workflow output

### Tests Pass Locally But Fail in CI
- Disable animations on local device to match CI
- Check for timing issues - add waits where needed
- Ensure tests don't depend on specific screen sizes

### Out of Actions Minutes
- Use `android-ui-tests-all.yml` (faster)
- Add path filters to reduce unnecessary runs
- Consider running tests only on PR (remove push trigger)

## Maintenance

### Updating Android API Level
Edit the `matrix.api-level` in both workflows:
```yaml
strategy:
  matrix:
    api-level: [34]  # Update this
```

### Changing JDK Version
Edit the `java-version` in both workflows:
```yaml
- name: Set up JDK 17
  uses: actions/setup-java@v4
  with:
    java-version: '17'  # Update this
```

### Adding New Test Suites
For `android-ui-tests.yml`, add a new step:
```yaml
- name: Run NewTest
  uses: reactivecircus/android-emulator-runner@v2
  with:
    # ... same config as other tests
    script: ./gradlew :app:connectedAndroidTest --tests "com.cpen321.roomsync.NewTest" --stacktrace
```

For `android-ui-tests-all.yml`, no changes needed - it automatically runs all tests.

## Cost Considerations

- GitHub Actions provides **2,000 free minutes/month** for private repos
- Android emulator tests can use **10-20 minutes per run**
- Consider:
  - Using `android-ui-tests-all.yml` for most PRs (faster)
  - Using `android-ui-tests.yml` only when debugging
  - Limiting runs to PRs only (remove push trigger)

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Android Emulator Runner Action](https://github.com/ReactiveCircus/android-emulator-runner)
- [Gradle Caching in GitHub Actions](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)

