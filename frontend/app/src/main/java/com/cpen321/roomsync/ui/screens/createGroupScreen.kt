package com.cpen321.roomsync.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
    
    // Handle successful group creation
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
            // Title
            Text(
                text = "Enter Group Name:",
                fontSize = 18.sp,
                fontWeight = FontWeight.Normal,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.padding(bottom = 24.dp)
            )

            // Input field with underline
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
            ) {
                OutlinedTextField(
                    value = groupName,
                    onValueChange = { groupName = it },
                    modifier = Modifier.fillMaxWidth(),
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

            Spacer(modifier = Modifier.height(32.dp))

            // Create Group button
            Button(
                onClick = { 
                    if (groupName.isNotBlank()) {
                        viewModel.createGroup(groupName)
                    }
                },
                modifier = Modifier
                    .width(200.dp)
                    .height(48.dp),
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
            
            // Show group code if group was created successfully
            uiState.group?.let { group ->
                Spacer(modifier = Modifier.height(32.dp))
                
                // Success message
                Text(
                    text = "Group created successfully!",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
                
                // Group code display
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
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                        
                        Text(
                            text = "They can use this code to join your group",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
            
            // Error message
            uiState.error?.let { error ->
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = error,
                    color = MaterialTheme.colorScheme.error,
                    fontSize = 14.sp
                )
            }
        }
    }
}
