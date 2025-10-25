package com.cpen321.roomsync.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.cpen321.roomsync.ui.screens.AuthScreen
import com.cpen321.roomsync.ui.screens.PersonalProfileScreen
import com.cpen321.roomsync.ui.screens.OptionalProfileScreen
import com.cpen321.roomsync.ui.screens.GroupSelectionScreen
import com.cpen321.roomsync.ui.screens.CreateGroupScreen
import com.cpen321.roomsync.ui.screens.HomeScreen
import com.cpen321.roomsync.ui.screens.GroupDetailsScreen
import com.cpen321.roomsync.ui.screens.ChatScreen
import com.cpen321.roomsync.ui.screens.TaskScreen
import com.cpen321.roomsync.ui.screens.PollingScreen


//testing
import androidx.lifecycle.viewmodel.compose.viewModel
import com.cpen321.roomsync.ui.viewmodels.AuthViewModel
import com.cpen321.roomsync.ui.viewmodels.PersonalProfileViewModel
import androidx.compose.runtime.collectAsState
import com.cpen321.roomsync.data.models.User
import androidx.compose.runtime.getValue
import com.cpen321.roomsync.ui.viewmodels.PersonalProfileViewModelFactory
import com.cpen321.roomsync.data.network.RetrofitInstance
import androidx.compose.foundation.layout.Box
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Alignment
import androidx.compose.material3.CircularProgressIndicator

//screen destinations
object NavRoutes {
    const val AUTH = "auth"
    const val PERSONAL_PROFILE = "personal_profile"
    const val OPTIONAL_PROFILE = "optional_profile"
    const val GROUP_SELECTION = "group_selection"
    const val CREATE_GROUP = "create_group"
    const val HOME = "home"
    const val GROUP_DETAILS = "group_details"
    const val CHAT = "chat"
    const val TASKS = "tasks"
    const val POLLING = "polling"
}

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    val authViewModel: AuthViewModel = viewModel()

    NavHost(
        navController = navController,
        startDestination = NavRoutes.AUTH
    ) {
        composable(NavRoutes.AUTH) {
            AuthScreen(
                viewModel = authViewModel, // Pass the shared instance
                onSignUp = {
                    navController.navigate(NavRoutes.PERSONAL_PROFILE)
                },
                onLogin = { userGroupName ->
                    navController.navigate("${NavRoutes.HOME}?groupName=${userGroupName}")
                }
            )
        }

        composable(NavRoutes.PERSONAL_PROFILE) {
            val authResponse by authViewModel.authState.collectAsState()
            val factory = PersonalProfileViewModelFactory(RetrofitInstance.api)
            val personalProfileViewModel: PersonalProfileViewModel = viewModel(factory = factory)
            val user = authResponse?.user

            if (user != null) {
                PersonalProfileScreen(
                    user = user,
                    viewModel = personalProfileViewModel,
                    onProfileComplete = {
                        navController.navigate(NavRoutes.OPTIONAL_PROFILE) {
                            popUpTo(NavRoutes.PERSONAL_PROFILE) { inclusive = true }
                        }
                    }
                )
            } else {
                Box(//need to change to  display error
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator() //need to change to
                }
            }
        }

        composable(NavRoutes.OPTIONAL_PROFILE) {
            OptionalProfileScreen(
                onComplete = {
                    navController.navigate(NavRoutes.GROUP_SELECTION)
                }
            )
        }

                composable(NavRoutes.GROUP_SELECTION) {
                    GroupSelectionScreen(
                        onCreateGroup = {
                            navController.navigate(NavRoutes.CREATE_GROUP)
                        },
                        onJoinGroup = {
                            // TODO: Navigate to join group screen
                        }
                    )
                }

                composable(NavRoutes.CREATE_GROUP) {
                    CreateGroupScreen(
                        onCreateGroup = { groupName ->
                            // TODO: Create group with backend
                            navController.navigate("${NavRoutes.HOME}?groupName=${groupName}")
                        },
                        onBack = {
                            navController.popBackStack()
                        }
                    )
                }

                composable("${NavRoutes.HOME}?groupName={groupName}") { backStackEntry ->
                    val groupName = backStackEntry.arguments?.getString("groupName") ?: "My Group"
                    HomeScreen(
                        groupName = groupName,
                        onViewGroupDetails = {
                            navController.navigate("${NavRoutes.GROUP_DETAILS}?groupName=${groupName}")
                        },
                        onOpenChat = {
                            navController.navigate("${NavRoutes.CHAT}?groupName=${groupName}")
                        },
                        onOpenTasks = {
                            navController.navigate("${NavRoutes.TASKS}?groupName=${groupName}")
                        },
                        onOpenPolls = {
                            navController.navigate("${NavRoutes.POLLING}?groupName=${groupName}")
                        }
                    )
                }

                composable("${NavRoutes.GROUP_DETAILS}?groupName={groupName}") { backStackEntry ->
                    val groupName = backStackEntry.arguments?.getString("groupName") ?: "My Group"
                    GroupDetailsScreen(
                        groupName = groupName,
                        onBack = {
                            navController.popBackStack()
                        }
                    )
                }

                composable("${NavRoutes.CHAT}?groupName={groupName}") { backStackEntry ->
                    val groupName = backStackEntry.arguments?.getString("groupName") ?: "Group Chat"
                    ChatScreen(
                        groupName = groupName,
                        groupId = "sample-group-id", // TODO: Get actual group ID
                        onBack = {
                            navController.popBackStack()
                        },
                        onNavigateToPolls = {
                            navController.navigate("${NavRoutes.POLLING}?groupName=${groupName}")
                        }
                    )
                }

                composable("${NavRoutes.TASKS}?groupName={groupName}") { backStackEntry ->
                    val groupName = backStackEntry.arguments?.getString("groupName") ?: "Group Tasks"
                    TaskScreen(
                        groupName = groupName,
                        groupId = "sample-group-id", // TODO: Get actual group ID
                        onBack = {
                            navController.popBackStack()
                        }
                    )
                }

                composable("${NavRoutes.POLLING}?groupName={groupName}") { backStackEntry ->
                    val groupName = backStackEntry.arguments?.getString("groupName") ?: "Group Polls"
                    PollingScreen(
                        groupName = groupName,
                        groupId = "sample-group-id", // TODO: Get actual group ID
                        onBack = {
                            navController.popBackStack()
                        }
                    )
                }
    }
}


