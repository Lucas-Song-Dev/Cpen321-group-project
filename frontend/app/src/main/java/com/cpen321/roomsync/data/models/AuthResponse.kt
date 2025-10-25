package com.cpen321.roomsync.data.models

//what the backend sends back to the app after login/signup.

//not sure:
import java.util.Date

data class AuthResponse(
    val success: Boolean,
    val message: String,
    val user: User? = null,
    val token: String? = null,
    val userGroupName: String? = null
)

data class ApiResponse<T>(
    val success: Boolean,
    val message: String? = null,
    val data: T? = null
)

data class User(
    val _id: String,
    val email: String,
    val name: String,
    val dob: Date?,
    val gender: String?,
    val profileComplete: Boolean,

    //optional properties
    val bio: String?,
    val profilePicture: String?,
    val livingPreferences: LivingPreferences?,
    val groupName: String?,
)