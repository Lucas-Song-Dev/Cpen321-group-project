package com.cpen321.roomsync.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.roomsync.data.repository.AuthRepository
import com.cpen321.roomsync.data.models.AuthResponse
import com.cpen321.roomsync.data.models.User
import com.cpen321.roomsync.data.network.RetrofitInstance
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class AuthViewModel(
    private val repository: AuthRepository = AuthRepository()
) : ViewModel() {

    private val _authState = MutableStateFlow<AuthResponse?>(null)
    val authState: StateFlow<AuthResponse?> = _authState

    fun login(idToken: String) {
        viewModelScope.launch {
            val result = repository.login(idToken)
            if (result.success && result.token != null) {
                RetrofitInstance.setAuthToken(result.token)
            }
            _authState.value = result
        }
    }

    fun signup(idToken: String) {
        viewModelScope.launch {
            val result = repository.signup(idToken)
            if (result.success && result.token != null) {
                RetrofitInstance.setAuthToken(result.token)
            }
            _authState.value = result
        }
    }

    fun setError(message: String) {
        _authState.value = AuthResponse(success = false, message = message)
    }

    fun clearAuthState() {
        _authState.value = null
    }

    fun logout() {
        RetrofitInstance.setAuthToken(null)
        _authState.value = null
    }

    fun updateUserData(updatedUser: User) {
        val currentState = _authState.value
        if (currentState != null) {
            _authState.value = currentState.copy(user = updatedUser)
        }
    }

    fun deleteUser() {
        viewModelScope.launch {
            try {
                println("AuthViewModel: Starting deleteUser()")
                val result = repository.deleteUser()
                println("AuthViewModel: Delete user result - success: ${result.success}, message: ${result.message}")
                
                if (result.success) {
                    // Clear auth token and state after successful deletion
                    RetrofitInstance.setAuthToken(null)
                    _authState.value = null
                    println("AuthViewModel: User deleted successfully, auth cleared")
                } else {
                    println("AuthViewModel: Delete user failed: ${result.message}")
                    _authState.value = AuthResponse(success = false, message = result.message ?: "Failed to delete user")
                }
            } catch (e: Exception) {
                println("AuthViewModel: Exception during deleteUser: ${e.message}")
                _authState.value = AuthResponse(success = false, message = "Error: ${e.message}")
            }
        }
    }

    // Bypass authentication for testing
    fun bypassAuth() {
        viewModelScope.launch {
            val response = AuthResponse(
                success = true,
                message = "Bypass authentication successful",
                user = User(
                    _id = "test-user-id",
                    email = "test@example.com",
                    name = "Test User",
                    dob = null,
                    gender = null,
                    profileComplete = false,
                    bio = null,
                    profilePicture = null,
                    livingPreferences = null,
                    groupName = "Test Group"
                ),
                token = "bypass-token"
            )
            RetrofitInstance.setAuthToken("bypass-token")
            _authState.value = response
        }
    }

    // Bypass authentication for second test user
    fun bypassAuthUser2() {
        viewModelScope.launch {
            val response = AuthResponse(
                success = true,
                message = "Bypass authentication successful (User 2)",
                user = User(
                    _id = "test2-user-id",
                    email = "test2@example.com",
                    name = "Test User 2",
                    dob = null,
                    gender = null,
                    profileComplete = false,
                    bio = null,
                    profilePicture = null,
                    livingPreferences = null,
                    groupName = ""
                ),
                token = "bypass-token-2"
            )
            RetrofitInstance.setAuthToken("bypass-token-2")
            _authState.value = response
        }
    }
}