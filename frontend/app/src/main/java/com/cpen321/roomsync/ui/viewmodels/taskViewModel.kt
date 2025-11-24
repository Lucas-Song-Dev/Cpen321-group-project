package com.cpen321.roomsync.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.roomsync.data.models.Task as ApiTask
import com.cpen321.roomsync.data.repository.TaskRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.*
import java.text.SimpleDateFormat

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

data class TaskUiState(
    val tasks: List<TaskItem> = emptyList(),
    val myTasks: List<TaskItem> = emptyList(),
    val dailyTasks: List<TaskItem> = emptyList(),
    val selectedDate: Date? = null, // Track the currently selected date for calendar view
    val groupMembers: List<ViewModelGroupMember> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val showAddTaskDialog: Boolean = false,
    val showAssignDialog: Boolean = false,
    val selectedTask: TaskItem? = null,
    val currentWeekStart: Date = Date(),
    val weeklyTasks: List<TaskItem> = emptyList(),
    val isAssigningWeekly: Boolean = false,
    val allTasksGroupedByDay: Map<String, List<TaskItem>> = emptyMap(),
    val myTasksGroupedByDay: Map<String, List<TaskItem>> = emptyMap()
)

// Helper function to get current week start (Monday)
fun getCurrentWeekStart(): Date {
    val calendar = Calendar.getInstance()
    calendar.set(Calendar.DAY_OF_WEEK, Calendar.MONDAY)
    calendar.set(Calendar.HOUR_OF_DAY, 0)
    calendar.set(Calendar.MINUTE, 0)
    calendar.set(Calendar.SECOND, 0)
    calendar.set(Calendar.MILLISECOND, 0)
    return calendar.time
}

// Helper function to format date for API
fun formatDateForApi(date: Date): String {
    val formatter = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    return formatter.format(date)
}

// Helper function to group tasks by day and sort chronologically
fun groupTasksByDay(tasks: List<TaskItem>): Map<String, List<TaskItem>> {
    val calendar = Calendar.getInstance()
    val dateFormatter = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val displayFormatter = SimpleDateFormat("EEEE, MMM dd", Locale.getDefault())
    
    val groupedByDate = tasks.groupBy { task ->
        // For one-time tasks, use the deadline date
        // For recurring tasks, use the current week start
        val taskDate = if (task.recurrence == "one-time" && task.deadline != null) {
            task.deadline
        } else {
            // For recurring tasks, we'll use the current week start as a fallback
            // In a real implementation, you might want to calculate the actual occurrence date
            Date()
        }
        
        calendar.time = taskDate
        dateFormatter.format(calendar.time)
    }.mapValues { (_, dayTasks) ->
        // Sort tasks within each day by deadline (earliest first, most urgent at top)
        dayTasks.sortedWith(compareBy<TaskItem>(
            { it.deadline ?: Date(Long.MAX_VALUE) }
        ).thenBy { it.createdAt })
    }
    
    // Sort the days chronologically and convert to display format
    return groupedByDate.toList().sortedBy { (dateString, _) ->
        calendar.time = dateFormatter.parse(dateString) ?: Date()
        calendar.time
    }.toMap().mapKeys { (dateString, _) ->
        calendar.time = dateFormatter.parse(dateString) ?: Date()
        displayFormatter.format(calendar.time)
    }
}

