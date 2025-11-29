package com.cpen321.roomsync.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cpen321.roomsync.ui.theme.GlassColors
import com.cpen321.roomsync.ui.theme.GlassGradients
import com.cpen321.roomsync.ui.theme.glassCard
import kotlinx.coroutines.launch

@Composable
fun HomeScreenGlass(
    groupName: String = "My Group",
    onViewGroupDetails: () -> Unit = {},
    onViewProfile: () -> Unit = {},
    onOpenChat: () -> Unit = {},
    onOpenTasks: () -> Unit = {},
    onOpenPolls: () -> Unit = {},
    onLeaveGroup: () -> Unit = {},
    onLogout: () -> Unit = {},
    onDeleteAccount: () -> Unit = {}
) {
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    var showDeleteDialog by remember { mutableStateOf(false) }
    var showLeaveGroupDialog by remember { mutableStateOf(false) }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                drawerContainerColor = Color(0xF0FFFFFF)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            brush = GlassGradients.AccentGradient
                        )
                        .padding(vertical = 32.dp, horizontal = 16.dp)
                ) {
                    Text(
                        text = "RoomSync",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                NavigationDrawerItem(
                    label = { Text("View Group Details", fontWeight = FontWeight.Medium) },
                    selected = false,
                    onClick = {
                        onViewGroupDetails()
                        scope.launch { drawerState.close() }
                    },
                    colors = NavigationDrawerItemDefaults.colors(
                        unselectedContainerColor = Color.Transparent
                    )
                )
                NavigationDrawerItem(
                    label = { Text("Open Chat", fontWeight = FontWeight.Medium) },
                    selected = false,
                    onClick = {
                        onOpenChat()
                        scope.launch { drawerState.close() }
                    },
                    colors = NavigationDrawerItemDefaults.colors(
                        unselectedContainerColor = Color.Transparent
                    )
                )
                NavigationDrawerItem(
                    label = { Text("View Tasks", fontWeight = FontWeight.Medium) },
                    selected = false,
                    onClick = {
                        onOpenTasks()
                        scope.launch { drawerState.close() }
                    },
                    colors = NavigationDrawerItemDefaults.colors(
                        unselectedContainerColor = Color.Transparent
                    )
                )
                NavigationDrawerItem(
                    label = { Text("View Polls", fontWeight = FontWeight.Medium) },
                    selected = false,
                    onClick = {
                        onOpenPolls()
                        scope.launch { drawerState.close() }
                    },
                    colors = NavigationDrawerItemDefaults.colors(
                        unselectedContainerColor = Color.Transparent
                    )
                )
                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                NavigationDrawerItem(
                    label = { Text("My Profile", fontWeight = FontWeight.Medium) },
                    selected = false,
                    onClick = {
                        onViewProfile()
                        scope.launch { drawerState.close() }
                    },
                    colors = NavigationDrawerItemDefaults.colors(
                        unselectedContainerColor = Color.Transparent
                    )
                )
                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                NavigationDrawerItem(
                    label = { Text("Leave Group", color = Color(0xFFEF4444), fontWeight = FontWeight.Medium) },
                    selected = false,
                    onClick = {
                        showLeaveGroupDialog = true
                        scope.launch { drawerState.close() }
                    },
                    colors = NavigationDrawerItemDefaults.colors(
                        unselectedContainerColor = Color.Transparent
                    )
                )
                NavigationDrawerItem(
                    label = { Text("Delete Account", color = Color(0xFFEF4444), fontWeight = FontWeight.Medium) },
                    selected = false,
                    onClick = {
                        showDeleteDialog = true
                        scope.launch { drawerState.close() }
                    },
                    colors = NavigationDrawerItemDefaults.colors(
                        unselectedContainerColor = Color.Transparent
                    )
                )
                NavigationDrawerItem(
                    label = { Text("Logout", color = Color(0xFFEF4444), fontWeight = FontWeight.Medium) },
                    selected = false,
                    onClick = {
                        onLogout()
                        scope.launch { drawerState.close() }
                    },
                    colors = NavigationDrawerItemDefaults.colors(
                        unselectedContainerColor = Color.Transparent
                    )
                )
            }
        }
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(brush = GlassGradients.MainBackground)
        ) {
            Column(
                modifier = Modifier.fillMaxSize()
            ) {
                // Top bar with hamburger menu - Glass effect
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            color = Color(0x30FFFFFF),
                            shape = RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp)
                        )
                        .border(
                            width = 1.dp,
                            color = Color(0x40FFFFFF),
                            shape = RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp)
                        )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(start = 16.dp, end = 16.dp, top = 40.dp, bottom = 16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(
                            onClick = { scope.launch { drawerState.open() } }
                        ) {
                            Icon(
                                Icons.Default.Menu,
                                contentDescription = "Menu",
                                tint = Color.White,
                                modifier = Modifier.size(28.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(16.dp))

                        Column {
                            Text(
                                text = "RoomSync",
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Text(
                                text = groupName,
                                fontSize = 14.sp,
                                color = Color(0xE0FFFFFF)
                            )
                        }
                    }
                }

                // Main content area
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically)
                ) {
                    // Welcome text
                    Text(
                        text = "Welcome Back!",
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )

                    // Quick actions - Glass Cards
                    GlassActionCard(
                        icon = Icons.Default.Email,
                        title = "Group Chat",
                        subtitle = "Connect with your roommates",
                        onClick = onOpenChat
                    )

                    GlassActionCard(
                        icon = Icons.Default.CheckCircle,
                        title = "Group Tasks",
                        subtitle = "Manage household chores",
                        onClick = onOpenTasks
                    )

                    GlassActionCard(
                        icon = Icons.Default.ThumbUp,
                        title = "Group Polls",
                        subtitle = "Vote on group decisions",
                        onClick = onOpenPolls
                    )

                    GlassActionCard(
                        icon = Icons.Default.AccountCircle,
                        title = "Group Details",
                        subtitle = "View members and info",
                        onClick = onViewGroupDetails
                    )
                }
            }

            // Leave group confirmation dialog
            if (showLeaveGroupDialog) {
                AlertDialog(
                    onDismissRequest = {
                        showLeaveGroupDialog = false
                    },
                    title = { Text("Leave Group", fontWeight = FontWeight.Bold, color = Color.White) },
                    text = { Text("Are you sure you want to leave this group? You can join another group later.", color = Color.White) },
                    confirmButton = {
                        Button(
                            onClick = {
                                showLeaveGroupDialog = false
                                onLeaveGroup()
                            },
                            modifier = Modifier.border(
                                width = 1.dp,
                                color = Color(0xFFFF6B6B),
                                shape = RoundedCornerShape(8.dp)
                            ),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color.Transparent,
                                contentColor = Color(0xFFFF6B6B)
                            )
                        ) {
                            Text("Leave", color = Color(0xFFFF6B6B))
                        }
                    },
                    dismissButton = {
                        TextButton(
                            onClick = { showLeaveGroupDialog = false },
                            colors = ButtonDefaults.textButtonColors(
                                contentColor = Color.White
                            )
                        ) {
                            Text("Cancel", color = Color.White)
                        }
                    },
                    containerColor = Color(0xCC000000),
                    shape = RoundedCornerShape(20.dp)
                )
            }

            // Delete account confirmation dialog
            if (showDeleteDialog) {
                AlertDialog(
                    onDismissRequest = { showDeleteDialog = false },
                    title = { Text("Delete Account", fontWeight = FontWeight.Bold, color = Color.White) },
                    text = { Text("Are you sure you want to delete your account? This action cannot be undone.", color = Color.White) },
                    confirmButton = {
                        Button(
                            onClick = {
                                showDeleteDialog = false
                                onDeleteAccount()
                            },
                            modifier = Modifier.border(
                                width = 1.dp,
                                color = Color(0xFFFF6B6B),
                                shape = RoundedCornerShape(8.dp)
                            ),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color.Transparent,
                                contentColor = Color(0xFFFF6B6B)
                            )
                        ) {
                            Text("Delete", color = Color(0xFFFF6B6B))
                        }
                    },
                    dismissButton = {
                        TextButton(
                            onClick = { showDeleteDialog = false },
                            colors = ButtonDefaults.textButtonColors(
                                contentColor = Color.White
                            )
                        ) {
                            Text("Cancel", color = Color.White)
                        }
                    },
                    containerColor = Color(0xCC000000),
                    shape = RoundedCornerShape(20.dp)
                )
            }
        }
    }
}

@Composable
fun GlassActionCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(90.dp)
            .glassCard()
            .clickable { onClick() }
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .background(
                        color = Color(0x40FFFFFF),
                        shape = RoundedCornerShape(12.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    tint = Color.White,
                    modifier = Modifier.size(28.dp)
                )
            }
            Spacer(modifier = Modifier.width(20.dp))
            Column(
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = title,
                    fontSize = 19.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = subtitle,
                    fontSize = 14.sp,
                    color = Color(0xE0FFFFFF)
                )
            }
        }
    }
}

