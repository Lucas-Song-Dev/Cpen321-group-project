package com.cpen321.roomsync.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp


import com.cpen321.roomsync.ui.viewmodels.AuthViewModel
import com.cpen321.roomsync.ui.viewmodels.AuthMode
@Composable
fun AuthScreen(
    onSignUp: () -> Unit = {},
    onLogin: (groupName: String) -> Unit = {},
    viewModel: AuthViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState) {
        when {
            uiState.success && uiState.mode == AuthMode.LOGIN -> {
                uiState.groupName?.let { onLogin(it) }
                viewModel.resetState()
            }
            uiState.success && uiState.mode == AuthMode.SIGNUP -> {
                onSignUp()
                viewModel.resetState()
            }
            uiState.errorMessage != null -> {
                // show popup (minimal example using snackbar)
                println("Error: ${uiState.errorMessage}") // replace with Snackbar later
                viewModel.resetState()
            }
        }
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
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

            Button(
                onClick = { viewModel.signUp() },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
            ) {
                Text("Sign Up", fontSize = 16.sp, fontWeight = FontWeight.Medium)
            }

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedButton(
                onClick = { viewModel.logIn() },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
            ) {
                Text("Login", fontSize = 16.sp, fontWeight = FontWeight.Medium)
            }
        }
    }
}


//
//@Composable
//fun AuthScreen(
//    onSignUp: () -> Unit = {},
//    onLogin: (groupName: String) -> Unit = {}
//) {
//    Surface(
//        modifier = Modifier.fillMaxSize(),
//        color = MaterialTheme.colorScheme.background
//    ) {
//        Column(
//            modifier = Modifier
//                .fillMaxSize()
//                .padding(24.dp),
//            verticalArrangement = Arrangement.Center,
//            horizontalAlignment = Alignment.CenterHorizontally
//        ) {
//            //displaying app name
//            Text(
//                text = "RoomSync",
//                fontSize = 48.sp,
//                fontWeight = FontWeight.Bold,
//                color = MaterialTheme.colorScheme.primary,
//                modifier = Modifier.padding(bottom = 48.dp)
//            )
//
//            //Sign Up button
//            Button(
//                onClick = onSignUp,
//                modifier = Modifier
//                    .fillMaxWidth()
//                    .height(48.dp),
//                colors = ButtonDefaults.buttonColors(
//                    containerColor = MaterialTheme.colorScheme.primary
//                )
//            ) {
//                Text(
//                    text = "Sign Up",
//                    fontSize = 16.sp,
//                    fontWeight = FontWeight.Medium
//                )
//            }
//
//            Spacer(modifier = Modifier.height(16.dp))
//
//            //login button
//            OutlinedButton(
//                onClick = {
//                    // TODO: Implement actual login logic
//                    // For now, navigate with a default group name
//                    onLogin("My Group")
//                },
//                modifier = Modifier
//                    .fillMaxWidth()
//                    .height(48.dp)
//            ) {
//                Text(
//                    text = "Login",
//                    fontSize = 16.sp,
//                    fontWeight = FontWeight.Medium
//                )
//            }
//        }
//    }
//}