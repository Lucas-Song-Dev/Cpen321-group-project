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
    val groupMembers: List<ViewModelGroupMember> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val showAddTaskDialog: Boolean = false,
    val showAssignDialog: Boolean = false,
    val selectedTask: TaskItem? = null,
    val currentWeekStart: Date = Date(),
    val weeklyTasks: List<TaskItem> = emptyList(),
    val isAssigningWeekly: Boolean = false
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
    
    private fun loadTasks() {
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
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "Failed to load tasks: ${e.message}",
                    isLoading = false
                )
            }
        }
    }
    
    private fun loadMyTasks() {
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
                    _uiState.value = _uiState.value.copy(myTasks = myTasks)
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
    
    fun createTask(name: String, description: String?, difficulty: Int, recurrence: String, requiredPeople: Int, assignedMemberIds: List<String> = emptyList()) {
        viewModelScope.launch {
            try {
                println("TaskViewModel: Creating task - name: $name, difficulty: $difficulty, recurrence: $recurrence, requiredPeople: $requiredPeople")
                val response = taskRepository.createTask(name, description, difficulty, recurrence, requiredPeople, assignedMemberIds)
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
    
    private fun loadWeeklyTasks() {
        viewModelScope.launch {
            try {
                val weekStart = formatDateForApi(_uiState.value.currentWeekStart)
                val response = taskRepository.getTasksForWeek(weekStart)
                if (response.success && response.data != null) {
                    val tasks = response.data.map { task ->
                        TaskItem(
                            id = task._id,
                            name = task.name,
                            description = task.description,
                            difficulty = task.difficulty,
                            recurrence = task.recurrence,
                            requiredPeople = task.requiredPeople,
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
                    _uiState.value = _uiState.value.copy(weeklyTasks = tasks)
                } else {
                    _uiState.value = _uiState.value.copy(
                        error = response.message ?: "Failed to load weekly tasks"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "Failed to load weekly tasks: ${e.message}"
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
}