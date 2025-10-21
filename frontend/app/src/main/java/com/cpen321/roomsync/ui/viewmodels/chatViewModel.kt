package com.cpen321.roomsync.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.*

data class ChatMessage(
    val id: String,
    val content: String,
    val senderName: String,
    val senderId: String,
    val timestamp: Date,
    val isOwnMessage: Boolean = false,
    val type: MessageType = MessageType.TEXT
)

data class PollMessage(
    val id: String,
    val question: String,
    val options: List<String>,
    val votes: Map<String, Int>,
    val senderName: String,
    val senderId: String,
    val timestamp: Date,
    val expiresAt: Date,
    val isExpired: Boolean = false,
    val userVote: String? = null,
    val pollType: PollType = PollType.SINGLE_CHOICE
)

enum class PollType {
    SINGLE_CHOICE, MULTIPLE_CHOICE
}

enum class MessageType {
    TEXT, POLL
}

data class ChatUiState(
    val messages: List<ChatMessage> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val isConnected: Boolean = false
)

class ChatViewModel(
    private val groupId: String,
    private val currentUserId: String
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()
    
    private var socket: Any? = null // TODO: Replace with actual Socket.IO client
    
    init {
        connectToChat()
        loadMessages()
        SharedPollRepository.setCurrentUserId(currentUserId)
    }
    
    private fun connectToChat() {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isLoading = true)
                
                // TODO: Implement Socket.IO connection
                // socket = IO.socket("ws://localhost:3000")
                // socket?.on(Socket.EVENT_CONNECT) { 
                //     _uiState.value = _uiState.value.copy(isConnected = true, isLoading = false)
                //     socket?.emit("join-group", groupId)
                // }
                
                // For now, simulate connection
                _uiState.value = _uiState.value.copy(isConnected = true, isLoading = false)
                
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "Failed to connect to chat: ${e.message}",
                    isLoading = false
                )
            }
        }
    }
    
    private fun loadMessages() {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isLoading = true)
                
                // TODO: Implement API call to load messages
                // val response = chatApi.getMessages(groupId)
                // val messages = response.data.messages.map { message ->
                //     ChatMessage(
                //         id = message.id,
                //         content = message.content,
                //         senderName = message.senderId.fullname ?: "Unknown",
                //         senderId = message.senderId.id,
                //         timestamp = message.createdAt,
                //         isOwnMessage = message.senderId.id == currentUserId
                //     )
                // }
                
                // For now, use sample data
                val sampleMessages = listOf(
                    ChatMessage(
                        id = "1",
                        content = "Hey everyone! Welcome to our group chat!",
                        senderName = "Alice",
                        senderId = "alice-id",
                        timestamp = Date(System.currentTimeMillis() - 3600000),
                        isOwnMessage = false
                    ),
                    ChatMessage(
                        id = "2", 
                        content = "Thanks for setting this up!",
                        senderName = "Bob",
                        senderId = "bob-id",
                        timestamp = Date(System.currentTimeMillis() - 3000000),
                        isOwnMessage = false
                    ),
                    ChatMessage(
                        id = "3",
                        content = "Looking forward to living with you all!",
                        senderName = "You",
                        senderId = currentUserId,
                        timestamp = Date(System.currentTimeMillis() - 1800000),
                        isOwnMessage = true
                    )
                )
                
                _uiState.value = _uiState.value.copy(
                    messages = sampleMessages,
                    isLoading = false
                )
                
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "Failed to load messages: ${e.message}",
                    isLoading = false
                )
            }
        }
    }
    
    fun sendMessage(content: String) {
        if (content.trim().isEmpty()) return
        
        viewModelScope.launch {
            try {
                val newMessage = ChatMessage(
                    id = UUID.randomUUID().toString(),
                    content = content.trim(),
                    senderName = "You",
                    senderId = currentUserId,
                    timestamp = Date(),
                    isOwnMessage = true
                )
                
                // Add message to UI immediately for better UX
                _uiState.value = _uiState.value.copy(
                    messages = _uiState.value.messages + newMessage
                )
                
                // TODO: Send message via Socket.IO
                // socket?.emit("send-message", mapOf(
                //     "groupId" to groupId,
                //     "senderId" to currentUserId,
                //     "content" to content.trim(),
                //     "type" to "text"
                // ))
                
                // TODO: Also send via REST API as fallback
                // chatApi.sendMessage(groupId, content.trim())
                
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "Failed to send message: ${e.message}"
                )
            }
        }
    }
    
    fun createPoll(question: String, options: List<String>) {
        if (question.trim().isEmpty() || options.size < 2) return
        
        viewModelScope.launch {
            try {
                val pollMessage = ChatMessage(
                    id = UUID.randomUUID().toString(),
                    content = question.trim(),
                    senderName = "You",
                    senderId = currentUserId,
                    timestamp = Date(),
                    isOwnMessage = true,
                    type = MessageType.POLL
                )
                
                // Add poll to UI immediately
                _uiState.value = _uiState.value.copy(
                    messages = _uiState.value.messages + pollMessage
                )
                
                // TODO: Send poll via Socket.IO
                // socket?.emit("send-poll", mapOf(
                //     "groupId" to groupId,
                //     "senderId" to currentUserId,
                //     "question" to question.trim(),
                //     "options" to options,
                //     "expiresInDays" to 7
                // ))
                
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "Failed to create poll: ${e.message}"
                )
            }
        }
    }
    
    fun voteOnPoll(messageId: String, option: String) {
        viewModelScope.launch {
            try {
                // TODO: Implement poll voting
                // socket?.emit("vote-poll", mapOf(
                //     "messageId" to messageId,
                //     "option" to option,
                //     "userId" to currentUserId,
                //     "groupId" to groupId
                // ))
                
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "Failed to vote: ${e.message}"
                )
            }
        }
    }
    
    fun createPoll(
        question: String,
        options: List<String>,
        pollType: PollType,
        durationDays: Int
    ) {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isLoading = true)
                
                // Create shared poll item
                val sharedPoll = SharedPollItem(
                    id = UUID.randomUUID().toString(),
                    question = question,
                    options = options.map { option ->
                        SharedPollOption(text = option, votes = 0, percentage = 0f)
                    },
                    createdBy = "You", // TODO: Get actual user name
                    createdAt = Date(),
                    expiresAt = Date(System.currentTimeMillis() + durationDays * 24 * 60 * 60 * 1000L),
                    status = SharedPollStatus.ACTIVE,
                    totalVotes = 0,
                    type = pollType,
                    createdInChat = true
                )
                
                // Add to shared repository
                SharedPollRepository.addPoll(sharedPoll)
                
                // Create poll message for chat
                val pollMessage = PollMessage(
                    id = sharedPoll.id,
                    question = question,
                    options = options,
                    votes = emptyMap(),
                    senderName = "You",
                    senderId = currentUserId,
                    timestamp = Date(),
                    expiresAt = sharedPoll.expiresAt,
                    pollType = pollType
                )
                
                // Convert PollMessage to ChatMessage for display
                val chatMessage = ChatMessage(
                    id = pollMessage.id,
                    content = pollMessage.question,
                    senderName = pollMessage.senderName,
                    senderId = pollMessage.senderId,
                    timestamp = pollMessage.timestamp,
                    isOwnMessage = true,
                    type = MessageType.POLL
                )
                
                // Add poll message to the chat
                val newMessages = _uiState.value.messages + chatMessage
                _uiState.value = _uiState.value.copy(
                    messages = newMessages,
                    isLoading = false
                )
                
                // TODO: Send poll to backend via Socket.IO
                // socket?.emit("send-poll", pollMessage)
                
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = e.message ?: "Failed to create poll",
                    isLoading = false
                )
            }
        }
    }

    fun voteOnPollInChat(pollId: String, option: String) {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isLoading = true)
                
                // Update shared repository
                SharedPollRepository.voteOnPoll(pollId, option)
                
                // Update chat message - keep it as ChatMessage but update the shared repository
                // The chat will show the poll as a message, voting is handled by the shared repository
                val updatedMessages = _uiState.value.messages
                
                _uiState.value = _uiState.value.copy(
                    messages = updatedMessages,
                    isLoading = false
                )
                
                // TODO: Send vote to backend via Socket.IO
                // socket?.emit("vote-poll", mapOf("pollId" to pollId, "option" to option))
                
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = e.message ?: "Failed to vote on poll",
                    isLoading = false
                )
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
    
    override fun onCleared() {
        super.onCleared()
        // TODO: Disconnect from Socket.IO
        // socket?.disconnect()
    }
}
