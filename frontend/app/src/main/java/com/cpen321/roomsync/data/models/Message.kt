package com.cpen321.roomsync.data.models

data class Message(
    val _id: String,
    val groupId: String,
    val senderId: SenderId,
    val content: String,
    val type: String,
    val pollData: PollData? = null,
    val createdAt: String,
    val updatedAt: String,
    val pollResults: Map<String, Int>? = null,
    val isPollExpired: Boolean = false,
    val totalPollVotes: Int = 0,
    val id: String? = null
)

data class SenderId(
    val _id: String,
    val name: String? = null
)

data class PollData(
    val question: String,
    val options: List<String>,
    val votes: List<PollVote>,
    val expiresAt: String
)

data class PollVote(
    val userId: String,
    val option: String,
    val timestamp: String
)

data class SendMessageRequest(
    val content: String
)

data class CreatePollRequest(
    val question: String,
    val options: List<String>,
    val expiresInDays: Int = 7
)

data class VotePollRequest(
    val option: String
)

data class MessageResponse(
    val success: Boolean,
    val message: String? = null,
    val data: Message? = null
)

data class MessagesResponse(
    val success: Boolean,
    val message: String? = null,
    val data: MessagesData? = null
)

data class MessagesData(
    val messages: List<Message>,
    val pagination: PaginationData
)

data class PaginationData(
    val page: Int,
    val limit: Int,
    val total: Int
)
