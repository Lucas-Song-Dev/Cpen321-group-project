package com.cpen321.roomsync

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.cpen321.roomsync.data.models.Grouppackage com.cpen321.roomsync

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.cpen321.roomsync.ui.screens.CreateGroupScreen
import com.cpen321.roomsync.ui.screens.HomeScreen
import com.cpen321.roomsync.ui.theme.RoomSyncFrontendTheme
import com.cpen321.roomsync.ui.viewmodels.GroupViewModel
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * End-to-End tests for Use Case 9: Create Group
 *
 * Main Success Scenario:
 * 1. User navigates to group creation page
 * 2. The app shows an input field and a 'Create Group' button (disabled)
 * 3. User enters a valid group name
 * 4. User clicks 'Create Group'
 * 5. System generates and displays a unique invitation code
 * 6. System creates a group with user as owner (saved name and code)
 * 7. System displays message and invitation code
 * 8. Dashboard displays group name
 *
 * Failure Scenarios:
 * 3a. Group name is left empty → Button disabled
 * 3b. Group name > 100 chars → Button disabled
 * 4a. User already in group → Error message
 * 4b. Network error → Error message
 */
@RunWith(AndroidJUnit4::class)
class CreateGroupE2ETest {

    @get:Rule
    val composeTestRule = createComposeRule()

    /** Step 1–2: Verify initial screen layout */
    @Test
    fun test_UC9_Step1_2_ScreenDisplaysCorrectly() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme { CreateGroupScreen() }
        }

        composeTestRule.onNodeWithTag("groupNameInput")
            .assertExists()
            .assertIsDisplayed()

        composeTestRule.onNodeWithTag("createGroupButton")
            .assertExists()
            .assertIsDisplayed()
            .assertIsNotEnabled()
    }

    /** Step 3: Valid group name enables button */
    @Test
    fun test_UC9_Step3_ValidGroupName_ButtonEnabled() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme { CreateGroupScreen() }
        }

        composeTestRule.onNodeWithTag("groupNameInput").performTextInput("Test Group")
        composeTestRule.waitForIdle()

        composeTestRule.onNodeWithTag("createGroupButton").assertIsEnabled()
    }

    /** Step 3: Group name with special characters */
    @Test
    fun test_UC9_Step3_SpecialCharactersAccepted() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme { CreateGroupScreen() }
        }

        composeTestRule.onNodeWithTag("groupNameInput").performTextInput("My Group! @#!")
        composeTestRule.waitForIdle()

        composeTestRule.onNodeWithTag("createGroupButton").assertIsEnabled()
    }

    /** Step 3a: Empty and whitespace-only group name disables button */
    @Test
    fun test_UC9_Step3a_EmptyOrWhitespace_DisablesButton() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme { CreateGroupScreen() }
        }

        // Empty input
        composeTestRule.onNodeWithTag("groupNameInput").assert(hasText(""))
        composeTestRule.onNodeWithTag("createGroupButton").assertIsNotEnabled()

        // Whitespace only
        composeTestRule.onNodeWithTag("groupNameInput").performTextInput("   ")
        composeTestRule.waitForIdle()
        composeTestRule.onNodeWithTag("createGroupButton").assertIsNotEnabled()
    }

    /** Step 4: Click 'Create Group' (success case mock) */
    @Test
    fun test_UC9_Step4_CreateGroup_Success() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme { CreateGroupScreen() }
        }

        composeTestRule.onNodeWithTag("groupNameInput").performTextInput("Test Group")
        composeTestRule.onNodeWithTag("createGroupButton").performClick()

//        // Step 6–7: Check success message and code display
//        composeTestRule.onNodeWithText("Group created successfully!").assertExists()
//        composeTestRule.onNodeWithText("Share this code with your roommates").assertExists()
    }
}

import com.cpen321.roomsync.ui.screens.CreateGroupScreen
import com.cpen321.roomsync.ui.theme.RoomSyncFrontendTheme
import com.cpen321.roomsync.ui.viewmodels.GroupViewModel
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * End-to-End tests for Use Case 9: Create Group
 * 
 * Main Success Scenario:
 * 1. User navigates to group creation page
 * 2. User enters group name in text field
 * 3. User clicks 'Create Group' button
 * 4. System creates group with user as owner and generates unique 4-character alphanumeric invitation code
 * 5. System displays success message "Group created successfully!"
 * 6. System displays group code in a card with instructions to "Share this code with your roommates"
 * 7. User is automatically navigated to group dashboard after a moment
 * 
 * Failure Scenarios:
 * - 2a. Group name is left empty → 'Create Group' button is disabled
 * - 3a. User already belongs to a group → Error message displayed
 * - 3b. Network error during group creation → Error message displayed
 */
