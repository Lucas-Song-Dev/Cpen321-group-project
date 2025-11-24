package com.cpen321.roomsync.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.cpen321.roomsync.ui.viewmodels.PollingViewModel
import com.cpen321.roomsync.ui.viewmodels.ViewModelPollItem
import com.cpen321.roomsync.ui.viewmodels.ViewModelPollStatus
import com.cpen321.roomsync.ui.viewmodels.ViewModelPollType
import com.cpen321.roomsync.ui.viewmodels.ViewModelPollOption
import com.cpen321.roomsync.ui.theme.GlassGradients
import com.cpen321.roomsync.ui.theme.GlassColors
import java.text.SimpleDateFormat
import java.util.*
import androidx.compose.ui.graphics.Color as ComposeColor

// Data classes for UI
data class PollItem(
    val id: String,
    val question: String,
    val options: List<PollOption>,
    val createdBy: String,
    val createdAt: Date,
    val expiresAt: Date,
    val status: PollStatus,
    val totalVotes: Int,
    val userVote: String? = null,
    val type: PollType = PollType.SINGLE_CHOICE
)

data class PollOption(
    val text: String,
    val votes: Int,
    val percentage: Float
)

enum class PollStatus {
    ACTIVE, EXPIRED, CLOSED
}

enum class PollType {
    SINGLE_CHOICE, MULTIPLE_CHOICE
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PollingScreen(
    groupName: String = "Group Polls",
    groupId: String = "68fb62f776137b62df6214d5",
    onBack: () -> Unit = {},
    currentUserId: String = "68fb4f7cac22f6c9e5ac82b6"
) {
    var showCreatePollDialog by remember { mutableStateOf(false) }
    var showMenu by remember { mutableStateOf(false) }
    var isRefreshing by remember { mutableStateOf(false) }
    
    // Animation for refresh button
    val infiniteTransition = rememberInfiniteTransition(label = "refresh")
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotation"
    )

    val viewModel: PollingViewModel = viewModel {
        PollingViewModel(groupId, currentUserId)
    }
    val uiState by viewModel.uiState.collectAsState()

    val listState = rememberLazyListState()

    // Error handling
    LaunchedEffect(uiState.error) {
        uiState.error?.let {
            // Handle error - could show a snackbar
            viewModel.clearError()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(brush = GlassGradients.MainBackground)
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
        // Top App Bar with extra padding
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = GlassColors.GradientMiddle.copy(alpha = 0.8f),
            shadowElevation = 4.dp
        ) {
            Column(
                modifier = Modifier.padding(top = 16.dp)
            ) {
                TopAppBar(
                    title = { Text(groupName, color = Color.White) },
                    navigationIcon = {
                        IconButton(onClick = onBack) {
                            Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                        }
                    },
                    actions = {
                        IconButton(onClick = { showMenu = true }) {
                            Icon(Icons.Default.MoreVert, contentDescription = "Menu", tint = Color.White)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = GlassColors.GradientMiddle.copy(alpha = 0.8f),
                        titleContentColor = Color.White,
                        navigationIconContentColor = Color.White,
                        actionIconContentColor = Color.White
                    )
                )
            }
        }

        // Menu Dropdown
        Box {
            DropdownMenu(
                expanded = showMenu,
                onDismissRequest = { showMenu = false }
            ) {
                DropdownMenuItem(
                    text = { Text("Create Poll") },
                    onClick = {
                        showCreatePollDialog = true
                        showMenu = false
                    },
                    leadingIcon = { Icon(Icons.Default.Add, contentDescription = null) }
                )
                DropdownMenuItem(
                    text = { Text("Refresh") },
                    onClick = {
                        viewModel.refreshPolls()
                        showMenu = false
                    },
                    leadingIcon = { Icon(Icons.Default.Refresh, contentDescription = null) }
                )
            }
        }

        // Content
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            // Quick Actions
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = { showCreatePollDialog = true },
                    modifier = Modifier
                        .weight(1f)
                        .border(
                            width = 1.dp,
                            color = ComposeColor.White,
                            shape = RoundedCornerShape(8.dp)
                        ),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = ComposeColor.Transparent,
                        contentColor = ComposeColor.White
                    )
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, tint = ComposeColor.White)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Create Poll", color = ComposeColor.White)
                }
                
                Button(
                    onClick = { 
                        isRefreshing = true
                        viewModel.refreshPolls()
                        // Stop animation after 2 seconds
                        kotlinx.coroutines.GlobalScope.launch {
                            delay(2000)
                            isRefreshing = false
                        }
                    },
                    modifier = Modifier
                        .weight(1f)
                        .border(
                            width = 1.dp,
                            color = ComposeColor.White,
                            shape = RoundedCornerShape(8.dp)
                        ),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = ComposeColor.Transparent,
                        contentColor = ComposeColor.White
                    )
                ) {
                    Icon(
                        Icons.Default.Refresh, 
                        contentDescription = null,
                        tint = ComposeColor.White,
                        modifier = if (isRefreshing) Modifier.rotate(rotation) else Modifier
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Refresh", color = ComposeColor.White)
                }
            }

            // Polls List
            if (uiState.polls.isEmpty()) {
                // Empty state
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        Icons.Default.Add,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "No polls yet",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color.White.copy(alpha = 0.8f)
                    )
                    Text(
                        text = "Create the first poll to get started",
                        fontSize = 14.sp,
                        color = Color.White.copy(alpha = 0.8f),
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = { showCreatePollDialog = true },
                        modifier = Modifier.border(
                            width = 1.dp,
                            color = ComposeColor.White,
                            shape = RoundedCornerShape(8.dp)
                        ),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = ComposeColor.Transparent,
                            contentColor = ComposeColor.White
                        )
                    ) {
                        Text("Create Poll", color = ComposeColor.White)
                    }
                }
            } else {
                LazyColumn(
                    state = listState,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(uiState.polls) { poll ->
                        PollCard(
                            poll = convertViewModelPoll(poll),
                            onVote = { optionText ->
                                viewModel.voteOnPoll(poll.id, optionText)
                            },
                            onClosePoll = {
                                viewModel.closePoll(poll.id)
                            }
                        )
                    }
                }
            }
        }
        }
    }

    // Create Poll Dialog
    if (showCreatePollDialog) {
        CreatePollDialog(
            onDismiss = { showCreatePollDialog = false },
            onCreatePoll = { question: String, options: List<String>, type: String, duration: Int ->
                viewModel.createPoll(question, options, type, duration)
                showCreatePollDialog = false
            }
        )
    }
}

