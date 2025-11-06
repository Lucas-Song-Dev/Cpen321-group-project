package com.cpen321.roomsync.ui.screens

import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.cpen321.roomsync.ui.viewmodels.AuthViewModel
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.tasks.Task

@Composable
fun AuthScreen(
    onSignUp: () -> Unit,
    onLogin: (String) -> Unit,
    viewModel: AuthViewModel = viewModel()
) {
    val context = LocalContext.current
    val authState by viewModel.authState.collectAsState()
    var isSigningUp by remember { mutableStateOf(false) }

    // Configure Google Sign-In
    val gso = remember {
        GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(context.getString(com.cpen321.roomsync.R.string.default_web_client_id))
            .requestEmail()
            .build()
    }

    val googleSignInClient = remember {
        GoogleSignIn.getClient(context, gso)
    }

    // Google Sign-In launcher
    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        handleSignInResult(task, isSigningUp, viewModel)
    }

    // Handle successful login/signup navigation
    LaunchedEffect(authState) {
        authState?.let { state ->
            if (state.success) {
                if (isSigningUp) {
                    onSignUp()
                } else {
                    // Navigate based on the actual persisted group membership
                    val groupName = state.user?.groupName ?: state.userGroupName
                    onLogin(groupName ?: "")
                }
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "RoomSync",
            fontSize = 48.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(bottom = 48.dp)
        )

        AuthScreenPart2(
            onSignUp = {
                isSigningUp = true
                googleSignInClient.signOut().addOnCompleteListener {
                    launcher.launch(googleSignInClient.signInIntent)
                }
            },
            onLogin = {
                isSigningUp = false
                googleSignInClient.signOut().addOnCompleteListener {
                    launcher.launch(googleSignInClient.signInIntent)
                }
            },
            authState = authState
        )
    }
}

@Composable
private fun AuthScreenPart2(
    onSignUp: () -> Unit,
    onLogin: () -> Unit,
    authState: com.cpen321.roomsync.data.models.AuthResponse?
) {
    Button(
        onClick = onSignUp,
        modifier = Modifier.fillMaxWidth().height(48.dp),
        enabled = authState?.success != true
    ) {
        Text("Sign Up", fontSize = 16.sp, fontWeight = FontWeight.Medium)
    }

    Spacer(Modifier.height(16.dp))

    OutlinedButton(
        onClick = onLogin,
        modifier = Modifier.fillMaxWidth().height(48.dp),
        enabled = authState?.success != true
    ) {
        Text("Login", fontSize = 16.sp, fontWeight = FontWeight.Medium)
    }

    Spacer(Modifier.height(24.dp))

    authState?.let { state ->
        if (state.success) {
            Text(
                "✅ ${state.message}",
                color = MaterialTheme.colorScheme.primary
            )
        } else {
            Text(
                "❌ ${state.message}",
                color = MaterialTheme.colorScheme.error
            )
        }
    }
}

private fun handleSignInResult(
    task: Task<GoogleSignInAccount>,
    isSigningUp: Boolean,
    viewModel: AuthViewModel
) {
    try {
        val account = task.getResult(ApiException::class.java)
        val idToken = account?.idToken

        println("=== Google Sign-In Debug ===")
        println("Account: ${account?.email}")
        println("ID Token: ${idToken?.substring(0, 20)}...")
        println("===========================")

        if (idToken != null) {
            if (isSigningUp) {
                viewModel.signup(idToken)
            } else {
                viewModel.login(idToken)
            }
        } else {
            viewModel.setError("Failed to get ID token from Google")
        }
    } catch (e: ApiException) {
        println("=== Google Sign-In Error ===")
        println("Error Code: ${e.statusCode}")
        println("Error Message: ${e.message}")
        println("===========================")
        viewModel.setError("Google Sign-In failed (Error ${e.statusCode}): ${e.message}")
    }
}