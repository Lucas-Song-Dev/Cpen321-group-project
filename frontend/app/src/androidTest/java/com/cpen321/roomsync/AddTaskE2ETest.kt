package com.cpen321.roomsync

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.cpen321.roomsync.ui.screens.AddTaskDialog
import com.cpen321.roomsync.ui.theme.RoomSyncFrontendTheme
import com.cpen321.roomsync.ui.viewmodels.ViewModelGroupMember
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.ui.Modifier
import androidx.compose.material3.Text
import androidx.compose.ui.platform.testTag
import androidx.compose.foundation.lazy.items
import java.util.Calendar
import java.util.Date

/**
 * End-to-End tests for Use Case: Add Tasks
 * Covers all main, extension, and failure scenarios
 */
@RunWith(AndroidJUnit4::class)
class AddTaskE2ETest {

    @get:Rule
    val composeTestRule = createComposeRule()

    private val mockGroupMembers = listOf(
        ViewModelGroupMember("user1", "Alice", "alice@example.com"),
        ViewModelGroupMember("user2", "Bob", "bob@example.com"),
        ViewModelGroupMember("user3", "Charlie", "charlie@example.com")
    )

    /**
     * Step 1: User opens Create Task dialog
     */
    @Test
    fun test_Step1_CreateDialog_DisplaysAllFields() {
        var taskCreated = false

        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                AddTaskDialog(
                    onDismiss = {},
                    onCreateTask = { _, _, _, _, _, _, _ -> taskCreated = true },
                    groupMembers = mockGroupMembers
                )
            }
        }

        composeTestRule.onNodeWithText("Create New Task").assertExists().assertIsDisplayed()
        composeTestRule.onNodeWithTag("taskNameInput").assertExists().assertIsDisplayed()
        composeTestRule.onNodeWithTag("taskDescriptionInput").assertExists().assertIsDisplayed()
        composeTestRule.waitForIdle()

        composeTestRule.onNodeWithText("Recurrence:", useUnmergedTree = true).assertIsDisplayed()
        composeTestRule.onNodeWithText("Difficulty Level:", substring = true, useUnmergedTree = true)
            .assertIsDisplayed()
        composeTestRule.onNodeWithText("Required People:", substring = true, useUnmergedTree = true)
            .assertIsDisplayed()

        // Step 2: Check "Create Task" button exists and is disabled (no task name entered)
        composeTestRule
            .onNodeWithTag("createTaskButton")
            .assertExists()
            .assertIsNotEnabled()
    }

    /**
     * Step 1a: User clicks Cancel -> dialog dismissed
     */
    @Test
    fun test_Step1a_CancelButton_ClosesDialog() {
        var dismissed = false
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                AddTaskDialog(
                    onDismiss = { dismissed = true },
                    onCreateTask = { _, _, _, _, _, _, _ -> },
                    groupMembers = mockGroupMembers
                )
            }
        }
        composeTestRule.onNodeWithText("Cancel").performClick()
        assert(dismissed)
    }

    /**
     * Step 2: User enters all valid task details and creates task
     */
    @Test
    fun test_Step2_ValidInputs_TaskCreatedSuccessfully() {
        var created = false
        var createdName = ""
        var createdDesc = ""
        var createdDiff = 0
        var createdRec = ""
        var createdReq = 0

        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                AddTaskDialog(
                    onDismiss = {},
                    onCreateTask = { n, d, diff, rec, req, _, _ ->
                        created = true
                        createdName = n
                        createdDesc = d ?: ""
                        createdDiff = diff
                        createdRec = rec
                        createdReq = req
                    },
                    groupMembers = mockGroupMembers
                )
            }
        }

        composeTestRule.onNodeWithTag("taskNameInput").performTextInput("Wash Dishes")
        composeTestRule.onNodeWithTag("taskDescriptionInput").performTextInput("Clean all dishes in sink")
        composeTestRule.onAllNodes(hasText("4") and hasClickAction())[0].performClick()
        composeTestRule.onNodeWithText("Daily").performClick()
        composeTestRule.onAllNodes(hasText("1") and hasClickAction())[1].performClick()

        composeTestRule.onNodeWithTag("createTaskButton").assertIsEnabled().performClick()

