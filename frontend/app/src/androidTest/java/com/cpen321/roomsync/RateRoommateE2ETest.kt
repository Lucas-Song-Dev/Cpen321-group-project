package com.cpen321.roomsync

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.cpen321.roomsync.ui.screens.RatingDialog
import com.cpen321.roomsync.ui.theme.RoomSyncFrontendTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * End-to-End tests for Use Case 19-20: Rate Roommate and Write Testimonial
 * 
 * Main Success Scenario:
 * 1. User navigates to Group Details screen
 * 2. User clicks on a group member to view member details
 * 3. Member details dialog shows ratings and reviews from previous roommates
 * 4. User clicks "Rate User" button
 * 5. Rating dialog opens showing member's name and rating interface
 * 6. User selects rating (1-5 stars) by clicking on star icons
 * 7. User optionally writes testimonial/review in text field (max 500 characters with live character count)
 * 8. Dialog displays note about 30-day requirement
 * 9. User clicks "Submit" button (disabled until rating is selected)
 * 10. System validates that both users have been in group for 30+ days
 * 11. System submits rating and updates member's average rating
 * 12. Rating dialog closes and member details refresh to show new rating
 * 
 * Failure Scenarios:
 * - 10a. Minimum cohabitation period not met
 * - 10b. User attempts to rate same roommate multiple times
 * - 10c. User tries to rate themselves
 * - 9a. User clicks Submit without selecting a rating → Button disabled
 * - 7a. Testimonial exceeds 500 characters → Input prevented
 * - 11a. Network error during rating submission
 */
@RunWith(AndroidJUnit4::class)
class RateRoommateE2ETest {

    @get:Rule
    val composeTestRule = createComposeRule()

