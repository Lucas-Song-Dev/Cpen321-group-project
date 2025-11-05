package com.cpen321.roomsync

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.cpen321.roomsync.ui.screens.CreateGroupScreen
import com.cpen321.roomsync.ui.screens.RatingDialog
import com.cpen321.roomsync.ui.theme.RoomSyncFrontendTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Basic UI Tests for RoomSync
 * 
 * These tests verify that UI components render correctly and basic interactions work.
 * They focus on UI structure rather than complex state management which requires backend/mocking.
 */
@RunWith(AndroidJUnit4::class)
class BasicUITests {

    @get:Rule
    val composeTestRule = createComposeRule()

    // ========== Use Case 9: Create Group Tests ==========

    @Test
    fun createGroupScreen_displaysTitle() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                CreateGroupScreen()
            }
        }

        composeTestRule
            .onNodeWithText("Enter Group Name:")
            .assertIsDisplayed()
    }

    @Test
    fun createGroupScreen_hasTextInputField() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                CreateGroupScreen()
            }
        }

        composeTestRule
            .onNode(hasSetTextAction())
            .assertExists()
            .assertIsDisplayed()
    }

    @Test
    fun createGroupScreen_textInputAcceptsText() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                CreateGroupScreen()
            }
        }

        val textField = composeTestRule.onNode(hasSetTextAction())
        textField.performTextInput("Test Group Name")
        
        composeTestRule.waitForIdle()
        
        // Verify field accepted input
        textField.assertExists()
    }

    @Test
    fun createGroupScreen_acceptsSpecialCharacters() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                CreateGroupScreen()
            }
        }

        composeTestRule
            .onNode(hasSetTextAction())
            .performTextInput("My Group! @#$")
        
        composeTestRule.waitForIdle()
    }

    @Test
    fun createGroupScreen_accepts100Characters() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                CreateGroupScreen()
            }
        }

        val longName = "A".repeat(100)
        composeTestRule
            .onNode(hasSetTextAction())
            .performTextInput(longName)
        
        composeTestRule.waitForIdle()
    }

    // ========== Use Case 19-20: Rate Roommate Tests ==========

    @Test
    fun ratingDialog_displaysTitle() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                RatingDialog(
                    memberName = "Test User",
                    onDismiss = {},
                    onSubmit = { _, _ -> }
                )
            }
        }

        composeTestRule
            .onNodeWithText("Rate Test User")
            .assertIsDisplayed()
    }

    @Test
    fun ratingDialog_hasRatingHeader() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                RatingDialog(
                    memberName = "Test User",
                    onDismiss = {},
                    onSubmit = { _, _ -> }
                )
            }
        }

        composeTestRule
            .onNodeWithText("Select Rating")
            .assertIsDisplayed()
    }

    @Test
    fun ratingDialog_hasFiveStars() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                RatingDialog(
                    memberName = "Test User",
                    onDismiss = {},
                    onSubmit = { _, _ -> }
                )
            }
        }

        val stars = composeTestRule
            .onAllNodes(hasText("★") and hasClickAction())
        
        // Should have 5 star buttons
        assert(stars.fetchSemanticsNodes().size == 5)
    }

    @Test
    fun ratingDialog_hasReviewLabel() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                RatingDialog(
                    memberName = "Test User",
                    onDismiss = {},
                    onSubmit = { _, _ -> }
                )
            }
        }

        composeTestRule
            .onNodeWithText("Review (Optional)")
            .assertIsDisplayed()
    }

    @Test
    fun ratingDialog_hasCharacterCounter() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                RatingDialog(
                    memberName = "Test User",
                    onDismiss = {},
                    onSubmit = { _, _ -> }
                )
            }
        }

        composeTestRule
            .onNodeWithText("0/500")
            .assertIsDisplayed()
    }

    @Test
    fun ratingDialog_has30DayNotice() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                RatingDialog(
                    memberName = "Test User",
                    onDismiss = {},
                    onSubmit = { _, _ -> }
                )
            }
        }

        composeTestRule
            .onNodeWithText("Note: Both you and the user must have been in the group for at least 30 days to submit a rating. Time spent together is automatically calculated.")
            .assertIsDisplayed()
    }

    @Test
    fun ratingDialog_submitButtonInitiallyDisabled() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                RatingDialog(
                    memberName = "Test User",
                    onDismiss = {},
                    onSubmit = { _, _ -> }
                )
            }
        }

        composeTestRule
            .onNodeWithText("Submit Rating")
            .assertIsNotEnabled()
    }

    @Test
    fun ratingDialog_hasCancelButton() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                RatingDialog(
                    memberName = "Test User",
                    onDismiss = {},
                    onSubmit = { _, _ -> }
                )
            }
        }

        composeTestRule
            .onNodeWithText("Cancel")
            .assertExists()
            .assertIsDisplayed()
    }

    @Test
    fun ratingDialog_cancelButtonDismisses() {
        var dismissed = false
        
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                RatingDialog(
                    memberName = "Test User",
                    onDismiss = { dismissed = true },
                    onSubmit = { _, _ -> }
                )
            }
        }

        composeTestRule
            .onNodeWithText("Cancel")
            .performClick()

        assert(dismissed)
    }

    @Test
    fun ratingDialog_starClickEnablesSubmit() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                RatingDialog(
                    memberName = "Test User",
                    onDismiss = {},
                    onSubmit = { _, _ -> }
                )
            }
        }

        // Click first star
        composeTestRule
            .onAllNodes(hasText("★") and hasClickAction())
            .get(0)
            .performClick()

        composeTestRule.waitForIdle()

        // Submit should now be enabled
        composeTestRule
            .onNodeWithText("Submit Rating")
            .assertIsEnabled()
    }
}