@Composable
fun PollCard(
    poll: PollItem,
    onVote: (String) -> Unit,
    onClosePoll: () -> Unit
) {
    val dateFormat = SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault())
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(
            containerColor = GlassColors.GradientMiddle.copy(alpha = 0.7f)
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Poll header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = poll.question,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Created by ${poll.createdBy}",
                        fontSize = 12.sp,
                        color = Color.White.copy(alpha = 0.8f)
                    )
                    Text(
                        text = "Expires: ${dateFormat.format(poll.expiresAt)}",
                        fontSize = 12.sp,
                        color = Color.White.copy(alpha = 0.8f)
                    )
                }
                
                // Poll status chip
                PollStatusChip(status = poll.status)
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Poll options
            if (poll.status == PollStatus.ACTIVE) {
                // Show voting options (allow changing votes)
                poll.options.forEach { option ->
                    if (poll.userVote == null) {
                        // Show as button if no vote yet
                        PollOptionButton(
                            option = option,
                            onClick = { onVote(option.text) }
                        )
                    } else {
                        // Show as clickable result bar if voted
                        PollResultBar(
                            option = option,
                            isSelected = poll.userVote == option.text,
                            onClick = { onVote(option.text) }
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                }
            } else {
                // Show results only for expired/closed polls
                poll.options.forEach { option ->
                    PollResultBar(
                        option = option,
                        isSelected = poll.userVote == option.text,
                        onClick = null // No clicking for expired polls
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Poll footer
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${poll.totalVotes} votes",
                    fontSize = 12.sp,
                        color = Color.White.copy(alpha = 0.8f)
                )
                
                if (poll.status == PollStatus.ACTIVE) {
                    TextButton(
                        onClick = onClosePoll,
                        colors = ButtonDefaults.textButtonColors(
                            contentColor = ComposeColor.White
                        )
                    ) {
                        Text("Close Poll", color = ComposeColor.White)
                    }
                }
            }
        }
    }
}

@Composable
fun PollOptionButton(
    option: PollOption,
    onClick: () -> Unit
) {
    Button(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .border(
                width = 1.dp,
                color = ComposeColor.White,
                shape = RoundedCornerShape(8.dp)
            ),
        colors = ButtonDefaults.buttonColors(
            containerColor = ComposeColor.Transparent,
            contentColor = ComposeColor.White
        )
    ) {
        Text(
            text = option.text,
            modifier = Modifier.fillMaxWidth(),
            textAlign = TextAlign.Start
        )
    }
}

@Composable
fun PollResultBar(
    option: PollOption,
    isSelected: Boolean,
    onClick: (() -> Unit)? = null
) {
    Column(
        modifier = Modifier.clickable { onClick?.invoke() }
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = option.text,
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = "${option.votes} (${String.format("%.1f", option.percentage)}%)",
                fontSize = 12.sp,
                        color = Color.White.copy(alpha = 0.8f)
            )
        }
        Spacer(modifier = Modifier.height(4.dp))
        LinearProgressIndicator(
            progress = option.percentage / 100f,
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp),
            color = if (isSelected) GlassColors.GradientMiddle else GlassColors.GradientMiddle.copy(alpha = 0.5f),
            trackColor = MaterialTheme.colorScheme.surfaceVariant
        )
    }
}

