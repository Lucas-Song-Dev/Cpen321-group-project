package com.cpen321.roomsync.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cpen321.roomsync.data.models.User
import com.cpen321.roomsync.ui.viewmodels.PersonalProfileViewModel
import com.cpen321.roomsync.ui.viewmodels.ProfileSetState

@Composable
fun PersonalProfileScreen(
    user: User,
    viewModel: PersonalProfileViewModel,
    onProfileComplete: () -> Unit
) {
    var dob by remember { mutableStateOf("") }
    var gender by remember { mutableStateOf("") }

    val profileSetState by viewModel.profileSetState.collectAsState()

    //Navigate when profile update is successful
    LaunchedEffect(profileSetState) {
        if (profileSetState is ProfileSetState.Success) {
            onProfileComplete()
        }
    }

    //Show loading dialog
    if (profileSetState is ProfileSetState.Loading) {
        AlertDialog(
            onDismissRequest = { },
            title = { Text("Updating Profile") },
            text = {
                Box(
                    modifier = Modifier.fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            },
            confirmButton = { }
        )
    }

    //Show error dialog
    if (profileSetState is ProfileSetState.Error) {
        AlertDialog(
            onDismissRequest = {
                viewModel.resetState()
            },
            title = { Text("Error") },
            text = { Text((profileSetState as ProfileSetState.Error).message) },
            confirmButton = {
                Button(onClick = {
                    viewModel.resetState()
                }) {
                    Text("OK")
                }
            }
        )
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            //Page title
            Text(
                text = "Personal Profile",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            //Name field (read-only: retrieved from google auth)
            Column {
                Text(
                    text = "Name:",
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                OutlinedTextField(
                    value = user.name,
                    onValueChange = { },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    enabled = false,
                    colors = OutlinedTextFieldDefaults.colors(
                        disabledTextColor = MaterialTheme.colorScheme.onSurface,
                        disabledBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                        disabledContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                    )
                )
            }

            //Email field (read-only: retrieved from google auth)
            Column {
                Text(
                    text = "Email:",
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                OutlinedTextField(
                    value = user.email,
                    onValueChange = { },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    enabled = false,
                    colors = OutlinedTextFieldDefaults.colors(
                        disabledTextColor = MaterialTheme.colorScheme.onSurface,
                        disabledBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                        disabledContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                    )
                )
            }

            //DOB field
            Column {
                Text(
                    text = "Date of Birth:",
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                OutlinedTextField(
                    value = dob,
                    onValueChange = { dob = it },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    placeholder = { Text("YYYY-MM-DD") }
                )
            }

            //Gender section
            Column {
                Text(
                    text = "Gender:",
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .selectableGroup(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    FilterChip(
                        onClick = { gender = "Male" },
                        label = { Text("Male") },
                        selected = gender == "Male",
                        modifier = Modifier.selectable(
                            selected = gender == "Male",
                            onClick = { gender = "Male" },
                            role = Role.RadioButton
                        )
                    )

                    FilterChip(
                        onClick = { gender = "Female" },
                        label = { Text("Female") },
                        selected = gender == "Female",
                        modifier = Modifier.selectable(
                            selected = gender == "Female",
                            onClick = { gender = "Female" },
                            role = Role.RadioButton
                        )
                    )

                    FilterChip(
                        onClick = { gender = "Prefer-not-to-say" },
                        label = { Text("Prefer-not-to-say") },
                        selected = gender == "Prefer-not-to-say",
                        modifier = Modifier.selectable(
                            selected = gender == "Prefer-not-to-say",
                            onClick = { gender = "Prefer-not-to-say" },
                            role = Role.RadioButton
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            //Continue button
            Button(
                onClick = {
                    viewModel.updateProfile(user.email, dob, gender)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                enabled = dob.isNotBlank() && gender.isNotBlank()
            ) {
                Text(
                    text = "Continue",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}