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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
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
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.DatePicker
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.DatePickerDialog
import com.cpen321.roomsync.ui.theme.GlassGradients
import com.cpen321.roomsync.ui.theme.GlassColors

data class TaskItem(
    val id: String,
    val name: String,
    val description: String?,
    val difficulty: Int,
    val recurrence: String,
    val requiredPeople: Int,
    val deadline: Date? = null,
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
        deadline = viewModelTask.deadline,
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

@Composable
fun CalendarView(
    selectedDate: Date,
    onDateSelected: (Date) -> Unit,
    modifier: Modifier = Modifier
) {
    val calendar = Calendar.getInstance()
    val currentMonth = calendar.get(Calendar.MONTH)
    val currentYear = calendar.get(Calendar.YEAR)
    
    val monthNames = arrayOf(
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    )
    
    val dayNames = arrayOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")
    
    Column(modifier = modifier) {
        // Month/Year header
        Text(
            text = "${monthNames[currentMonth]} $currentYear",
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White,
            modifier = Modifier.padding(16.dp)
        )
        
        // Day names header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
        ) {
            dayNames.forEach { dayName ->
                Text(
                    text = dayName,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = Color.White,
                    modifier = Modifier.weight(1f),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )
            }
        }
        
        // Calendar grid
        val firstDayOfMonth = Calendar.getInstance().apply {
            set(currentYear, currentMonth, 1)
        }.get(Calendar.DAY_OF_WEEK) - 1
        
        val daysInMonth = Calendar.getInstance().apply {
            set(currentYear, currentMonth + 1, 0)
        }.get(Calendar.DAY_OF_MONTH)
        
        val weeks = ((firstDayOfMonth + daysInMonth) + 6) / 7
        
        repeat(weeks) { week ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
            ) {
                repeat(7) { dayOfWeek ->
                    val dayNumber = week * 7 + dayOfWeek - firstDayOfMonth + 1
                    val isCurrentMonth = dayNumber in 1..daysInMonth
                    val isToday = isCurrentMonth && dayNumber == Calendar.getInstance().get(Calendar.DAY_OF_MONTH)
                    val isSelected = isCurrentMonth && selectedDate.let { selected ->
                        val selectedCalendar = Calendar.getInstance().apply { time = selected }
                        selectedCalendar.get(Calendar.YEAR) == currentYear &&
                        selectedCalendar.get(Calendar.MONTH) == currentMonth &&
                        selectedCalendar.get(Calendar.DAY_OF_MONTH) == dayNumber
                    }
                    
                    val dayDate = if (isCurrentMonth) {
                        Calendar.getInstance().apply {
                            set(currentYear, currentMonth, dayNumber)
                        }.time
                    } else null
                    
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .aspectRatio(1f)
                            .padding(2.dp)
                            .clip(CircleShape)
                            .background(
                                when {
                                    isSelected -> Color.White.copy(alpha = 0.3f)
                                    isToday -> Color.White.copy(alpha = 0.2f)
                                    else -> Color.Transparent
                                }
                            )
                            .clickable(enabled = isCurrentMonth) {
                                dayDate?.let { onDateSelected(it) }
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        if (isCurrentMonth) {
                            Text(
                                text = dayNumber.toString(),
                                color = Color.White,
                                fontSize = 14.sp,
                                fontWeight = if (isToday || isSelected) FontWeight.Bold else FontWeight.Normal
                            )
                        }
                    }
                }
            }
        }
    }
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
    var selectedDate by remember { mutableStateOf(Date()) }
    var showCalendar by remember { mutableStateOf(true) }

    // Load tasks for selected date when calendar view is shown
    LaunchedEffect( selectedDate, currentTab) {
        if (currentTab == 0) {
            viewModel.loadTasksForDate(selectedDate)
        }
    }

    // Load initial data
    LaunchedEffect(Unit) {
        viewModel.loadTasks()
        viewModel.loadMyTasks()
        viewModel.loadWeeklyTasks()
        viewModel.loadGroupMembers()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(brush = GlassGradients.MainBackground)
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Top App Bar with glass effect (like home screen)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        color = Color(0x30FFFFFF),
                        shape = RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp)
                    )
                    .border(
                        width = 1.dp,
                        color = Color(0x40FFFFFF),
                        shape = RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp)
                    )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(start = 16.dp, end = 16.dp, top = 40.dp, bottom = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onBack) {
                        Icon(
                            Icons.Default.ArrowBack,
                            contentDescription = "Back",
                            tint = Color.White
                        )
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Text(
                        text = groupName,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )

                    Spacer(modifier = Modifier.weight(1f))

                    IconButton(onClick = { showAddTaskDialog = true }) {
                        Icon(
                            Icons.Default.Add,
                            contentDescription = "Add Task",
                            tint = Color.White
                        )
                    }
                }
            }

            // Calendar View
            if (showCalendar) {
                CalendarView(
                    selectedDate = selectedDate,
                    onDateSelected = { date ->
                        selectedDate = date
                        viewModel.loadTasksForDate(date)
                    },
                    modifier = Modifier.padding(16.dp)
                )
            }

            // Weekly View Header
            if (!showCalendar && currentTab == 1) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                        .border(
                            width = 1.dp,
                            color = Color.White,
                            shape = RoundedCornerShape(12.dp)
                        ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = Color.Transparent
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
                                color = Color.White
                            )
                            
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                IconButton(
                                    onClick = { viewModel.changeWeek(-1) },
                                    enabled = !uiState.isLoading
                                ) {
                                    Icon(Icons.Default.KeyboardArrowLeft, contentDescription = "Previous Week", tint = Color.White)
                                }
                                
                                Text(
                                    text = viewModel.getWeekDisplayText(),
                                    fontSize = 14.sp,
                                    color = Color.White,
                                    modifier = Modifier.padding(horizontal = 8.dp)
                                )
                                
                                IconButton(
                                    onClick = { viewModel.changeWeek(1) },
                                    enabled = !uiState.isLoading
                                ) {
                                    Icon(Icons.Default.KeyboardArrowRight, contentDescription = "Next Week", tint = Color.White)
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
                                modifier = Modifier.border(
                                    width = 1.dp,
                                    color = Color.White,
                                    shape = RoundedCornerShape(8.dp)
                                ),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color.Transparent,
                                    contentColor = Color.White
                                )
                            ) {
                                if (uiState.isAssigningWeekly) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(16.dp),
                                        color = Color.White
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
                                Icon(Icons.Default.Add, contentDescription = "Add Task", tint = Color.White)
                            }
                        }
                    }
                }
            }

            // Tab Row
            TabRow(
                selectedTabIndex = currentTab,
                containerColor = Color.Transparent,
                contentColor = Color.White,
                indicator = { },
                divider = { },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
            ) {
                Tab(
                    selected = currentTab == 0,
                    onClick = { 
                        currentTab = 0
                        showCalendar = true
                    },
                    text = { Text("Calendar View", color = Color.White) },
                    modifier = Modifier
                        .weight(1f)
                        .padding(4.dp)
                        .border(
                            width = if (currentTab == 0) 2.dp else 1.dp,
                            color = Color.White,
                            shape = RoundedCornerShape(8.dp)
                        )
                        .padding(horizontal = 12.dp, vertical = 8.dp)
                )
                Tab(
                    selected = currentTab == 1,
                    onClick = { 
                        currentTab = 1
                        showCalendar = false
                    },
                    text = { Text("Weekly View", color = Color.White) },
                    modifier = Modifier
                        .weight(1f)
                        .padding(4.dp)
                        .border(
                            width = if (currentTab == 1) 2.dp else 1.dp,
                            color = Color.White,
                            shape = RoundedCornerShape(8.dp)
                        )
                        .padding(horizontal = 12.dp, vertical = 8.dp)
                )
                Tab(
                    selected = currentTab == 2,
                    onClick = { 
                        currentTab = 2
                        showCalendar = false
                    },
                    text = { Text("My Tasks", color = Color.White) },
                    modifier = Modifier
                        .weight(1f)
                        .padding(4.dp)
                        .border(
                            width = if (currentTab == 2) 2.dp else 1.dp,
                            color = Color.White,
                            shape = RoundedCornerShape(8.dp)
                        )
                        .padding(horizontal = 12.dp, vertical = 8.dp)
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
                when (currentTab) {
                    0 -> {
                        // Calendar View - show daily tasks
                        val tasks = uiState.dailyTasks.map { convertViewModelTask(it) }
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
                                        IconButton(
                                            onClick = { showAddTaskDialog = true },
                                            modifier = Modifier.size(64.dp)
                                        ) {
                                            Icon(
                                                Icons.Default.Add,
                                                contentDescription = "Add Task",
                                                modifier = Modifier.size(64.dp),
                                                tint = Color.White
                                            )
                                        }
                                        Text(
                                            text = "No tasks for ${SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(selectedDate)}",
                                            fontSize = 16.sp,
                                            color = Color.White
                                        )
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
                    1 -> {
                        // Weekly View - show all tasks grouped by day
                        val groupedTasks = uiState.allTasksGroupedByDay
                        if (groupedTasks.isEmpty()) {
                            item {
                                Box(
                                    modifier = Modifier.fillMaxWidth(),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Column(
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        verticalArrangement = Arrangement.spacedBy(16.dp)
                                    ) {
                                        IconButton(
                                            onClick = { showAddTaskDialog = true },
                                            modifier = Modifier.size(64.dp)
                                        ) {
                                            Icon(
                                                Icons.Default.Add,
                                                contentDescription = "Add Task",
                                                modifier = Modifier.size(64.dp),
                                                tint = Color.White
                                            )
                                        }
                                        Text(
                                            text = "No tasks assigned for this week",
                                            fontSize = 16.sp,
                                            color = Color.White
                                        )
                                    }
                                }
                            }
                        } else {
                            groupedTasks.forEach { (dayName, dayTasks) ->
                                item {
                                    // Day header
                                    Card(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(vertical = 4.dp)
                                            .border(
                                                width = 1.dp,
                                                color = Color.White,
                                                shape = RoundedCornerShape(8.dp)
                                            ),
                                        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                                        colors = CardDefaults.cardColors(
                                            containerColor = Color.Transparent
                                        )
                                    ) {
                                        Text(
                                            text = dayName,
                                            fontSize = 16.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.White,
                                            modifier = Modifier.padding(12.dp)
                                        )
                                    }
                                }
                                
                                // Tasks for this day
                                items(dayTasks.map { convertViewModelTask(it) }) { task ->
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
                    2 -> {
                        // My Tasks - show my tasks grouped by day
                        val groupedTasks = uiState.myTasksGroupedByDay
                        if (groupedTasks.isEmpty()) {
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
                                            tint = Color.White
                                        )
                                        Text(
                                            text = "No tasks assigned to you",
                                            fontSize = 16.sp,
                                            color = Color.White
                                        )
                                        Button(
                                            onClick = { showAddTaskDialog = true },
                                            modifier = Modifier.border(
                                                width = 1.dp,
                                                color = Color.White,
                                                shape = RoundedCornerShape(8.dp)
                                            ),
                                            colors = ButtonDefaults.buttonColors(
                                                containerColor = Color.Transparent,
                                                contentColor = Color.White
                                            )
                                        ) {
                                            Text("Create First Task")
                                        }
                                    }
                                }
                            }
                        } else {
                            groupedTasks.forEach { (dayName, dayTasks) ->
                                item {
                                    // Day header
                                    Card(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(vertical = 4.dp)
                                            .border(
                                                width = 1.dp,
                                                color = Color.White,
                                                shape = RoundedCornerShape(8.dp)
                                            ),
                                        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                                        colors = CardDefaults.cardColors(
                                            containerColor = Color.Transparent
                                        )
                                    ) {
                                        Text(
                                            text = dayName,
                                            fontSize = 16.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.White,
                                            modifier = Modifier.padding(12.dp)
                                        )
                                    }
                                }
                                
                                // Tasks for this day
                                items(dayTasks.map { convertViewModelTask(it) }) { task ->
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
                }
            }
        }

        // Add Task Dialog
        if (showAddTaskDialog) {
            AddTaskDialog(
                onDismiss = { showAddTaskDialog = false },
                onCreateTask = { name, description, difficulty, recurrence, requiredPeople, deadline, assignedMembers ->
                    viewModel.createTask(name, description, difficulty, recurrence, requiredPeople, deadline, assignedMembers)
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
        modifier = Modifier
            .fillMaxWidth()
            .border(
                width = 1.dp,
                color = Color.White,
                shape = RoundedCornerShape(12.dp)
            ),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.Transparent
        )
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
                        Color.White.copy(alpha = 0.7f)
                    } else {
                        Color.White
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
                    color = Color.White
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
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    val difficultyColor = when {
                        task.difficulty <= 2 -> Color(0xFF4CAF50) // Green for 1-2
                        task.difficulty == 3 -> Color(0xFFFFC107) // Yellow for 3
                        else -> Color(0xFFF44336) // Red for 4-5
                    }
                    repeat(5) { index ->
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(
                                    if (index < task.difficulty) difficultyColor 
                                    else Color.White.copy(alpha = 0.3f)
                                )
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
                        tint = Color.White
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Assigned to: ${task.assignedTo.joinToString(", ")}",
                        fontSize = 12.sp,
                        color = Color.White
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
            
            // Deadline info
            if (task.deadline != null) {
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.DateRange,
                        contentDescription = null,
                        modifier = Modifier.size(14.dp),
                        tint = Color.White
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Deadline: ${SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(task.deadline)}",
                        fontSize = 12.sp,
                        color = Color.White
                    )
                }
            }
        }
    }
}

@Composable
fun TaskStatusChip(
    status: TaskStatus,
    onClick: () -> Unit
) {
    val (text, color, icon) = when (status) {
        TaskStatus.INCOMPLETE -> Triple("Incomplete", Color(0xFFFF6B6B), Icons.Default.Close)
        TaskStatus.IN_PROGRESS -> Triple("In Progress", MaterialTheme.colorScheme.primary, Icons.Default.PlayArrow)
        TaskStatus.COMPLETED -> Triple("Complete", Color(0xFF4CAF50), Icons.Default.CheckCircle)
    }

    FilterChip(
        onClick = onClick,
        label = { Text(text, color = Color.White) },
        leadingIcon = {
            Icon(icon, contentDescription = null, modifier = Modifier.size(16.dp), tint = Color.White)
        },
        selected = status == TaskStatus.COMPLETED,
        colors = FilterChipDefaults.filterChipColors(
            containerColor = if (status == TaskStatus.COMPLETED) Color(0xFF4CAF50).copy(alpha = 0.5f) else color.copy(alpha = 0.3f),
            selectedContainerColor = Color(0xFF4CAF50).copy(alpha = 0.5f),
            labelColor = Color.White,
            selectedLabelColor = Color.White
        )
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddTaskDialog(
    onDismiss: () -> Unit,
    onCreateTask: (String, String?, Int, String, Int, Date?, List<String>) -> Unit,
    groupMembers: List<ViewModelGroupMember>
) {
    var name by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var difficulty by remember { mutableStateOf(1) }
    var recurrence by remember { mutableStateOf("one-time") }
    var requiredPeople by remember { mutableStateOf(1) }
    var deadline by remember { mutableStateOf<Date?>(null) }
    var selectedMembers by remember { mutableStateOf<List<String>>(emptyList()) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text("Create New Task")
        },
        text = {
            val scrollState = rememberScrollState()
            Column(
                modifier = Modifier.verticalScroll(scrollState),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Task Name") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("taskNameInput")
                )

                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description (Optional)") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("taskDescriptionInput"),
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
                                color = if (index < difficulty) Color.White else Color.White.copy(alpha = 0.5f),
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
                Column(
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // First row - 2 options
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FilterChip(
                            onClick = { recurrence = "one-time" },
                            label = { Text("One time") },
                            selected = recurrence == "one-time",
                            modifier = Modifier.weight(1f)
                        )
                        FilterChip(
                            onClick = { recurrence = "daily" },
                            label = { Text("Daily") },
                            selected = recurrence == "daily",
                            modifier = Modifier.weight(1f)
                        )
                    }
                    // Second row - 2 options
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FilterChip(
                            onClick = { recurrence = "weekly" },
                            label = { Text("Weekly") },
                            selected = recurrence == "weekly",
                            modifier = Modifier.weight(1f)
                        )
                        FilterChip(
                            onClick = { recurrence = "bi-weekly" },
                            label = { Text("Bi weekly") },
                            selected = recurrence == "bi-weekly",
                            modifier = Modifier.weight(1f)
                        )
                    }
                    // Third row - 1 option
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FilterChip(
                            onClick = { recurrence = "monthly" },
                            label = { Text("Monthly") },
                            selected = recurrence == "monthly",
                            modifier = Modifier.weight(1f)
                        )
                        // Empty spacer to balance the row
                        Spacer(modifier = Modifier.weight(1f))
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
                                color = if (requiredPeople == peopleCount) Color.White else Color.White.copy(alpha = 0.7f),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
                
                // Deadline field (only for one-time tasks)
                if (recurrence == "one-time") {
                    Text(
                        text = "Deadline:",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )
                    
                    var showDatePicker by remember { mutableStateOf(false) }
                    val datePickerState = rememberDatePickerState(
                        initialSelectedDateMillis = deadline?.time
                    )
                    
                    OutlinedTextField(
                        value = deadline?.let { 
                            SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(it) 
                        } ?: "",
                        onValueChange = { },
                        label = { Text("Select Deadline") },
                        readOnly = true,
                        trailingIcon = {
                            IconButton(
                                onClick = { showDatePicker = true },
                                modifier = Modifier.testTag("taskDeadlinePickerButton")
                            ) {
                                Icon(Icons.Default.DateRange, contentDescription = "Select Date")
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("taskDeadlineInput")
                    )
                    
                    if (showDatePicker) {
                        DatePickerDialog(
                            onDismissRequest = { showDatePicker = false },
                            confirmButton = {
                                TextButton(
                                    onClick = {
                                        datePickerState.selectedDateMillis?.let { millis ->
                                            deadline = Date(millis)
                                        }
                                        showDatePicker = false
                                    }
                                ) {
                                    Text("OK")
                                }
                            },
                            dismissButton = {
                                TextButton(onClick = { showDatePicker = false }) {
                                    Text("Cancel")
                                }
                            }
                        ) {
                            DatePicker(state = datePickerState)
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
                            deadline,
                            selectedMembers
                        )
                    }
                },
                enabled = name.trim().isNotEmpty() && (recurrence != "one-time" || deadline != null),
                modifier = Modifier
                    .testTag("createTaskButton"),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF2196F3),
                    contentColor = Color.White,
                    disabledContainerColor = Color.Gray.copy(alpha = 0.3f),
                    disabledContentColor = Color.Gray.copy(alpha = 0.7f)
                ),
                shape = RoundedCornerShape(8.dp)
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