    /**
     * Test: Main Success Scenario Steps 5-8
     * Test Steps:
     * - Open rating dialog
     * - Check dialog title shows member name
     * - Check "Select Rating" header is displayed
     * - Check 5 star buttons exist
     * - Check "Review (Optional)" label is displayed
     * - Check character counter shows "0/500"
     * - Check 30-day notice is displayed
     * - Check "Submit Rating" button exists
     * - Check "Submit Rating" button is disabled
     * - Check "Cancel" button exists
     */
    @Test
    fun test_UC19_20_Step5_8_RatingDialogDisplaysCorrectly() {
        // Step 5: Rating dialog opens
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                RatingDialog(
                    memberName = "Alice Smith",
                    onDismiss = {},
                    onSubmit = { _, _ -> }
                )
            }
        }

        // Step 5: Check dialog title shows member's name
        composeTestRule
            .onNodeWithText("Rate Alice Smith")
            .assertIsDisplayed()

        // Step 5: Check "Select Rating" header is displayed
        composeTestRule
            .onNodeWithText("Select Rating")
            .assertIsDisplayed()

        // Step 6: Check that 5 star buttons exist
        val starButtons = composeTestRule
            .onAllNodes(hasText("★") and hasClickAction())
        assert(starButtons.fetchSemanticsNodes().size == 5)

        // Step 7: Check "Review (Optional)" label is displayed
        composeTestRule
            .onNodeWithText("Review (Optional)")
            .assertIsDisplayed()

        // Step 7: Check character counter shows "0/500"
        composeTestRule
            .onNodeWithText("0/500")
            .assertIsDisplayed()

        // Step 8: Check 30-day notice is displayed
        composeTestRule
            .onNodeWithText("Note: Both you and the user must have been in the group for at least 30 days to submit a rating. Time spent together is automatically calculated.")
            .assertIsDisplayed()

        // Step 9: Check "Submit Rating" button exists
        composeTestRule
            .onNodeWithTag("submitRatingButton")
            .assertExists()

        // Step 9: Check "Submit Rating" button is disabled (no rating selected)
        composeTestRule
            .onNodeWithTag("submitRatingButton")
            .assertIsNotEnabled()

        // Check "Cancel" button exists
        composeTestRule
            .onNodeWithText("Cancel")
            .assertExists()
            .assertIsDisplayed()
    }

    /**
     * Test: Main Success Scenario Steps 6-9
     * Test Steps:
     * - Select 5-star rating by clicking on 5th star
     * - Check that Submit button is now enabled
     * - Click Submit button
     * - Verify onSubmit callback was called with rating=5
     */
    @Test
    fun test_UC19_20_Step6_9_SelectRatingAndSubmit() {
        var submittedRating = 0
        var submittedTestimonial = ""

        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                RatingDialog(
                    memberName = "Bob Johnson",
                    onDismiss = {},
                    onSubmit = { rating, testimonial ->
                        submittedRating = rating
                        submittedTestimonial = testimonial
                    }
                )
            }
        }

        // Step 6: Select 5-star rating by clicking on star icons
        composeTestRule
            .onAllNodes(hasText("★") and hasClickAction())
            .get(4) // 5th star (index 4)
            .performClick()

        composeTestRule.waitForIdle()

        // Step 9: Check that "Submit" button is now enabled
        composeTestRule
            .onNodeWithTag("submitRatingButton")
            .assertIsEnabled()

        // Step 9: Click Submit button
        composeTestRule
            .onNodeWithTag("submitRatingButton")
            .performClick()

        // Verify rating was submitted
        assert(submittedRating == 5)
        assert(submittedTestimonial == "")
    }

    /**
     * Test: Main Success Scenario Steps 6-7-9
     * Test Steps:
     * - Select 4-star rating
     * - Write testimonial "Great roommate! Very clean."
     * - Check character counter updates to "30/500"
     * - Click Submit button
     * - Verify onSubmit was called with rating and testimonial
     */
    @Test
    fun test_UC19_20_Step6_7_9_RatingWithTestimonial() {
        var submittedRating = 0
        var submittedTestimonial = ""

        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                RatingDialog(
                    memberName = "Charlie Brown",
                    onDismiss = {},
                    onSubmit = { rating, testimonial ->
                        submittedRating = rating
                        submittedTestimonial = testimonial
                    }
                )
            }
        }

        // Step 6: Select 4-star rating
        composeTestRule
            .onAllNodes(hasText("★") and hasClickAction())
            .get(3) // 4th star
            .performClick()

        composeTestRule.waitForIdle()

        // Step 7: Write testimonial
        val testimonialText = "Great roommate! Very clean."
        composeTestRule
            .onNodeWithTag("testimonialInput")
            .performTextInput(testimonialText)

        composeTestRule.waitForIdle()

        // Step 7: Check character counter updates
        composeTestRule
            .onNodeWithText("${testimonialText.length}/500")
            .assertIsDisplayed()

        // Step 9: Check Submit button is enabled
        composeTestRule
            .onNodeWithTag("submitRatingButton")
            .assertIsEnabled()

        // Step 9: Click Submit button
        composeTestRule
            .onNodeWithTag("submitRatingButton")
            .performClick()

        // Verify rating and testimonial were submitted
        assert(submittedRating == 4)
        assert(submittedTestimonial == testimonialText)
    }

    /**
     * Test: Failure Scenario 9a
     * Scenario: User clicks Submit without selecting a rating
     * Test Steps:
     * - Do NOT select any star
     * - Check that Submit button is disabled
     */
    @Test
    fun test_UC19_20_Scenario9a_NoRatingSelected_SubmitDisabled() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                RatingDialog(
                    memberName = "Diana Prince",
                    onDismiss = {},
                    onSubmit = { _, _ -> }
                )
            }
        }

        // Scenario 9a: User does not select rating
        // (no action needed - testing default state)

        // Check that Submit button is disabled
        composeTestRule
            .onNodeWithTag("submitRatingButton")
            .assertIsNotEnabled()

        // Even if user writes testimonial, button should still be disabled
        composeTestRule
            .onNodeWithTag("testimonialInput")
            .performTextInput("Good person")

        composeTestRule.waitForIdle()

        // Submit button should still be disabled without rating
        composeTestRule
            .onNodeWithTag("submitRatingButton")
            .assertIsNotEnabled()
    }

    /**
     * Test: Testimonial at maximum length (500 characters)
     * Scenario: User inputs exactly 500 characters
     * Test Steps:
     * - Select rating
     * - Input exactly 500 characters in testimonial
     * - Verify testimonial is accepted at maximum length
     */
    @Test
    fun test_UC19_20_Testimonial500Characters_Accepted() {
        var submittedTestimonial = ""

        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                RatingDialog(
                    memberName = "Eve Wilson",
                    onDismiss = {},
                    onSubmit = { _, testimonial ->
                        submittedTestimonial = testimonial
                    }
                )
            }
        }

        // Select rating first
        composeTestRule
            .onAllNodes(hasText("★") and hasClickAction())
            .get(2) // 3 stars
            .performClick()

        composeTestRule.waitForIdle()

        // Input exactly 500 characters (maximum allowed)
        val text500chars = "A".repeat(500)
        composeTestRule
            .onNodeWithTag("testimonialInput")
            .performTextInput(text500chars)

        composeTestRule.waitForIdle()

        // Submit the rating
        composeTestRule
            .onNodeWithTag("submitRatingButton")
            .performClick()

        // Verify all 500 characters were accepted
        assert(submittedTestimonial.length == 500)
        assert(submittedTestimonial == text500chars)
    }

    /**
     * Test: Minimum rating (1 star)
     * Test Steps:
     * - Select 1-star rating
     * - Verify Submit button is enabled
     * - Submit and verify rating value
     */
    @Test
    fun test_UC19_20_MinimumRating_1Star() {
        var submittedRating = 0

        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                RatingDialog(
                    memberName = "Test User",
                    onDismiss = {},
                    onSubmit = { rating, _ ->
                        submittedRating = rating
                    }
                )
            }
        }

        // Select 1st star
        composeTestRule
            .onAllNodes(hasText("★") and hasClickAction())
            .get(0)
            .performClick()

        composeTestRule.waitForIdle()

        // Check Submit is enabled
        composeTestRule
            .onNodeWithTag("submitRatingButton")
            .assertIsEnabled()
            .performClick()

        // Verify rating = 1
        assert(submittedRating == 1)
    }

    /**
     * Test: Maximum rating (5 stars)
     * Test Steps:
     * - Select 5-star rating
     * - Verify Submit button is enabled
     * - Submit and verify rating value
     */
    @Test
    fun test_UC19_20_MaximumRating_5Stars() {
        var submittedRating = 0

        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                RatingDialog(
                    memberName = "Test User",
                    onDismiss = {},
                    onSubmit = { rating, _ ->
                        submittedRating = rating
                    }
                )
            }
        }

        // Select 5th star
        composeTestRule
            .onAllNodes(hasText("★") and hasClickAction())
            .get(4)
            .performClick()

        composeTestRule.waitForIdle()

        // Check Submit is enabled
        composeTestRule
            .onNodeWithTag("submitRatingButton")
            .assertIsEnabled()
            .performClick()

        // Verify rating = 5
        assert(submittedRating == 5)
    }

    /**
     * Test: Cancel button dismisses dialog
     * Test Steps:
     * - Click Cancel button
     * - Verify onDismiss callback is called
     */
    @Test
    fun test_UC19_20_CancelButton_DismissesDialog() {
        var dismissed = false

        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                RatingDialog(
                    memberName = "Frank Miller",
                    onDismiss = { dismissed = true },
                    onSubmit = { _, _ -> }
                )
            }
        }

        // Click Cancel button
        composeTestRule
            .onNodeWithText("Cancel")
            .performClick()

        // Verify dialog was dismissed
        assert(dismissed)
    }
}

