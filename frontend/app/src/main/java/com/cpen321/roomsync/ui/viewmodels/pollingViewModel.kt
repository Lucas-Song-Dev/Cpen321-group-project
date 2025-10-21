package com.cpen321.roomsync.ui.viewmodels

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
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
    private val currentUserId: String
) : ViewModel() {

    private val _uiState = MutableStateFlow(PollingUiState())
    val uiState: StateFlow<PollingUiState> = _uiState.asStateFlow()

    init {
        SharedPollRepository.setCurrentUserId(currentUserId)
        loadPolls()
    }

    fun loadPolls() {
        _uiState.value = _uiState.value.copy(isLoading = true, error = null)
        
        // Get polls from shared repository
        val allPolls = SharedPollRepository.getPollsForGroup(groupId)
        val viewModelPolls = allPolls.map { sharedPoll ->
            ViewModelPollItem(
                id = sharedPoll.id,
                question = sharedPoll.question,
                options = sharedPoll.options.map { option ->
                    ViewModelPollOption(
                        text = option.text,
                        votes = option.votes,
                        percentage = option.percentage
                    )
                },
                createdBy = sharedPoll.createdBy,
                createdAt = sharedPoll.createdAt,
                expiresAt = sharedPoll.expiresAt,
                status = when (sharedPoll.status) {
                    SharedPollStatus.ACTIVE -> ViewModelPollStatus.ACTIVE
                    SharedPollStatus.EXPIRED -> ViewModelPollStatus.EXPIRED
                    SharedPollStatus.CLOSED -> ViewModelPollStatus.CLOSED
                },
                totalVotes = sharedPoll.totalVotes,
                userVote = sharedPoll.userVote,
                type = when (sharedPoll.type) {
                    PollType.SINGLE_CHOICE -> ViewModelPollType.SINGLE_CHOICE
                    PollType.MULTIPLE_CHOICE -> ViewModelPollType.MULTIPLE_CHOICE
                },
                createdInChat = sharedPoll.createdInChat
            )
        }
        
        _uiState.value = _uiState.value.copy(
            polls = viewModelPolls,
            isLoading = false
        )
    }

    fun refreshPolls() {
        // Just reload from shared repository without clearing existing polls
        loadPolls()
    }

    fun createPoll(
        question: String,
        options: List<String>,
        type: String,
        durationDays: Int
    ) {
        _uiState.value = _uiState.value.copy(isLoading = true, error = null)
        
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
            type = if (type == "multiple") PollType.MULTIPLE_CHOICE else PollType.SINGLE_CHOICE,
            createdInChat = false
        )
        
        // Add to shared repository
        SharedPollRepository.addPoll(sharedPoll)
        
        // Reload polls to reflect changes
        loadPolls()
    }

    fun voteOnPoll(pollId: String, optionText: String) {
        _uiState.value = _uiState.value.copy(isLoading = true, error = null)
        
        // Update shared repository
        SharedPollRepository.voteOnPoll(pollId, optionText)
        
        // Update local state directly instead of reloading
        val currentPolls = _uiState.value.polls.toMutableList()
        val pollIndex = currentPolls.indexOfFirst { it.id == pollId }
        
        if (pollIndex != -1) {
            val poll = currentPolls[pollIndex]
            val updatedOptions = poll.options.map { option ->
                if (option.text == optionText) {
                    option.copy(votes = option.votes + 1)
                } else if (option.text == poll.userVote) {
                    option.copy(votes = option.votes - 1)
                } else {
                    option
                }
            }
            
            val totalVotes = updatedOptions.sumOf { it.votes }
            val optionsWithPercentage = updatedOptions.map { option ->
                option.copy(percentage = if (totalVotes > 0) (option.votes.toFloat() / totalVotes * 100) else 0f)
            }
            
            currentPolls[pollIndex] = poll.copy(
                options = optionsWithPercentage,
                totalVotes = totalVotes,
                userVote = optionText
            )
            
            _uiState.value = _uiState.value.copy(
                polls = currentPolls,
                isLoading = false
            )
        } else {
            _uiState.value = _uiState.value.copy(isLoading = false)
        }
    }

    fun closePoll(pollId: String) {
        _uiState.value = _uiState.value.copy(isLoading = true, error = null)
        
        // Update shared repository
        SharedPollRepository.closePoll(pollId)
        
        // Update local state directly
        val currentPolls = _uiState.value.polls.toMutableList()
        val pollIndex = currentPolls.indexOfFirst { it.id == pollId }
        
        if (pollIndex != -1) {
            currentPolls[pollIndex] = currentPolls[pollIndex].copy(status = ViewModelPollStatus.CLOSED)
            _uiState.value = _uiState.value.copy(
                polls = currentPolls,
                isLoading = false
            )
        } else {
            _uiState.value = _uiState.value.copy(isLoading = false)
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

}
