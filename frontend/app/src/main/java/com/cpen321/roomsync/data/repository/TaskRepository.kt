package com.cpen321.roomsync.data.repository

import com.cpen321.roomsync.data.models.*
import com.cpen321.roomsync.data.network.RetrofitInstance
import retrofit2.HttpException
import java.io.IOException

class TaskRepository {

    suspend fun getTasks(): TasksResponse {
        return try {
            val response = RetrofitInstance.api.getTasks()
            if (response.isSuccessful) {
                response.body() ?: TasksResponse(false, "Empty response from server")
            } else {
                val errorBody = response.errorBody()?.string()
                TasksResponse(false, errorBody ?: "Get tasks failed: ${response.code()}")
            }
        } catch (e: IOException) {
            TasksResponse(false, "Network error: ${e.message}")
        } catch (e: HttpException) {
            TasksResponse(false, "HTTP error: ${e.code()} - ${e.message()}")
        } catch (e: Exception) {
            TasksResponse(false, "Unexpected error: ${e.message}")
        }
    }

    suspend fun getMyTasks(): TasksResponse {
        return try {
            val response = RetrofitInstance.api.getMyTasks()
            if (response.isSuccessful) {
                response.body() ?: TasksResponse(false, "Empty response from server")
            } else {
                val errorBody = response.errorBody()?.string()
                TasksResponse(false, errorBody ?: "Get my tasks failed: ${response.code()}")
            }
        } catch (e: IOException) {
            TasksResponse(false, "Network error: ${e.message}")
        } catch (e: HttpException) {
            TasksResponse(false, "HTTP error: ${e.code()} - ${e.message()}")
        } catch (e: Exception) {
            TasksResponse(false, "Unexpected error: ${e.message}")
        }
    }

    suspend fun createTask(
        name: String,
        description: String?,
        difficulty: Int,
        recurrence: String,
        assignedUserIds: List<String>? = null
    ): TaskResponse {
        return try {
            val response = RetrofitInstance.api.createTask(
                CreateTaskRequest(name, description, difficulty, recurrence, assignedUserIds)
            )
            if (response.isSuccessful) {
                response.body() ?: TaskResponse(false, "Empty response from server")
            } else {
                val errorBody = response.errorBody()?.string()
                TaskResponse(false, errorBody ?: "Create task failed: ${response.code()}")
            }
        } catch (e: IOException) {
            TaskResponse(false, "Network error: ${e.message}")
        } catch (e: HttpException) {
            TaskResponse(false, "HTTP error: ${e.code()} - ${e.message()}")
        } catch (e: Exception) {
            TaskResponse(false, "Unexpected error: ${e.message}")
        }
    }

    suspend fun updateTaskStatus(taskId: String, status: String): TaskResponse {
        return try {
            val response = RetrofitInstance.api.updateTaskStatus(taskId, UpdateTaskStatusRequest(status))
            if (response.isSuccessful) {
                response.body() ?: TaskResponse(false, "Empty response from server")
            } else {
                val errorBody = response.errorBody()?.string()
                TaskResponse(false, errorBody ?: "Update task status failed: ${response.code()}")
            }
        } catch (e: IOException) {
            TaskResponse(false, "Network error: ${e.message}")
        } catch (e: HttpException) {
            TaskResponse(false, "HTTP error: ${e.code()} - ${e.message()}")
        } catch (e: Exception) {
            TaskResponse(false, "Unexpected error: ${e.message}")
        }
    }

    suspend fun assignTask(taskId: String, userIds: List<String>): TaskResponse {
        return try {
            val response = RetrofitInstance.api.assignTask(taskId, AssignTaskRequest(userIds))
            if (response.isSuccessful) {
                response.body() ?: TaskResponse(false, "Empty response from server")
            } else {
                val errorBody = response.errorBody()?.string()
                TaskResponse(false, errorBody ?: "Assign task failed: ${response.code()}")
            }
        } catch (e: IOException) {
            TaskResponse(false, "Network error: ${e.message}")
        } catch (e: HttpException) {
            TaskResponse(false, "HTTP error: ${e.code()} - ${e.message()}")
        } catch (e: Exception) {
            TaskResponse(false, "Unexpected error: ${e.message}")
        }
    }

    suspend fun deleteTask(taskId: String): ApiResponse<Any> {
        return try {
            val response = RetrofitInstance.api.deleteTask(taskId)
            if (response.isSuccessful) {
                response.body() ?: ApiResponse(false, "Empty response from server")
            } else {
                val errorBody = response.errorBody()?.string()
                ApiResponse(false, errorBody ?: "Delete task failed: ${response.code()}")
            }
        } catch (e: IOException) {
            ApiResponse(false, "Network error: ${e.message}")
        } catch (e: HttpException) {
            ApiResponse(false, "HTTP error: ${e.code()} - ${e.message()}")
        } catch (e: Exception) {
            ApiResponse(false, "Unexpected error: ${e.message}")
        }
    }
}
