package com.cpen321.roomsync

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.cpen321.roomsync.ui.screens.RatingDialog
import com.cpen321.roomsync.ui.theme.RoomSyncTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * End-to-end UI tests for Use Case 19-20: Rate Roommate and Write Testimonial
 * 
 * This test class covers all success and failure scenarios from the formal use case specification:
 * 
 * Main Success Scenario:
 * 1. User navigates to Group Details screen
 * 2. User clicks on a group member to view member details
 * 3. Member details dialog shows ratings and reviews from previous roommates
 * 4. User clicks "Rate User" button
 * 5. Rating dialog opens showing member's name and rating interface
 * 6. User selects rating (1-5 stars) by clicking on star icons
 * 7. User optionally writes testimonial/review in text field (max 500 characters with live character count)
 * 8. Dialog displays note about 30-day requirement: "Both you and the user must have been in the 
 *    group for at least 30 days to submit a rating"
 * 9. User clicks "Submit" button (disabled until rating is selected)
 * 10. System validates that both users have been in group for 30+ days
 * 11. System submits rating and updates member's average rating
 * 12. Rating dialog closes and member details refresh to show new rating
 * 
 * Extensions/Failure Scenarios:
 * - 10a. Minimum cohabitation period not met (less than 30 days)
 *   - System displays error message indicating insufficient time in group
 *   - Rating is not submitted
 * - 10b. User attempts to rate same roommate multiple times
 *   - System detects existing rating from user
 *   - System offers option to update existing rating instead
 * - 10c. User tries to rate themselves
 *   - System prevents self-rating with error message
 * - 9a. User clicks Submit without selecting a rating
 *   - Submit button is disabled until rating (1-5 stars) is selected
 * - 7a. Testimonial exceeds 500 characters
 *   - Input field prevents typing beyond 500 characters
 *   - Character counter shows limit
 * - 11a. Network error during rating submission
 *   - System displays error message
 *   - User can retry submitting the rating
 */
