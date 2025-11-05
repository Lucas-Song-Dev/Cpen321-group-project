package com.cpen321.roomsync.ui.screens

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.cpen321.roomsync.ui.theme.GlassColors
import com.cpen321.roomsync.ui.theme.GlassGradients
import com.cpen321.roomsync.ui.viewmodels.AuthViewModel
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.tasks.Task

@Composable
fun AuthScreenModern(
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
                    val groupName = state.user?.groupName ?: state.userGroupName
                    onLogin(groupName ?: "")
                }
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(brush = GlassGradients.MainBackground),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // App Logo - Icon-based design
            Box(
                modifier = Modifier
                    .size(140.dp)
                    .clip(CircleShape)
                    .background(
                        color = Color(0x40FFFFFF),
                        shape = CircleShape
                    )
                    .border(
                        width = 3.dp,
                        color = Color(0x60FFFFFF),
                        shape = CircleShape
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Home,
                    contentDescription = "RoomSync Logo",
                    modifier = Modifier.size(70.dp),
                    tint = Color.White
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            // App title
            Text(
                text = "RoomSync",
                fontSize = 48.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Connect with your roommates",
                fontSize = 18.sp,
                color = Color(0xE0FFFFFF)
            )

            Spacer(modifier = Modifier.height(64.dp))

            // Sign Up Button
            Button(
                onClick = {
                    isSigningUp = true
                    googleSignInClient.signOut().addOnCompleteListener {
                        launcher.launch(googleSignInClient.signInIntent)
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0x50FFFFFF),
                    contentColor = Color.White
                ),
                shape = RoundedCornerShape(16.dp),
                enabled = authState?.success != true
            ) {
                Row(
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Star,
                        contentDescription = null,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = "Sign Up with Google",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Login Button
            OutlinedButton(
                onClick = {
                    isSigningUp = false
                    googleSignInClient.signOut().addOnCompleteListener {
                        launcher.launch(googleSignInClient.signInIntent)
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = Color.White
                ),
                border = ButtonDefaults.outlinedButtonBorder.copy(
                    width = 2.dp,
                    brush = androidx.compose.ui.graphics.SolidColor(Color.White)
                ),
                shape = RoundedCornerShape(16.dp),
                enabled = authState?.success != true
            ) {
                Row(
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = null,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = "Login with Google",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Info card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        color = Color(0x30FFFFFF),
                        shape = RoundedCornerShape(20.dp)
                    )
                    .border(
                        width = 1.dp,
                        color = Color(0x40FFFFFF),
                        shape = RoundedCornerShape(20.dp)
                    )
                    .padding(20.dp)
            ) {
                Column(
                    horizontalAlignment = Alignment.Start
                ) {
                    Text(
                        text = "Features",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    FeatureItemModern("Group Chat & Communication")
                    FeatureItemModern("Shared Task Management")
                    FeatureItemModern("Group Polls & Decisions")
                    FeatureItemModern("Roommate Ratings")
                }
            }

            // Show auth state
            authState?.let { state ->
                Spacer(modifier = Modifier.height(16.dp))
                if (!state.success && state.message.isNotEmpty()) {
                    Text(
                        text = state.message,
                        color = Color(0xFFFFCDD2),
                        fontSize = 14.sp
                    )
                }
            }
        }
    }
}

@Composable
fun FeatureItemModern(text: String) {
    Row(
        modifier = Modifier.padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(6.dp)
                .clip(CircleShape)
                .background(Color.White)
        )
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            text = text,
            fontSize = 14.sp,
            color = Color(0xE0FFFFFF)
        )
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




