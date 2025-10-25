package com.cpen321.roomsync.data.models

data class ProfileSetRequest(
    val email: String,
    val dob: String,
    val gender: String
)

data class ProfileResponse(
    val success: Boolean,
    val message: String,
    val user: User
)