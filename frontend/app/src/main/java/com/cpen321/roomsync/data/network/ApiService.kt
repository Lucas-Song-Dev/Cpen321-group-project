package com.cpen321.roomsync.data.network

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

    @PUT("api/users/profile")
    suspend fun updateProfile(@Body profileSetRequest: ProfileSetRequest): Response<ProfileResponse>

    @PUT("api/users/optionalProfile")
    suspend fun updateOptionalProfile(@Body profileSetRequest: ProfileSetRequest): Response<ProfileResponse>
}