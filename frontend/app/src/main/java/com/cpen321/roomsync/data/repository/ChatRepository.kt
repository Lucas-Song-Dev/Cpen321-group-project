package com.cpen321.roomsync.data.repository

import com.cpen321.roomsync.data.models.*
import com.cpen321.roomsync.data.network.RetrofitInstance
import retrofit2.HttpException
import java.io.IOException

class ChatRepository {

    suspend fun getMessages(groupId: String): MessagesResponse {
        return try {
            val response = RetrofitInstance.api.getMessages(groupId)
            if (response.isSuccessful) {
                response.body() ?: MessagesResponse(false, "Empty response from server")
            } else {
                val errorBody = response.errorBody()?.string()
                MessagesResponse(false, errorBody ?: "Get messages failed: ${response.code()}")
            }
        } catch (e: IOException) {
            MessagesResponse(false, "Network error: ${e.message}")
        } catch (e: HttpException) {
            MessagesResponse(false, "HTTP error: ${e.code()} - ${e.message()}")
        } catch (e: Exception) {
            MessagesResponse(false, "Unexpected error: ${e.message}")
        }
    }

    suspend fun sendMessage(groupId: String, content: String): MessageResponse {
        return try {
            val response = RetrofitInstance.api.sendMessage(groupId, SendMessageRequest(content))
            if (response.isSuccessful) {
                response.body() ?: MessageResponse(false, "Empty response from server")
            } else {
                val errorBody = response.errorBody()?.string()
                MessageResponse(false, errorBody ?: "Send message failed: ${response.code()}")
            }
        } catch (e: IOException) {
            MessageResponse(false, "Network error: ${e.message}")
        } catch (e: HttpException) {
            MessageResponse(false, "HTTP error: ${e.code()} - ${e.message()}")
        } catch (e: Exception) {
            MessageResponse(false, "Unexpected error: ${e.message}")
        }
    }

    suspend fun createPoll(
        groupId: String,
        question: String,
        options: List<String>,
        expiresInDays: Int = 7
    ): MessageResponse {
        return try {
            val response = RetrofitInstance.api.createPoll(
                groupId,
                CreatePollRequest(question, options, expiresInDays)
            )
            if (response.isSuccessful) {
                response.body() ?: MessageResponse(false, "Empty response from server")
            } else {
                val errorBody = response.errorBody()?.string()
                MessageResponse(false, errorBody ?: "Create poll failed: ${response.code()}")
            }
        } catch (e: IOException) {
            MessageResponse(false, "Network error: ${e.message}")
        } catch (e: HttpException) {
            MessageResponse(false, "HTTP error: ${e.code()} - ${e.message()}")
        } catch (e: Exception) {
            MessageResponse(false, "Unexpected error: ${e.message}")
        }
    }

    suspend fun votePoll(groupId: String, messageId: String, option: String): MessageResponse {
        return try {
            val response = RetrofitInstance.api.votePoll(groupId, messageId, VotePollRequest(option))
            if (response.isSuccessful) {
                response.body() ?: MessageResponse(false, "Empty response from server")
            } else {
                val errorBody = response.errorBody()?.string()
                MessageResponse(false, errorBody ?: "Vote poll failed: ${response.code()}")
            }
        } catch (e: IOException) {
            MessageResponse(false, "Network error: ${e.message}")
        } catch (e: HttpException) {
            MessageResponse(false, "HTTP error: ${e.code()} - ${e.message()}")
        } catch (e: Exception) {
            MessageResponse(false, "Unexpected error: ${e.message}")
        }
    }

    suspend fun deleteMessage(groupId: String, messageId: String): ApiResponse<Any> {
        return try {
            val response = RetrofitInstance.api.deleteMessage(groupId, messageId)
            if (response.isSuccessful) {
                response.body() ?: ApiResponse(false, "Empty response from server")
            } else {
                val errorBody = response.errorBody()?.string()
                ApiResponse(false, errorBody ?: "Delete message failed: ${response.code()}")
            }
        } catch (e: IOException) {
            ApiResponse(false, "Network error: ${e.message}")
        } catch (e: HttpException) {
            ApiResponse(false, "HTTP error: ${e.code()} - ${e.message()}")
        } catch (e: Exception) {
            ApiResponse(false, "Unexpected error: ${e.message}")
        }
    }
}
