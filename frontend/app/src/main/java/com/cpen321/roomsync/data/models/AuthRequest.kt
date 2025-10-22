package com.cpen321.roomsync.data.models

//body of the POST request sent to the backend when the user logs in or signs up.

data class AuthRequest(
    val token: String
)