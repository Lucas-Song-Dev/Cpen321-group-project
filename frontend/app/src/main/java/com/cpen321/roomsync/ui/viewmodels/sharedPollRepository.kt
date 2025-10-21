package com.cpen321.roomsync.ui.viewmodels

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.*

// Shared poll data class
data class SharedPollItem(
    val id: String,
    val question: String,
    val options: List<SharedPollOption>,
    val createdBy: String,
    val createdAt: Date,
    val expiresAt: Date,
    val status: SharedPollStatus,
    val totalVotes: Int,
    val userVote: String? = null,
    val type: PollType = PollType.SINGLE_CHOICE,
    val createdInChat: Boolean = false
)

data class SharedPollOption(
    val text: String,
    val votes: Int,
    val percentage: Float
)

enum class SharedPollStatus {
    ACTIVE, EXPIRED, CLOSED
}

// Singleton repository for managing polls across the app
object SharedPollRepository {
    private val _polls = MutableStateFlow<List<SharedPollItem>>(emptyList())
    val polls: StateFlow<List<SharedPollItem>> = _polls.asStateFlow()
    
    private var currentUserId: String = "current-user"
    
    fun setCurrentUserId(userId: String) {
        currentUserId = userId
    }
    
    fun addPoll(poll: SharedPollItem) {
        val currentPolls = _polls.value.toMutableList()
        currentPolls.add(poll)
        _polls.value = currentPolls
    }
    
    fun updatePoll(pollId: String, updatedPoll: SharedPollItem) {
        val currentPolls = _polls.value.toMutableList()
        val index = currentPolls.indexOfFirst { it.id == pollId }
        if (index != -1) {
            currentPolls[index] = updatedPoll
            _polls.value = currentPolls
        }
    }
    
    fun voteOnPoll(pollId: String, optionText: String) {
        val currentPolls = _polls.value.toMutableList()
        val pollIndex = currentPolls.indexOfFirst { it.id == pollId }
        
        if (pollIndex != -1) {
            val poll = currentPolls[pollIndex]
            
            // Remove existing vote from this user if any
            val updatedOptions = poll.options.map { option ->
                if (option.text == poll.userVote) {
                    option.copy(votes = option.votes - 1)
                } else {
                    option
                }
            }.toMutableList()
            
            // Add new vote
            val optionIndex = updatedOptions.indexOfFirst { it.text == optionText }
            if (optionIndex != -1) {
                updatedOptions[optionIndex] = updatedOptions[optionIndex].copy(
                    votes = updatedOptions[optionIndex].votes + 1
                )
            }
            
            // Calculate percentages
            val totalVotes = updatedOptions.sumOf { it.votes }
            val optionsWithPercentage = updatedOptions.map { option ->
                option.copy(
                    percentage = if (totalVotes > 0) (option.votes.toFloat() / totalVotes * 100) else 0f
                )
            }
            
            val updatedPoll = poll.copy(
                options = optionsWithPercentage,
                totalVotes = totalVotes,
                userVote = optionText
            )
            
            currentPolls[pollIndex] = updatedPoll
            _polls.value = currentPolls
        }
    }
    
    fun closePoll(pollId: String) {
        val currentPolls = _polls.value.toMutableList()
        val index = currentPolls.indexOfFirst { it.id == pollId }
        if (index != -1) {
            currentPolls[index] = currentPolls[index].copy(status = SharedPollStatus.CLOSED)
            _polls.value = currentPolls
        }
    }
    
    fun getPollsForGroup(groupId: String): List<SharedPollItem> {
        // TODO: Filter by group ID when backend integration is added
        return _polls.value
    }
    
    fun getChatPolls(): List<SharedPollItem> {
        return _polls.value.filter { it.createdInChat }
    }
    
    fun getStandalonePolls(): List<SharedPollItem> {
        return _polls.value.filter { !it.createdInChat }
    }
    
    // Initialize with empty data (only if not already initialized)
    fun initializeWithMockData() {
        // Don't clear existing data - just ensure it's initialized
        // _polls.value is already initialized as emptyList() by default
    }
}
