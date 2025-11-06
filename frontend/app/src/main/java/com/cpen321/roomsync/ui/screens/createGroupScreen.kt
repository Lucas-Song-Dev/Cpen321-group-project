package com.cpen321.roomsync.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.cpen321.roomsync.ui.viewmodels.GroupViewModel

@Composable
fun CreateGroupScreen(
    onCreateGroup: () -> Unit = {},
    onBack: () -> Unit = {},
    viewModel: GroupViewModel = viewModel()
) {
    var groupName by remember { mutableStateOf("") }
    val uiState by viewModel.uiState.collectAsState()
    
    LaunchedEffect(uiState.group) {
        if (uiState.group != null) {
            onCreateGroup()
        }
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "Enter Group Name:",
                fontSize = 18.sp,
                fontWeight = FontWeight.Normal,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.padding(bottom = 24.dp)
            )

            CreateGroupScreenPart2(groupName) { groupName = it }
            Spacer(modifier = Modifier.height(32.dp))
            CreateGroupScreenPart3(groupName, uiState, viewModel)
            uiState.group?.let { group ->
                CreateGroupScreenPart4(group)
            }
            
            uiState.error?.let { error ->
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = error,
                    color = MaterialTheme.colorScheme.error,
                    fontSize = 14.sp,
                    modifier = Modifier.testTag("errorMessage")
                )
            }
        }
    }
}

@Composable
private fun CreateGroupScreenPart2(
    groupName: String,
    onGroupNameChange: (String) -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
    ) {
        OutlinedTextField(
            value = groupName,
            onValueChange = onGroupNameChange,
            modifier = Modifier
                .fillMaxWidth()
                .testTag("groupNameInput"),
            singleLine = true,
            placeholder = { Text("") },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = MaterialTheme.colorScheme.onSurface,
                unfocusedBorderColor = MaterialTheme.colorScheme.onSurface,
                cursorColor = MaterialTheme.colorScheme.onSurface
            ),
            shape = RoundedCornerShape(0.dp)
        )
    }
}

@Composable
private fun CreateGroupScreenPart3(
    groupName: String,
    uiState: com.cpen321.roomsync.ui.viewmodels.GroupUiState,
    viewModel: GroupViewModel
) {
    Button(
        onClick = { 
            if (groupName.isNotBlank()) {
                viewModel.createGroup(groupName)
            }
        },
        modifier = Modifier
            .width(200.dp)
            .height(48.dp)
            .testTag("createGroupButton"),
        shape = RoundedCornerShape(24.dp),
        enabled = groupName.isNotBlank() && !uiState.isLoading,
        colors = ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.surface,
            contentColor = MaterialTheme.colorScheme.onSurface
        )
    ) {
        if (uiState.isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(24.dp),
                color = MaterialTheme.colorScheme.onSurface
            )
        } else {
            Text(
                text = "Create Group",
                fontSize = 16.sp,
                fontWeight = FontWeight.Normal
            )
        }
    }
}

@Composable
private fun CreateGroupScreenPart4(group: com.cpen321.roomsync.ui.viewmodels.Group) {
    Spacer(modifier = Modifier.height(32.dp))
    
    Text(
        text = "Group created successfully!",
        fontSize = 16.sp,
        fontWeight = FontWeight.Medium,
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier
            .padding(bottom = 16.dp)
            .testTag("successMessage")
    )
    
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 32.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Share this code with your roommates:",
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            
            Text(
                text = group.groupCode ?: "N/A",
                fontSize = 32.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier
                    .padding(bottom = 8.dp)
                    .testTag("groupCode")
            )
            
            Text(
                text = "They can use this code to join your group",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
