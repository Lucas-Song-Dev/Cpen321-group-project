package com.cpen321.roomsync.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.*

data class TaskItem(
    val id: String,
    val name: String,
    val description: String?,
    val difficulty: Int,
    val recurrence: String,
    val createdBy: String,
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
    val groupMembers: List<GroupMember> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val showAddTaskDialog: Boolean = false,
    val showAssignDialog: Boolean = false,
    val selectedTask: TaskItem? = null
)

data class GroupMember(
    val id: String,
    val name: String,
    val email: String = "",
    val isAdmin: Boolean = false,
    val joinDate: Date = Date(),
    val bio: String = "",
    val profilePicture: String? = null
)

class TaskViewModel(
    private val groupId: String,
    private val currentUserId: String
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
        loadTasks()
        loadMyTasks()
        loadGroupMembers()
    }
    
    private fun loadTasks() {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isLoading = true)
                
                // TODO: Implement API call to load tasks
                // val response = taskApi.getTasks(groupId)
                // val tasks = response.data.tasks.map { task ->
                //     TaskItem(
                //         id = task.id,
                //         name = task.name,
                //         description = task.description,
                //         difficulty = task.difficulty,
                //         recurrence = task.recurrence,
                //         createdBy = task.createdBy.fullname ?: "Unknown",
                //         status = when (task.currentWeekAssignment?.status) {
                //             "incomplete" -> TaskStatus.INCOMPLETE
                //             "in-progress" -> TaskStatus.IN_PROGRESS
                //             "completed" -> TaskStatus.COMPLETED
                //             else -> TaskStatus.INCOMPLETE
                //         },
                //         createdAt = task.createdAt,
                //         completedAt = task.currentWeekAssignment?.completedAt,
                //         assignedTo = task.assignments.map { it.userId.fullname ?: "Unknown" }
                //     )
                // }
                
                // For now, use sample data with proper group members
                val sampleTasks = listOf(
                    TaskItem(
                        id = "1",
                        name = "Take out trash",
                        description = "Empty all trash bins and take to the curb",
                        difficulty = 2,
                        recurrence = "weekly",
                        createdBy = "You",
                        status = TaskStatus.INCOMPLETE,
                        createdAt = Date(System.currentTimeMillis() - 86400000),
                        completedAt = null,
                        assignedTo = listOf("Alex Chen", "Blake Johnson")
                    ),
                    TaskItem(
                        id = "2",
                        name = "Clean kitchen",
                        description = "Wash dishes, wipe counters, clean stove",
                        difficulty = 3,
                        recurrence = "daily",
                        createdBy = "You",
                        status = TaskStatus.IN_PROGRESS,
                        createdAt = Date(System.currentTimeMillis() - 172800000),
                        completedAt = null,
                        assignedTo = listOf("Casey Smith")
                    ),
                    TaskItem(
                        id = "3",
                        name = "Vacuum living room",
                        description = "Vacuum the entire living room area",
                        difficulty = 2,
                        recurrence = "weekly",
                        createdBy = "You",
                        status = TaskStatus.COMPLETED,
                        createdAt = Date(System.currentTimeMillis() - 259200000),
                        completedAt = Date(System.currentTimeMillis() - 43200000),
                        assignedTo = listOf("Alex Chen")
                    ),
                    TaskItem(
                        id = "4",
                        name = "Grocery shopping",
                        description = "Buy groceries for the week",
                        difficulty = 4,
                        recurrence = "weekly",
                        createdBy = "You",
                        status = TaskStatus.INCOMPLETE,
                        createdAt = Date(System.currentTimeMillis() - 345600000),
                        completedAt = null,
                        assignedTo = listOf("Blake Johnson")
                    ),
                    TaskItem(
                        id = "5",
                        name = "Organize common areas",
                        description = "Tidy up living room and organize shared spaces",
                        difficulty = 3,
                        recurrence = "weekly",
                        createdBy = "You",
                        status = TaskStatus.INCOMPLETE,
                        createdAt = Date(System.currentTimeMillis() - 432000000),
                        completedAt = null,
                        assignedTo = listOf("Casey Smith")
                    )
                )
                
                _uiState.value = _uiState.value.copy(
                    tasks = sampleTasks,
                    isLoading = false
                )
                
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
                // TODO: Implement API call to load user's tasks
                // val response = taskApi.getMyTasks(groupId)
                // val myTasks = response.data.tasks.map { task ->
                //     // Convert to TaskItem similar to loadTasks()
                // }
                
                // For now, filter from all tasks
                val myTasks = _uiState.value.tasks.filter { task ->
                    task.assignedTo.contains("You") || task.createdBy == "You"
                }
                
                _uiState.value = _uiState.value.copy(myTasks = myTasks)
                
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "Failed to load your tasks: ${e.message}"
                )
            }
        }
    }
    
    fun createTask(name: String, description: String?, difficulty: Int, recurrence: String, assignedMemberIds: List<String> = emptyList()) {
        viewModelScope.launch {
            try {
                // TODO: Implement API call to create task
                // val response = taskApi.createTask(groupId, name, description, difficulty, recurrence)
                
                // Get assigned member names
                val assignedMembers = assignedMemberIds.mapNotNull { memberId ->
                    _uiState.value.groupMembers.find { it.id == memberId }
                }.map { member -> member.name }

                val newTask = TaskItem(
                    id = UUID.randomUUID().toString(),
                    name = name,
                    description = description,
                    difficulty = difficulty,
                    recurrence = recurrence,
                    createdBy = "You",
                    status = TaskStatus.INCOMPLETE,
                    createdAt = Date(),
                    completedAt = null,
                    assignedTo = assignedMembers
                )
                
                // Add to UI immediately for better UX
                _uiState.value = _uiState.value.copy(
                    tasks = _uiState.value.tasks + newTask
                )
                
                // Refresh my tasks
                loadMyTasks()
                
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "Failed to create task: ${e.message}"
                )
            }
        }
    }
    
    fun updateTaskStatus(taskId: String, newStatus: TaskStatus) {
        viewModelScope.launch {
            try {
                // TODO: Implement API call to update task status
                // val statusString = when (newStatus) {
                //     TaskStatus.INCOMPLETE -> "incomplete"
                //     TaskStatus.IN_PROGRESS -> "in-progress"
                //     TaskStatus.COMPLETED -> "completed"
                // }
                // taskApi.updateTaskStatus(taskId, statusString)
                
                // Update UI immediately
                val updatedTasks = _uiState.value.tasks.map { task ->
                    if (task.id == taskId) {
                        task.copy(
                            status = newStatus,
                            completedAt = if (newStatus == TaskStatus.COMPLETED) Date() else null
                        )
                    } else {
                        task
                    }
                }
                
                _uiState.value = _uiState.value.copy(tasks = updatedTasks)
                
                // Refresh my tasks
                loadMyTasks()
                
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
                // TODO: Implement API call to assign task
                // taskApi.assignTask(taskId, userIds)
                
                // Update UI immediately
                val updatedTasks = _uiState.value.tasks.map { task ->
                    if (task.id == taskId) {
                        task.copy(assignedTo = userIds)
                    } else {
                        task
                    }
                }
                
                _uiState.value = _uiState.value.copy(tasks = updatedTasks)
                
                // Refresh my tasks
                loadMyTasks()
                
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
                // TODO: Implement API call to delete task
                // taskApi.deleteTask(taskId)
                
                // Update UI immediately
                val updatedTasks = _uiState.value.tasks.filter { it.id != taskId }
                _uiState.value = _uiState.value.copy(tasks = updatedTasks)
                
                // Refresh my tasks
                loadMyTasks()
                
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "Failed to delete task: ${e.message}"
                )
            }
        }
    }
    
    fun loadGroupMembers() {
        // TODO: Replace with actual API call to get group members
        // Create proper group member profiles
        val userBio = getUserBio() // Get actual user bio from storage
        val groupMembers = listOf(
            GroupMember(
                id = currentUserId,
                name = "You",
                email = "you@example.com",
                isAdmin = true,
                joinDate = Date(),
                bio = userBio.ifEmpty { "Tap to add your bio and tell your roommates about yourself!" },
                profilePicture = null
            ),
            GroupMember(
                id = "member-a",
                name = "Alex Chen",
                email = "alex.chen@example.com",
                isAdmin = false,
                joinDate = Date(),
                bio = "Computer Science student, loves coding and gaming",
                profilePicture = null
            ),
            GroupMember(
                id = "member-b", 
                name = "Blake Johnson",
                email = "blake.johnson@example.com",
                isAdmin = false,
                joinDate = Date(),
                bio = "Engineering student, enjoys outdoor activities and photography",
                profilePicture = null
            ),
            GroupMember(
                id = "member-c",
                name = "Casey Smith", 
                email = "casey.smith@example.com",
                isAdmin = false,
                joinDate = Date(),
                bio = "Business student, passionate about music and art",
                profilePicture = null
            )
        )
        
        _uiState.value = _uiState.value.copy(groupMembers = groupMembers)
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
    
    fun refreshTasks() {
        loadTasks()
        loadMyTasks()
    }
}