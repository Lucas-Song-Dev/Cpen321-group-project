package com.cpen321.roomsync.data.models

//what the backend sends back to the app after login/signup.

//not sure:
import java.util.Date

data class AuthResponse(
    val success: Boolean,
    val message: String,
    val userGroupName: String? = null, //delete later
    val user: User? = null
)

data class User(
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