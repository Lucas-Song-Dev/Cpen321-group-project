package com.cpen321.roomsync.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.roomsync.data.models.Rating
import com.cpen321.roomsync.data.repository.RatingRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class RatingUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val success: Boolean = false,
    val successMessage: String? = null,
    val ratings: List<Rating> = emptyList(),
    val averageRating: Double = 0.0,
    val totalRatings: Int = 0,
    val canRate: Boolean = false, // Set to true if time spent >= 5 minutes
    val timeSpentMinutes: Int = 0
)

class RatingViewModel(
    private val ratingRepository: RatingRepository = RatingRepository()
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(RatingUiState())
    val uiState: StateFlow<RatingUiState> = _uiState.asStateFlow()
    
    fun submitRating(
        ratedUserId: String,
        groupId: String,
        rating: Int,
        testimonial: String? = null
    ) {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isLoading = true, error = null)
                
                val response = ratingRepository.submitRating(
                    ratedUserId = ratedUserId,
                    groupId = groupId,
                    rating = rating,
                    testimonial = testimonial
                )
                
                if (response.success) {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        success = true,
                        successMessage = response.message ?: "Rating submitted successfully"
                    )
                    // Clear success after a delay
                    kotlinx.coroutines.delay(2000)
                    _uiState.value = _uiState.value.copy(success = false)
                } else {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = response.message ?: "Failed to submit rating"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = "Error: ${e.message}"
                )
            }
        }
    }
    
    fun getUserRatings(userId: String) {
        viewModelScope.launch {
            try {
                println("RatingViewModel: Loading ratings for user: $userId")
                _uiState.value = _uiState.value.copy(isLoading = true, error = null)
                
                val response = ratingRepository.getUserRatings(userId)
                println("RatingViewModel: Response success: ${response.success}, data: ${response.data}")
                
                if (response.success && response.data != null) {
                    println("RatingViewModel: Setting state - ratings count: ${response.data.ratings.size}, avg: ${response.data.averageRating}, total: ${response.data.totalRatings}")
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        ratings = response.data.ratings,
                        averageRating = response.data.averageRating,
                        totalRatings = response.data.totalRatings
                    )
                    println("RatingViewModel: State updated - current totalRatings: ${_uiState.value.totalRatings}")
                } else {
                    println("RatingViewModel: Failed to load ratings: ${response.message}")
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = response.message ?: "Failed to load ratings"
                    )
                }
            } catch (e: Exception) {
                println("RatingViewModel: Exception: ${e.message}")
                e.printStackTrace()
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = "Error: ${e.message}"
                )
            }
        }
    }
    
    fun getUserRatingsInGroup(userId: String, groupId: String) {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isLoading = true, error = null)
                
                val response = ratingRepository.getUserRatingsInGroup(userId, groupId)
                
                if (response.success && response.data != null) {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        ratings = response.data.ratings,
                        averageRating = response.data.averageRating,
                        totalRatings = response.data.totalRatings
                    )
                } else {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = response.message ?: "Failed to load ratings"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = "Error: ${e.message}"
                )
            }
        }
    }
    
    fun setTimeSpentMinutes(minutes: Int) {
        _uiState.value = _uiState.value.copy(
            timeSpentMinutes = minutes,
            canRate = minutes >= 5
        )
    }
    
    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
    
    fun clearSuccess() {
        _uiState.value = _uiState.value.copy(success = false)
    }
}

