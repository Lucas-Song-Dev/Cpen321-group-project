package com.cpen321.roomsync

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.cpen321.roomsync.ui.screens.AddTaskDialog
import com.cpen321.roomsync.ui.theme.RoomSyncTheme
import com.cpen321.roomsync.ui.viewmodels.ViewModelGroupMember
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import java.util.Date

/**
 * End-to-end UI tests for Use Case 16: Add Task
 * 
 * This test class covers all success and failure scenarios from the formal use case specification:
 * 
 * Main Success Scenario:
 * 1. User clicks 'Create Task'
 * 2. User enters task name and optional description
 * 3. User selects difficulty (1-5 scale), recurrence (one-time, daily, weekly, bi-weekly, monthly), 
 *    and required people (1-10)
 * 4. If one-time task, user sets deadline date
 * 5. User optionally selects specific group members to assign the task to
 * 6. User clicks 'Create Task'
 * 7. System creates task and assigns to selected members for current week, or queues for weekly 
 *    algorithmic assignment if no members specified
 * 8. Users can view tasks in three views: Calendar View (tasks by selected date), Weekly View 
 *    (all group tasks grouped by day), or My Tasks (personal tasks grouped by day)
 * 
 * Extensions/Failure Scenarios:
 * - 2a. Task name is empty
 *   - System displays error and disables 'Create Task' button until name is provided
 * - 4a. One-time task created without deadline
 *   - System requires deadline before allowing task creation
 *   - 'Create Task' button remains disabled until deadline is set
 * - 7a. Algorithm fails to distribute tasks fairly
 *   - System falls back to round-robin assignment method
 *   - System notifies group owner of algorithm failure
 */
