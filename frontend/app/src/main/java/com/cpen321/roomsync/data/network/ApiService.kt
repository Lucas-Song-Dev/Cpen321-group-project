package com.cpen321.roomsync.data.network

import com.cpen321.roomsync.data.models.AuthRequest
import com.cpen321.roomsync.data.models.AuthResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface ApiService {
    @POST("api/auth/login")
    suspend fun login(@Body request: AuthRequest): Response<AuthResponse>

    @POST("api/auth/signup")
    suspend fun signup(@Body request: AuthRequest): Response<AuthResponse>
}
