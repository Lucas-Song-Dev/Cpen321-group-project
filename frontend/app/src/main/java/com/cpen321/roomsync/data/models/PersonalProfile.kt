package com.cpen321.roomsync.data.models


data class ProfileResponse(
    val success: Boolean,
    val message: String,
    val user: User
)

//FOR MANDATORY PROFILE
data class ProfileSetRequest(
    val email: String,
    val name: String,
    val updatedEmail: String? = null,
    val dob: String,
    val gender: String
)


//FOR OPTIONAL PROFILE
data class ProfileUpdateRequest(
    val email: String,
    val bio: String?,
    val profilePicture: String?,
    val livingPreferences: LivingPreferences?,
)

data class LivingPreferences(
    val schedule: String?,
    val drinking: String?,
    val partying: String?,
    val noise: String?,
    val profession: String?
)