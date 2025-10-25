package com.cpen321.roomsync.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*
import com.cpen321.roomsync.ui.viewmodels.ChatViewModel
import com.cpen321.roomsync.ui.viewmodels.ChatMessage as ViewModelChatMessage
import com.cpen321.roomsync.ui.viewmodels.PollType

data class ChatMessage(
    val id: String,
    val content: String,
    val senderName: String,
    val timestamp: Date,
    val isOwnMessage: Boolean = false,
    val type: MessageType = MessageType.TEXT
)

data class PollMessage(
    val id: String,
    val question: String,
    val options: List<String>,
    val votes: Map<String, Int>,
    val senderName: String,
    val timestamp: Date,
    val isExpired: Boolean = false,
    val userVote: String? = null
)

enum class MessageType {
    TEXT, POLL
}

// Helper function to convert ViewModel message to UI message
fun convertViewModelMessage(viewModelMessage: ViewModelChatMessage): ChatMessage {
    return ChatMessage(
        id = viewModelMessage.id,
        content = viewModelMessage.content,
        senderName = viewModelMessage.senderName,
        timestamp = viewModelMessage.timestamp,
        isOwnMessage = viewModelMessage.isOwnMessage,
        type = when (viewModelMessage.type) {
            com.cpen321.roomsync.ui.viewmodels.MessageType.TEXT -> MessageType.TEXT
            com.cpen321.roomsync.ui.viewmodels.MessageType.POLL -> MessageType.POLL
        }
    )
}