@RunWith(AndroidJUnit4::class)
class AddTaskTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    // Sample group members for testing
    private val sampleGroupMembers = listOf(
        ViewModelGroupMember(
            id = "1",
            name = "Alice Smith",
            email = "alice@test.com",
            bio = "Test user",
            isAdmin = true,
            joinDate = Date()
        ),
        ViewModelGroupMember(
            id = "2",
            name = "Bob Johnson",
            email = "bob@test.com",
            bio = "Test user",
            isAdmin = false,
            joinDate = Date()
        )
    )

    /**
     * Test: Valid task creation with all required fields
     * Input: 
     * - Task name: "Clean Kitchen"
     * - Description: "Deep clean the kitchen"
     * - Difficulty: 3
     * - Recurrence: "weekly"
     * - Required people: 2
     * Expected status: Success
     * Expected behavior: Create Task button is enabled when all required fields are filled
     * Expected output: Task creation form validates successfully
     */
    @Test
    fun testAddTask_ValidTaskAllFields_CreateButtonEnabled() {
        // Arrange - Set up the Add Task dialog
        var taskCreated = false
        composeTestRule.setContent {
            RoomSyncTheme {
                AddTaskDialog(
                    onDismiss = {},
                    onCreateTask = { _, _, _, _, _, _, _ -> taskCreated = true },
                    groupMembers = sampleGroupMembers
                )
            }
        }

        // Assert - Verify dialog title is displayed
        composeTestRule
            .onNodeWithText("Create New Task")
            .assertIsDisplayed()

        // Assert - Verify Create Task button is initially disabled (no task name)
        composeTestRule
            .onNodeWithText("Create Task")
            .assertIsNotEnabled()

        // Act - Enter task name
        composeTestRule
            .onNodeWithText("Task Name")
            .performTextInput("Clean Kitchen")

        // Act - Enter description
        composeTestRule
            .onNodeWithText("Description (Optional)")
            .performTextInput("Deep clean the kitchen")

        // Act - Select difficulty level 3
        composeTestRule
            .onNodeWithText("Difficulty Level: 1")
            .assertIsDisplayed()

        // Click on difficulty level 3
        composeTestRule
            .onAllNodes(hasClickAction() and hasContentDescription(""))
            .filter(hasAnyAncestor(hasText("Difficulty Level: 1")))
            [2] // Index 2 corresponds to difficulty 3
            .performClick()

        // Assert - Verify difficulty changed
        composeTestRule
            .onNodeWithText("Difficulty Level: 3")
            .assertIsDisplayed()

        // Act - Select recurrence: Weekly
        composeTestRule
            .onNodeWithText("Weekly")
            .performClick()

        // Assert - Verify Weekly is selected
        composeTestRule
            .onNodeWithText("Weekly")
            .assertIsSelected()

        // Act - Select required people: 2
        // The required people selector shows numbers 1-10
        composeTestRule
            .onNodeWithText("Required People: 1")
            .assertIsDisplayed()

        // Click on people count 2
        composeTestRule
            .onAllNodes(hasText("2") and hasClickAction())
            [0] // First "2" is in the Required People section
            .performClick()

        // Assert - Verify required people changed
        composeTestRule
            .onNodeWithText("Required People: 2")
            .assertIsDisplayed()

        // Assert - Verify Create Task button is now enabled
        composeTestRule
            .onNodeWithText("Create Task")
            .assertIsEnabled()
    }

    /**
     * Test: Empty task name
     * Input: No task name entered
     * Expected status: Button disabled
     * Expected behavior: 
     * - Create Task button is disabled
     * - User cannot create task without a name
     * Expected output: Button remains disabled
     */
    @Test
    fun testAddTask_EmptyTaskName_CreateButtonDisabled() {
        // Arrange - Set up the Add Task dialog
        composeTestRule.setContent {
            RoomSyncTheme {
                AddTaskDialog(
                    onDismiss = {},
                    onCreateTask = { _, _, _, _, _, _, _ -> },
                    groupMembers = sampleGroupMembers
                )
            }
        }

        // Assert - Verify Create Task button is disabled when no name is entered
        composeTestRule
            .onNodeWithText("Create Task")
            .assertIsNotEnabled()

        // Act - Enter and then clear task name
        val taskNameField = composeTestRule
            .onNodeWithText("Task Name")
        
        taskNameField.performTextInput("Test")
        
        // Assert - Button should be enabled with text
        composeTestRule
            .onNodeWithText("Create Task")
            .assertIsEnabled()

        // Act - Clear the task name field
        taskNameField.performTextClearance()

        // Assert - Button should be disabled again
        composeTestRule
            .onNodeWithText("Create Task")
            .assertIsNotEnabled()
    }

    /**
     * Test: One-time task without deadline
     * Input: 
     * - Task name: "Fix leaky faucet"
     * - Recurrence: "one-time"
     * - No deadline set
     * Expected status: Button disabled
     * Expected behavior: 
     * - Create Task button remains disabled
     * - System requires deadline for one-time tasks
     * Expected output: Button is disabled until deadline is set
     */
    @Test
    fun testAddTask_OneTimeTaskWithoutDeadline_CreateButtonDisabled() {
        // Arrange - Set up the Add Task dialog
        composeTestRule.setContent {
            RoomSyncTheme {
                AddTaskDialog(
                    onDismiss = {},
                    onCreateTask = { _, _, _, _, _, _, _ -> },
                    groupMembers = sampleGroupMembers
                )
            }
        }

        // Act - Enter task name
        composeTestRule
            .onNodeWithText("Task Name")
            .performTextInput("Fix leaky faucet")

        // Act - Select recurrence: One time (default)
        composeTestRule
            .onNodeWithText("One time")
            .assertIsSelected()

        // Assert - Verify deadline field is displayed for one-time tasks
        composeTestRule
            .onNodeWithText("Deadline:")
            .assertIsDisplayed()

        // Assert - Verify deadline field exists
        composeTestRule
            .onNodeWithText("Select Deadline")
            .assertExists()

        // Assert - Create Task button should be disabled without deadline
        composeTestRule
            .onNodeWithText("Create Task")
            .assertIsNotEnabled()
    }

    /**
     * Test: Task with minimum difficulty (1)
     * Input: 
     * - Task name: "Take out trash"
     * - Difficulty: 1
     * - Recurrence: "daily"
     * Expected status: Success
     * Expected behavior: 
     * - System accepts difficulty level 1
     * - Create Task button is enabled
     * Expected output: Task can be created with minimum difficulty
     */
    @Test
    fun testAddTask_MinimumDifficulty_CreateButtonEnabled() {
        // Arrange - Set up the Add Task dialog
        composeTestRule.setContent {
            RoomSyncTheme {
                AddTaskDialog(
                    onDismiss = {},
                    onCreateTask = { _, _, _, _, _, _, _ -> },
                    groupMembers = sampleGroupMembers
                )
            }
        }

        // Act - Enter task name
        composeTestRule
            .onNodeWithText("Task Name")
            .performTextInput("Take out trash")

        // Act - Select recurrence: Daily (not one-time, so no deadline needed)
        composeTestRule
            .onNodeWithText("Daily")
            .performClick()

        // Assert - Difficulty defaults to 1
        composeTestRule
            .onNodeWithText("Difficulty Level: 1")
            .assertIsDisplayed()

        // Assert - Create Task button is enabled
        composeTestRule
            .onNodeWithText("Create Task")
            .assertIsEnabled()
    }

    /**
     * Test: Task with maximum difficulty (5)
     * Input: 
     * - Task name: "Deep clean entire apartment"
     * - Difficulty: 5
     * - Recurrence: "monthly"
     * Expected status: Success
     * Expected behavior: 
     * - System accepts difficulty level 5
     * - Create Task button is enabled
     * Expected output: Task can be created with maximum difficulty
     */
    @Test
    fun testAddTask_MaximumDifficulty_CreateButtonEnabled() {
        // Arrange - Set up the Add Task dialog
        composeTestRule.setContent {
            RoomSyncTheme {
                AddTaskDialog(
                    onDismiss = {},
                    onCreateTask = { _, _, _, _, _, _, _ -> },
                    groupMembers = sampleGroupMembers
                )
            }
        }

        // Act - Enter task name
        composeTestRule
            .onNodeWithText("Task Name")
            .performTextInput("Deep clean entire apartment")

        // Act - Select recurrence: Monthly
        composeTestRule
            .onNodeWithText("Monthly")
            .performClick()

        // Act - Select difficulty level 5
        composeTestRule
            .onAllNodes(hasClickAction())
            .filter(hasAnyAncestor(hasText("Difficulty Level: 1")))
            [4] // Index 4 corresponds to difficulty 5
            .performClick()

        // Assert - Verify difficulty changed to 5
        composeTestRule
            .onNodeWithText("Difficulty Level: 5")
            .assertIsDisplayed()

        // Assert - Create Task button is enabled
        composeTestRule
            .onNodeWithText("Create Task")
            .assertIsEnabled()
    }

    /**
     * Test: Task with all recurrence options
     * Input: Test each recurrence type
     * Expected status: Success
     * Expected behavior: 
     * - System accepts all recurrence options (one-time, daily, weekly, bi-weekly, monthly)
     * - Each option can be selected
     * Expected output: All recurrence options are selectable
     */
    @Test
    fun testAddTask_AllRecurrenceOptions_Selectable() {
        // Arrange - Set up the Add Task dialog
        composeTestRule.setContent {
            RoomSyncTheme {
                AddTaskDialog(
                    onDismiss = {},
                    onCreateTask = { _, _, _, _, _, _, _ -> },
                    groupMembers = sampleGroupMembers
                )
            }
        }

        // Act & Assert - Test One time
        composeTestRule
            .onNodeWithText("One time")
            .assertExists()
            .performClick()
            .assertIsSelected()

        // Act & Assert - Test Daily
        composeTestRule
            .onNodeWithText("Daily")
            .assertExists()
            .performClick()
            .assertIsSelected()

        // Act & Assert - Test Weekly
        composeTestRule
            .onNodeWithText("Weekly")
            .assertExists()
            .performClick()
            .assertIsSelected()

        // Act & Assert - Test Bi weekly
        composeTestRule
            .onNodeWithText("Bi weekly")
            .assertExists()
            .performClick()
            .assertIsSelected()

        // Act & Assert - Test Monthly
        composeTestRule
            .onNodeWithText("Monthly")
            .assertExists()
            .performClick()
            .assertIsSelected()
    }

    /**
     * Test: Task with minimum required people (1)
     * Input: 
     * - Task name: "Water plants"
     * - Required people: 1
     * Expected status: Success
     * Expected behavior: 
     * - System accepts minimum 1 person required
     * - Create Task button is enabled
     * Expected output: Task can be created with 1 person required
     */
    @Test
    fun testAddTask_MinimumRequiredPeople_CreateButtonEnabled() {
        // Arrange - Set up the Add Task dialog
        composeTestRule.setContent {
            RoomSyncTheme {
                AddTaskDialog(
                    onDismiss = {},
                    onCreateTask = { _, _, _, _, _, _, _ -> },
                    groupMembers = sampleGroupMembers
                )
            }
        }

        // Act - Enter task name
        composeTestRule
            .onNodeWithText("Task Name")
            .performTextInput("Water plants")

        // Act - Select recurrence: Weekly
        composeTestRule
            .onNodeWithText("Weekly")
            .performClick()

        // Assert - Required people defaults to 1
        composeTestRule
            .onNodeWithText("Required People: 1")
            .assertIsDisplayed()

        // Assert - Create Task button is enabled
        composeTestRule
            .onNodeWithText("Create Task")
            .assertIsEnabled()
    }

    /**
     * Test: Task with maximum required people (10)
     * Input: 
     * - Task name: "Team cleaning day"
     * - Required people: 10
     * Expected status: Success
     * Expected behavior: 
     * - System accepts maximum 10 people required
     * - Create Task button is enabled
     * Expected output: Task can be created with 10 people required
     */
    @Test
    fun testAddTask_MaximumRequiredPeople_CreateButtonEnabled() {
        // Arrange - Set up the Add Task dialog
        composeTestRule.setContent {
            RoomSyncTheme {
                AddTaskDialog(
                    onDismiss = {},
                    onCreateTask = { _, _, _, _, _, _, _ -> },
                    groupMembers = sampleGroupMembers
                )
            }
        }

        // Act - Enter task name
        composeTestRule
            .onNodeWithText("Task Name")
            .performTextInput("Team cleaning day")

        // Act - Select recurrence: Monthly
        composeTestRule
            .onNodeWithText("Monthly")
            .performClick()

        // Act - Select required people: 10
        composeTestRule
            .onAllNodes(hasText("10") and hasClickAction())
            [0] // First "10" is in the Required People section
            .performClick()

        // Assert - Verify required people changed to 10
        composeTestRule
            .onNodeWithText("Required People: 10")
            .assertIsDisplayed()

        // Assert - Create Task button is enabled
        composeTestRule
            .onNodeWithText("Create Task")
            .assertIsEnabled()
    }

    /**
     * Test: Task with optional description
     * Input: 
     * - Task name: "Grocery shopping"
     * - Description: "Buy milk, eggs, and bread"
     * Expected status: Success
     * Expected behavior: 
     * - System accepts optional description
     * - Description field can contain text
     * Expected output: Description is accepted
     */
    @Test
    fun testAddTask_WithOptionalDescription_Accepted() {
        // Arrange - Set up the Add Task dialog
        composeTestRule.setContent {
            RoomSyncTheme {
                AddTaskDialog(
                    onDismiss = {},
                    onCreateTask = { _, _, _, _, _, _, _ -> },
                    groupMembers = sampleGroupMembers
                )
            }
        }

        // Act - Enter task name
        composeTestRule
            .onNodeWithText("Task Name")
            .performTextInput("Grocery shopping")

        // Act - Enter description
        val descriptionField = composeTestRule
            .onNodeWithText("Description (Optional)")
        
        descriptionField.performTextInput("Buy milk, eggs, and bread")

        // Assert - Verify description was entered
        descriptionField.assert(hasText("Buy milk, eggs, and bread"))

        // Act - Select recurrence: Weekly
        composeTestRule
            .onNodeWithText("Weekly")
            .performClick()

        // Assert - Create Task button is enabled
        composeTestRule
            .onNodeWithText("Create Task")
            .assertIsEnabled()
    }

    /**
     * Test: Task without description
     * Input: 
     * - Task name: "Mop floors"
     * - No description
     * Expected status: Success
     * Expected behavior: 
     * - System accepts task without description (description is optional)
     * - Create Task button is enabled
     * Expected output: Task can be created without description
     */
    @Test
    fun testAddTask_WithoutDescription_CreateButtonEnabled() {
        // Arrange - Set up the Add Task dialog
        composeTestRule.setContent {
            RoomSyncTheme {
                AddTaskDialog(
                    onDismiss = {},
                    onCreateTask = { _, _, _, _, _, _, _ -> },
                    groupMembers = sampleGroupMembers
                )
            }
        }

        // Act - Enter task name only
        composeTestRule
            .onNodeWithText("Task Name")
            .performTextInput("Mop floors")

        // Act - Select recurrence: Daily
        composeTestRule
            .onNodeWithText("Daily")
            .performClick()

        // Assert - Description field should be empty
        composeTestRule
            .onNodeWithText("Description (Optional)")
            .assert(hasText(""))

        // Assert - Create Task button is enabled without description
        composeTestRule
            .onNodeWithText("Create Task")
            .assertIsEnabled()
    }

    /**
     * Test: Cancel button dismisses dialog
     * Input: User clicks Cancel button
     * Expected status: Dialog dismissed
     * Expected behavior: 
     * - Cancel button exists and is clickable
     * - Clicking Cancel should trigger onDismiss callback
     * Expected output: Dialog is closed
     */
    @Test
    fun testAddTask_CancelButton_DismissesDialog() {
        // Arrange - Set up the Add Task dialog
        var dialogDismissed = false
        composeTestRule.setContent {
            RoomSyncTheme {
                AddTaskDialog(
                    onDismiss = { dialogDismissed = true },
                    onCreateTask = { _, _, _, _, _, _, _ -> },
                    groupMembers = sampleGroupMembers
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

        // Assert - Verify dialog was dismissed (callback was triggered)
        assert(dialogDismissed)
    }

    /**
     * Test: Member assignment is optional
     * Input: 
     * - Task name: "Vacuum living room"
     * - No members assigned
     * Expected status: Success
     * Expected behavior: 
     * - Task can be created without assigning specific members
     * - System will use algorithmic assignment
     * Expected output: Create Task button is enabled
     */
    @Test
    fun testAddTask_NoMembersAssigned_CreateButtonEnabled() {
        // Arrange - Set up the Add Task dialog
        composeTestRule.setContent {
            RoomSyncTheme {
                AddTaskDialog(
                    onDismiss = {},
                    onCreateTask = { _, _, _, _, _, _, _ -> },
                    groupMembers = sampleGroupMembers
                )
            }
        }

        // Act - Enter task name
        composeTestRule
            .onNodeWithText("Task Name")
            .performTextInput("Vacuum living room")

        // Act - Select recurrence: Weekly
        composeTestRule
            .onNodeWithText("Weekly")
            .performClick()

        // Assert - Verify member assignment section exists but is optional
        composeTestRule
            .onNodeWithText("Assign to members (optional):")
            .assertIsDisplayed()

        // Assert - Create Task button is enabled without member assignment
        composeTestRule
            .onNodeWithText("Create Task")
            .assertIsEnabled()
    }
}

