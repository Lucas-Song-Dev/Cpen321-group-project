package com.cpen321.roomsync.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import java.text.SimpleDateFormat
import java.util.*
import com.cpen321.roomsync.ui.viewmodels.TaskViewModel
import com.cpen321.roomsync.ui.viewmodels.TaskItem as ViewModelTaskItem
import com.cpen321.roomsync.ui.viewmodels.TaskStatus as ViewModelTaskStatus
import com.cpen321.roomsync.ui.viewmodels.ViewModelGroupMember

data class TaskItem(
    val id: String,
    val name: String,
    val description: String?,
    val difficulty: Int,
    val recurrence: String,
    val requiredPeople: Int,
    val createdBy: String,
    val createdById: String,
    val status: TaskStatus,
    val createdAt: Date,
    val completedAt: Date?,
    val assignedTo: List<String> = emptyList()
)

enum class TaskStatus {
    INCOMPLETE, IN_PROGRESS, COMPLETED
}

// Helper function to convert ViewModel task to UI task
fun convertViewModelTask(viewModelTask: ViewModelTaskItem): TaskItem {
    return TaskItem(
        id = viewModelTask.id,
        name = viewModelTask.name,
        description = viewModelTask.description,
        difficulty = viewModelTask.difficulty,
        recurrence = viewModelTask.recurrence,
        createdBy = viewModelTask.createdBy,
        createdById = viewModelTask.createdById,
        requiredPeople = viewModelTask.requiredPeople,
        status = when (viewModelTask.status) {
            ViewModelTaskStatus.INCOMPLETE -> TaskStatus.INCOMPLETE
            ViewModelTaskStatus.IN_PROGRESS -> TaskStatus.IN_PROGRESS
            ViewModelTaskStatus.COMPLETED -> TaskStatus.COMPLETED
        },
        createdAt = viewModelTask.createdAt,
        completedAt = viewModelTask.completedAt,
        assignedTo = viewModelTask.assignedTo
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskScreen(
    groupName: String = "Group Tasks",
    groupId: String = "68fb62f776137b62df6214d5",
    onBack: () -> Unit = {},
    currentUserId: String = "68fb4f7cac22f6c9e5ac82b6"
) {
    // Use ViewModel
    val viewModel: TaskViewModel = viewModel { 
        TaskViewModel(groupId, currentUserId) 
    }
    val uiState by viewModel.uiState.collectAsState()

    var showAddTaskDialog by remember { mutableStateOf(false) }
    var showAssignDialog by remember { mutableStateOf(false) }
    var showDeleteConfirmation by remember { mutableStateOf(false) }
    var selectedTask by remember { mutableStateOf<TaskItem?>(null) }
    var currentTab by remember { mutableStateOf(0) }
    var showWeeklyView by remember { mutableStateOf(true) }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Top App Bar with extra padding
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = MaterialTheme.colorScheme.surface,
                shadowElevation = 4.dp
            ) {
                Column(
                    modifier = Modifier.padding(top = 16.dp)
                ) {
                    TopAppBar(
                        title = {
                            Text(
                                text = groupName,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold
                            )
                        },
                        navigationIcon = {
                            IconButton(onClick = onBack) {
                                Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                            }
                        },
                        actions = {
                            IconButton(onClick = { showAddTaskDialog = true }) {
                                Icon(Icons.Default.Add, contentDescription = "Add Task")
                            }
                        },
                        colors = TopAppBarDefaults.topAppBarColors(
                            containerColor = MaterialTheme.colorScheme.surface
                        )
                    )
                }
            }

            // Weekly View Toggle and Controls
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Weekly Tasks",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            IconButton(
                                onClick = { viewModel.changeWeek(-1) },
                                enabled = !uiState.isLoading
                            ) {
                                Icon(Icons.Default.KeyboardArrowLeft, contentDescription = "Previous Week")
                            }
                            
                            Text(
                                text = viewModel.getWeekDisplayText(),
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onPrimaryContainer,
                                modifier = Modifier.padding(horizontal = 8.dp)
                            )
                            
                            IconButton(
                                onClick = { viewModel.changeWeek(1) },
                                enabled = !uiState.isLoading
                            ) {
                                Icon(Icons.Default.KeyboardArrowRight, contentDescription = "Next Week")
                            }
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Button(
                            onClick = { viewModel.assignWeeklyTasks() },
                            enabled = !uiState.isAssigningWeekly && !uiState.isLoading,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.primary
                            )
                        ) {
                            if (uiState.isAssigningWeekly) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(16.dp),
                                    color = MaterialTheme.colorScheme.onPrimary
                                )
                            } else {
                                Icon(Icons.Default.Settings, contentDescription = null)
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Auto-Assign Week")
                        }
                        
                        IconButton(
                            onClick = { showAddTaskDialog = true }
                        ) {
                            Icon(Icons.Default.Add, contentDescription = "Add Task")
                        }
                    }
                }
            }

            // Tab Row
            TabRow(selectedTabIndex = currentTab) {
                Tab(
                    selected = currentTab == 0,
                    onClick = { currentTab = 0 },
                    text = { Text("Weekly View") }
                )
                Tab(
                    selected = currentTab == 1,
                    onClick = { currentTab = 1 },
                    text = { Text("All Tasks") }
                )
                Tab(
                    selected = currentTab == 2,
                    onClick = { currentTab = 2 },
                    text = { Text("My Tasks") }
                )
            }

            // Task List
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .padding(16.dp),
                contentPadding = PaddingValues(vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                val tasks = when (currentTab) {
                    0 -> uiState.weeklyTasks.map { convertViewModelTask(it) }
                    1 -> uiState.tasks.map { convertViewModelTask(it) }
                    2 -> uiState.myTasks.map { convertViewModelTask(it) }
                    else -> emptyList()
                }
                
                if (tasks.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier.fillMaxWidth(),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                Icon(
                                    Icons.Default.Add,
                                    contentDescription = null,
                                    modifier = Modifier.size(64.dp),
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = when (currentTab) {
                                        0 -> "No tasks assigned for this week"
                                        1 -> "No tasks yet"
                                        2 -> "No tasks assigned to you"
                                        else -> "No tasks"
                                    },
                                    fontSize = 16.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                if (currentTab == 0) {
                                    Button(onClick = { viewModel.assignWeeklyTasks() }) {
                                        Text("Auto-Assign Tasks")
                                    }
                                } else if (currentTab == 1) {
                                    Button(onClick = { showAddTaskDialog = true }) {
                                        Text("Create First Task")
                                    }
                                }
                            }
                        }
                    }
                } else {
                    items(tasks) { task ->
                        TaskCard(
                            task = task,
                            currentUserId = currentUserId,
                            onStatusChange = { status -> 
                                val viewModelStatus = when (status) {
                                    TaskStatus.INCOMPLETE -> ViewModelTaskStatus.INCOMPLETE
                                    TaskStatus.IN_PROGRESS -> ViewModelTaskStatus.IN_PROGRESS
                                    TaskStatus.COMPLETED -> ViewModelTaskStatus.COMPLETED
                                }
                                viewModel.updateTaskStatus(task.id, viewModelStatus)
                            },
                            onAssignClick = { 
                                selectedTask = task
                                showAssignDialog = true 
                            },
                            onDeleteClick = {
                                selectedTask = task
                                showDeleteConfirmation = true
                            }
                        )
                    }
                }
            }
        }

        // Add Task Dialog
        if (showAddTaskDialog) {
            AddTaskDialog(
                onDismiss = { showAddTaskDialog = false },
                onCreateTask = { name, description, difficulty, recurrence, requiredPeople, assignedMembers ->
                    viewModel.createTask(name, description, difficulty, recurrence, requiredPeople, assignedMembers)
                    showAddTaskDialog = false
                },
                groupMembers = uiState.groupMembers
            )
        }

        // Assign Task Dialog
        if (showAssignDialog && selectedTask != null) {
            AssignTaskDialog(
                task = selectedTask!!,
                onDismiss = { 
                    showAssignDialog = false
                    selectedTask = null
                },
                onAssign = { userIds ->
                    viewModel.assignTask(selectedTask!!.id, userIds)
                    showAssignDialog = false
                    selectedTask = null
                }
            )
        }

        // Delete Task Confirmation Dialog
        if (showDeleteConfirmation && selectedTask != null) {
            AlertDialog(
                onDismissRequest = { 
                    showDeleteConfirmation = false
                    selectedTask = null
                },
                title = { Text("Delete Task") },
                text = { 
                    Text("Are you sure you want to delete '${selectedTask!!.name}'? This action cannot be undone.")
                },
                confirmButton = {
                    TextButton(
                        onClick = {
                            viewModel.deleteTask(selectedTask!!.id)
                            showDeleteConfirmation = false
                            selectedTask = null
                        }
                    ) {
                        Text("Delete", color = MaterialTheme.colorScheme.error)
                    }
                },
                dismissButton = {
                    TextButton(
                        onClick = {
                            showDeleteConfirmation = false
                            selectedTask = null
                        }
                    ) {
                        Text("Cancel")
                    }
                }
            )
        }

        // Error handling
        uiState.error?.let { error ->
            LaunchedEffect(error) {
                // TODO: Show snackbar with error message
                viewModel.clearError()
            }
        }
    }
}