@Composable
fun MessageBubble(
    message: ChatMessage,
    onPollClick: () -> Unit = {}
) {
    val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (message.isOwnMessage) {
            Arrangement.End
        } else {
            Arrangement.Start
        }
    ) {
        if (!message.isOwnMessage) {
            // Avatar
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primary)
                    .padding(8.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = message.senderName.first().uppercase(),
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
        }

        Column(
            modifier = Modifier.widthIn(max = 280.dp),
            horizontalAlignment = if (message.isOwnMessage) {
                Alignment.End
            } else {
                Alignment.Start
            }
        ) {
            if (!message.isOwnMessage) {
                Text(
                    text = message.senderName,
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.height(2.dp))
            }
            
            when (message.type) {
                MessageType.TEXT -> {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(
                            topStart = 16.dp,
                            topEnd = 16.dp,
                            bottomStart = if (message.isOwnMessage) 16.dp else 4.dp,
                            bottomEnd = if (message.isOwnMessage) 4.dp else 16.dp
                        ),
                        colors = CardDefaults.cardColors(
                            containerColor = if (message.isOwnMessage) {
                                MaterialTheme.colorScheme.primary
                            } else {
                                MaterialTheme.colorScheme.surfaceVariant
                            }
                        )
                    ) {
                        Text(
                            text = message.content,
                            modifier = Modifier.padding(12.dp),
                            color = if (message.isOwnMessage) {
                                Color.White
                            } else {
                                MaterialTheme.colorScheme.onSurfaceVariant
                            }
                        )
                    }
                }
                MessageType.POLL -> {
                    // Show poll as a special message with poll icon
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onPollClick() },
                        shape = RoundedCornerShape(
                            topStart = 16.dp,
                            topEnd = 16.dp,
                            bottomStart = if (message.isOwnMessage) 16.dp else 4.dp,
                            bottomEnd = if (message.isOwnMessage) 4.dp else 16.dp
                        ),
                        colors = CardDefaults.cardColors(
                            containerColor = if (message.isOwnMessage) {
                                MaterialTheme.colorScheme.primary
                            } else {
                                MaterialTheme.colorScheme.surfaceVariant
                            }
                        )
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "📊",
                                    fontSize = 16.sp,
                                    modifier = Modifier.padding(end = 8.dp)
                                )
                                Text(
                                    text = "Poll",
                                    fontWeight = FontWeight.Bold,
                                    color = if (message.isOwnMessage) {
                                        Color.White
                                    } else {
                                        MaterialTheme.colorScheme.onSurfaceVariant
                                    }
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = message.content,
                                color = if (message.isOwnMessage) {
                                    Color.White
                                } else {
                                    MaterialTheme.colorScheme.onSurfaceVariant
                                }
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Tap to view and vote →",
                                fontSize = 12.sp,
                                style = MaterialTheme.typography.bodySmall,
                                color = if (message.isOwnMessage) {
                                    Color.White.copy(alpha = 0.8f)
                                } else {
                                    MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                                }
                            )
                        }
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(4.dp))
            
            Text(
                text = timeFormat.format(message.timestamp),
                fontSize = 10.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(horizontal = 4.dp)
            )
        }

        if (message.isOwnMessage) {
            Spacer(modifier = Modifier.width(8.dp))
            // Avatar
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.secondary)
                    .padding(8.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Y",
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
fun MessageInput(
    messageText: String,
    onMessageTextChange: (String) -> Unit,
    onSendMessage: () -> Unit,
    onShowPollDialog: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
            verticalAlignment = Alignment.Bottom
        ) {
            OutlinedTextField(
                value = messageText,
                onValueChange = onMessageTextChange,
                modifier = Modifier.weight(1f),
                placeholder = { Text("Type a message...") },
                maxLines = 4,
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Text,
                    imeAction = ImeAction.Send
                ),
                keyboardActions = KeyboardActions(
                    onSend = { onSendMessage() }
                ),
                shape = RoundedCornerShape(24.dp)
            )
            
            Spacer(modifier = Modifier.width(8.dp))
            
            // Poll button
            IconButton(
                onClick = onShowPollDialog,
                modifier = Modifier.size(48.dp)
            ) {
                Icon(
                    Icons.Default.Add,
                    contentDescription = "Create Poll",
                    tint = MaterialTheme.colorScheme.primary
                )
            }
            
            Spacer(modifier = Modifier.width(8.dp))
            
            FloatingActionButton(
                onClick = onSendMessage,
                modifier = Modifier.size(48.dp),
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(
                    Icons.Default.Send,
                    contentDescription = "Send",
                    tint = Color.White
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreatePollDialog(
    onDismiss: () -> Unit,
    onCreatePoll: (String, List<String>, PollType, Int) -> Unit
) {
    var question by remember { mutableStateOf("") }
    var options by remember { mutableStateOf(listOf("", "")) }
    var pollType by remember { mutableStateOf(PollType.SINGLE_CHOICE) }
    var duration by remember { mutableStateOf(7) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text("Create Poll")
        },
        text = {
            Column {
                OutlinedTextField(
                    value = question,
                    onValueChange = { question = it },
                    label = { Text("Poll Question") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 2
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Text(
                    text = "Options:",
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                
                options.forEachIndexed { index, option ->
                    OutlinedTextField(
                        value = option,
                        onValueChange = { newValue ->
                            options = options.toMutableList().apply {
                                set(index, newValue)
                            }
                        },
                        label = { Text("Option ${index + 1}") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 8.dp)
                    )
                }
                
                if (options.size < 10) {
                    Button(
                        onClick = {
                            options = options + ""
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Add Option")
                    }
                }
                
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
                        selected = pollType == PollType.SINGLE_CHOICE,
                        onClick = { pollType = PollType.SINGLE_CHOICE },
                        label = { Text("Single Choice") }
                    )
                    FilterChip(
                        selected = pollType == PollType.MULTIPLE_CHOICE,
                        onClick = { pollType = PollType.MULTIPLE_CHOICE },
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
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = duration == 1,
                        onClick = { duration = 1 },
                        label = { Text("1 day") }
                    )
                    FilterChip(
                        selected = duration == 3,
                        onClick = { duration = 3 },
                        label = { Text("3 days") }
                    )
                    FilterChip(
                        selected = duration == 7,
                        onClick = { duration = 7 },
                        label = { Text("1 week") }
                    )
                    FilterChip(
                        selected = duration == 30,
                        onClick = { duration = 30 },
                        label = { Text("1 month") }
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (question.trim().isNotEmpty() && 
                        options.filter { it.trim().isNotEmpty() }.size >= 2) {
                        onCreatePoll(question.trim(), options.filter { it.trim().isNotEmpty() }, pollType, duration)
                    }
                },
                enabled = question.trim().isNotEmpty() && 
                         options.filter { it.trim().isNotEmpty() }.size >= 2
            ) {
                Text("Create Poll")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    groupName: String = "Group Chat",
    groupId: String = "68fb62f776137b62df6214d5",
    onBack: () -> Unit = {},
    currentUserId: String = "68fb4f7cac22f6c9e5ac82b6",
    onNavigateToPolls: () -> Unit = {}
) {
    var messageText by remember { mutableStateOf("") }
    var showPollDialog by remember { mutableStateOf(false) }
    var showMenu by remember { mutableStateOf(false) }
    val keyboardController = LocalSoftwareKeyboardController.current
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()

    // Use ViewModel
    val viewModel: ChatViewModel = viewModel { 
        ChatViewModel(groupId, currentUserId) 
    }
    val uiState by viewModel.uiState.collectAsState()

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Top App Bar
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = groupName,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "4 members online",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { showPollDialog = true }) {
                        Icon(Icons.Default.Add, contentDescription = "Create Poll")
                    }
                    IconButton(onClick = { showMenu = true }) {
                        Icon(Icons.Default.MoreVert, contentDescription = "More")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )

            // Messages List
            println("ChatScreen: Current UI state: $uiState")
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 16.dp),
                contentPadding = PaddingValues(vertical = 8.dp),
                reverseLayout = true
            ) {
                val reversedMessages = uiState.messages.reversed()
                println("ChatScreen: Displaying ${reversedMessages.size} messages")
                items(reversedMessages) { message ->
                    println("ChatScreen: Displaying message: $message")
                    MessageBubble(
                        message = convertViewModelMessage(message),
                        onPollClick = onNavigateToPolls
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }

            // Message Input
            MessageInput(
                messageText = messageText,
                onMessageTextChange = { messageText = it },
                onSendMessage = {
                    if (messageText.trim().isNotEmpty()) {
                        viewModel.sendMessage(messageText)
                        messageText = ""
                        keyboardController?.hide()
                        
                        // Auto-scroll to bottom
                        coroutineScope.launch {
                            listState.animateScrollToItem(0)
                        }
                    }
                },
                onShowPollDialog = { showPollDialog = true }
            )
        }

        // Poll Dialog
        if (showPollDialog) {
            CreatePollDialog(
                onDismiss = { showPollDialog = false },
                onCreatePoll = { question: String, options: List<String>, pollType: PollType, duration: Int ->
                    viewModel.createPoll(question, options, pollType, duration)
                    showPollDialog = false
                }
            )
        }

        // Menu Dropdown
        if (showMenu) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clickable { showMenu = false }
            ) {
                Card(
                    modifier = Modifier
                        .padding(end = 16.dp, top = 80.dp)
                        .width(200.dp)
                ) {
                    Column {
                        TextButton(
                            onClick = {
                                showMenu = false
                                // TODO: Implement group settings
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = "Group Settings",
                                modifier = Modifier.padding(16.dp)
                            )
                        }
                        TextButton(
                            onClick = {
                                showMenu = false
                                // TODO: Implement member list
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = "View Members",
                                modifier = Modifier.padding(16.dp)
                            )
                        }
                    }
                }
            }
        }

        // Show error snackbar
        uiState.error?.let { error ->
            LaunchedEffect(error) {
                // TODO: Show snackbar with error message
                viewModel.clearError()
            }
        }
    }
}