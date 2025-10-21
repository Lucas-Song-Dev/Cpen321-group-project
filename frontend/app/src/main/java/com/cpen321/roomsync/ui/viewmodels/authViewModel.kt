package com.cpen321.roomsync.ui.viewmodels

import android.app.Activity
import android.content.Intent
import androidx.activity.result.IntentSenderRequest
import androidx.lifecycle.ViewModel
import com.google.android.gms.auth.api.identity.BeginSignInRequest
import com.google.android.gms.auth.api.identity.Identity
import com.google.android.gms.auth.api.identity.SignInClient
import kotlinx.coroutines.tasks.await

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch
enum class AuthMode { LOGIN, SIGNUP }

data class AuthUiState(
    val loading: Boolean = false,
    val success: Boolean = false,
    val errorMessage: String? = null,
    val groupName: String? = null,
    val mode: AuthMode? = null
)

class AuthViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState = _uiState.asStateFlow()

    fun signUp() {
        viewModelScope.launch {
            _uiState.value = AuthUiState(loading = true, mode = AuthMode.SIGNUP)

            // TODO: Replace with backend call
            val userExists = false // backend check

            if (userExists) {
                _uiState.value = AuthUiState(errorMessage = "Account already exists.", mode = AuthMode.SIGNUP)
            } else {
                _uiState.value = AuthUiState(success = true, mode = AuthMode.SIGNUP)
            }
        }
    }

    fun logIn() {
        viewModelScope.launch {
            _uiState.value = AuthUiState(loading = true, mode = AuthMode.LOGIN)

            // TODO: Replace with backend call
            val userExists = true // backend check
            val groupName = "MyGroup"

            if (userExists) {
                _uiState.value =
                    AuthUiState(success = true, groupName = groupName, mode = AuthMode.LOGIN)
            } else {
                _uiState.value =
                    AuthUiState(errorMessage = "User does not exist.", mode = AuthMode.LOGIN)
            }
        }
    }

    fun resetState() {
        _uiState.value = AuthUiState()
    }
}


//
//class AuthViewModel : ViewModel() {
//
//    private var oneTapClient: SignInClient? = null
//
//    fun initGoogleSignIn(activity: Activity) {
//        oneTapClient = Identity.getSignInClient(activity)
//    }
//
//    fun getSignInRequest(): BeginSignInRequest {
//        return BeginSignInRequest.builder()
//            .setGoogleIdTokenRequestOptions(
//                BeginSignInRequest.GoogleIdTokenRequestOptions.builder()
//                    .setSupported(true)
//                    .setServerClientId("YOUR_WEB_CLIENT_ID") // from Google Cloud console
//                    .setFilterByAuthorizedAccounts(false)
//                    .build()
//            )
//            .setAutoSelectEnabled(false)
//            .build()
//    }
//
//    suspend fun launchSignIn(activity: Activity): IntentSenderRequest? {
//        val signInRequest = getSignInRequest()
//        return try {
//            val result = oneTapClient?.beginSignIn(signInRequest)?.await()
//            result?.let {
//                IntentSenderRequest.Builder(it.pendingIntent.intentSender).build()
//            }
//        } catch (e: Exception) {
//            e.printStackTrace()
//            null
//        }
//    }
//
//    suspend fun handleSignInResult(intent: Intent): String? {
//        return try {
//            val credential = oneTapClient?.getSignInCredentialFromIntent(intent)
//            val email = credential?.id
//            email
//        } catch (e: Exception) {
//            e.printStackTrace()
//            null
//        }
//    }
//}
