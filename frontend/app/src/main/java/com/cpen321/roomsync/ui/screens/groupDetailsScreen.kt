package com.cpen321.roomsync.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.cpen321.roomsync.ui.viewmodels.TaskViewModel
import com.cpen321.roomsync.ui.viewmodels.ViewModelGroupMember
import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.rememberScrollState

@Composable
fun GroupDetailsScreen(
    groupName: String = "My Group",
    viewModel: TaskViewModel,  // Inject ViewModel from parent
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
    val clipboardManager: ClipboardManager = LocalClipboardManager.current
    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Top bar with back button - THICKER PADDING
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
                        onClick = onBack
                    ) {
                        Icon(
                            Icons.Default.ArrowBack,
                            contentDescription = "Back",
                            tint = MaterialTheme.colorScheme.onSurface
                        )
                    }
                    
                    Spacer(modifier = Modifier.width(16.dp))
                    
                    Text(
                        text = "Group Details",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }

            // Main content
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                // Group info card
                Card(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Text(
                            text = "Group Name:",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = groupName,
                            fontSize = 18.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        Text(
                            text = "Members:",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = "${groupUiState.group?.members?.size ?: 0} members",
                            fontSize = 18.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // Group Code section
                        Text(
                            text = "Group Code:",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        // Group code display with copy functionality
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.primaryContainer
                            ),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text(
                                        text = "Share this code with new members:",
                                        fontSize = 14.sp,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                                        modifier = Modifier.padding(bottom = 8.dp)
                                    )
                                    
                                    Text(
                                        text = groupUiState.group?.groupCode ?: "Loading...",
                                        fontSize = 24.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                                
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
                                        contentDescription = "Copy group code",
                                        tint = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Members list
                Card(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Text(
                            text = "Group Members",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.padding(bottom = 16.dp)
                        )

                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // Show all members (including owner) from the group data
                            groupUiState.group?.members?.let { members ->
                                items(members) { member ->
                                    val isOwner = member.id == groupUiState.group?.owner?.id
                                    val isCurrentUserOwner = groupUiState.group?.owner?.id == currentUserId
                                    MemberCard(
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

                Spacer(modifier = Modifier.height(24.dp))

                // Back button
                Button(
                    onClick = onBack,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Back to Home")
                }
            }
        }

        // Member detail dialog
        selectedMember?.let { member ->
            MemberDetailDialog(
                member = member,
                groupId = groupId,
                currentUserId = currentUserId,
                onDismiss = { selectedMember = null }
            )
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
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    ),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = "Group code copied to clipboard!",
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
        }

        // Kick member confirmation dialog
        if (showKickConfirmation && memberToKick != null) {
            AlertDialog(
                onDismissRequest = { 
                    showKickConfirmation = false
                    memberToKick = null
                },
                title = { Text("Kick Member") },
                text = { 
                    Text("Are you sure you want to kick ${memberToKick?.name} from the group? This action cannot be undone.")
                },
                confirmButton = {
                    TextButton(
                        onClick = {
                            memberToKick?.let { member ->
                                groupViewModel.removeMember(member.id)
                            }
                            showKickConfirmation = false
                            memberToKick = null
                        }
                    ) {
                        Text("Kick", color = MaterialTheme.colorScheme.error)
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
                }
            )
        }
    }
}

@Composable
fun MemberCard(
    member: ViewModelGroupMember,
    onClick: () -> Unit = {},
    onRemove: (() -> Unit)? = null,
    showRemoveButton: Boolean = false
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Profile picture placeholder
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(
                        if (member.isAdmin) MaterialTheme.colorScheme.primary
                        else MaterialTheme.colorScheme.secondary
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = member.name.take(1).uppercase(),
                    color = Color.White,
                    fontSize = 18.sp,
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
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    if (member.isAdmin) {
                        Spacer(modifier = Modifier.width(8.dp))
                        Surface(
                            modifier = Modifier.clip(RoundedCornerShape(12.dp)),
                            color = MaterialTheme.colorScheme.primary
                        ) {
                            Text(
                                text = "Admin",
                                fontSize = 10.sp,
                                color = Color.White,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = member.bio,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = member.email,
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Kick member button (only for non-admin members, owner only)
            if (showRemoveButton && !member.isAdmin && onRemove != null) {
                IconButton(
                    onClick = onRemove
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Kick member from group",
                        tint = MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MemberDetailDialog(
    member: ViewModelGroupMember,
    groupId: String = "",
    currentUserId: String = "",
    onDismiss: () -> Unit
) {
    var showRatingDialog by remember { mutableStateOf(false) }
    val ratingViewModel: com.cpen321.roomsync.ui.viewmodels.RatingViewModel = viewModel()
    val ratingUiState by ratingViewModel.uiState.collectAsState()
    
    // Get current user's join date to calculate roommate duration
    val taskViewModel: com.cpen321.roomsync.ui.viewmodels.TaskViewModel = viewModel()
    val taskUiState by taskViewModel.uiState.collectAsState()
    val currentUserMember = taskUiState.groupMembers.find { it.id == currentUserId }
    
    // Calculate time since joining
    val joinDateText = remember(member.joinDate) {
        val joinDate = member.joinDate ?: return@remember "Unknown"
        val now = java.util.Date()
        val diffMs = now.time - joinDate.time
        val days = (diffMs / (1000 * 60 * 60 * 24)).toInt()
        
        println("MemberDetailDialog: Join date calculation - Member: ${member.name}, Join Date: $joinDate, Days: $days")
        
        when {
            days == 0 -> "Today"
            days == 1 -> "Yesterday"
            days < 7 -> "$days days ago"
            days < 30 -> "${days / 7} weeks ago"
            days < 365 -> "${days / 30} months ago"
            else -> "${days / 365} years ago"
        }
    }
    
    // Calculate roommate duration (time both users have been in the group together)
    val roommateDurationText = remember(member.joinDate, currentUserMember?.joinDate) {
        if (member.id == currentUserId) {
            return@remember null // Don't show for yourself
        }
        
        val memberJoinDate = member.joinDate ?: return@remember "Unknown"
        val currentUserJoinDate = currentUserMember?.joinDate ?: return@remember "Unknown"
        
        println("MemberDetailDialog: Roommate duration calculation")
        println("  - Member ${member.name} joined: $memberJoinDate")
        println("  - Current user joined: $currentUserJoinDate")
        
        // The roommate duration is from the later join date (when both were in the group)
        val laterJoinDate = if (memberJoinDate.time > currentUserJoinDate.time) memberJoinDate else currentUserJoinDate
        val now = java.util.Date()
        val durationMs = now.time - laterJoinDate.time
        val days = (durationMs / (1000 * 60 * 60 * 24)).toInt()
        
        println("  - Later join date: $laterJoinDate")
        println("  - Days as roommates: $days")
        
        when {
            days == 0 -> "Since today"
            days == 1 -> "1 day"
            days < 7 -> "$days days"
            days < 30 -> "${days / 7} week${if (days / 7 != 1) "s" else ""}"
            days < 365 -> "${days / 30} month${if (days / 30 != 1) "s" else ""}"
            else -> "${days / 365} year${if (days / 365 != 1) "s" else ""}"
        }
    }
    
    // Load user ratings when dialog opens
    LaunchedEffect(member.id) {
        println("MemberDetailDialog: Loading ratings for member: ${member.id}")
        ratingViewModel.getUserRatings(member.id)
    }
    
    // Debug: Log rating state changes
    LaunchedEffect(ratingUiState.totalRatings, ratingUiState.averageRating) {
        println("MemberDetailDialog: Rating state changed - total: ${ratingUiState.totalRatings}, avg: ${ratingUiState.averageRating}, ratings count: ${ratingUiState.ratings.size}")
    }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Profile picture
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(
                            if (member.isAdmin) MaterialTheme.colorScheme.primary
                            else MaterialTheme.colorScheme.secondary
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = member.name.take(1).uppercase(),
                        color = Color.White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Spacer(modifier = Modifier.width(16.dp))

                Column {
                    Text(
                        text = member.name,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )

                    if (member.isAdmin) {
                        Surface(
                            modifier = Modifier.clip(RoundedCornerShape(12.dp)),
                            color = MaterialTheme.colorScheme.primary
                        ) {
                            Text(
                                text = "Admin",
                                fontSize = 12.sp,
                                color = Color.White,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                            )
                        }
                    }
                }
            }
        },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.verticalScroll(rememberScrollState())
            ) {
                // Bio section
                Column {
                    Text(
                        text = "About",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = member.bio,
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }

                // Contact section
                Column {
                    Text(
                        text = "Contact",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = member.email,
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }

                // Join date section
                Column {
                    Text(
                        text = "Joined",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = joinDateText,
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
                
                // Roommate duration section (only show for other users)
                if (roommateDurationText != null) {
                    Column {
                        Text(
                            text = "Roommates For",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = roommateDurationText,
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
                
                // Rating section
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Rating",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.primary
                        )
                        if (member.id != currentUserId) {
                            TextButton(onClick = { showRatingDialog = true }) {
                                Text("Rate User")
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        // Star rating display - show blank if no ratings
                        val averageRating = ratingUiState.averageRating
                        val filledStars = if (ratingUiState.totalRatings > 0) 
                            averageRating.toInt() else 0
                        
                        repeat(5) { index ->
                            Text(
                                text = "★",
                                fontSize = 20.sp,
                                color = if (index < filledStars) 
                                    MaterialTheme.colorScheme.primary 
                                else 
                                    MaterialTheme.colorScheme.surfaceVariant,
                                modifier = Modifier.padding(horizontal = 2.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (ratingUiState.totalRatings > 0) 
                                "(${ratingUiState.totalRatings} rating${if (ratingUiState.totalRatings != 1) "s" else ""})" 
                            else 
                                "(No ratings yet)",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                
                // Reviews section
                if (ratingUiState.ratings.isNotEmpty()) {
                    Column {
                        Text(
                            text = "Reviews",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        ratingUiState.ratings.take(3).forEach { rating ->
                            if (!rating.testimonial.isNullOrBlank()) {
                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 4.dp),
                                    colors = CardDefaults.cardColors(
                                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                                    )
                                ) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            repeat(5) { index ->
                                                Text(
                                                    text = "★",
                                                    fontSize = 14.sp,
                                                    color = if (index < rating.rating) 
                                                        MaterialTheme.colorScheme.primary 
                                                    else 
                                                        MaterialTheme.colorScheme.surfaceVariant
                                                )
                                            }
                                        }
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = rating.testimonial,
                                            fontSize = 14.sp,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                    }
                                }
                            }
                        }
                        
                        if (ratingUiState.ratings.size > 3) {
                            Text(
                                text = "+${ratingUiState.ratings.size - 3} more reviews",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(top = 4.dp)
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )
    
    // Rating Dialog
    if (showRatingDialog) {
        RatingDialog(
            memberName = member.name,
            onDismiss = { showRatingDialog = false },
            onSubmit = { rating, testimonial ->
                ratingViewModel.submitRating(
                    ratedUserId = member.id,
                    groupId = groupId,
                    rating = rating,
                    testimonial = testimonial
                )
                // Close both the rating dialog and profile dialog immediately
                showRatingDialog = false
                onDismiss()
            }
        )
    }
}

@Composable
fun RatingDialog(
    memberName: String,
    onDismiss: () -> Unit,
    onSubmit: (rating: Int, testimonial: String) -> Unit
) {
    var selectedRating by remember { mutableStateOf(0) }
    var testimonial by remember { mutableStateOf("") }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Rate $memberName") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.verticalScroll(rememberScrollState())
            ) {
                // Star rating selector
                Text(
                    text = "Select Rating",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
                Row(
                    horizontalArrangement = Arrangement.Center,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    repeat(5) { index ->
                        IconButton(
                            onClick = { selectedRating = index + 1 }
                        ) {
                            Text(
                                text = "★",
                                fontSize = 32.sp,
                                color = if (index < selectedRating) 
                                    MaterialTheme.colorScheme.primary 
                                else 
                                    MaterialTheme.colorScheme.surfaceVariant
                            )
                        }
                    }
                }
                
                // Testimonial input
                Text(
                    text = "Review (Optional)",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
                OutlinedTextField(
                    value = testimonial,
                    onValueChange = { 
                        if (it.length <= 500) testimonial = it 
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(120.dp),
                    placeholder = { Text("Share your experience as a roommate...") },
                    maxLines = 5,
                    supportingText = {
                        Text(
                            text = "${testimonial.length}/500",
                            fontSize = 12.sp,
                            modifier = Modifier.fillMaxWidth(),
                            textAlign = TextAlign.End
                        )
                    }
                )
                
                Text(
                    text = "Note: Both you and the user must have been in the group for at least 30 days to submit a rating. Time spent together is automatically calculated.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodySmall
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (selectedRating > 0) {
                        onSubmit(selectedRating, testimonial.trim())
                    }
                },
                enabled = selectedRating > 0
            ) {
                Text("Submit Rating")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}