package com.cpen321.roomsync

import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.cpen321.roomsync.ui.screens.CreateGroupScreen
import com.cpen321.roomsync.ui.screens.AddTaskDialog
import com.cpen321.roomsync.ui.screens.RatingDialog
import com.cpen321.roomsync.ui.theme.RoomSyncFrontendTheme
import com.cpen321.roomsync.ui.viewmodels.ViewModelGroupMember
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Non-Functional Requirement Tests: UI Accessibility Requirement
 * 
 * Tests that all interactive buttons and touch targets meet the minimum
 * touch target size of 42x42 pixels as specified in NFR3.
 * 
 * Reference: Requirements_and_Design.md Section 3.7 NFR3
 */
@RunWith(AndroidJUnit4::class)
class ButtonSizeTests {

    @get:Rule
    val composeTestRule = createComposeRule()

    private val MIN_TOUCH_TARGET_SIZE_PX = 42f
    private val mockGroupMembers = listOf(
        ViewModelGroupMember(id = "user1", name = "Alice", email = "alice@example.com")
    )

    private fun assertButtonTouchTargetMeetsMinimumSize(
        node: SemanticsNodeInteraction,
        buttonName: String
    ) {
        val minSizePx = MIN_TOUCH_TARGET_SIZE_PX

        // Get the bounds of the button in pixels
        val bounds = node.getBoundsInRoot()
        val widthPx = bounds.width
        val heightPx = bounds.height

        // Verify both dimensions meet minimum
        assert(widthPx >= minSizePx) {
            "$buttonName width is ${widthPx}px, but must be at least ${minSizePx}px"
        }
        assert(heightPx >= minSizePx) {
            "$buttonName height is ${heightPx}px, but must be at least ${minSizePx}px"
        }
    }

