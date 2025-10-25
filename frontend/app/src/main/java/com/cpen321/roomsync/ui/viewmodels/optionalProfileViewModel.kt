package com.cpen321.roomsync.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.roomsync.data.models.LivingPreferences
import com.cpen321.roomsync.data.models.ProfileUpdateRequest
import com.cpen321.roomsync.data.models.User
import com.cpen321.roomsync.data.network.ApiService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class OptionalProfileViewModel(
    private val apiService: ApiService
) : ViewModel() {

    private val _optionalProfileState = MutableStateFlow<OptionalProfileState>(OptionalProfileState.Idle)
    val optionalProfileState: StateFlow<OptionalProfileState> = _optionalProfileState.asStateFlow()

    fun updateOptionalProfile(
        email: String,
        bio: String?,
        profilePicture: String?,
        schedule: String?,
        drinking: String?,
        partying: String?,
        noise: String?,
        profession: String?
    ) {
        viewModelScope.launch {
            _optionalProfileState.value = OptionalProfileState.Loading
            try {
                val livingPreferences = if (schedule != null || drinking != null ||
                    partying != null || noise != null || profession != null) {
                    LivingPreferences(
                        schedule = schedule,
                        drinking = drinking,
                        partying = partying,
                        noise = noise,
                        profession = profession
                    )
                } else null

                val response = apiService.updateOptionalProfile(
                    ProfileUpdateRequest(
                        email = email,
                        bio = bio?.takeIf { it.isNotBlank() },
                        profilePicture = profilePicture,
                        livingPreferences = livingPreferences
                    )
                )

                if (response.isSuccessful && response.body() != null) {
                    val optionalProfileResponse = response.body()!!
                    _optionalProfileState.value = OptionalProfileState.Success(optionalProfileResponse.user)
                } else {
                    val errorMsg = response.errorBody()?.string() ?: "Failed to update profile"
                    _optionalProfileState.value = OptionalProfileState.Error(errorMsg)
                }
            } catch (e: Exception) {
                _optionalProfileState.value = OptionalProfileState.Error(e.message ?: "Unknown error")
            }
        }
    }

    fun resetState() {
        _optionalProfileState.value = OptionalProfileState.Idle
    }
}

sealed class OptionalProfileState {
    object Idle : OptionalProfileState()
    object Loading : OptionalProfileState()
    data class Success(val user: User) : OptionalProfileState()
    data class Error(val message: String) : OptionalProfileState()
}