@Composable
fun PollStatusChip(status: PollStatus) {
    val (text, color) = when (status) {
        PollStatus.ACTIVE -> Pair("Active", Color(0xFF4CAF50))
        PollStatus.EXPIRED -> Pair("Expired", MaterialTheme.colorScheme.error)
        PollStatus.CLOSED -> Pair("Closed", MaterialTheme.colorScheme.outline)
    }

    Surface(
        shape = RoundedCornerShape(16.dp),
        color = color
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            fontSize = 12.sp,
            color = Color.White
        )
    }
}

@Composable
fun CreatePollDialog(
    onDismiss: () -> Unit,
    onCreatePoll: (String, List<String>, String, Int) -> Unit
) {
    var question by remember { mutableStateOf("") }
    var option1 by remember { mutableStateOf("") }
    var option2 by remember { mutableStateOf("") }
    var option3 by remember { mutableStateOf("") }
    var option4 by remember { mutableStateOf("") }
    var pollType by remember { mutableStateOf("single") }
    var duration by remember { mutableStateOf(7) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create New Poll") },
        text = {
            Column {
                TextField(
                    value = question,
                    onValueChange = { question = it },
                    label = { Text("Poll Question") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                TextField(
                    value = option1,
                    onValueChange = { option1 = it },
                    label = { Text("Option 1") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                
                TextField(
                    value = option2,
                    onValueChange = { option2 = it },
                    label = { Text("Option 2") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                
                TextField(
                    value = option3,
                    onValueChange = { option3 = it },
                    label = { Text("Option 3 (Optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                
                TextField(
                    value = option4,
                    onValueChange = { option4 = it },
                    label = { Text("Option 4 (Optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Poll type selection
                Text(
                    text = "Poll Type",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = pollType == "single",
                        onClick = { pollType = "single" },
                        label = { Text("Single Choice") }
                    )
                    FilterChip(
                        selected = pollType == "multiple",
                        onClick = { pollType = "multiple" },
                        label = { Text("Multiple Choice") }
                    )
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Duration selection
                Text(
                    text = "Duration (days)",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                
                Column(
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // First row - 2 options
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FilterChip(
                            selected = duration == 1,
                            onClick = { duration = 1 },
                            label = { Text("1 day") },
                            modifier = Modifier.weight(1f)
                        )
                        FilterChip(
                            selected = duration == 3,
                            onClick = { duration = 3 },
                            label = { Text("3 days") },
                            modifier = Modifier.weight(1f)
                        )
                    }
                    // Second row - 2 options
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FilterChip(
                            selected = duration == 7,
                            onClick = { duration = 7 },
                            label = { Text("1 week") },
                            modifier = Modifier.weight(1f)
                        )
                        FilterChip(
                            selected = duration == 30,
                            onClick = { duration = 30 },
                            label = { Text("1 month") },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val options = listOfNotNull(
                        option1.takeIf { it.isNotBlank() },
                        option2.takeIf { it.isNotBlank() },
                        option3.takeIf { it.isNotBlank() },
                        option4.takeIf { it.isNotBlank() }
                    )
                    if (question.isNotBlank() && options.size >= 2) {
                        onCreatePoll(question, options, pollType, duration)
                    }
                },
                enabled = question.isNotBlank() && 
                         option1.isNotBlank() && 
                         option2.isNotBlank(),
                modifier = Modifier.border(
                    width = 1.dp,
                    color = ComposeColor.White,
                    shape = RoundedCornerShape(8.dp)
                ),
                colors = ButtonDefaults.buttonColors(
                    containerColor = ComposeColor.Transparent,
                    contentColor = ComposeColor.White,
                    disabledContainerColor = ComposeColor.Transparent.copy(alpha = 0.5f),
                    disabledContentColor = ComposeColor.White.copy(alpha = 0.5f)
                )
            ) {
                Text("Create Poll", color = ComposeColor.White)
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                colors = ButtonDefaults.textButtonColors(
                    contentColor = ComposeColor.White
                )
            ) {
                Text("Cancel", color = ComposeColor.White)
            }
        }
    )
}

// Helper function to convert ViewModel poll to UI poll
fun convertViewModelPoll(viewModelPoll: ViewModelPollItem): PollItem {
    return PollItem(
        id = viewModelPoll.id,
        question = viewModelPoll.question,
        options = viewModelPoll.options.map { option ->
            PollOption(
                text = option.text,
                votes = option.votes,
                percentage = option.percentage
            )
        },
        createdBy = viewModelPoll.createdBy,
        createdAt = viewModelPoll.createdAt,
        expiresAt = viewModelPoll.expiresAt,
        status = when (viewModelPoll.status) {
            ViewModelPollStatus.ACTIVE -> PollStatus.ACTIVE
            ViewModelPollStatus.EXPIRED -> PollStatus.EXPIRED
            ViewModelPollStatus.CLOSED -> PollStatus.CLOSED
        },
        totalVotes = viewModelPoll.totalVotes,
        userVote = viewModelPoll.userVote,
        type = when (viewModelPoll.type) {
            ViewModelPollType.SINGLE_CHOICE -> PollType.SINGLE_CHOICE
            ViewModelPollType.MULTIPLE_CHOICE -> PollType.MULTIPLE_CHOICE
        }
    )
}