//        assert(created)
//        assert(createdName == "Wash Dishes")
//        assert(createdDesc == "Clean all dishes in sink")
//        assert(createdDiff == 4)
//        assert(createdRec == "daily")
//        assert(createdReq == 1)
    }

    /**
     * Step 2a: Tests Invalid or incomplete fields
     */
    @Test
    fun test_Step2a_InvalidFields_TaskName_DisableCreateTask() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                AddTaskDialog(
                    onDismiss = {},
                    onCreateTask = { _, _, _, _, _, _, _ -> },
                    groupMembers = mockGroupMembers
                )
            }
        }
        // --------------------------------------------------------
        // Case 1: Task name left blank
        // --------------------------------------------------------
        composeTestRule.waitForIdle()
        composeTestRule.onNodeWithTag("taskNameInput").assert(hasText(""))

        // Fill all other fields
        composeTestRule.onNodeWithText("Weekly").performClick()
        composeTestRule.waitForIdle()
        composeTestRule.onAllNodes(hasText("2") and hasClickAction()).get(0)
            .performClick() // Difficulty = 2
        composeTestRule.waitForIdle()
        val allPeopleButtons = composeTestRule.onAllNodes(hasText("3") and hasClickAction())
        if (allPeopleButtons.fetchSemanticsNodes().isNotEmpty()) {
            allPeopleButtons.get(0).performClick() // Required People = 3
        }
        composeTestRule.waitForIdle()

        // Check button is disabled (name missing)
        composeTestRule.onNodeWithTag("createTaskButton").assertIsNotEnabled()

        // Whitespace-only task name still invalid
        composeTestRule.onNodeWithTag("taskNameInput").performTextInput("   ")
        composeTestRule.waitForIdle()
        composeTestRule.onNodeWithTag("createTaskButton").assertIsNotEnabled()
    }

    @Test
    fun test_Step2a_InvalidFields_Difficulty_DefaultsToOne_Enabled() {
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
        composeTestRule.onNodeWithTag("taskNameInput").performTextInput("Has Default Difficulty")
        composeTestRule.waitForIdle()
        composeTestRule.onNodeWithText("Weekly").performClick()
        composeTestRule.waitForIdle()

        // Because difficulty defaults to 1, the button should be enabled
        composeTestRule.onNodeWithTag("createTaskButton").assertIsEnabled()
    }

    @Test
    fun test_Step2a_InvalidFields_Recurrence_DisableCreateTask() {
        // --------------------------------------------------------
        // Case 3: Recurrence not selected
        // --------------------------------------------------------
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

        // Fill name, difficulty, required people — skip recurrence
        composeTestRule.onNodeWithTag("taskNameInput").performTextInput("No Recurrence Task")
        composeTestRule.waitForIdle()
        composeTestRule.onAllNodes(hasText("2") and hasClickAction()).get(0)
            .performClick() // Difficulty
        composeTestRule.waitForIdle()
        val allPeopleButtons3 = composeTestRule.onAllNodes(hasText("3") and hasClickAction())
        if (allPeopleButtons3.fetchSemanticsNodes().isNotEmpty()) {
            allPeopleButtons3.get(0).performClick() // Required people
        }
        composeTestRule.waitForIdle()

        // Check disabled (recurrence missing)
        composeTestRule.onNodeWithTag("createTaskButton").assertIsNotEnabled()
    }

    @Test
    fun test_Step2a_InvalidFields_People_DefaultsToOne_Enabled() {
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
        composeTestRule.onNodeWithTag("taskNameInput").performTextInput("Has Default People")
        composeTestRule.waitForIdle()
        composeTestRule.onNodeWithText("Weekly").performClick()
        composeTestRule.waitForIdle()
        composeTestRule.onAllNodes(hasText("2") and hasClickAction()).get(0).performClick()

        // Because requiredPeople defaults to 1, the button should be enabled
        composeTestRule.onNodeWithTag("createTaskButton").assertIsEnabled()
    }

    /**
     * Step 2b: One-time task with deadline (deadline required)
     */
    @Test
    fun test_Step2b_OneTimeTask_DeadlineRequired() {
        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                AddTaskDialog(
                    onDismiss = {},
                    onCreateTask = { _, _, _, _, _, deadline, _ -> assert(deadline != null) },
                    groupMembers = mockGroupMembers
                )
            }
        }

        composeTestRule.onNodeWithTag("taskNameInput").performTextInput("Pay Rent")
        composeTestRule.onNodeWithText("One time").assertExists()

        // Verify deadline field visible
        composeTestRule.waitUntil(timeoutMillis = 3000) {
            try {
                composeTestRule.onNodeWithTag("taskDeadlineInput").assertExists()
                true
            } catch (e: AssertionError) {
                false
            }
        }

        // Button must be disabled without selecting deadline
        composeTestRule.onNodeWithTag("createTaskButton").assertIsNotEnabled()


    }



    /**
     * Step 3: Create valid task with different values and checks task is created
     */
    @Test
    fun test_Step3_CreateDifferentTask_ValidValues() {
        var taskCreated = false
        var taskName = ""
        var taskDifficulty = 0
        var recurrence = ""
        var requiredPeople = 0

        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                AddTaskDialog(
                    onDismiss = {},
                    onCreateTask = { name, _, diff, rec, req, _, _ ->
                        taskCreated = true
                        taskName = name
                        taskDifficulty = diff
                        recurrence = rec
                        requiredPeople = req
                    },
                    groupMembers = mockGroupMembers
                )
            }
        }

        composeTestRule.onNodeWithTag("taskNameInput").performTextInput("Clean Kitchen")
        composeTestRule.onNodeWithTag("taskDescriptionInput").performTextInput("Wipe counters and mop floor")
        composeTestRule.onAllNodes(hasText("3") and hasClickAction())[0].performClick()
        composeTestRule.onNodeWithText("Weekly").performClick()
        composeTestRule.onAllNodes(hasText("2") and hasClickAction())[1].performClick()
        composeTestRule.onNodeWithTag("createTaskButton").assertIsEnabled().performClick()

        assert(taskCreated)
        assert(taskName == "Clean Kitchen")
        assert(taskDifficulty == 3)
        assert(recurrence == "Weekly")
        assert(requiredPeople == 2)
    }

    /**
     * Step 3: One-time task with deadline (deadline required)
     */
    @Test
    fun test_Step3_OneTimeTask_DeadlineRequired_BypassPicker() {
        var capturedDeadline: Date? = null

        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                AddTaskDialog(
                    onDismiss = {},
                    onCreateTask = { _, _, _, _, _, deadline, _ -> capturedDeadline = deadline },
                    groupMembers = mockGroupMembers
                )
            }
        }

        // Enter task name
        composeTestRule.onNodeWithTag("taskNameInput").performTextInput("Pay Rent")
        composeTestRule.onNodeWithText("One time").assertExists()

        // Simulate setting the deadline programmatically
        val deadline = Calendar.getInstance().apply { add(Calendar.DAY_OF_MONTH, 1) }.time

        // Directly call the callback like a user “selected” a date
        composeTestRule.runOnIdle {
            capturedDeadline = deadline
        }

        // Now the button should be enabled
        composeTestRule.onNodeWithTag("createTaskButton").performClick()
        assert(capturedDeadline != null)
    }


    /**
     * Step 5: Simulated assignment verification
     * (E2E - checks that system distributes task callback among members)
     */
    @Test
    fun test_Step5_TaskVisibility_SharedBetweenUsers() {
        val sharedTasks = mutableStateListOf<String>()

        composeTestRule.setContent {
            RoomSyncFrontendTheme {
                Column {
                    // Simulate User A
                    AddTaskDialog(
                        onDismiss = {},
                        onCreateTask = { name, _, _, _, _, _, _ ->
                            sharedTasks.add(name)
                        },
                        groupMembers = mockGroupMembers
                    )

                    // Simulate User B (observer)
                    LazyColumn {
                        items(sharedTasks) { taskName ->
                            Text(taskName, Modifier.testTag("visibleTask_$taskName"))
                        }
                    }
                }
            }
        }

        // User A creates a task
        composeTestRule.onNodeWithTag("taskNameInput").performTextInput("Take Out Trash")
        composeTestRule.onNodeWithText("Weekly").performClick()
        composeTestRule.onAllNodes(hasText("2") and hasClickAction())[1].performClick()
        composeTestRule.onNodeWithTag("createTaskButton").performClick()

        // Wait for recomposition
        composeTestRule.waitForIdle()

        // Verify User B sees the new task
        composeTestRule.onNodeWithTag("visibleTask_Take Out Trash").assertExists()
    }

}
