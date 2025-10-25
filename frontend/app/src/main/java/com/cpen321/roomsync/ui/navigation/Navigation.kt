package com.cpen321.roomsync.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.lifecycle.viewmodel.compose.viewModel
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
import com.cpen321.roomsync.ui.viewmodels.TaskViewModel
import com.cpen321.roomsync.ui.viewmodels.GroupViewModel


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
import com.cpen321.roomsync.ui.viewmodels.OptionalProfileViewModelFactory
import com.cpen321.roomsync.ui.viewmodels.OptionalProfileViewModel
import androidx.compose.runtime.LaunchedEffect

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
                    // Check if user has a group
                    if (userGroupName.isNotEmpty()) {
                        navController.navigate(NavRoutes.HOME) {
                            popUpTo(NavRoutes.AUTH) { inclusive = true }
                        }
                    } else {
                        navController.navigate(NavRoutes.GROUP_SELECTION) {
                            popUpTo(NavRoutes.AUTH) { inclusive = true }
                        }
                    }
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
            val authResponse by authViewModel.authState.collectAsState()
            val factory = OptionalProfileViewModelFactory(RetrofitInstance.api)
            val optionalProfileViewModel: OptionalProfileViewModel = viewModel(factory = factory)
            val user = authResponse?.user

            if (user != null) {
                OptionalProfileScreen(
                    user = user,
                    viewModel = optionalProfileViewModel,
                    onComplete = {
                        navController.navigate(NavRoutes.GROUP_SELECTION)
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
                        onCreateGroup = {
                            // Navigate to home after successful group creation
                            navController.navigate(NavRoutes.HOME) {
                                popUpTo(NavRoutes.GROUP_SELECTION) { inclusive = true }
                            }
                        },
                        onBack = {
                            navController.popBackStack()
                        }
                    )
                }

                composable(NavRoutes.HOME) {
                    val groupViewModel: GroupViewModel = viewModel()
                    val groupUiState by groupViewModel.uiState.collectAsState()
                    val groupName = groupUiState.group?.name ?: "My Group"
                    val authState by authViewModel.authState.collectAsState()
                    
                    // Monitor auth state for deletion success (when auth becomes null)
                    LaunchedEffect(authState) {
                        // If auth state becomes null and we're not in auth screen, go to auth
                        if (authState == null) {
                            println("Navigation: Auth state is null, navigating to AUTH screen")
                        }
                    }
                    
                    HomeScreen(
                        groupName = groupName,
                        onViewGroupDetails = {
                            navController.navigate(NavRoutes.GROUP_DETAILS)
                        },
                        onOpenChat = {
                            navController.navigate(NavRoutes.CHAT)
                        },
                        onOpenTasks = {
                            navController.navigate(NavRoutes.TASKS)
                        },
                        onOpenPolls = {
                            navController.navigate(NavRoutes.POLLING)
                        },
                        onLogout = {
                            println("Navigation: Logout called")
                            authViewModel.logout()
                            navController.navigate(NavRoutes.AUTH) {
                                popUpTo(0) { inclusive = true }
                            }
                        },
                        onDeleteAccount = {
                            println("Navigation: Delete account called")
                            authViewModel.deleteUser()
                            // Navigate after deletion completes
                            navController.navigate(NavRoutes.AUTH) {
                                popUpTo(0) { inclusive = true }
                            }
                        }
                    )
                }

                composable(NavRoutes.GROUP_DETAILS) {
                    val groupViewModel: GroupViewModel = viewModel()
                    val groupUiState by groupViewModel.uiState.collectAsState()
                    val authState by authViewModel.authState.collectAsState()
                    
                    val groupName = groupUiState.group?.name ?: "My Group"
                    val groupId = groupUiState.group?.id ?: ""
                    val currentUserId = authState?.user?._id ?: ""
                    
                    println("Navigation GROUP_DETAILS: groupId='$groupId', currentUserId='$currentUserId'")
                    
                    if (groupId.isNotEmpty() && currentUserId.isNotEmpty()) {
                        val taskViewModel = androidx.lifecycle.viewmodel.compose.viewModel {
                            TaskViewModel(groupId, currentUserId)
                        }
                        GroupDetailsScreen(
                            groupName = groupName,
                            viewModel = taskViewModel,
                            onBack = {
                                navController.popBackStack()
                            }
                        )
                    } else {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator()
                        }
                    }
                }

                composable(NavRoutes.CHAT) {
                    val groupViewModel: GroupViewModel = viewModel()
                    val groupUiState by groupViewModel.uiState.collectAsState()
                    val authState by authViewModel.authState.collectAsState()
                    
                    val groupName = groupUiState.group?.name ?: "Group Chat"
                    val groupId = groupUiState.group?.id ?: ""
                    val currentUserId = authState?.user?._id ?: ""
                    
                    println("Navigation CHAT: groupId='$groupId', currentUserId='$currentUserId'")
                    
                    if (groupId.isNotEmpty() && currentUserId.isNotEmpty()) {
                        ChatScreen(
                            groupName = groupName,
                            groupId = groupId,
                            currentUserId = currentUserId,
                            onBack = {
                                navController.popBackStack()
                            },
                            onNavigateToPolls = {
                                navController.navigate(NavRoutes.POLLING)
                            }
                        )
                    } else {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator()
                        }
                    }
                }

                composable(NavRoutes.TASKS) {
                    val groupViewModel: GroupViewModel = viewModel()
                    val groupUiState by groupViewModel.uiState.collectAsState()
                    val authState by authViewModel.authState.collectAsState()
                    
                    val groupName = groupUiState.group?.name ?: "Group Tasks"
                    val groupId = groupUiState.group?.id ?: ""
                    val currentUserId = authState?.user?._id ?: ""
                    
                    println("Navigation TASKS: groupId='$groupId', currentUserId='$currentUserId'")
                    
                    if (groupId.isNotEmpty() && currentUserId.isNotEmpty()) {
                        TaskScreen(
                            groupName = groupName,
                            groupId = groupId,
                            currentUserId = currentUserId,
                            onBack = {
                                navController.popBackStack()
                            }
                        )
                    } else {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator()
                        }
                    }
                }

                composable(NavRoutes.POLLING) {
                    val groupViewModel: GroupViewModel = viewModel()
                    val groupUiState by groupViewModel.uiState.collectAsState()
                    val authState by authViewModel.authState.collectAsState()
                    
                    val groupName = groupUiState.group?.name ?: "Group Polls"
                    val groupId = groupUiState.group?.id ?: ""
                    val currentUserId = authState?.user?._id ?: ""
                    
                    println("Navigation POLLING: groupId='$groupId', currentUserId='$currentUserId'")
                    
                    if (groupId.isNotEmpty() && currentUserId.isNotEmpty()) {
                        PollingScreen(
                            groupName = groupName,
                            groupId = groupId,
                            currentUserId = currentUserId,
                            onBack = {
                                navController.popBackStack()
                            }
                        )
                    } else {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator()
                        }
                    }
                }
    }
}


