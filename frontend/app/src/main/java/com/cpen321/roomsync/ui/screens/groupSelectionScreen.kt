package com.cpen321.roomsync.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cpen321.roomsync.ui.theme.GlassGradients
import androidx.compose.ui.graphics.Color as ComposeColor

@Composable
fun GroupSelectionScreen(
    onCreateGroup: () -> Unit = {},
    onJoinGroup: () -> Unit = {}
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(brush = GlassGradients.MainBackground)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Welcome text
            Text(
                text = "Welcome",
                fontSize = 32.sp,
                fontWeight = FontWeight.Bold,
                color = ComposeColor.White,
                modifier = Modifier.padding(bottom = 48.dp)
            )

            // Create Group button
            Button(
                onClick = onCreateGroup,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .border(
                        width = 1.dp,
                        color = ComposeColor.White,
                        shape = RoundedCornerShape(12.dp)
                    ),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = ComposeColor.Transparent,
                    contentColor = ComposeColor.White
                )
            ) {
                Text(
                    text = "Create Group",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Medium,
                    color = ComposeColor.White
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Join Group button
            Button(
                onClick = onJoinGroup,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .border(
                        width = 1.dp,
                        color = ComposeColor.White,
                        shape = RoundedCornerShape(12.dp)
                    ),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = ComposeColor.Transparent,
                    contentColor = ComposeColor.White
                )
            ) {
                Text(
                    text = "Join Group",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Medium,
                    color = ComposeColor.White
                )
            }
        }
    }
}
