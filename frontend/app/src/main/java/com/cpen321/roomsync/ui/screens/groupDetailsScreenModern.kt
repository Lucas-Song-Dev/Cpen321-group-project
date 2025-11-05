package com.cpen321.roomsync.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.ClipboardManager
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.cpen321.roomsync.data.models.ReportUserRequest
import com.cpen321.roomsync.data.network.RetrofitInstance
import com.cpen321.roomsync.ui.theme.GlassColors
import com.cpen321.roomsync.ui.theme.GlassGradients
import com.cpen321.roomsync.ui.theme.glassCard
import com.cpen321.roomsync.ui.viewmodels.TaskViewModel
import com.cpen321.roomsync.ui.viewmodels.ViewModelGroupMember
import kotlinx.coroutines.launch

@Composable
fun GroupDetailsScreenModern(
    groupName: String = "My Group",
    viewModel: TaskViewModel,
    groupId: String = "",
    currentUserId: String = "",
    onBack: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()
    val groupViewModel: com.cpen321.roomsync.ui.viewmodels.GroupViewModel = viewModel()
    val groupUiState by groupViewModel.uiState.collectAsState()

    var selectedMember by remember { mutableStateOf<ViewModelGroupMember?>(null) }
    var showCopyToast by remember { mutableStateOf(false) }
    var memberToKick by remember { mutableStateOf<ViewModelGroupMember?>(null) }
    var showKickConfirmation by remember { mutableStateOf(false) }
    var showEditGroupDialog by remember { mutableStateOf(false) }
    var editedGroupName by remember { mutableStateOf(groupName) }
    
    val clipboardManager: ClipboardManager = LocalClipboardManager.current
    val isCurrentUserOwner = groupUiState.group?.owner?.id == currentUserId

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(brush = GlassGradients.MainBackground)
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Glass Top Bar
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
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(onClick = onBack) {
                            Icon(
                                Icons.Default.ArrowBack,
                                contentDescription = "Back",
                                tint = Color.White
                            )
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Group Details",
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                    
                    if (isCurrentUserOwner) {
                        IconButton(onClick = { showEditGroupDialog = true }) {
                            Icon(
                                Icons.Default.Edit,
                                contentDescription = "Edit Group",
                                tint = Color.White
                            )
                        }
                    }
                }
            }

            // Main content
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Group Info Card
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .glassCard()
                        .padding(20.dp)
                ) {
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Group Name",
                                    fontSize = 14.sp,
                                    color = Color(0xC0FFFFFF),
                                    fontWeight = FontWeight.Medium
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = groupName,
                                    fontSize = 24.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        
                        HorizontalDivider(color = Color(0x30FFFFFF))
                        
                        Spacer(modifier = Modifier.height(16.dp))

                        // Group Code
                        Column {
                            Text(
                                text = "Group Code",
                                fontSize = 14.sp,
                                color = Color(0xC0FFFFFF),
                                fontWeight = FontWeight.Medium
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(
                                        color = Color(0x30FFFFFF),
                                        shape = RoundedCornerShape(12.dp)
                                    )
                                    .padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = groupUiState.group?.groupCode ?: "Loading...",
                                    fontSize = 28.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White,
                                    letterSpacing = 4.sp
                                )
                                IconButton(
                                    onClick = {
                                        groupUiState.group?.groupCode?.let { code ->
                                            clipboardManager.setText(AnnotatedString(code))
                                            showCopyToast = true
                                        }
                                    }
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Share,
                                        contentDescription = "Copy code",
                                        tint = Color.White
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Share this code to invite members",
                                fontSize = 12.sp,
                                color = Color(0xA0FFFFFF)
                            )
                        }
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        HorizontalDivider(color = Color(0x30FFFFFF))
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        // Member count
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Members",
                                fontSize = 14.sp,
                                color = Color(0xC0FFFFFF),
                                fontWeight = FontWeight.Medium
                            )
                            Text(
                                text = "${groupUiState.group?.members?.size ?: 0} / 8",
                                fontSize = 14.sp,
                                color = Color.White,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                // Members List
                Text(
                    text = "Group Members",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    groupUiState.group?.members?.let { members ->
                        items(members) { member ->
                            val isOwner = member.id == groupUiState.group?.owner?.id
                            ModernMemberCard(
                                member = if (isOwner) member.copy(isAdmin = true) else member,
                                onClick = { selectedMember = member },
                                onRemove = if (!isOwner && isCurrentUserOwner) {
                                    {
                                        memberToKick = member
                                        showKickConfirmation = true
                                    }
                                } else null,
                                showRemoveButton = !isOwner && isCurrentUserOwner
                            )
                        }
                    }
                }
            }
        }

        // Copy toast
        if (showCopyToast) {
            LaunchedEffect(showCopyToast) {
                kotlinx.coroutines.delay(2000)
                showCopyToast = false
            }

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                contentAlignment = Alignment.BottomCenter
            ) {
                Box(
                    modifier = Modifier
                        .background(
                            color = Color(0xE0FFFFFF),
                            shape = RoundedCornerShape(12.dp)
                        )
                        .padding(16.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Default.Check,
                            contentDescription = null,
                            tint = GlassColors.AccentPurple
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Code copied!",
                            color = GlassColors.AccentPurple,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
        }

        // Kick member confirmation
        if (showKickConfirmation && memberToKick != null) {
            AlertDialog(
                onDismissRequest = {
                    showKickConfirmation = false
                    memberToKick = null
                },
                title = { Text("Remove Member", fontWeight = FontWeight.Bold) },
                text = {
                    Text("Are you sure you want to remove ${memberToKick?.name} from the group?")
                },
                confirmButton = {
                    Button(
                        onClick = {
                            memberToKick?.let { member ->
                                groupViewModel.removeMember(member.id)
                            }
                            showKickConfirmation = false
                            memberToKick = null
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFFEF4444)
                        )
                    ) {
                        Text("Remove")
                    }
                },
                dismissButton = {
                    TextButton(
                        onClick = {
                            showKickConfirmation = false
                            memberToKick = null
                        }
                    ) {
                        Text("Cancel")
                    }
                },
                containerColor = Color.White,
                shape = RoundedCornerShape(20.dp)
            )
        }

        // Edit Group Dialog (Admin only)
        if (showEditGroupDialog) {
            AlertDialog(
                onDismissRequest = { showEditGroupDialog = false },
                title = { Text("Edit Group", fontWeight = FontWeight.Bold) },
                text = {
                    Column {
                        OutlinedTextField(
                            value = editedGroupName,
                            onValueChange = { editedGroupName = it },
                            label = { Text("Group Name") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Note: Other members will see the updated name",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            // TODO: Implement group name update API call
                            // groupViewModel.updateGroupName(editedGroupName)
                            showEditGroupDialog = false
                        },
                        enabled = editedGroupName.trim().isNotEmpty() && editedGroupName != groupName
                    ) {
                        Text("Save")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { 
                        editedGroupName = groupName
                        showEditGroupDialog = false 
                    }) {
                        Text("Cancel")
                    }
                },
                containerColor = Color.White,
                shape = RoundedCornerShape(20.dp)
            )
        }

        // Member detail dialog
        selectedMember?.let { member ->
            MemberDetailDialog(
                member = member,
                groupId = groupId,
                currentUserId = currentUserId,
                groupViewModel = groupViewModel,
                onDismiss = { selectedMember = null },
                onTransferSuccess = {
                    viewModel.loadGroupMembers()
                }
            )
        }
    }
}

