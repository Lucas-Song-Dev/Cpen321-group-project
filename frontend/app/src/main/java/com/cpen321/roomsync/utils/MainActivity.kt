package com.cpen321.roomsync.utils

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import com.cpen321.roomsync.ui.theme.RoomSyncFrontendTheme

//added
import com.google.android.gms.auth.api.identity.Identity
import com.google.android.gms.auth.api.identity.SignInClient
import android.content.Intent
import com.google.android.gms.auth.api.identity.SignInCredential
import android.util.Log
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import com.google.android.gms.common.api.ApiException
import com.cpen321.roomsync.ui.screens.LoginScreen


class MainActivity : ComponentActivity() {
    // this client manages the One Tap sign-in UI
    private lateinit var oneTapClient: SignInClient

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // initialize the One Tap client
        oneTapClient = Identity.getSignInClient(this)
        enableEdgeToEdge()
        setContent {
            RoomSyncFrontendTheme {
                LoginScreen()
            }
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)

        if (requestCode == 2) {
            val oneTapClient = Identity.getSignInClient(this)
            try {
                val credential: SignInCredential = oneTapClient.getSignInCredentialFromIntent(data)
                val idToken = credential.googleIdToken
                val username = credential.displayName
                val email = credential.id

                if (idToken != null) {
                    Log.d("Auth", "Got ID token: $idToken")
                    // TODO: Send this to backend for verification
                } else {
                    Log.d("Auth", "No ID token!")
                }
            } catch (e: ApiException) {
                Log.e("Auth", "Sign-in failed", e)
            }
        }
    }


//    override fun onCreate(savedInstanceState: Bundle?) {
//        super.onCreate(savedInstanceState)
//        enableEdgeToEdge()
//        setContent {
//            RoomSyncFrontendTheme {
//                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
//                    Greeting(
//                        name = "Android",
//                        modifier = Modifier.padding(innerPadding)
//                    )
//                }
//            }
//        }
//    }
}
//
//@Composable
//fun Greeting(name: String, modifier: Modifier = Modifier) {
//    Text(
//        text = "Hello $name!",
//        modifier = modifier
//    )
//}
//
//@Preview(showBackground = true)
//@Composable
//fun GreetingPreview() {
//    RoomSyncFrontendTheme {
//        Greeting("Android")
//    }
//}

