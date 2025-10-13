package com.cpen321.roomsync.ui.viewmodels

import android.app.Activity
import android.content.IntentSender
import android.util.Log
import androidx.lifecycle.ViewModel
import com.google.android.gms.auth.api.identity.BeginSignInRequest
import com.google.android.gms.auth.api.identity.Identity
import com.google.android.gms.auth.api.identity.SignInClient
import com.google.android.gms.auth.api.identity.SignInCredential
import com.google.android.gms.common.api.ApiException


class AuthViewModel : ViewModel() {

    fun beginSignIn(activity: Activity) {
        val oneTapClient: SignInClient = Identity.getSignInClient(activity)

        val signInRequest = BeginSignInRequest.builder()
            .setGoogleIdTokenRequestOptions(
                BeginSignInRequest.GoogleIdTokenRequestOptions.builder()
                    .setSupported(true)
                    .setServerClientId("541793356201-qgco2eercgnmfneqq111nsbgb535k95v.apps.googleusercontent.com")
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
                }
            }
            .addOnFailureListener(activity) { e ->
                Log.d(TAG, "No saved credentials: ${e.localizedMessage}")
            }
    }

    fun beginAccountCreation(activity: Activity) {
        val oneTapClient: SignInClient = Identity.getSignInClient(activity)

        val signUpRequest = BeginSignInRequest.builder()
            .setGoogleIdTokenRequestOptions(
                BeginSignInRequest.GoogleIdTokenRequestOptions.builder()
                    .setSupported(true)
                    // Replace with your real Web client ID from Google Cloud Console
                    .setServerClientId("541793356201-qgco2eercgnmfneqq111nsbgb535k95v.apps.googleusercontent.com")
                    // false = show *all* Google accounts, not just ones already authorized
                    .setFilterByAuthorizedAccounts(false)
                    .build()
            )
            // Don’t use auto-select here — we want user to pick or create a new account
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
                }
            }
            .addOnFailureListener(activity) { e ->
                Log.d(TAG, "No accounts available for sign-up: ${e.localizedMessage}")
            }
    }


    companion object {
        private const val TAG = "AuthViewModel"
        private const val REQ_ONE_TAP = 2
    }
}