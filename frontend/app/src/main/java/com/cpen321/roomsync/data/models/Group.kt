package com.cpen321.roomsync.data.models

data class Group(
    val _id: String,
    val name: String,
    val groupCode: String,
    val owner: User,
    val members: List<GroupMember>,
    val createdAt: String,
    val updatedAt: String
)

data class GroupMember(
    val userId: User,
    val joinDate: String,
    val moveInDate: String? = null
)

data class CreateGroupRequest(
    val name: String
)

data class JoinGroupRequest(
    val groupCode: String
)

data class GroupResponse(
    val success: Boolean,
    val message: String? = null,
    val data: Group? = null
)
