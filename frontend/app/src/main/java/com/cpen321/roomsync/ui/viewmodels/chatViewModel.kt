package com.cpen321.roomsync.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.roomsync.data.models.Message as ApiMessage
import com.cpen321.roomsync.data.repository.ChatRepository
import com.cpen321.roomsync.data.network.SocketManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.json.JSONObject
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
    private val currentUserId: String,
    private val authToken: String? = null,
    private val chatRepository: ChatRepository = ChatRepository()
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()
    
    private val socketManager = SocketManager()
    
    init {
        connectToChat()
        loadMessages()
        SharedPollRepository.setCurrentUserId(currentUserId)
    }
    
    private fun connectToChat() {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isLoading = true)
                
                // Connect to Socket.IO with authentication token
                socketManager.connect(token = authToken)
                
                // Wait a bit for connection to establish
                kotlinx.coroutines.delay(500)
                
                // Join the group
                socketManager.joinGroup(groupId)
                
                // Set up real-time listeners
                setupSocketListeners()
                
                // Update connection state
                _uiState.value = _uiState.value.copy(isConnected = true, isLoading = false)
                
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "Failed to connect to chat: ${e.message}",
                    isLoading = false
                )
            }
        }
    }
    
    private fun setupSocketListeners() {
        // Listen for new messages
        socketManager.onNewMessage { messageData ->
            viewModelScope.launch {
                val newMessage = ChatMessage(
                    id = messageData.getString("id"),
                    content = messageData.getString("content"),
                    senderName = messageData.getString("senderName"),
                    senderId = messageData.getString("senderId"),
                    timestamp = Date(messageData.getLong("timestamp")),
                    isOwnMessage = messageData.getString("senderId") == currentUserId
                )
                
                _uiState.value = _uiState.value.copy(
                    messages = _uiState.value.messages + newMessage
                )
            }
        }
        
        // Listen for poll updates
        socketManager.onPollUpdate { pollData ->
            viewModelScope.launch {
                // Update poll in the chat
                val pollId = pollData.getString("pollId")
                val updatedMessages = _uiState.value.messages.map { message ->
                    if (message.id == pollId) {
                        // Update poll message with new vote counts
                        message
                    } else {
                        message
                    }
                }
                _uiState.value = _uiState.value.copy(messages = updatedMessages)
            }
        }
        
        // Listen for user join/leave events
        socketManager.onUserJoined { userData ->
            // Handle user joined event
        }
        
        socketManager.onUserLeft { userData ->
            // Handle user left event
        }
    }
    
    private fun loadMessages() {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isLoading = true)
                
                val response = chatRepository.getMessages(groupId)
                println("ChatViewModel: Got response: $response")
                if (response.success && response.data?.messages != null) {
                    println("ChatViewModel: Mapping ${response.data.messages.size} messages")
                    val messages = response.data.messages.map { message ->
                        println("ChatViewModel: Processing message: $message")
                        ChatMessage(
                            id = message._id,
                            content = message.content,
                            senderName = "User", // Simplified since we don't have user names yet
                            senderId = message.senderId._id,
                            timestamp = Date(message.createdAt.toLongOrNull() ?: System.currentTimeMillis()),
                            isOwnMessage = message.senderId._id == currentUserId,
                            type = when (message.type) {
                                "poll" -> MessageType.POLL
                                else -> MessageType.TEXT
                            }
                        )
                    }
                    _uiState.value = _uiState.value.copy(
                        messages = messages,
                        isLoading = false
                    )
                } else {
                    _uiState.value = _uiState.value.copy(
                        error = response.message ?: "Failed to load messages",
                        isLoading = false
                    )
                }
                
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
                // Send message via Socket.IO for real-time delivery
                socketManager.sendMessage(groupId, content.trim(), currentUserId)
                
                // Also send to backend for persistence
                val response = chatRepository.sendMessage(groupId, content.trim())
                if (!response.success) {
                    _uiState.value = _uiState.value.copy(
                        error = response.message ?: "Failed to save message"
                    )
                }
                
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
                
                // Send poll via Socket.IO for real-time delivery
                socketManager.createPoll(
                    groupId = groupId,
                    question = question,
                    options = options,
                    senderId = currentUserId,
                    durationDays = durationDays
                )
                
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
                
                // Send vote via Socket.IO for real-time updates
                socketManager.voteOnPoll(pollId, option, currentUserId)
                
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
        // Leave group and disconnect from Socket.IO
        socketManager.leaveGroup(groupId)
        socketManager.disconnect()
    }
}
