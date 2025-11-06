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
                _uiState.value = _uiState.value.copy(
                    error = "Network error: ${e.message}",
                    isLoading = false
                )
            } catch (e: retrofit2.HttpException) {
                _uiState.value = _uiState.value.copy(
                    error = "HTTP error: ${e.code()} - ${e.message()}",
                    isLoading = false
                )
            } catch (e: IllegalArgumentException) {
                _uiState.value = _uiState.value.copy(
                    error = "Invalid data loading tasks: ${e.message}",
                    isLoading = false
                )
            } catch (e: IllegalStateException) {
                _uiState.value = _uiState.value.copy(
                    error = "State error loading tasks: ${e.message}",
                    isLoading = false
                )
            }
        }
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
                    // Refresh tasks after successful deletion
                    loadTasks()
                    loadMyTasks()
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
                // Load all tasks instead of just weekly tasks
                val response = taskRepository.getTasks()
                if (response.success && response.data != null) {
                    val allTasks = response.data.map { task ->
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
                    
                    // Get tasks for current week
                    val weeklyTasks = getTasksForCurrentWeek(allTasks, _uiState.value.currentWeekStart)
                    
                    // Group all tasks by day
                    val allTasksGrouped = groupTasksByDay(allTasks)
                    
                    _uiState.value = _uiState.value.copy(
                        tasks = allTasks,
                        weeklyTasks = weeklyTasks,
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
                    // Refresh all task lists after assignment
                    loadTasks()
                    loadMyTasks()
                    loadWeeklyTasks()
                } else {
                    println("TaskViewModel: Weekly assignment failed: ${response.message}")
                    _uiState.value = _uiState.value.copy(
                        error = response.message ?: "Failed to assign weekly tasks"
                    )
                }
            } catch (e: Exception) {
                println("TaskViewModel: Exception during weekly assignment: ${e.message}")
                e.printStackTrace()
                _uiState.value = _uiState.value.copy(
                    error = "Failed to assign weekly tasks: ${e.message}"
                )
            } finally {
                _uiState.value = _uiState.value.copy(isAssigningWeekly = false)
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