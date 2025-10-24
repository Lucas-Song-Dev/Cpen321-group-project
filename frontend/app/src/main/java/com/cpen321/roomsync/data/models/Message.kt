package com.cpen321.roomsync.data.models

data class Message(
    val _id: String,
    val groupId: String,
    val senderId: User,
    val content: String,
    val type: String,
    val pollData: PollData? = null,
    val createdAt: String,
    val updatedAt: String
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
    val data: List<Message>? = null
)
