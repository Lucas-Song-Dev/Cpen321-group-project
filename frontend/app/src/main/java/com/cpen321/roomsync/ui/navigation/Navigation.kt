package com.cpen321.roomsync.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.lifecycle.viewmodel.compose.viewModel
import com.cpen321.roomsync.ui.screens.AuthScreen
import com.cpen321.roomsync.ui.screens.AuthScreenGlass
import com.cpen321.roomsync.ui.screens.AuthScreenModern
import com.cpen321.roomsync.ui.screens.PersonalProfileScreen
import com.cpen321.roomsync.ui.screens.OptionalProfileScreen
import com.cpen321.roomsync.ui.screens.GroupSelectionScreen
import com.cpen321.roomsync.ui.screens.CreateGroupScreen
import com.cpen321.roomsync.ui.screens.JoinGroupScreen
import com.cpen321.roomsync.ui.screens.HomeScreen
import com.cpen321.roomsync.ui.screens.HomeScreenGlass
import com.cpen321.roomsync.ui.screens.ProfileScreen
import com.cpen321.roomsync.ui.screens.GroupDetailsScreen
import com.cpen321.roomsync.ui.screens.GroupDetailsScreenModern
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
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.ui.unit.dp

//screen destinations
object NavRoutes {
    const val AUTH = "auth"
    const val PERSONAL_PROFILE = "personal_profile"
    const val OPTIONAL_PROFILE = "optional_profile"
    const val GROUP_SELECTION = "group_selection"
    const val CREATE_GROUP = "create_group"
    const val JOIN_GROUP = "join_group"
    const val HOME = "home"
    const val PROFILE = "profile"
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
            AuthScreenModern(
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
                            navController.navigate(NavRoutes.JOIN_GROUP)
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

                composable(NavRoutes.JOIN_GROUP) {
                    val groupViewModel: GroupViewModel = viewModel()
                    
                    // Clear group state when entering join group screen
                    LaunchedEffect(Unit) {
                        groupViewModel.clearGroupState()
                    }
                    
                    JoinGroupScreen(
                        onJoinGroup = {
                            // Navigate to home after successful group join
                            navController.navigate(NavRoutes.HOME) {
                                popUpTo(NavRoutes.GROUP_SELECTION) { inclusive = true }
                            }
                        },
                        onBack = {
                            navController.popBackStack()
                        },
                        viewModel = groupViewModel
                    )
                }

                composable(NavRoutes.HOME) {
                    val groupViewModel: GroupViewModel = viewModel()
                    val groupUiState by groupViewModel.uiState.collectAsState()
                    val groupName = groupUiState.group?.name ?: "My Group"
                    val authState by authViewModel.authState.collectAsState()
                    
                    // Monitor auth state for deletion success (when auth becomes null)
                    LaunchedEffect(authState) {
                        if (authState == null) {
                            println("Navigation: Auth cleared -> navigating to AUTH")
                            navController.navigate(NavRoutes.AUTH) {
                                popUpTo(0) { inclusive = true }
                            }
                        }
                    }
                    LaunchedEffect(groupUiState.leftGroup) {
                        if (groupUiState.leftGroup) {
                            println("Navigation: leftGroup event -> navigating to GROUP_SELECTION")
                            groupViewModel.clearGroupState()
                            navController.navigate(NavRoutes.GROUP_SELECTION) {
                                popUpTo(0) { inclusive = true }
                            }
                            groupViewModel.consumeLeftGroupEvent()
                        }
                    }
                    
                    HomeScreenGlass(
                        groupName = groupName,
                        onViewGroupDetails = {
                            navController.navigate(NavRoutes.GROUP_DETAILS)
                        },
                        onViewProfile = {
                            navController.navigate(NavRoutes.PROFILE)
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
                        onLeaveGroup = {
                            println("Navigation: Leave group called - about to call groupViewModel.leaveGroup()")
                            groupViewModel.leaveGroup()
                            println("Navigation: groupViewModel.leaveGroup() called")
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
                        }
                    )
                }

                composable(NavRoutes.PROFILE) {
                    val authResponse by authViewModel.authState.collectAsState()
                    val factory = OptionalProfileViewModelFactory(RetrofitInstance.api)
                    val profileViewModel: OptionalProfileViewModel = viewModel(factory = factory)
                    val user = authResponse?.user
                    
                    if (user != null) {
                        ProfileScreen(
                            user = user,
                            viewModel = profileViewModel,
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

                composable(NavRoutes.GROUP_DETAILS) {
                    val groupViewModel: GroupViewModel = viewModel()
                    val groupUiState by groupViewModel.uiState.collectAsState()
                    val authState by authViewModel.authState.collectAsState()
                    
                    val groupName = groupUiState.group?.name ?: "My Group"
                    val groupId = groupUiState.group?.id ?: ""
                    val currentUserId = authState?.user?._id ?: ""
                    
                    println("Navigation GROUP_DETAILS: groupId='$groupId', currentUserId='$currentUserId'")
                    
                    // If no group data, navigate back to group selection
                    LaunchedEffect(groupUiState.group) {
                        if (groupUiState.group == null && !groupUiState.isLoading) {
                            println("Navigation GROUP_DETAILS: No group data, navigating to GROUP_SELECTION")
                            navController.navigate(NavRoutes.GROUP_SELECTION) {
                                popUpTo(NavRoutes.HOME) { inclusive = false }
                            }
                        }
                    }
                    
                    if (groupId.isNotEmpty() && currentUserId.isNotEmpty()) {
                        val taskViewModel = androidx.lifecycle.viewmodel.compose.viewModel {
                            TaskViewModel(groupId, currentUserId)
                        }
                        GroupDetailsScreenModern(
                            groupName = groupName,
                            viewModel = taskViewModel,
                            groupId = groupId,
                            currentUserId = currentUserId,
                            onBack = {
                                navController.popBackStack()
                            }
                        )
                    } else if (groupUiState.isLoading) {
                        // Show loading while group data is being fetched
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator()
                        }
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
                    
                    println("Navigation CHAT: groupId='$groupId', currentUserId='$currentUserId', isLoading=${groupUiState.isLoading}")
                    println("Navigation CHAT: group=${groupUiState.group}, authUser=${authState?.user}")
                    
                    when {
                        groupUiState.isLoading -> {
                            Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center
                            ) {
                                CircularProgressIndicator()
                                Text(
                                    text = "Loading group...",
                                    modifier = Modifier.padding(top = 64.dp)
                                )
                            }
                        }
                        groupId.isEmpty() -> {
                            Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("No group found. Please create or join a group first.")
                                    Button(
                                        onClick = { navController.navigate(NavRoutes.GROUP_SELECTION) },
                                        modifier = Modifier.padding(top = 16.dp)
                                    ) {
                                        Text("Go to Group Selection")
                                    }
                                }
                            }
                        }
                        currentUserId.isEmpty() -> {
                            Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("User not authenticated. Please log in again.")
                            }
                        }
                        else -> {
                            ChatScreen(
                                groupName = groupName,
                                groupId = groupId,
                                currentUserId = currentUserId,
                                authViewModel = authViewModel,
                                onBack = {
                                    navController.popBackStack()
                                },
                                onNavigateToPolls = {
                                    navController.navigate(NavRoutes.POLLING)
                                }
                            )
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
                    
                    // If no group data, navigate back to group selection
                    LaunchedEffect(groupUiState.group) {
                        if (groupUiState.group == null && !groupUiState.isLoading) {
                            println("Navigation TASKS: No group data, navigating to GROUP_SELECTION")
                            navController.navigate(NavRoutes.GROUP_SELECTION) {
                                popUpTo(NavRoutes.HOME) { inclusive = false }
                            }
                        }
                    }
                    
                    if (groupId.isNotEmpty() && currentUserId.isNotEmpty()) {
                        TaskScreen(
                            groupName = groupName,
                            groupId = groupId,
                            onBack = {
                                navController.popBackStack()
                            },
                            currentUserId = currentUserId
                        )
                    } else if (groupUiState.isLoading) {
                        // Show loading while group data is being fetched
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator()
                        }
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
                    
                    // If no group data, navigate back to group selection
                    LaunchedEffect(groupUiState.group) {
                        if (groupUiState.group == null && !groupUiState.isLoading) {
                            println("Navigation POLLING: No group data, navigating to GROUP_SELECTION")
                            navController.navigate(NavRoutes.GROUP_SELECTION) {
                                popUpTo(NavRoutes.HOME) { inclusive = false }
                            }
                        }
                    }
                    
                    if (groupId.isNotEmpty() && currentUserId.isNotEmpty()) {
                        PollingScreen(
                            groupName = groupName,
                            groupId = groupId,
                            currentUserId = currentUserId,
                            onBack = {
                                navController.popBackStack()
                            }
                        )
                    } else if (groupUiState.isLoading) {
                        // Show loading while group data is being fetched
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator()
                        }
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