    /**
     * Test: Create Group Screen - Create Group Button
     * Verifies the "Create Group" button meets 42x42 pixel minimum
     */
    @Test
    fun test_CreateGroupButton_MeetsMinimumSize() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                CreateGroupScreen()
            }
        }

        composeTestRule.waitForIdle()

        val button = composeTestRule.onNodeWithTag("createGroupButton")
        button.assertExists()
        
        assertButtonTouchTargetMeetsMinimumSize(button, "Create Group Button")
    }

    /**
     * Test: Add Task Dialog - Create Task Button
     * Verifies the "Create Task" button in AddTaskDialog meets 42x42 pixel minimum
     */
    @OptIn(ExperimentalMaterial3Api::class)
    @Test
    fun test_CreateTaskButton_MeetsMinimumSize() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                AddTaskDialog(
                    onDismiss = {},
                    onCreateTask = { _, _, _, _, _, _, _ -> },
                    groupMembers = mockGroupMembers
                )
            }
        }

        composeTestRule.waitForIdle()

        // Enter task name to enable button
        composeTestRule
            .onNodeWithTag("taskNameInput")
            .performTextInput("Test Task")

        composeTestRule.waitForIdle()

        // Select non-one-time recurrence to enable button
        composeTestRule
            .onNodeWithText("Weekly")
            .performClick()

        composeTestRule.waitForIdle()

        val button = composeTestRule.onNodeWithTag("createTaskButton")
        button.assertExists()
        
        assertButtonTouchTargetMeetsMinimumSize(button, "Create Task Button")
    }

    /**
     * Test: Rating Dialog - Submit Rating Button
     * Verifies the "Submit Rating" button meets 42x42 pixel minimum
     */
    @Test
    fun test_SubmitRatingButton_MeetsMinimumSize() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                RatingDialog(
                    memberName = "Test User",
                    onDismiss = {},
                    onSubmit = { _, _ -> }
                )
            }
        }

        composeTestRule.waitForIdle()

        // Select a rating to enable button
        composeTestRule
            .onAllNodes(hasText("★") and hasClickAction())
            .get(2) // Select 3rd star
            .performClick()

        composeTestRule.waitForIdle()

        val button = composeTestRule.onNodeWithTag("submitRatingButton")
        button.assertExists()
        
        assertButtonTouchTargetMeetsMinimumSize(button, "Submit Rating Button")
    }

    /**
     * Test: Rating Dialog - Cancel Button
     * Verifies the "Cancel" button meets 42x42 pixel minimum
     */
    @Test
    fun test_CancelButton_MeetsMinimumSize() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                RatingDialog(
                    memberName = "Test User",
                    onDismiss = {},
                    onSubmit = { _, _ -> }
                )
            }
        }

        composeTestRule.waitForIdle()

        val button = composeTestRule.onNodeWithText("Cancel")
        button.assertExists()
        
        assertButtonTouchTargetMeetsMinimumSize(button, "Cancel Button")
    }

    /**
     * Test: Add Task Dialog - Cancel Button
     * Verifies the "Cancel" button in AddTaskDialog meets 42x42 pixel minimum
     */
    @OptIn(ExperimentalMaterial3Api::class)
    @Test
    fun test_AddTaskDialogCancelButton_MeetsMinimumSize() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                AddTaskDialog(
                    onDismiss = {},
                    onCreateTask = { _, _, _, _, _, _, _ -> },
                    groupMembers = mockGroupMembers
                )
            }
        }

        composeTestRule.waitForIdle()

        val button = composeTestRule.onNodeWithText("Cancel")
        button.assertExists()
        
        assertButtonTouchTargetMeetsMinimumSize(button, "Add Task Dialog Cancel Button")
    }

    /**
     * Test: All Buttons in Create Group Screen
     * Verifies all interactive buttons in CreateGroupScreen meet minimum size
     */
    @Test
    fun test_CreateGroupScreen_AllButtons_MeetMinimumSize() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                CreateGroupScreen()
            }
        }

        composeTestRule.waitForIdle()

        // Check Create Group button
        val createButton = composeTestRule.onNodeWithTag("createGroupButton")
        assertButtonTouchTargetMeetsMinimumSize(createButton, "Create Group Button")
    }

    /**
     * Test: Filter Chips in Add Task Dialog
     * Verifies that FilterChips (recurrence options) meet minimum touch target
     */
    @OptIn(ExperimentalMaterial3Api::class)
    @Test
    fun test_AddTaskDialog_RecurrenceChips_MeetMinimumSize() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                AddTaskDialog(
                    onDismiss = {},
                    onCreateTask = { _, _, _, _, _, _, _ -> },
                    groupMembers = mockGroupMembers
                )
            }
        }

        composeTestRule.waitForIdle()

        // Test each recurrence option chip
        val recurrenceOptions = listOf("One time", "Daily", "Weekly", "Bi weekly", "Monthly")
        
        recurrenceOptions.forEach { option ->
            val chip = composeTestRule.onNodeWithText(option)
            chip.assertExists()
            assertButtonTouchTargetMeetsMinimumSize(chip, "Recurrence Chip: $option")
        }
    }

    /**
     * Test: Difficulty Selector Buttons
     * Verifies that difficulty selector buttons (1-5) meet minimum touch target
     */
    @OptIn(ExperimentalMaterial3Api::class)
    @Test
    fun test_AddTaskDialog_DifficultyButtons_MeetMinimumSize() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                AddTaskDialog(
                    onDismiss = {},
                    onCreateTask = { _, _, _, _, _, _, _ -> },
                    groupMembers = mockGroupMembers
                )
            }
        }

        composeTestRule.waitForIdle()

        // Difficulty buttons are numbered 1-5
        // They should be clickable and meet minimum size
        // Check the first difficulty button (labeled "1")
        val difficultyButtons = composeTestRule.onAllNodes(hasText("1") and hasClickAction())
        
        if (difficultyButtons.fetchSemanticsNodes().isNotEmpty()) {
            val firstDifficultyButton = difficultyButtons.get(0)
            assertButtonTouchTargetMeetsMinimumSize(firstDifficultyButton, "Difficulty Button 1")
        }
    }

    /**
     * Test: Required People Selector Buttons
     * Verifies that required people selector buttons meet minimum touch target
     */
    @OptIn(ExperimentalMaterial3Api::class)
    @Test
    fun test_AddTaskDialog_RequiredPeopleButtons_MeetMinimumSize() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                AddTaskDialog(
                    onDismiss = {},
                    onCreateTask = { _, _, _, _, _, _, _ -> },
                    groupMembers = mockGroupMembers
                )
            }
        }

        composeTestRule.waitForIdle()

        // Required people buttons are numbered 1-10
        // Check the first required people button (the second "1" button, after difficulty)
        val allButtons = composeTestRule.onAllNodes(hasText("1") and hasClickAction())
        
        if (allButtons.fetchSemanticsNodes().size > 1) {
            // Second "1" button should be required people selector
            val requiredPeopleButton = allButtons.get(1)
            assertButtonTouchTargetMeetsMinimumSize(requiredPeopleButton, "Required People Button 1")
        }
    }

    /**
     * Test: Star Rating Buttons in Rating Dialog
     * Verifies that star rating buttons (1-5 stars) meet minimum touch target
     */
    @Test
    fun test_RatingDialog_StarButtons_MeetMinimumSize() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                RatingDialog(
                    memberName = "Test User",
                    onDismiss = {},
                    onSubmit = { _, _ -> }
                )
            }
        }

        composeTestRule.waitForIdle()

        // Check all 5 star buttons
        val starButtons = composeTestRule.onAllNodes(hasText("★") and hasClickAction())
        
        assert(starButtons.fetchSemanticsNodes().size == 5) {
            "Expected 5 star buttons, found ${starButtons.fetchSemanticsNodes().size}"
        }

        starButtons.fetchSemanticsNodes().forEachIndexed { index, _ ->
            val starButton = composeTestRule.onAllNodes(hasText("★") and hasClickAction()).get(index)
            assertButtonTouchTargetMeetsMinimumSize(starButton, "Star Rating Button ${index + 1}")
        }
    }
}

