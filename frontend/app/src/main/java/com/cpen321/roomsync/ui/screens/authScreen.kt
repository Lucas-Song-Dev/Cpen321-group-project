package com.cpen321.roomsync.ui.screens

import android.app.Activity
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import com.cpen321.roomsync.ui.viewmodels.AuthViewModel


//@Composable
//fun LoginScreen(viewModel: AuthViewModel = viewModel()){
//    val context = LocalContext.current
//    val activity = context as Activity
//
//    Surface(
//        modifier = Modifier.fillMaxSize(),
//        color = MaterialTheme.colorScheme.background
//    ) {
//        Box(
//            modifier = Modifier.fillMaxSize(),
//            contentAlignment = Alignment.Center
//        ) {
//            Button(
//                onClick = { viewModel.beginSignIn(activity) },
//                modifier = Modifier.padding(16.dp)
//            ) {
//                Text("Sign in with Google")
//            }
//        }
//    }
//}

@Composable
fun LoginScreen(viewModel: AuthViewModel = viewModel()) {
    val context = LocalContext.current
    val activity = context as Activity
    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Button(
                    onClick = { viewModel.beginSignIn(activity) }, // you’ll add logic later
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text("Sign in with Google")
                }

                OutlinedButton(
                    onClick = { viewModel.beginAccountCreation(activity) }, // placeholder function
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text("Create Account")
                }
            }
        }
    }
}

