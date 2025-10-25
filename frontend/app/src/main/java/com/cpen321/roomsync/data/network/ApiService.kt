package com.cpen321.roomsync.data.network

import com.cpen321.roomsync.data.models.*
import retrofit2.http.*
import com.cpen321.roomsync.data.models.AuthRequest
import com.cpen321.roomsync.data.models.AuthResponse
import com.cpen321.roomsync.data.models.ProfileSetRequest
import com.cpen321.roomsync.data.models.User
import com.cpen321.roomsync.data.models.ProfileResponse


import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.DELETE


interface ApiService {
    @POST("api/auth/login")
    suspend fun login(@Body request: AuthRequest): Response<AuthResponse>

    @POST("api/auth/signup")
    suspend fun signup(@Body request: AuthRequest): Response<AuthResponse>

    // Group endpoints
    @POST("api/group")
    suspend fun createGroup(@Body request: CreateGroupRequest): Response<GroupResponse>

    @POST("api/group/join")
    suspend fun joinGroup(@Body request: JoinGroupRequest): Response<GroupResponse>

    @GET("api/group")
    suspend fun getGroup(): Response<GroupResponse>

    @DELETE("api/group/leave")
    suspend fun leaveGroup(): Response<ApiResponse<Any>>

    // Task endpoints
    @GET("api/task")
    suspend fun getTasks(): Response<TasksResponse>

    @GET("api/task/my-tasks")
    suspend fun getMyTasks(): Response<TasksResponse>

    @POST("api/task")
    suspend fun createTask(@Body request: CreateTaskRequest): Response<TaskResponse>

    @PUT("api/task/{id}/status")
    suspend fun updateTaskStatus(@Path("id") taskId: String, @Body request: UpdateTaskStatusRequest): Response<TaskResponse>

    @POST("api/task/{id}/assign")
    suspend fun assignTask(@Path("id") taskId: String, @Body request: AssignTaskRequest): Response<TaskResponse>

    @DELETE("api/task/{id}")
    suspend fun deleteTask(@Path("id") taskId: String): Response<ApiResponse<Any>>

    // Chat endpoints
    @GET("api/chat/{groupId}/messages")
    suspend fun getMessages(@Path("groupId") groupId: String): Response<MessagesResponse>

    @POST("api/chat/{groupId}/message")
    suspend fun sendMessage(@Path("groupId") groupId: String, @Body request: SendMessageRequest): Response<MessageResponse>

    @POST("api/chat/{groupId}/poll")
    suspend fun createPoll(@Path("groupId") groupId: String, @Body request: CreatePollRequest): Response<MessageResponse>

    @POST("api/chat/{groupId}/poll/{messageId}/vote")
    suspend fun votePoll(@Path("groupId") groupId: String, @Path("messageId") messageId: String, @Body request: VotePollRequest): Response<MessageResponse>

    @DELETE("api/chat/{groupId}/message/{messageId}")
    suspend fun deleteMessage(@Path("groupId") groupId: String, @Path("messageId") messageId: String): Response<ApiResponse<Any>>
    @PUT("api/users/profile")
    suspend fun updateProfile(@Body profileSetRequest: ProfileSetRequest): Response<ProfileResponse>

    @PUT("api/users/optionalProfile")
    suspend fun updateOptionalProfile(@Body request: ProfileUpdateRequest): Response<ProfileResponse>

    @GET("api/users/profile")
    suspend fun getProfile(@Query("email") email: String): Response<ProfileResponse>

    // User endpoints
    @DELETE("api/user/users/me")
    suspend fun deleteUser(): Response<ApiResponse<Any>>
}