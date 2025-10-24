package com.cpen321.roomsync.data.models

data class Task(
    val _id: String,
    val name: String,
    val description: String?,
    val groupId: String,
    val createdBy: User,
    val difficulty: Int,
    val recurrence: String,
    val assignments: List<TaskAssignment>,
    val createdAt: String,
    val updatedAt: String
)

data class TaskAssignment(
    val userId: User,
    val weekStart: String,
    val status: String,
    val completedAt: String? = null
)

data class CreateTaskRequest(
    val name: String,
    val description: String? = null,
    val difficulty: Int,
    val recurrence: String,
    val assignedUserIds: List<String>? = null
)

data class UpdateTaskStatusRequest(
    val status: String
)

data class AssignTaskRequest(
    val userIds: List<String>
)

data class TaskResponse(
    val success: Boolean,
    val message: String? = null,
    val data: Task? = null
)

data class TasksResponse(
    val success: Boolean,
    val message: String? = null,
    val data: List<Task>? = null
)
