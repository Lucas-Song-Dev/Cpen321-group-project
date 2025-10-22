package com.cpen321.roomsync.data.models

//what the backend sends back to the app after login/signup.

data class AuthResponse(
    val success: Boolean,
    val message: String,
    val userGroupName: String? = null
)

data class User(
    val email: String,
    val name: String?,
    val groupName: String?
)
