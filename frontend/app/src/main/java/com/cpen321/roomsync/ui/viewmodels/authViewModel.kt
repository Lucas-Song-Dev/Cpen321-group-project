package com.cpen321.roomsync.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.roomsync.data.repository.AuthRepository
import com.cpen321.roomsync.data.models.AuthResponse
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
            _authState.value = result
        }
    }

    fun signup(idToken: String) {
        viewModelScope.launch {
            val result = repository.signup(idToken)
            _authState.value = result
        }
    }

    fun setError(message: String) {
        _authState.value = AuthResponse(success = false, message = message)
    }

    fun clearAuthState() {
        _authState.value = null
    }
}