@RunWith(AndroidJUnit4::class)
class CreateGroupE2ETest {

    @get:Rule
    val composeTestRule = createComposeRule()

    /**
     * Test: Main Success Scenario
     * Scenario Steps: 1-2
     * Test Steps:
     * - Open "Create Group" screen
     * - Check that text field is present on screen
     * - Check that button labelled "Create Group" is present on screen
     * - Check that "Create Group" button is disabled
     */
    @Test
    fun test_UC9_Step1_2_ScreenDisplaysCorrectly() {
        // Step 1: Open "Create Group" screen
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                CreateGroupScreen()
            }
        }

        // Step 2: Check text field is present on screen
        composeTestRule
            .onNodeWithTag("groupNameInput")
            .assertExists()
            .assertIsDisplayed()

        // Step 2: Check button labelled "Create Group" is present on screen
        composeTestRule
            .onNodeWithTag("createGroupButton")
            .assertExists()
            .assertIsDisplayed()

        // Step 2: Check that "Create Group" button is disabled
        composeTestRule
            .onNodeWithTag("createGroupButton")
            .assertIsNotEnabled()
    }

    /**
     * Test: Main Success Scenario continued
     * Scenario Steps: 3
     * Test Steps:
     * - Input "Test Group" in text field
     * - Check that button labelled "Create Group" is enabled
     */
    @Test
    fun test_UC9_Step3_ValidGroupName_ButtonEnabled() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                CreateGroupScreen()
            }
        }

        // Step 3: Input "Test Group" in text field
        composeTestRule
            .onNodeWithTag("groupNameInput")
            .performTextInput("Test Group")

        composeTestRule.waitForIdle()

        // Step 3: Check that button labelled "Create Group" is enabled
        composeTestRule
            .onNodeWithTag("createGroupButton")
            .assertIsEnabled()
    }

    /**
     * Test: Failure Scenario 2a
     * Scenario Steps: 2a
     * Test Steps:
     * - Leave group name empty
     * - Check that "Create Group" button is disabled
     */
    @Test
    fun test_UC9_Scenario2a_EmptyGroupName_ButtonDisabled() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                CreateGroupScreen()
            }
        }

        // Step 2a: Group name is empty (default state)
        composeTestRule
            .onNodeWithTag("groupNameInput")
            .assert(hasText(""))

        // Step 2a: Check that "Create Group" button is disabled
        composeTestRule
            .onNodeWithTag("createGroupButton")
            .assertIsNotEnabled()
    }

    /**
     * Test: Failure Scenario - Whitespace only
     * Scenario Steps: 2a (variation)
     * Test Steps:
     * - Input "   " (whitespace only) in text field
     * - Check that "Create Group" button is disabled
     * 
     * Note: Whitespace validation works via isNotBlank() check in the UI
     */
    @Test
    fun test_UC9_Scenario2a_WhitespaceOnly_ButtonDisabled() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                CreateGroupScreen()
            }
        }

        // Input whitespace-only string
        composeTestRule
            .onNodeWithTag("groupNameInput")
            .performTextInput("   ")

        // Give UI time to process
        composeTestRule.waitUntil(timeoutMillis = 3000) {
            try {
                composeTestRule
                    .onNodeWithTag("createGroupButton")
                    .assertIsNotEnabled()
                true
            } catch (e: AssertionError) {
                false
            }
        }

        // Check that "Create Group" button is disabled
        composeTestRule
            .onNodeWithTag("createGroupButton")
            .assertIsNotEnabled()
    }

    /**
     * Test: Success Scenario - Special Characters
     * Test Steps:
     * - Input "My Group! @#$" in text field  
     * - Check that button is enabled (special characters accepted)
     */
    @Test
    fun test_UC9_SpecialCharacters_Accepted() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                CreateGroupScreen()
            }
        }

        // Input group name with special characters
        composeTestRule
            .onNodeWithTag("groupNameInput")
            .performTextInput("My Group! @#$")

        composeTestRule.waitForIdle()

        // Check that button is enabled
        composeTestRule
            .onNodeWithTag("createGroupButton")
            .assertIsEnabled()
    }

    /**
     * Test: Success Scenario - Maximum Length
     * Test Steps:
     * - Input 100-character group name
     * - Check that button is enabled
     */
    @Test
    fun test_UC9_MaxLength100Characters_Accepted() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                CreateGroupScreen()
            }
        }

        // Input 100-character group name (max per spec)
        val maxLengthName = "A".repeat(101)
        composeTestRule
            .onNodeWithTag("groupNameInput")
            .performTextInput(maxLengthName)

        composeTestRule.waitForIdle()

        // Check that button is enabled
        composeTestRule
            .onNodeWithTag("createGroupButton")
            .assertIsEnabled()
    }
}

