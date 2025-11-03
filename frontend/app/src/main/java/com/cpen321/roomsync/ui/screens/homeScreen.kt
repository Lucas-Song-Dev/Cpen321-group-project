package com.cpen321.roomsync.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex

@Composable
fun HomeScreen(
    groupName: String = "My Group",
    onViewGroupDetails: () -> Unit = {},
    onOpenChat: () -> Unit = {},
    onOpenTasks: () -> Unit = {},
    onOpenPolls: () -> Unit = {},
    onLeaveGroup: () -> Unit = {},
    onLogout: () -> Unit = {},
    onDeleteAccount: () -> Unit = {}
) {
    var showMenu by remember { mutableStateOf(false) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    var showLeaveGroupDialog by remember { mutableStateOf(false) }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Top bar with hamburger menu - INCREASED PADDING
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = MaterialTheme.colorScheme.background,
                shadowElevation = 4.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(start = 16.dp, end = 16.dp, top = 40.dp, bottom = 12.dp),
                    verticalAlignment = Alignment.Bottom
                ) {
                    IconButton(
                        onClick = { showMenu = true }
                    ) {
                        Icon(
                            Icons.Default.Menu,
                            contentDescription = "Menu",
                            tint = MaterialTheme.colorScheme.onSurface
                        )
                    }
                    
                    Spacer(modifier = Modifier.width(16.dp))
                    
                    Text(
                        text = "RoomSync",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }

            // Main content area
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "Welcome to $groupName!",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground,
                    modifier = Modifier.padding(bottom = 32.dp)
                )
                
                // Quick actions
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp)
                        .clickable { onOpenChat() },
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "💬",
                            fontSize = 24.sp,
                            modifier = Modifier.padding(end = 16.dp)
                        )
                        Column {
                            Text(
                                text = "Group Chat",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Start chatting with your roommates",
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp)
                        .clickable { onOpenTasks() },
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "✅",
                            fontSize = 24.sp,
                            modifier = Modifier.padding(end = 16.dp)
                        )
                        Column {
                            Text(
                                text = "Group Tasks",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Manage household tasks and assignments",
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
                
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp)
                        .clickable { onOpenPolls() },
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "📊",
                            fontSize = 24.sp,
                            modifier = Modifier.padding(end = 16.dp)
                        )
                        Column {
                            Text(
                                text = "Group Polls",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Create and vote on group decisions",
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
                
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp)
                        .clickable { onViewGroupDetails() },
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "👥",
                            fontSize = 24.sp,
                            modifier = Modifier.padding(end = 16.dp)
                        )
                        Column {
                            Text(
                                text = "Group Details",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "View group information and members",
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
        }

        // Dropdown menu
        DropdownMenu(
            expanded = showMenu,
            onDismissRequest = { 
                println("HomeScreen: Dropdown menu dismissed")
                showMenu = false 
            },
            modifier = Modifier
                .width(250.dp)
                .zIndex(1f)
        ) {
            DropdownMenuItem(
                text = { Text("View Group Details") },
                onClick = {
                    onViewGroupDetails()
                    showMenu = false
                }
            )
            DropdownMenuItem(
                text = { Text("Open Chat") },
                onClick = {
                    onOpenChat()
                    showMenu = false
                }
            )
            DropdownMenuItem(
                text = { Text("View Tasks") },
                onClick = {
                    onOpenTasks()
                    showMenu = false
                }
            )
            DropdownMenuItem(
                text = { Text("View Polls") },
                onClick = {
                    onOpenPolls()
                    showMenu = false
                }
            )
            HorizontalDivider()
            DropdownMenuItem(
                text = { 
                    println("HomeScreen: Rendering Leave Group button text")
                    Text(
                        "Leave Group (TEST)",
                        color = MaterialTheme.colorScheme.error
                    ) 
                },
                onClick = {
                    println("HomeScreen: Leave Group button clicked - showMenu: $showMenu, showLeaveGroupDialog: $showLeaveGroupDialog")
                    // Test: Just show a simple alert first
                    println("HomeScreen: TEST - Button click registered!")
                    showLeaveGroupDialog = true
                    showMenu = false
                    println("HomeScreen: After setting states - showMenu: $showMenu, showLeaveGroupDialog: $showLeaveGroupDialog")
                }
            )
            DropdownMenuItem(
                text = { 
                    Text(
                        "Delete Account",
                        color = MaterialTheme.colorScheme.error
                    ) 
                },
                onClick = {
                    showDeleteDialog = true
                    showMenu = false
                }
            )
            DropdownMenuItem(
                text = { 
                    Text(
                        "Logout",
                        color = MaterialTheme.colorScheme.error
                    ) 
                },
                onClick = {
                    onLogout()
                    showMenu = false
                }
            )
        }
        
        // Leave group confirmation dialog
        if (showLeaveGroupDialog) {
            println("HomeScreen: Rendering Leave Group dialog")
            AlertDialog(
                onDismissRequest = { 
                    println("HomeScreen: Dialog dismissed")
                    showLeaveGroupDialog = false 
                },
                title = { Text("Leave Group") },
                text = { Text("Are you sure you want to leave this group? You can join another group later.") },
                confirmButton = {
                    Button(
                        onClick = {
                            println("HomeScreen: Leave Group dialog confirmed")
                            showLeaveGroupDialog = false
                            onLeaveGroup()
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.error
                        )
                    ) {
                        Text("Leave")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showLeaveGroupDialog = false }) {
                        Text("Cancel")
                    }
                }
            )
        }
        
        // Delete account confirmation dialog
        if (showDeleteDialog) {
            AlertDialog(
                onDismissRequest = { showDeleteDialog = false },
                title = { Text("Delete Account") },
                text = { Text("Are you sure you want to permanently delete your account? This action cannot be undone.") },
                confirmButton = {
                    Button(
                        onClick = {
                            showDeleteDialog = false
                            onDeleteAccount()
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.error
                        )
                    ) {
                        Text("Delete")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDeleteDialog = false }) {
                        Text("Cancel")
                    }
                }
            )
        }
    }
}
