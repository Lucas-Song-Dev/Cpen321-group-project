package com.cpen321.roomsync.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.cpen321.roomsync.ui.screens.AuthScreen
import com.cpen321.roomsync.ui.screens.PersonalProfileScreen
import com.cpen321.roomsync.ui.screens.OptionalProfileScreen
import com.cpen321.roomsync.ui.screens.dashboardScreen
import com.cpen321.roomsync.ui.viewmodels.AuthViewModel



//NavController: Responsible for navigating between destinations—that is, the screens in your app.
//NavGraph: Maps composable destinations to navigate to.
//NavHost: Composable acting as a container for displaying the current destination of the NavGraph.

object NavRoutes {
    const val AUTH = "auth"
    const val PERSONAL_PROFILE = "personal_profile"
    const val OPTIONAL_PROFILE = "optional_profile"
    const val MAIN = "main"
}

@Composable
fun AppNavigation(onAuthViewModelReady: (AuthViewModel) -> Unit = {}) {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = NavRoutes.AUTH
    ) {
        composable(NavRoutes.AUTH) {
            val authViewModel: AuthViewModel = hiltViewModel()
            
            // Notify MainActivity about the AuthViewModel
            LaunchedEffect(authViewModel) {
                onAuthViewModelReady(authViewModel)
            }
            
            AuthScreen(
                authViewModel = authViewModel,
                onSignInSuccess = { isNewUser ->
                    if (isNewUser) {
                        navController.navigate(NavRoutes.PERSONAL_PROFILE) {
                            popUpTo(NavRoutes.AUTH) { inclusive = true }
                        }
                    } else {
                        navController.navigate(NavRoutes.MAIN) {
                            popUpTo(NavRoutes.AUTH) { inclusive = true }
                        }
                    }
                }
            )
        }

        composable(NavRoutes.PERSONAL_PROFILE) {
            PersonalProfileScreen(
                onContinue = {
                    navController.navigate(NavRoutes.OPTIONAL_PROFILE)
                }
            )
        }

        composable(NavRoutes.OPTIONAL_PROFILE) {
            OptionalProfileScreen(
                onComplete = {
                    navController.navigate(NavRoutes.MAIN) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        composable(NavRoutes.MAIN) {
            dashboardScreen()
        }
    }
}


