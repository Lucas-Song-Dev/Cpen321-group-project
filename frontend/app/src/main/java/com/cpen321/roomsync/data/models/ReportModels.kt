package com.cpen321.roomsync.data.models

import com.google.gson.annotations.SerializedName

data class ReportUserRequest(
    @SerializedName("reportedUserId") val reportedUserId: String,
    @SerializedName("reporterId") val reporterId: String,
    @SerializedName("groupId") val groupId: String,
    @SerializedName("reason") val reason: String? = null
)

data class ReportUserResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String,
    @SerializedName("data") val data: ReportData?
)

data class ReportData(
    @SerializedName("isOffensive") val isOffensive: Boolean,
    @SerializedName("actionTaken") val actionTaken: String?  // Added String? type
)