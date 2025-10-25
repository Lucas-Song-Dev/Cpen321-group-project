package com.cpen321.roomsync.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.roomsync.data.network.ApiService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import com.cpen321.roomsync.data.models.ProfileSetRequest
import com.cpen321.roomsync.data.models.User
import com.cpen321.roomsync.data.network.RetrofitInstance
import android.util.Log
class PersonalProfileViewModel(
    private val apiService: ApiService = RetrofitInstance.api
) : ViewModel() {

    private val _profileSetState = MutableStateFlow<ProfileSetState>(ProfileSetState.Idle)
    val profileSetState: StateFlow<ProfileSetState> = _profileSetState.asStateFlow()

    fun updateProfile(email: String, dob: String, gender: String) {
        viewModelScope.launch {
            _profileSetState.value = ProfileSetState.Loading
            try {
                val response = apiService.updateProfile(
                    ProfileSetRequest(
                        email = email,
                        dob = dob,
                        gender = gender
                    )
                )

                Log.d("PersonalProfile", "Response code: ${response.code()}")
                Log.d("PersonalProfile", "Response body: ${response.body()}")
                Log.d("PersonalProfile", "Error body: ${response.errorBody()?.string()}")

                if (response.isSuccessful && response.body() != null) {
                    val profileResponse = response.body()!!
                    _profileSetState.value = ProfileSetState.Success(profileResponse.user)
                } else {
                    //_profileSetState.value = ProfileSetState.Error("Failed to update profile")
                    _profileSetState.value = ProfileSetState.Error("Failed to update profile: ${response.code()}")
                }
            } catch (e: Exception) {
                _profileSetState.value = ProfileSetState.Error(e.message ?: "Unknown error")
            }
        }
    }

    fun resetState() {
        _profileSetState.value = ProfileSetState.Idle
    }
}

sealed class ProfileSetState {
    object Idle : ProfileSetState()
    object Loading : ProfileSetState()
    data class Success(val user: User) : ProfileSetState()
    data class Error(val message: String) : ProfileSetState()
}