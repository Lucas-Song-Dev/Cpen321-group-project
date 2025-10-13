package com.cpen321.roomsync.ui.viewmodels

import android.app.Activity
import android.content.IntentSender
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import com.google.android.gms.auth.api.identity.BeginSignInRequest
import com.google.android.gms.auth.api.identity.Identity
import com.google.android.gms.auth.api.identity.SignInClient
import com.google.android.gms.auth.api.identity.SignInCredential
import com.google.android.gms.common.api.ApiException
import com.cpen321.roomsync.network.ApiService
import com.cpen321.roomsync.network.GoogleAuthRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

data class AuthState(
    val isLoading: Boolean = false,
    val isAuthenticated: Boolean = false,
    val isNewUser: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val apiService: ApiService
) : ViewModel() {
    private val _authState = MutableStateFlow(AuthState())
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    fun beginSignIn(activity: Activity) {
        _authState.value = _authState.value.copy(isLoading = true, error = null)
        
        val oneTapClient: SignInClient = Identity.getSignInClient(activity)

        val signInRequest = BeginSignInRequest.builder()
            .setGoogleIdTokenRequestOptions(
                BeginSignInRequest.GoogleIdTokenRequestOptions.builder()
                    .setSupported(true)
                    .setServerClientId("445076519627-97j67dhhi8pqvkqsts8luanr6pttltbv.apps.googleusercontent.com")
                    .setFilterByAuthorizedAccounts(false)
                    .build()
            )
            .setAutoSelectEnabled(true)
            .build()

        oneTapClient.beginSignIn(signInRequest)
            .addOnSuccessListener(activity) { result ->
                try {
                    activity.startIntentSenderForResult(
                        result.pendingIntent.intentSender,
                        REQ_ONE_TAP,
                        null, 0, 0, 0, null
                    )
                } catch (e: IntentSender.SendIntentException) {
                    Log.e(TAG, "Couldn't start One Tap UI: ${e.localizedMessage}")
                    _authState.value = _authState.value.copy(
                        isLoading = false,
                        error = "Failed to start sign in"
                    )
                }
            }
            .addOnFailureListener(activity) { e ->
                Log.d(TAG, "No saved credentials: ${e.localizedMessage}")
                _authState.value = _authState.value.copy(
                    isLoading = false,
                    error = "Sign in failed"
                )
            }
    }

    fun beginAccountCreation(activity: Activity) {
        _authState.value = _authState.value.copy(isLoading = true, error = null)
        
        val oneTapClient: SignInClient = Identity.getSignInClient(activity)

        val signUpRequest = BeginSignInRequest.builder()
            .setGoogleIdTokenRequestOptions(
                BeginSignInRequest.GoogleIdTokenRequestOptions.builder()
                    .setSupported(true)
                    .setServerClientId("445076519627-97j67dhhi8pqvkqsts8luanr6pttltbv.apps.googleusercontent.com")
                    .setFilterByAuthorizedAccounts(false)
                    .build()
            )
            .build()

        oneTapClient.beginSignIn(signUpRequest)
            .addOnSuccessListener(activity) { result ->
                try {
                    activity.startIntentSenderForResult(
                        result.pendingIntent.intentSender,
                        REQ_ONE_TAP,
                        null, 0, 0, 0, null
                    )
                } catch (e: IntentSender.SendIntentException) {
                    Log.e(TAG, "Couldn't start One Tap UI for sign-up: ${e.localizedMessage}")
                    _authState.value = _authState.value.copy(
                        isLoading = false,
                        error = "Failed to start sign up"
                    )
                }
            }
            .addOnFailureListener(activity) { e ->
                Log.d(TAG, "No accounts available for sign-up: ${e.localizedMessage}")
                _authState.value = _authState.value.copy(
                    isLoading = false,
                    error = "Sign up failed"
                )
            }
    }

    fun handleSignInResult(credential: SignInCredential) {
        viewModelScope.launch {
            try {
                val idToken = credential.googleIdToken
                
                if (idToken != null) {
                    // Send token to backend for verification
                    val response = apiService.authenticateWithGoogle(
                        GoogleAuthRequest(idToken = idToken)
                    )
                    
                    if (response.isSuccessful && response.body()?.success == true) {
                        val authData = response.body()?.data
                        val isNewUser = authData?.user?.needsProfileCompletion ?: false
                        
                        _authState.value = AuthState(
                            isLoading = false,
                            isAuthenticated = true,
                            isNewUser = isNewUser
                        )
                    } else {
                        _authState.value = AuthState(
                            isLoading = false,
                            error = "Backend authentication failed"
                        )
                    }
                } else {
                    _authState.value = AuthState(
                        isLoading = false,
                        error = "No ID token received from Google"
                    )
                }
            } catch (e: Exception) {
                Log.e(TAG, "Authentication error", e)
                _authState.value = AuthState(
                    isLoading = false,
                    error = "Authentication failed: ${e.message}"
                )
            }
        }
    }


    fun clearError() {
        _authState.value = _authState.value.copy(error = null)
    }

    companion object {
        private const val TAG = "AuthViewModel"
        private const val REQ_ONE_TAP = 2
    }
}