@Composable
fun ModernMemberCard(
    member: ViewModelGroupMember,
    onClick: () -> Unit = {},
    onRemove: (() -> Unit)? = null,
    showRemoveButton: Boolean = false
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .glassCard()
            .clickable { onClick() }
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(CircleShape)
                    .background(
                        if (member.isAdmin) 
                            Color(0x80FFFFFF)
                        else 
                            Color(0x50FFFFFF)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = member.name.take(1).uppercase(),
                    color = Color.White,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            Column(
                modifier = Modifier.weight(1f)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = member.name,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )

                    if (member.isAdmin) {
                        Spacer(modifier = Modifier.width(8.dp))
                        Box(
                            modifier = Modifier
                                .background(
                                    color = Color(0x80FFFFFF),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                .padding(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = "Admin",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                if (member.bio.isNotEmpty()) {
                    Text(
                        text = member.bio,
                        fontSize = 14.sp,
                        color = Color(0xD0FFFFFF),
                        maxLines = 1
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Email,
                        contentDescription = null,
                        modifier = Modifier.size(14.dp),
                        tint = Color(0xB0FFFFFF)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = member.email,
                        fontSize = 12.sp,
                        color = Color(0xB0FFFFFF)
                    )
                }
            }

            // Remove button for non-admin members (owner only)
            if (showRemoveButton && !member.isAdmin && onRemove != null) {
                IconButton(onClick = onRemove) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Remove member",
                        tint = Color(0xFFEF4444)
                    )
                }
            } else {
                Icon(
                    imageVector = Icons.Default.Info,
                    contentDescription = "View details",
                    tint = Color(0x80FFFFFF),
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}




