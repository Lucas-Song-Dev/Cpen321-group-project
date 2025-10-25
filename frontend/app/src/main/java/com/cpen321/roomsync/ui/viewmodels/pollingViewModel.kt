package com.cpen321.roomsync.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.roomsync.data.models.Message as ApiMessage
import com.cpen321.roomsync.data.repository.ChatRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.*

// Data classes for ViewModel
data class ViewModelPollItem(
    val id: String,
    val question: String,
    val options: List<ViewModelPollOption>,
    val createdBy: String,
    val createdAt: Date,
    val expiresAt: Date,
    val status: ViewModelPollStatus,
    val totalVotes: Int,
    val userVote: String? = null,
    val type: ViewModelPollType = ViewModelPollType.SINGLE_CHOICE,
    val createdInChat: Boolean = false
)

data class ViewModelPollOption(
    val text: String,
    val votes: Int,
    val percentage: Float
)

enum class ViewModelPollStatus {
    ACTIVE, EXPIRED, CLOSED
}

enum class ViewModelPollType {
    SINGLE_CHOICE, MULTIPLE_CHOICE
}

data class PollingUiState(
    val polls: List<ViewModelPollItem> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

class PollingViewModel(
    private val groupId: String,
    private val currentUserId: String,
    private val chatRepository: ChatRepository = ChatRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(PollingUiState())
    val uiState: StateFlow<PollingUiState> = _uiState.asStateFlow()

    init {
        loadPolls()
    }

    fun loadPolls() {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isLoading = true, error = null)
                
                val response = chatRepository.getMessages(groupId)
                if (response.success && response.data?.messages != null) {
                    val pollMessages = response.data.messages.filter { it.type == "poll" }
                    val viewModelPolls = pollMessages.mapNotNull { message ->
                        val pollData = message.pollData
                        if (pollData != null) {
                            val totalVotes = message.totalPollVotes
                            val optionsWithVotes = pollData.options.map { option ->
                                val votes = message.pollResults?.get(option) ?: 0
                                ViewModelPollOption(
                                    text = option,
                                    votes = votes,
                                    percentage = if (totalVotes > 0) (votes.toFloat() / totalVotes * 100) else 0f
                                )
                            }
                            
                            ViewModelPollItem(
                                id = message._id,
                                question = pollData.question,
                                options = optionsWithVotes,
                                createdBy = message.senderId.name ?: "Unknown",
                                createdAt = Date(message.createdAt.toLongOrNull() ?: System.currentTimeMillis()),
                                expiresAt = Date(pollData.expiresAt.toLongOrNull() ?: System.currentTimeMillis()),
                                status = if (message.isPollExpired) {
                                    ViewModelPollStatus.EXPIRED
                                } else {
                                    ViewModelPollStatus.ACTIVE
                                },
                                totalVotes = totalVotes,
                                userVote = pollData.votes.find { it.userId == currentUserId }?.option,
                                type = ViewModelPollType.SINGLE_CHOICE,
                                createdInChat = true
                            )
                        } else {
                            null
                        }
                    }.filterNotNull()
                    
                    _uiState.value = _uiState.value.copy(
                        polls = viewModelPolls,
                        isLoading = false
                    )
                } else {
                    _uiState.value = _uiState.value.copy(
                        error = response.message ?: "Failed to load polls",
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "Failed to load polls: ${e.message}",
                    isLoading = false
                )
            }
        }
    }

    fun refreshPolls() {
        loadPolls()
    }

    fun createPoll(
        question: String,
        options: List<String>,
        type: String,
        durationDays: Int
    ) {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isLoading = true, error = null)
                
                val response = chatRepository.createPoll(groupId, question, options, durationDays)
                if (response.success) {
                    // Refresh polls after successful creation
                    loadPolls()
                } else {
                    _uiState.value = _uiState.value.copy(
                        error = response.message ?: "Failed to create poll",
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "Failed to create poll: ${e.message}",
                    isLoading = false
                )
            }
        }
    }

    fun voteOnPoll(pollId: String, optionText: String) {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isLoading = true, error = null)
                
                val response = chatRepository.votePoll(groupId, pollId, optionText)
                if (response.success) {
                    // Refresh polls after successful vote
                    loadPolls()
                } else {
                    _uiState.value = _uiState.value.copy(
                        error = response.message ?: "Failed to vote on poll",
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "Failed to vote on poll: ${e.message}",
                    isLoading = false
                )
            }
        }
    }

    fun closePoll(pollId: String) {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isLoading = true, error = null)
                
                // For now, just refresh polls - backend doesn't have close poll endpoint yet
                loadPolls()
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "Failed to close poll: ${e.message}",
                    isLoading = false
                )
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

}