// Helper function to group tasks by day for a specific week
fun groupTasksByDayForWeek(tasks: List<TaskItem>, weekStart: Date): Map<String, List<TaskItem>> {
    val calendar = Calendar.getInstance()
    val dateFormatter = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val displayFormatter = SimpleDateFormat("EEEE, MMM dd", Locale.getDefault())
    
    // Normalize weekStart to start of day
    calendar.time = weekStart
    calendar.set(Calendar.HOUR_OF_DAY, 0)
    calendar.set(Calendar.MINUTE, 0)
    calendar.set(Calendar.SECOND, 0)
    calendar.set(Calendar.MILLISECOND, 0)
    val normalizedWeekStart = calendar.time
    
    // Calculate week end (6 days after week start)
    calendar.time = normalizedWeekStart
    calendar.add(Calendar.DAY_OF_MONTH, 6)
    calendar.set(Calendar.HOUR_OF_DAY, 23)
    calendar.set(Calendar.MINUTE, 59)
    calendar.set(Calendar.SECOND, 59)
    calendar.set(Calendar.MILLISECOND, 999)
    val weekEnd = calendar.time
    
    // Group tasks by the day they appear on in this week
    val groupedByDate = tasks.groupBy { task ->
        val taskDate: Date = if (task.recurrence == "one-time" && task.deadline != null) {
            // For one-time tasks, use the deadline date if it's within the week
            val deadlineDate = task.deadline
            // Normalize deadline to start of day for comparison
            calendar.time = deadlineDate
            calendar.set(Calendar.HOUR_OF_DAY, 0)
            calendar.set(Calendar.MINUTE, 0)
            calendar.set(Calendar.SECOND, 0)
            calendar.set(Calendar.MILLISECOND, 0)
            val normalizedDeadline = calendar.time
            
            // Check if deadline falls within the week range
            if (normalizedDeadline >= normalizedWeekStart && normalizedDeadline <= weekEnd) {
                normalizedDeadline
            } else {
                // If outside week, still use it (shouldn't happen if backend filters correctly)
                normalizedDeadline
            }
        } else {
            // For recurring tasks in weekly view, show them on Monday (weekStart) by default
            normalizedWeekStart
        }
        
        // Format the date as a string key
        calendar.time = taskDate
        dateFormatter.format(calendar.time)
    }.mapValues { (_, dayTasks) ->
        // Sort tasks within each day by deadline (earliest first, most urgent at top)
        dayTasks.sortedWith(compareBy<TaskItem>(
            { it.deadline ?: Date(Long.MAX_VALUE) }
        ).thenBy { it.createdAt })
    }
    
    // Filter to only include days within the week and sort chronologically
    val filteredGrouped = groupedByDate.filterKeys { dateString ->
        try {
            val parsedDate = dateFormatter.parse(dateString)
            parsedDate != null && parsedDate >= normalizedWeekStart && parsedDate <= weekEnd
        } catch (e: Exception) {
            false
        }
    }
    
    // Sort the days chronologically and convert to display format
    return filteredGrouped.toList().sortedBy { (dateString, _) ->
        dateFormatter.parse(dateString) ?: Date()
    }.toMap().mapKeys { (dateString, _) ->
        calendar.time = dateFormatter.parse(dateString) ?: Date()
        displayFormatter.format(calendar.time)
    }
}

// Helper function to get tasks for the current week
fun getTasksForCurrentWeek(allTasks: List<TaskItem>, weekStart: Date): List<TaskItem> {
    val calendar = Calendar.getInstance()
    val weekEnd = Calendar.getInstance().apply {
        time = weekStart
        add(Calendar.DAY_OF_WEEK, 6)
    }.time
    
    return allTasks.filter { task ->
        if (task.recurrence == "one-time" && task.deadline != null) {
            // For one-time tasks, check if deadline is within the week
            task.deadline >= weekStart && task.deadline <= weekEnd
        } else {
            // For recurring tasks, include them in the weekly view
            true
        }
    }
}

data class ViewModelGroupMember(
    val id: String,
    val name: String,
    val email: String = "",
    val isAdmin: Boolean = false,
    val joinDate: Date = Date(),
    val moveInDate: Date? = null,
    val bio: String = "",
    val profilePicture: String? = null
)


