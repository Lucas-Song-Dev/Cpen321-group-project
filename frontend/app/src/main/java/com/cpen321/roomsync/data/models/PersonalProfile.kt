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

data class ProfileUpdateRequest(
    val email: String,
    val bio: String?,
    val profilePicture: String?,
    val livingPreferences: LivingPreferences?,
    val groupName: String?
)

data class LivingPreferences(
    val schedule: String?,
    val drinking: String?,
    val partying: String?,
    val noise: String?,
    val profession: String?
)