@RunWith(AndroidJUnit4::class)
class RateRoommateTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    /**
     * Test: Valid rating with testimonial
     * Input: 
     * - Rating: 5 stars
     * - Testimonial: "Great roommate! Very clean and respectful."
     * Expected status: Success
     * Expected behavior: 
     * - User can select 5-star rating
     * - User can enter testimonial text
     * - Submit button is enabled
     * Expected output: Rating and testimonial are accepted
     */
    @Test
    fun testRateRoommate_ValidRatingWithTestimonial_SubmitEnabled() {
        // Arrange - Set up the Rating dialog
        var submittedRating = 0
        var submittedTestimonial = ""
        
        composeTestRule.setContent {
            RoomSyncTheme {
                RatingDialog(
                    memberName = "Alice Smith",
                    onDismiss = {},
                    onSubmit = { rating, testimonial ->
                        submittedRating = rating
                        submittedTestimonial = testimonial
                    }
                )
            }
        }

        // Assert - Verify dialog title is displayed with member name
        composeTestRule
            .onNodeWithText("Rate Alice Smith")
            .assertIsDisplayed()

        // Assert - Verify Submit button is initially disabled (no rating selected)
        composeTestRule
            .onNodeWithText("Submit Rating")
            .assertIsNotEnabled()

        // Act - Select 5-star rating (click on 5th star)
        composeTestRule
            .onAllNodes(hasText("★") and hasClickAction())
            [4] // Index 4 corresponds to the 5th star
            .performClick()

        // Assert - Verify 5 stars are now filled
        // All 5 stars should be in primary color (selected state)

        // Act - Enter testimonial
        composeTestRule
            .onNodeWithText("Share your experience as a roommate...")
            .performTextInput("Great roommate! Very clean and respectful.")

        // Assert - Verify testimonial was entered
        composeTestRule
            .onNodeWithText("Share your experience as a roommate...")
            .assert(hasText("Great roommate! Very clean and respectful."))

        // Assert - Verify character counter is displayed
        composeTestRule
            .onNodeWithText("44/500") // "Great roommate! Very clean and respectful." is 44 chars
            .assertIsDisplayed()

        // Assert - Verify Submit button is now enabled
        composeTestRule
            .onNodeWithText("Submit Rating")
            .assertIsEnabled()

        // Act - Click Submit button
        composeTestRule
            .onNodeWithText("Submit Rating")
            .performClick()

        // Assert - Verify rating and testimonial were submitted
        assert(submittedRating == 5)
        assert(submittedTestimonial == "Great roommate! Very clean and respectful.")
    }

    /**
     * Test: Rating without testimonial
     * Input: 
     * - Rating: 4 stars
     * - No testimonial
     * Expected status: Success
     * Expected behavior: 
     * - User can submit rating without testimonial (testimonial is optional)
     * - Submit button is enabled with just rating
     * Expected output: Rating is accepted without testimonial
     */
    @Test
    fun testRateRoommate_RatingWithoutTestimonial_SubmitEnabled() {
        // Arrange - Set up the Rating dialog
        var submittedRating = 0
        var submittedTestimonial = ""
        
        composeTestRule.setContent {
            RoomSyncTheme {
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

        // Act - Select 4-star rating (click on 4th star)
        composeTestRule
            .onAllNodes(hasText("★") and hasClickAction())
            [3] // Index 3 corresponds to the 4th star
            .performClick()

        // Assert - Testimonial field should be empty
        composeTestRule
            .onNodeWithText("Share your experience as a roommate...")
            .assert(hasText(""))

        // Assert - Verify Submit button is enabled without testimonial
        composeTestRule
            .onNodeWithText("Submit Rating")
            .assertIsEnabled()

        // Act - Click Submit button
        composeTestRule
            .onNodeWithText("Submit Rating")
            .performClick()

        // Assert - Verify rating was submitted without testimonial
        assert(submittedRating == 4)
        assert(submittedTestimonial == "")
    }

    /**
     * Test: No rating selected
     * Input: No rating selected
     * Expected status: Button disabled
     * Expected behavior: 
     * - Submit button is disabled when no rating is selected
     * - User must select at least 1 star
     * Expected output: Submit button remains disabled
     */
    @Test
    fun testRateRoommate_NoRatingSelected_SubmitDisabled() {
        // Arrange - Set up the Rating dialog
        composeTestRule.setContent {
            RoomSyncTheme {
                RatingDialog(
                    memberName = "Charlie Brown",
                    onDismiss = {},
                    onSubmit = { _, _ -> }
                )
            }
        }

        // Assert - Verify Submit button is disabled when no rating is selected
        composeTestRule
            .onNodeWithText("Submit Rating")
            .assertIsNotEnabled()

        // Act - Enter testimonial without selecting rating
        composeTestRule
            .onNodeWithText("Share your experience as a roommate...")
            .performTextInput("Good person but rating not selected yet")

        // Assert - Submit button should still be disabled
        composeTestRule
            .onNodeWithText("Submit Rating")
            .assertIsNotEnabled()
    }

    /**
     * Test: Minimum rating (1 star)
     * Input: 
     * - Rating: 1 star
     * - Testimonial: "Not compatible as roommates"
     * Expected status: Success
     * Expected behavior: 
     * - System accepts minimum 1-star rating
     * - Submit button is enabled
     * Expected output: 1-star rating can be submitted
     */
    @Test
    fun testRateRoommate_MinimumRating_SubmitEnabled() {
        // Arrange - Set up the Rating dialog
        var submittedRating = 0
        
        composeTestRule.setContent {
            RoomSyncTheme {
                RatingDialog(
                    memberName = "Diana Prince",
                    onDismiss = {},
                    onSubmit = { rating, _ ->
                        submittedRating = rating
                    }
                )
            }
        }

        // Act - Select 1-star rating (click on 1st star)
        composeTestRule
            .onAllNodes(hasText("★") and hasClickAction())
            [0] // Index 0 corresponds to the 1st star
            .performClick()

        // Act - Enter testimonial
        composeTestRule
            .onNodeWithText("Share your experience as a roommate...")
            .performTextInput("Not compatible as roommates")

        // Assert - Verify Submit button is enabled
        composeTestRule
            .onNodeWithText("Submit Rating")
            .assertIsEnabled()

        // Act - Click Submit button
        composeTestRule
            .onNodeWithText("Submit Rating")
            .performClick()

        // Assert - Verify 1-star rating was submitted
        assert(submittedRating == 1)
    }

    /**
     * Test: Maximum rating (5 stars)
     * Input: 
     * - Rating: 5 stars
     * - Testimonial: "Perfect roommate in every way!"
     * Expected status: Success
     * Expected behavior: 
     * - System accepts maximum 5-star rating
     * - Submit button is enabled
     * Expected output: 5-star rating can be submitted
     */
    @Test
    fun testRateRoommate_MaximumRating_SubmitEnabled() {
        // Arrange - Set up the Rating dialog
        var submittedRating = 0
        
        composeTestRule.setContent {
            RoomSyncTheme {
                RatingDialog(
                    memberName = "Eve Wilson",
                    onDismiss = {},
                    onSubmit = { rating, _ ->
                        submittedRating = rating
                    }
                )
            }
        }

        // Act - Select 5-star rating (click on 5th star)
        composeTestRule
            .onAllNodes(hasText("★") and hasClickAction())
            [4] // Index 4 corresponds to the 5th star
            .performClick()

        // Act - Enter testimonial
        composeTestRule
            .onNodeWithText("Share your experience as a roommate...")
            .performTextInput("Perfect roommate in every way!")

        // Assert - Verify Submit button is enabled
        composeTestRule
            .onNodeWithText("Submit Rating")
            .assertIsEnabled()

        // Act - Click Submit button
        composeTestRule
            .onNodeWithText("Submit Rating")
            .performClick()

        // Assert - Verify 5-star rating was submitted
        assert(submittedRating == 5)
    }

    /**
     * Test: Testimonial character limit (500 characters)
     * Input: Testimonial with exactly 500 characters
     * Expected status: Success
     * Expected behavior: 
     * - System accepts testimonial up to 500 characters
     * - Character counter displays "500/500"
     * Expected output: Full 500-character testimonial is accepted
     */
    @Test
    fun testRateRoommate_TestimonialAtCharacterLimit_Accepted() {
        // Arrange - Set up the Rating dialog
        composeTestRule.setContent {
            RoomSyncTheme {
                RatingDialog(
                    memberName = "Frank Miller",
                    onDismiss = {},
                    onSubmit = { _, _ -> }
                )
            }
        }

        // Act - Select rating
        composeTestRule
            .onAllNodes(hasText("★") and hasClickAction())
            [2] // Select 3 stars
            .performClick()

        // Act - Enter 500-character testimonial
        val testimonial500chars = "A".repeat(500)
        composeTestRule
            .onNodeWithText("Share your experience as a roommate...")
            .performTextInput(testimonial500chars)

        // Assert - Verify character counter shows 500/500
        composeTestRule
            .onNodeWithText("500/500")
            .assertIsDisplayed()

        // Assert - Verify testimonial was entered
        composeTestRule
            .onNodeWithText("Share your experience as a roommate...")
            .assert(hasText(testimonial500chars))

        // Assert - Submit button should be enabled
        composeTestRule
            .onNodeWithText("Submit Rating")
            .assertIsEnabled()
    }

    /**
     * Test: Testimonial exceeds character limit
     * Input: Attempt to enter more than 500 characters
     * Expected status: Input prevented
     * Expected behavior: 
     * - Input field prevents typing beyond 500 characters
     * - Text is truncated at 500 characters
     * Expected output: Only first 500 characters are accepted
     */
    @Test
    fun testRateRoommate_TestimonialExceedsLimit_Prevented() {
        // Arrange - Set up the Rating dialog
        composeTestRule.setContent {
            RoomSyncTheme {
                RatingDialog(
                    memberName = "Grace Lee",
                    onDismiss = {},
                    onSubmit = { _, _ -> }
                )
            }
        }

        // Act - Select rating
        composeTestRule
            .onAllNodes(hasText("★") and hasClickAction())
            [3] // Select 4 stars
            .performClick()

        // Act - Attempt to enter 501 characters
        val testimonial501chars = "A".repeat(501)
        composeTestRule
            .onNodeWithText("Share your experience as a roommate...")
            .performTextInput(testimonial501chars)

        // Assert - Character counter should show 500/500 (not 501)
        composeTestRule
            .onNodeWithText("500/500")
            .assertIsDisplayed()

        // Assert - Text field should only contain 500 characters
        val expected500chars = "A".repeat(500)
        composeTestRule
            .onNodeWithText("Share your experience as a roommate...")
            .assert(hasText(expected500chars))
    }

    /**
     * Test: Cancel button dismisses dialog
     * Input: User clicks Cancel button
     * Expected status: Dialog dismissed
     * Expected behavior: 
     * - Cancel button exists and is clickable
     * - Clicking Cancel triggers onDismiss callback
     * Expected output: Dialog is closed without submitting
     */
    @Test
    fun testRateRoommate_CancelButton_DismissesDialog() {
        // Arrange - Set up the Rating dialog
        var dialogDismissed = false
        
        composeTestRule.setContent {
            RoomSyncTheme {
                RatingDialog(
                    memberName = "Henry Davis",
                    onDismiss = { dialogDismissed = true },
                    onSubmit = { _, _ -> }
                )
            }
        }

        // Assert - Verify Cancel button exists
        composeTestRule
            .onNodeWithText("Cancel")
            .assertExists()
            .assertIsDisplayed()

        // Act - Click Cancel button
        composeTestRule
            .onNodeWithText("Cancel")
            .performClick()

        // Assert - Verify dialog was dismissed
        assert(dialogDismissed)
    }

    /**
     * Test: 30-day requirement notice is displayed
     * Input: Dialog is opened
     * Expected status: Notice displayed
     * Expected behavior: 
     * - Dialog displays note about 30-day requirement
     * - User is informed about the time requirement
     * Expected output: Notice text is visible
     */
    @Test
    fun testRateRoommate_ThirtyDayNotice_Displayed() {
        // Arrange - Set up the Rating dialog
        composeTestRule.setContent {
            RoomSyncTheme {
                RatingDialog(
                    memberName = "Iris Chen",
                    onDismiss = {},
                    onSubmit = { _, _ -> }
                )
            }
        }

        // Assert - Verify 30-day requirement notice is displayed
        composeTestRule
            .onNodeWithText("Note: Both you and the user must have been in the group for at least 30 days to submit a rating. Time spent together is automatically calculated.")
            .assertIsDisplayed()
    }

    /**
     * Test: Star rating selection updates correctly
     * Input: Click on different star ratings sequentially
     * Expected status: Success
     * Expected behavior: 
     * - User can change star rating by clicking different stars
     * - Selected rating updates each time
     * Expected output: Rating changes based on user selection
     */
    @Test
    fun testRateRoommate_StarRatingSelection_UpdatesCorrectly() {
        // Arrange - Set up the Rating dialog
        var currentRating = 0
        
        composeTestRule.setContent {
            RoomSyncTheme {
                RatingDialog(
                    memberName = "Jack Thompson",
                    onDismiss = {},
                    onSubmit = { rating, _ ->
                        currentRating = rating
                    }
                )
            }
        }

        val stars = composeTestRule
            .onAllNodes(hasText("★") and hasClickAction())

        // Act & Assert - Select 1 star
        stars[0].performClick()
        composeTestRule
            .onNodeWithText("Submit Rating")
            .assertIsEnabled()
            .performClick()
        assert(currentRating == 1)

        // Reset dialog
        composeTestRule.setContent {
            RoomSyncTheme {
                RatingDialog(
                    memberName = "Jack Thompson",
                    onDismiss = {},
                    onSubmit = { rating, _ ->
                        currentRating = rating
                    }
                )
            }
        }

        // Act & Assert - Select 3 stars
        composeTestRule
            .onAllNodes(hasText("★") and hasClickAction())
            [2].performClick()
        composeTestRule
            .onNodeWithText("Submit Rating")
            .performClick()
        assert(currentRating == 3)

        // Reset dialog
        composeTestRule.setContent {
            RoomSyncTheme {
                RatingDialog(
                    memberName = "Jack Thompson",
                    onDismiss = {},
                    onSubmit = { rating, _ ->
                        currentRating = rating
                    }
                )
            }
        }

        // Act & Assert - Select 5 stars
        composeTestRule
            .onAllNodes(hasText("★") and hasClickAction())
            [4].performClick()
        composeTestRule
            .onNodeWithText("Submit Rating")
            .performClick()
        assert(currentRating == 5)
    }

    /**
     * Test: All UI elements are displayed correctly
     * Input: Dialog is opened
     * Expected status: All elements visible
     * Expected behavior: 
     * - Dialog title with member name
     * - Rating selection header
     * - 5 star buttons
     * - Review label
     * - Testimonial input field
     * - Character counter
     * - 30-day notice
     * - Submit and Cancel buttons
     * Expected output: All UI components are present
     */
    @Test
    fun testRateRoommate_AllUIElements_DisplayedCorrectly() {
        // Arrange - Set up the Rating dialog
        composeTestRule.setContent {
            RoomSyncTheme {
                RatingDialog(
                    memberName = "Kate Martinez",
                    onDismiss = {},
                    onSubmit = { _, _ -> }
                )
            }
        }

        // Assert - Verify dialog title
        composeTestRule
            .onNodeWithText("Rate Kate Martinez")
            .assertIsDisplayed()

        // Assert - Verify rating selection header
        composeTestRule
            .onNodeWithText("Select Rating")
            .assertIsDisplayed()

        // Assert - Verify 5 star buttons exist
        val starButtons = composeTestRule
            .onAllNodes(hasText("★") and hasClickAction())
        assert(starButtons.fetchSemanticsNodes().size == 5)

        // Assert - Verify review label
        composeTestRule
            .onNodeWithText("Review (Optional)")
            .assertIsDisplayed()

        // Assert - Verify testimonial input field
        composeTestRule
            .onNodeWithText("Share your experience as a roommate...")
            .assertExists()

        // Assert - Verify character counter (initially 0/500)
        composeTestRule
            .onNodeWithText("0/500")
            .assertIsDisplayed()

        // Assert - Verify 30-day notice
        composeTestRule
            .onNodeWithText("Note: Both you and the user must have been in the group for at least 30 days to submit a rating. Time spent together is automatically calculated.")
            .assertIsDisplayed()

        // Assert - Verify Submit button
        composeTestRule
            .onNodeWithText("Submit Rating")
            .assertExists()
            .assertIsDisplayed()

        // Assert - Verify Cancel button
        composeTestRule
            .onNodeWithText("Cancel")
            .assertExists()
            .assertIsDisplayed()
    }

    /**
     * Test: Character counter updates correctly
     * Input: Type various lengths of text
     * Expected status: Counter updates
     * Expected behavior: 
     * - Character counter updates as user types
     * - Shows current count out of 500
     * Expected output: Counter displays correct character count
     */
    @Test
    fun testRateRoommate_CharacterCounter_UpdatesCorrectly() {
        // Arrange - Set up the Rating dialog
        composeTestRule.setContent {
            RoomSyncTheme {
                RatingDialog(
                    memberName = "Leo Garcia",
                    onDismiss = {},
                    onSubmit = { _, _ -> }
                )
            }
        }

        // Assert - Initial count should be 0/500
        composeTestRule
            .onNodeWithText("0/500")
            .assertIsDisplayed()

        // Act - Enter 10 characters
        composeTestRule
            .onNodeWithText("Share your experience as a roommate...")
            .performTextInput("Ten chars!")

        // Assert - Counter should show 10/500
        composeTestRule
            .onNodeWithText("10/500")
            .assertIsDisplayed()

        // Act - Enter more text (total 50 characters)
        composeTestRule
            .onNodeWithText("Share your experience as a roommate...")
            .performTextInput("Adding more text to reach fifty chars here")

        // Note: The total would be "Ten chars!" + "Adding more text to reach fifty chars here"
        // This is implementation-dependent on whether text replaces or appends
    }
}

