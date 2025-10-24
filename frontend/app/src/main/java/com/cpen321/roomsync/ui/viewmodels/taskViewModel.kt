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
    val groupMembers: List<ViewModelGroupMember> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val showAddTaskDialog: Boolean = false,
    val showAssignDialog: Boolean = false,
    val selectedTask: TaskItem? = null
)

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
        loadTasks()
        loadMyTasks()
        loadGroupMembers()
    }
    
    private fun loadTasks() {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isLoading = true)
                
                val response = taskRepository.getTasks()
                if (response.success && response.data != null) {
                    val tasks = response.data.map { task ->
                        TaskItem(
                            id = task._id,
                            name = task.name,
                            description = task.description,
                            difficulty = task.difficulty,
                            recurrence = task.recurrence,
                            createdBy = task.createdBy.name ?: "Unknown",
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
                            createdBy = task.createdBy.name ?: "Unknown",
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
    
    fun createTask(name: String, description: String?, difficulty: Int, recurrence: String, assignedMemberIds: List<String> = emptyList()) {
        viewModelScope.launch {
            try {
                val response = taskRepository.createTask(name, description, difficulty, recurrence, assignedMemberIds)
                if (response.success) {
                    // Refresh tasks after successful creation
                    loadTasks()
                    loadMyTasks()
                } else {
                    _uiState.value = _uiState.value.copy(
                        error = response.message ?: "Failed to create task"
                    )
                }
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
    
    fun loadGroupMembers() {
        // TODO: Replace with actual API call to get group members
        // Create proper group member profiles
        val userBio = getUserBio() // Get actual user bio from storage
        val groupMembers = listOf(
            ViewModelGroupMember(
                id = currentUserId,
                name = "You",
                email = "you@example.com",
                isAdmin = true,
                joinDate = Date(),
                bio = userBio.ifEmpty { "Tap to add your bio and tell your roommates about yourself!" },
                profilePicture = null
            ),
            ViewModelGroupMember(
                id = "member-a",
                name = "Alex Chen",
                email = "alex.chen@example.com",
                isAdmin = false,
                joinDate = Date(),
                bio = "Computer Science student, loves coding and gaming",
                profilePicture = null
            ),
            ViewModelGroupMember(
                id = "member-b", 
                name = "Blake Johnson",
                email = "blake.johnson@example.com",
                isAdmin = false,
                joinDate = Date(),
                bio = "Engineering student, enjoys outdoor activities and photography",
                profilePicture = null
            ),
            ViewModelGroupMember(
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