@Composable
fun TaskCard(
    task: TaskItem,
    currentUserId: String,
    onStatusChange: (TaskStatus) -> Unit,
    onAssignClick: () -> Unit,
    onDeleteClick: () -> Unit
) {
    var showMenu by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header with task name and menu
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = task.name,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (task.status == TaskStatus.COMPLETED) {
                        MaterialTheme.colorScheme.onSurfaceVariant
                    } else {
                        MaterialTheme.colorScheme.onSurface
                    },
                    textDecoration = if (task.status == TaskStatus.COMPLETED) {
                        TextDecoration.LineThrough
                    } else {
                        TextDecoration.None
                    }
                )

                Box {
                    IconButton(onClick = { showMenu = true }) {
                        Icon(Icons.Default.MoreVert, contentDescription = "More")
                    }

                    if (showMenu) {
                        DropdownMenu(
                            expanded = showMenu,
                            onDismissRequest = { showMenu = false }
                        ) {
                            DropdownMenuItem(
                                text = { Text("Assign") },
                                onClick = {
                                    onAssignClick()
                                    showMenu = false
                                },
                                leadingIcon = {
                                    Icon(Icons.Default.Add, contentDescription = null)
                                }
                            )
                            if (task.createdById == currentUserId) {
                                DropdownMenuItem(
                                    text = { Text("Delete") },
                                    onClick = {
                                        onDeleteClick()
                                        showMenu = false
                                    },
                                    leadingIcon = {
                                        Icon(Icons.Default.Delete, contentDescription = null)
                                    }
                                )
                            }
                        }
                    }
                }
            }

            // Description
            if (!task.description.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = task.description,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Task details row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Difficulty indicator
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Difficulty:",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    repeat(task.difficulty) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.primary)
                        )
                    }
                    repeat(5 - task.difficulty) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f))
                        )
                    }
                }

                // Status chip
                TaskStatusChip(
                    status = task.status,
                    onClick = { 
                        val newStatus = when (task.status) {
                            TaskStatus.INCOMPLETE -> TaskStatus.IN_PROGRESS
                            TaskStatus.IN_PROGRESS -> TaskStatus.COMPLETED
                            TaskStatus.COMPLETED -> TaskStatus.INCOMPLETE
                        }
                        onStatusChange(newStatus)
                    }
                )
            }

            // Assigned to
            if (task.assignedTo.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.Person,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Assigned to: ${task.assignedTo.joinToString(", ")}",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Created info
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Created by ${task.createdBy} • ${task.recurrence} • ${task.requiredPeople} people needed",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun TaskStatusChip(
    status: TaskStatus,
    onClick: () -> Unit
) {
    val (text, color, icon) = when (status) {
        TaskStatus.INCOMPLETE -> Triple("Incomplete", MaterialTheme.colorScheme.error, Icons.Default.Close)
        TaskStatus.IN_PROGRESS -> Triple("In Progress", MaterialTheme.colorScheme.primary, Icons.Default.PlayArrow)
        TaskStatus.COMPLETED -> Triple("Completed", Color(0xFF4CAF50), Icons.Default.CheckCircle)
    }

    FilterChip(
        onClick = onClick,
        label = { Text(text) },
        leadingIcon = {
            Icon(icon, contentDescription = null, modifier = Modifier.size(16.dp))
        },
        selected = status == TaskStatus.COMPLETED,
        colors = FilterChipDefaults.filterChipColors(
            selectedContainerColor = color.copy(alpha = 0.2f),
            selectedLabelColor = color
        )
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddTaskDialog(
    onDismiss: () -> Unit,
    onCreateTask: (String, String?, Int, String, Int, List<String>) -> Unit,
    groupMembers: List<ViewModelGroupMember>
) {
    var name by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var difficulty by remember { mutableStateOf(1) }
    var recurrence by remember { mutableStateOf("one-time") }
    var requiredPeople by remember { mutableStateOf(1) }
    var selectedMembers by remember { mutableStateOf<List<String>>(emptyList()) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text("Create New Task")
        },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Task Name") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description (Optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 3
                )

                // Difficulty selector
                Text(
                    text = "Difficulty Level: $difficulty",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    repeat(5) { index ->
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(
                                    if (index < difficulty) MaterialTheme.colorScheme.primary 
                                    else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f)
                                )
                                .clickable { difficulty = index + 1 },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "${index + 1}",
                                color = if (index < difficulty) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                // Recurrence selector
                Text(
                    text = "Recurrence:",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("one-time", "daily", "weekly", "bi-weekly", "monthly").forEach { rec ->
                        FilterChip(
                            onClick = { recurrence = rec },
                            label = { Text(rec.replace("-", " ").capitalize()) },
                            selected = recurrence == rec
                        )
                    }
                }
                
                // Required people selector
                Text(
                    text = "Required People: $requiredPeople",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    repeat(10) { index ->
                        val peopleCount = index + 1
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(
                                    if (requiredPeople == peopleCount) MaterialTheme.colorScheme.primary
                                    else MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)
                                )
                                .clickable { requiredPeople = peopleCount },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = peopleCount.toString(),
                                color = if (requiredPeople == peopleCount) Color.White else MaterialTheme.colorScheme.onSurface,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
                
                // Member assignment
                Text(
                    text = "Assign to members (optional):",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
                
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(groupMembers) { member: ViewModelGroupMember ->
                        FilterChip(
                            onClick = {
                                selectedMembers = if (selectedMembers.contains(member.id)) {
                                    selectedMembers - member.id
                                } else {
                                    selectedMembers + member.id
                                }
                            },
                            label = { 
                                Text(member.name)
                            },
                            selected = selectedMembers.contains(member.id)
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (name.trim().isNotEmpty()) {
                        onCreateTask(
                            name.trim(),
                            if (description.trim().isEmpty()) null else description.trim(),
                            difficulty,
                            recurrence,
                            requiredPeople,
                            selectedMembers
                        )
                    }
                },
                enabled = name.trim().isNotEmpty()
            ) {
                Text("Create Task")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AssignTaskDialog(
    task: TaskItem,
    onDismiss: () -> Unit,
    onAssign: (List<String>) -> Unit
) {
    var selectedUsers by remember { mutableStateOf(setOf<String>()) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text("Assign Task")
        },
        text = {
            Column {
                Text(
                    text = "Assign '${task.name}' to:",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                // Sample users - in real app, get from group members
                val sampleUsers = listOf("Alice", "Bob", "Charlie", "Diana")
                
                sampleUsers.forEach { user ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                selectedUsers = if (selectedUsers.contains(user)) {
                                    selectedUsers - user
                                } else {
                                    selectedUsers + user
                                }
                            }
                            .padding(vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = selectedUsers.contains(user),
                            onCheckedChange = {
                                selectedUsers = if (selectedUsers.contains(user)) {
                                    selectedUsers - user
                                } else {
                                    selectedUsers + user
                                }
                            }
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = user,
                            fontSize = 16.sp
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onAssign(selectedUsers.toList()) },
                enabled = selectedUsers.isNotEmpty()
            ) {
                Text("Assign")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}