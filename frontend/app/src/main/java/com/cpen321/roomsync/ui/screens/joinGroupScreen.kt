package com.cpen321.roomsync.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.cpen321.roomsync.ui.theme.GlassColors
import com.cpen321.roomsync.ui.theme.GlassGradients
import com.cpen321.roomsync.ui.viewmodels.GroupViewModel
import androidx.compose.ui.graphics.Color as ComposeColor

@Composable
fun JoinGroupScreen(
    onJoinGroup: () -> Unit = {},
    onBack: () -> Unit = {},
    viewModel: GroupViewModel = viewModel()
) {
    var groupCode by remember { mutableStateOf("") }
    val uiState by viewModel.uiState.collectAsState()
    
    // Handle successful group join
    LaunchedEffect(uiState.group) {
        if (uiState.group != null) {
            onJoinGroup()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(brush = GlassGradients.MainBackground)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp)
        ) {
            // Header with back button
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 24.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(
                        imageVector = Icons.Default.ArrowBack,
                        contentDescription = "Back",
                        tint = ComposeColor.White
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Join Group",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = ComposeColor.White
                )
            }

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                // Title
                Text(
                    text = "Enter Group Code",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Normal,
                    color = ComposeColor.White,
                    modifier = Modifier.padding(bottom = 24.dp)
                )

                // Input field
                OutlinedTextField(
                    value = groupCode,
                    onValueChange = { 
                        // Limit to 4 characters and convert to uppercase
                        if (it.length <= 4) {
                            groupCode = it.uppercase()
                        }
                    },
                    label = { Text("Group Code", color = ComposeColor.White) },
                    placeholder = { Text("ABCD", color = ComposeColor.White.copy(alpha = 0.6f)) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 24.dp),
                    shape = RoundedCornerShape(12.dp),
                    keyboardOptions = KeyboardOptions(
                        capitalization = KeyboardCapitalization.Characters,
                        keyboardType = KeyboardType.Text
                    ),
                    singleLine = true,
                    isError = uiState.error != null,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = ComposeColor.White,
                        unfocusedTextColor = ComposeColor.White,
                        focusedLabelColor = ComposeColor.White,
                        unfocusedLabelColor = ComposeColor.White.copy(alpha = 0.7f),
                        focusedBorderColor = ComposeColor.White,
                        unfocusedBorderColor = ComposeColor.White.copy(alpha = 0.7f),
                        cursorColor = ComposeColor.White
                    )
                )

                // Error message
                if (uiState.error != null) {
                    Text(
                        text = uiState.error!!,
                        color = GlassColors.AlertRed,
                        fontSize = 14.sp,
                        modifier = Modifier.padding(bottom = 16.dp)
                    )
                }

                // Join button
                Button(
                    onClick = {
                        if (groupCode.length == 4) {
                            viewModel.joinGroup(groupCode)
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp)
                        .border(
                            width = 1.dp,
                            color = ComposeColor.White,
                            shape = RoundedCornerShape(12.dp)
                        ),
                    shape = RoundedCornerShape(12.dp),
                    enabled = groupCode.length == 4 && !uiState.isLoading,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = ComposeColor.Transparent,
                        contentColor = ComposeColor.White,
                        disabledContainerColor = ComposeColor.Transparent.copy(alpha = 0.5f),
                        disabledContentColor = ComposeColor.White.copy(alpha = 0.5f)
                    )
                ) {
                    if (uiState.isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = ComposeColor.White
                        )
                    } else {
                        Text(
                            text = "Join Group",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Medium,
                            color = ComposeColor.White
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Help text
                Text(
                    text = "Ask your group leader for the 4-character code",
                    fontSize = 14.sp,
                    color = ComposeColor.White.copy(alpha = 0.7f),
                    modifier = Modifier.padding(horizontal = 16.dp)
                )
            }
        }
    }
}