class TaskViewModel(
    private val groupId: String,
    private val currentUserId: String,
    private val taskRepository: TaskRepository = TaskRepository()
) : ViewModel() {
    
    companion object {
        private var userBio: String = ""
        
        fun saveUserBio(bio: String) {
            userBio = bio
        }
        
        fun getUserBio(): String {
            return userBio
        }
    }
    
    private val _uiState = MutableStateFlow(TaskUiState())
    val uiState: StateFlow<TaskUiState> = _uiState.asStateFlow()
    
    init {
        // Initialize current week start
        _uiState.value = _uiState.value.copy(currentWeekStart = getCurrentWeekStart())
        loadTasks()
        loadMyTasks()
        loadGroupMembers()
        loadWeeklyTasks()
    }
    
    fun loadTasks() {
        viewModelScope.launch {
            try {
                println("TaskViewModel: Loading all tasks...")
                _uiState.value = _uiState.value.copy(isLoading = true)
                
                val response = taskRepository.getTasks()
                println("TaskViewModel: Get tasks response - success: ${response.success}, data count: ${response.data?.size ?: 0}")
                if (response.success && response.data != null) {
                    val tasks = response.data.map { task ->
                        TaskItem(
                            id = task._id,
                            name = task.name,
                            description = task.description,
                            difficulty = task.difficulty,
                            recurrence = task.recurrence,
                            requiredPeople = task.requiredPeople,
                            deadline = task.deadline?.let { 
                                SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).parse(it)
                            },
                            createdBy = task.createdBy.name ?: "Unknown",
                            createdById = task.createdBy._id,
                            status = when (task.assignments.find { it.userId._id == currentUserId }?.status) {
                                "incomplete" -> TaskStatus.INCOMPLETE
                                "in-progress" -> TaskStatus.IN_PROGRESS
                                "completed" -> TaskStatus.COMPLETED
                                else -> TaskStatus.INCOMPLETE
                            },
                            createdAt = Date(task.createdAt.toLongOrNull() ?: System.currentTimeMillis()),
                            completedAt = task.assignments.find { it.userId._id == currentUserId }?.completedAt?.let { Date(it.toLongOrNull() ?: 0) },
                            assignedTo = task.assignments.map { it.userId.name ?: "Unknown" }
                        )
                    }
                    _uiState.value = _uiState.value.copy(
                        tasks = tasks,
                        isLoading = false
                    )
                } else {
                    _uiState.value = _uiState.value.copy(
                        error = response.message ?: "Failed to load tasks",
                        isLoading = false
                    )
                }
            } catch (e: java.io.IOException) {
                loadTasksPart2(e)
            } catch (e: retrofit2.HttpException) {
                loadTasksPart2(e)
            } catch (e: IllegalArgumentException) {
                loadTasksPart2(e)
            } catch (e: IllegalStateException) {
                loadTasksPart2(e)
            }
        }
    }
    
    private fun loadTasksPart2(e: Exception) {
        val errorMsg = when (e) {
            is java.io.IOException -> "Network error: ${e.message}"
            is retrofit2.HttpException -> "HTTP error: ${e.code()} - ${e.message()}"
            is IllegalArgumentException -> "Invalid data loading tasks: ${e.message}"
            is IllegalStateException -> "State error loading tasks: ${e.message}"
            else -> "Error loading tasks: ${e.message}"
        }
        _uiState.value = _uiState.value.copy(
            error = errorMsg,
            isLoading = false
        )
    }
    
    fun loadMyTasks() {
        viewModelScope.launch {
            try {
                val response = taskRepository.getMyTasks()
                if (response.success && response.data != null) {
                    val myTasks = response.data.map { task ->
                        TaskItem(
                            id = task._id,
                            name = task.name,
                            description = task.description,
                            difficulty = task.difficulty,
                            recurrence = task.recurrence,
                            requiredPeople = task.requiredPeople,
                            deadline = task.deadline?.let { 
                                SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).parse(it)
                            },
                            createdBy = task.createdBy.name ?: "Unknown",
                            createdById = task.createdBy._id,
                            status = when (task.assignments.find { it.userId._id == currentUserId }?.status) {
                                "incomplete" -> TaskStatus.INCOMPLETE
                                "in-progress" -> TaskStatus.IN_PROGRESS
                                "completed" -> TaskStatus.COMPLETED
                                else -> TaskStatus.INCOMPLETE
                            },
                            createdAt = Date(task.createdAt.toLongOrNull() ?: System.currentTimeMillis()),
                            completedAt = task.assignments.find { it.userId._id == currentUserId }?.completedAt?.let { Date(it.toLongOrNull() ?: 0) },
                            assignedTo = task.assignments.map { it.userId.name ?: "Unknown" }
                        )
                    }
                    
                    // Group my tasks by day
                    val myTasksGrouped = groupTasksByDay(myTasks)
                    
                    _uiState.value = _uiState.value.copy(
                        myTasks = myTasks,
                        myTasksGroupedByDay = myTasksGrouped
                    )
                } else {
                    _uiState.value = _uiState.value.copy(
                        error = response.message ?: "Failed to load your tasks"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "Failed to load your tasks: ${e.message}"
                )
            }
        }
    }
    
    fun createTask(name: String, description: String?, difficulty: Int, recurrence: String, requiredPeople: Int, deadline: Date? = null, assignedMemberIds: List<String> = emptyList()) {
        viewModelScope.launch {
            try {
                println("TaskViewModel: Creating task - name: $name, difficulty: $difficulty, recurrence: $recurrence, requiredPeople: $requiredPeople")
                val deadlineString = deadline?.let { 
                    SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(it) 
                }
                val response = taskRepository.createTask(name, description, difficulty, recurrence, requiredPeople, deadlineString, assignedMemberIds)
                println("TaskViewModel: Create task response - success: ${response.success}, message: ${response.message}")
                
                if (response.success) {
                    println("TaskViewModel: Task created successfully, refreshing all task lists")
                    // Small delay to ensure backend has processed the task
                    kotlinx.coroutines.delay(500)
                    // Refresh all task lists after successful creation
                    loadTasks()
                    loadMyTasks()
                    loadWeeklyTasks()
                } else {
                    println("TaskViewModel: Task creation failed: ${response.message}")
                    _uiState.value = _uiState.value.copy(
                        error = response.message ?: "Failed to create task"
                    )
                }
            } catch (e: Exception) {
                println("TaskViewModel: Exception during task creation: ${e.message}")
                e.printStackTrace()
                _uiState.value = _uiState.value.copy(
                    error = "Failed to create task: ${e.message}"
                )
            }
        }
    }
    
    fun updateTaskStatus(taskId: String, newStatus: TaskStatus) {
        viewModelScope.launch {
            try {
                val statusString = when (newStatus) {
                    TaskStatus.INCOMPLETE -> "incomplete"
                    TaskStatus.IN_PROGRESS -> "in-progress"
                    TaskStatus.COMPLETED -> "completed"
                }
                val response = taskRepository.updateTaskStatus(taskId, statusString)
                if (response.success) {
                    // Refresh tasks after successful update
                    loadTasks()
                    loadMyTasks()
                } else {
                    _uiState.value = _uiState.value.copy(
                        error = response.message ?: "Failed to update task status"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "Failed to update task status: ${e.message}"
                )
            }
        }
    }
    
    fun assignTask(taskId: String, userIds: List<String>) {
        viewModelScope.launch {
            try {
                val response = taskRepository.assignTask(taskId, userIds)
                if (response.success) {
                    // Refresh tasks after successful assignment
                    loadTasks()
                    loadMyTasks()
                } else {
                    _uiState.value = _uiState.value.copy(
                        error = response.message ?: "Failed to assign task"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "Failed to assign task: ${e.message}"
                )
            }
        }
    }
    
    fun deleteTask(taskId: String) {
        viewModelScope.launch {
            try {
                val response = taskRepository.deleteTask(taskId)
                if (response.success) {
                    // Remove task from local state immediately
                    val currentState = _uiState.value
                    val updatedTasks = currentState.tasks.filter { it.id != taskId }
                    val updatedMyTasks = currentState.myTasks.filter { it.id != taskId }
                    val updatedDailyTasks = currentState.dailyTasks.filter { it.id != taskId }
                    val updatedWeeklyTasks = currentState.weeklyTasks.filter { it.id != taskId }
                    
                    // Update grouped tasks
                    val updatedAllTasksGrouped = currentState.allTasksGroupedByDay.mapValues { (_, tasks) ->
                        tasks.filter { it.id != taskId }
                    }.filterValues { it.isNotEmpty() }
                    
                    val updatedMyTasksGrouped = currentState.myTasksGroupedByDay.mapValues { (_, tasks) ->
                        tasks.filter { it.id != taskId }
                    }.filterValues { it.isNotEmpty() }
                    
                    _uiState.value = currentState.copy(
                        tasks = updatedTasks,
                        myTasks = updatedMyTasks,
                        dailyTasks = updatedDailyTasks,
                        weeklyTasks = updatedWeeklyTasks,
                        allTasksGroupedByDay = updatedAllTasksGrouped,
                        myTasksGroupedByDay = updatedMyTasksGrouped
                    )
                    
                    // Also refresh from server to ensure consistency
                    loadTasks()
                    loadMyTasks()
                    loadWeeklyTasks()
                    // Reload daily tasks for the currently selected date if we have one
                    currentState.selectedDate?.let { date ->
                        loadTasksForDate(date)
                    }
                } else {
                    _uiState.value = _uiState.value.copy(
                        error = response.message ?: "Failed to delete task"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "Failed to delete task: ${e.message}"
                )
            }
        }
    }
    
    private fun parseIsoDate(isoString: String): Date {
        return try {
            // Parse ISO 8601 date string (e.g., "2025-10-27T02:04:13.878Z")
            val format = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US)
            format.timeZone = java.util.TimeZone.getTimeZone("UTC")
            val parsedDate = format.parse(isoString)
            println("TaskViewModel: Parsed ISO date '$isoString' to ${parsedDate}")
            parsedDate ?: Date(System.currentTimeMillis())
        } catch (e: Exception) {
            println("TaskViewModel: Failed to parse ISO date '$isoString': ${e.message}")
            // Fallback: Try parsing as timestamp
            try {
                val timestamp = isoString.toLongOrNull()
                if (timestamp != null) {
                    println("TaskViewModel: Parsed as timestamp: $timestamp")
                    Date(timestamp)
                } else {
                    println("TaskViewModel: Not a valid timestamp, using current time")
                    Date(System.currentTimeMillis())
                }
            } catch (e2: Exception) {
                println("TaskViewModel: All parsing failed, using current time")
                Date(System.currentTimeMillis())
            }
        }
    }
    
    fun loadGroupMembers() {
        // Load group members from the GroupRepository to get real data
        viewModelScope.launch {
            try {
                println("TaskViewModel: Loading group members...")
                val groupRepository = com.cpen321.roomsync.data.repository.GroupRepository()
                val response = groupRepository.getGroup()
                
                if (response.success && response.data != null) {
                    val group = response.data
                    val userBio = getUserBio() // Get actual user bio from storage
                    
                    println("TaskViewModel: Group data received - Name: ${group.name}, Members count: ${group.members.size}")
                    
                    val groupMembers = group.members.mapIndexed { index, member ->
                        println("TaskViewModel: Processing member $index - Name: ${member.userId.name}, Join Date String: '${member.joinDate}'")
                        
                        val joinDate = parseIsoDate(member.joinDate)
                        val now = Date()
                        val durationMs = now.time - joinDate.time
                        val days = (durationMs / (1000 * 60 * 60 * 24)).toInt()
                        
                        println("TaskViewModel: Member ${member.userId.name} - Join Date: $joinDate, Days ago: $days")
                        
                        ViewModelGroupMember(
                            id = member.userId._id,
                            name = member.userId.name ?: "Unknown",
                            email = member.userId.email,
                            isAdmin = member.userId._id == group.owner._id,
                            joinDate = joinDate,
                            moveInDate = member.moveInDate?.let { parseIsoDate(it) },
                            bio = member.userId.bio ?: "No bio available",
                            profilePicture = null
                        )
                    }
                    
                     // Ensure owner is marked as admin in the members list
                     val allMembers = groupMembers.map { member ->
                         if (member.id == group.owner._id) {
                             member.copy(isAdmin = true)
                         } else {
                             member
                         }
                     }
                    
                    println("TaskViewModel: Final member count: ${allMembers.size}")
                    _uiState.value = _uiState.value.copy(groupMembers = allMembers)
                } else {
                    println("TaskViewModel: Failed to load group - success: ${response.success}, message: ${response.message}")
                    // Fallback to empty list if group loading fails
                    _uiState.value = _uiState.value.copy(groupMembers = emptyList())
                }
            } catch (e: Exception) {
                println("TaskViewModel: Error loading group members: ${e.message}")
                e.printStackTrace()
                // Fallback to empty list on error
                _uiState.value = _uiState.value.copy(groupMembers = emptyList())
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
    
    fun refreshTasks() {
        loadTasks()
        loadMyTasks()
        loadWeeklyTasks()
    }
    
    fun loadWeeklyTasks() {
        viewModelScope.launch {
            try {
                val weekStart = _uiState.value.currentWeekStart
                // Normalize week start to beginning of day for comparison
                val calendar = Calendar.getInstance()
                calendar.time = weekStart
                calendar.set(Calendar.HOUR_OF_DAY, 0)
                calendar.set(Calendar.MINUTE, 0)
                calendar.set(Calendar.SECOND, 0)
                calendar.set(Calendar.MILLISECOND, 0)
                val normalizedWeekStart = calendar.time
                val weekStartString = formatDateForApi(normalizedWeekStart)
                
                // Calculate week end
                val weekEnd = Calendar.getInstance().apply {
                    time = normalizedWeekStart
                    add(Calendar.DAY_OF_WEEK, 6)
                    set(Calendar.HOUR_OF_DAY, 23)
                    set(Calendar.MINUTE, 59)
                    set(Calendar.SECOND, 59)
                    set(Calendar.MILLISECOND, 999)
                }.time
                
                // Load tasks specifically for this week
                val response = taskRepository.getTasksForWeek(weekStartString)
                println("TaskViewModel: Load weekly tasks - weekStart: $weekStartString, response success: ${response.success}, data count: ${response.data?.size ?: 0}")
                if (response.success && response.data != null) {
                    println("TaskViewModel: Backend returned ${response.data.size} tasks for week")
                    // Log all tasks returned by backend for debugging
                    response.data.forEach { task ->
                        println("TaskViewModel: Task from backend - name: ${task.name}, recurrence: ${task.recurrence}, deadline: ${task.deadline}")
                    }
                    // Backend already filters tasks for this week, so use all tasks returned
                    // We just need to filter assignments to show only ones for this week
                    val tasksForThisWeek = response.data.map { task ->
                        // Get assignments for this week only
                        val assignmentsThisWeek = task.assignments.filter { assignment ->
                            try {
                                val assignmentWeekStart = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).parse(assignment.weekStart)
                                if (assignmentWeekStart != null) {
                                    val assignmentCalendar = Calendar.getInstance()
                                    assignmentCalendar.time = assignmentWeekStart
                                    assignmentCalendar.set(Calendar.HOUR_OF_DAY, 0)
                                    assignmentCalendar.set(Calendar.MINUTE, 0)
                                    assignmentCalendar.set(Calendar.SECOND, 0)
                                    assignmentCalendar.set(Calendar.MILLISECOND, 0)
                                    assignmentCalendar.time == normalizedWeekStart
                                } else {
                                    false
                                }
                            } catch (e: Exception) {
                                false
                            }
                        }
                        
                        TaskItem(
                            id = task._id,
                            name = task.name,
                            description = task.description,
                            difficulty = task.difficulty,
                            recurrence = task.recurrence,
                            requiredPeople = task.requiredPeople,
                            deadline = task.deadline?.let { 
                                SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).parse(it)
                            },
                            createdBy = task.createdBy.name ?: "Unknown",
                            createdById = task.createdBy._id,
                            status = when (assignmentsThisWeek.find { it.userId._id == currentUserId }?.status) {
                                "incomplete" -> TaskStatus.INCOMPLETE
                                "in-progress" -> TaskStatus.IN_PROGRESS
                                "completed" -> TaskStatus.COMPLETED
                                else -> TaskStatus.INCOMPLETE
                            },
                            createdAt = Date(task.createdAt.toLongOrNull() ?: System.currentTimeMillis()),
                            completedAt = assignmentsThisWeek.find { it.userId._id == currentUserId }?.completedAt?.let { Date(it.toLongOrNull() ?: 0) },
                            // Only show assignments for this week
                            assignedTo = assignmentsThisWeek.map { it.userId.name ?: "Unknown" }
                        )
                    }
                    
                    println("TaskViewModel: Filtered tasks for week: ${tasksForThisWeek.size}")
                    
                    // Group tasks by day for this week only
                    val allTasksGrouped = groupTasksByDayForWeek(tasksForThisWeek, normalizedWeekStart)
                    
                    println("TaskViewModel: Grouped tasks by day: ${allTasksGrouped.keys}")
                    
                    _uiState.value = _uiState.value.copy(
                        weeklyTasks = tasksForThisWeek,
                        allTasksGroupedByDay = allTasksGrouped
                    )
                } else {
                    _uiState.value = _uiState.value.copy(
                        error = response.message ?: "Failed to load tasks"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "Failed to load tasks: ${e.message}"
                )
            }
        }
    }
    
    fun assignWeeklyTasks() {
        viewModelScope.launch {
            try {
                println("TaskViewModel: Starting weekly task assignment...")
                _uiState.value = _uiState.value.copy(isAssigningWeekly = true)
                val response = taskRepository.assignWeeklyTasks()
                println("TaskViewModel: Assign weekly tasks response - success: ${response.success}, message: ${response.message}")
                
                if (response.success) {
                    println("TaskViewModel: Weekly assignment successful, refreshing all task lists")
                    // Refresh all task lists - loadWeeklyTasks updates allTasksGroupedByDay for weekly view
                    val selectedDate = _uiState.value.selectedDate
                    loadWeeklyTasks() // This updates allTasksGroupedByDay which is used in weekly view
                    loadTasks()
                    loadMyTasks()
                    // Reload daily tasks for the currently selected date if we have one
                    selectedDate?.let { date ->
                        loadTasksForDate(date)
                    }
                    // Set isAssigningWeekly to false after starting all refresh operations
                    _uiState.value = _uiState.value.copy(isAssigningWeekly = false)
                } else {
                    println("TaskViewModel: Weekly assignment failed: ${response.message}")
                    _uiState.value = _uiState.value.copy(
                        error = response.message ?: "Failed to assign weekly tasks",
                        isAssigningWeekly = false
                    )
                }
            } catch (e: Exception) {
                println("TaskViewModel: Exception during weekly assignment: ${e.message}")
                e.printStackTrace()
                _uiState.value = _uiState.value.copy(
                    error = "Failed to assign weekly tasks: ${e.message}",
                    isAssigningWeekly = false
                )
            }
        }
    }
    
    fun changeWeek(weekOffset: Int) {
        val calendar = Calendar.getInstance()
        calendar.time = _uiState.value.currentWeekStart
        calendar.add(Calendar.WEEK_OF_YEAR, weekOffset)
        _uiState.value = _uiState.value.copy(currentWeekStart = calendar.time)
        loadWeeklyTasks()
    }
    
    fun getWeekDisplayText(): String {
        val formatter = SimpleDateFormat("MMM dd", Locale.getDefault())
        val calendar = Calendar.getInstance()
        calendar.time = _uiState.value.currentWeekStart
        val weekStart = formatter.format(calendar.time)
        calendar.add(Calendar.DAY_OF_WEEK, 6)
        val weekEnd = formatter.format(calendar.time)
        return "$weekStart - $weekEnd"
    }
    
    fun loadTasksForDate(date: Date) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            try {
                val dateString = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(date)
                val response = taskRepository.getTasksForDate(dateString)
                
                if (response.success) {
                    val tasks = response.data?.map { apiTask ->
                        TaskItem(
                            id = apiTask._id,
                            name = apiTask.name,
                            description = apiTask.description,
                            difficulty = apiTask.difficulty,
                            recurrence = apiTask.recurrence,
                            requiredPeople = apiTask.requiredPeople,
                            deadline = apiTask.deadline?.let { 
                                SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).parse(it)
                            },
                            createdBy = apiTask.createdBy.name,
                            createdById = apiTask.createdBy._id,
                            status = when (apiTask.assignments.firstOrNull()?.status) {
                                "completed" -> TaskStatus.COMPLETED
                                "in-progress" -> TaskStatus.IN_PROGRESS
                                else -> TaskStatus.INCOMPLETE
                            },
                            createdAt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).parse(apiTask.createdAt) ?: Date(),
                            completedAt = apiTask.assignments.firstOrNull()?.completedAt?.let {
                                SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).parse(it)
                            },
                            assignedTo = apiTask.assignments.map { it.userId.name }
                        )
                    } ?: emptyList()
                    
                    _uiState.value = _uiState.value.copy(
                        dailyTasks = tasks,
                        selectedDate = date,
                        isLoading = false
                    )
                } else {
                    _uiState.value = _uiState.value.copy(
                        error = response.message ?: "Failed to load tasks for date",
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "Error loading tasks for date: ${e.message}",
                    isLoading = false
                )
            }
        }
    }
}