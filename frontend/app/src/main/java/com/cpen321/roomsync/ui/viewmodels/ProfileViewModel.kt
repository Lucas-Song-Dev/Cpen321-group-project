package com.cpen321.roomsync.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.roomsync.data.models.LivingPreferences
import com.cpen321.roomsync.data.models.ProfileUpdateRequest
import com.cpen321.roomsync.data.models.User
import com.cpen321.roomsync.data.network.ApiService
import com.cpen321.roomsync.data.network.RetrofitInstance
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ProfileViewModel(
    private val apiService: ApiService = RetrofitInstance.api
) : ViewModel() {

    private val _profileState = MutableStateFlow<ProfileState>(ProfileState.Idle)
    val profileState: StateFlow<ProfileState> = _profileState.asStateFlow()

    fun loadProfile(email: String) {
        viewModelScope.launch {
            _profileState.value = ProfileState.Loading
            try {
                val response = apiService.getProfile(email)
                if (response.isSuccessful && response.body() != null) {
                    val profileResponse = response.body()!!
                    _profileState.value = ProfileState.Success(profileResponse.user)
                } else {
                    val errorMsg = response.errorBody()?.string() ?: "Failed to load profile"
                    _profileState.value = ProfileState.Error(errorMsg)
                }
            } catch (e: Exception) {
                _profileState.value = ProfileState.Error(e.message ?: "Unknown error")
            }
        }
    }

    fun updateOptionalProfile(
        email: String,
        bio: String?,
        schedule: String?,
        drinking: String?,
        partying: String?,
        noise: String?,
        profession: String?
    ) {
        viewModelScope.launch {
            _profileState.value = ProfileState.Loading
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
                        profilePicture = null,
                        livingPreferences = livingPreferences,
                    )
                )

                if (response.isSuccessful && response.body() != null) {
                    val profileResponse = response.body()!!
                    _profileState.value = ProfileState.Success(profileResponse.user)
                } else {
                    val errorMsg = response.errorBody()?.string() ?: "Failed to update profile"
                    _profileState.value = ProfileState.Error(errorMsg)
                }
            } catch (e: Exception) {
                _profileState.value = ProfileState.Error(e.message ?: "Unknown error")
            }
        }
    }

    fun resetState() {
        _profileState.value = ProfileState.Idle
    }
}

sealed class ProfileState {
    object Idle : ProfileState()
    object Loading : ProfileState()
    data class Success(val user: User) : ProfileState()
    data class Error(val message: String) : ProfileState()
}
