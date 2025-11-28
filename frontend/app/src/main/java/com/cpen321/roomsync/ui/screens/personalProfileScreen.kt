package com.cpen321.roomsync.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.activity.compose.BackHandler
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material3.*
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cpen321.roomsync.data.models.User
import com.cpen321.roomsync.ui.theme.GlassGradients
import com.cpen321.roomsync.ui.viewmodels.PersonalProfileViewModel
import com.cpen321.roomsync.ui.viewmodels.ProfileSetState
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PersonalProfileScreen(
    user: User,
    viewModel: PersonalProfileViewModel,
    onProfileComplete: () -> Unit
) {
    BackHandler(enabled = true) {
        // Swallow system back presses on this screen to prevent leaving before completion
    }
    // Initialize with existing user data if available
    val dateFormatter = remember { SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()) }
    
    // Format DOB from user object - use user._id as key to force recalculation when user changes
    val formattedDob = remember(user._id, user.dob) {
        user.dob?.let { date ->
            dateFormatter.format(date)
        } ?: ""
    }
    
    val userGender = remember(user._id, user.gender) {
        user.gender ?: ""
    }
    
    var nameInput by remember(user._id) { mutableStateOf(user.name) }
    var emailInput by remember(user._id) { mutableStateOf(user.email) }
    var dob by remember(user._id) { mutableStateOf(formattedDob) }
    var gender by remember(user._id) { mutableStateOf(userGender) }
    
    // Update local state when user data changes - this ensures persistence when coming back
    LaunchedEffect(user._id, user.dob, user.gender) {
        nameInput = user.name
        emailInput = user.email
        dob = user.dob?.let { dateFormatter.format(it) } ?: ""
        gender = user.gender ?: ""
    }

    val profileSetState by viewModel.profileSetState.collectAsState()
    val datePickerState = rememberDatePickerState(
        initialSelectedDateMillis = runCatching { dateFormatter.parse(dob)?.time }
            .getOrNull() ?: System.currentTimeMillis()
    )
    var showDatePicker by remember { mutableStateOf(false) }

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

    val scrollState = rememberScrollState()
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(brush = GlassGradients.MainBackground)
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Glass top header
            Box(
            modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        color = Color.White.copy(alpha = 0.15f),
                        shape = RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp)
                    )
                    .border(
                        width = 1.dp,
                        color = Color.White.copy(alpha = 0.25f),
                        shape = RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp)
                    )
            ) {
            Text(
                text = "Personal Profile",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                    color = Color.White,
                    modifier = Modifier
                        .padding(horizontal = 24.dp, vertical = 32.dp)
                        .align(Alignment.BottomStart)
                )
            }

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 24.dp)
                    .padding(top = 24.dp, bottom = 16.dp)
                    .verticalScroll(scrollState),
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                // Name field (read-only)
                Text(
                    text = "Name:",
                    fontSize = 16.sp,
                    color = Color.White,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                OutlinedTextField(
                    value = nameInput,
                    onValueChange = { nameInput = it },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Color.White,
                        unfocusedBorderColor = Color.White.copy(alpha = 0.6f),
                        cursorColor = Color.White,
                        focusedContainerColor = Color.Transparent,
                        unfocusedContainerColor = Color.Transparent,
                        focusedLabelColor = Color.White,
                        unfocusedLabelColor = Color.White.copy(alpha = 0.7f)
                    )
                )

                // Email field (read-only)
                Text(
                    text = "Email:",
                    fontSize = 16.sp,
                    color = Color.White,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                OutlinedTextField(
                    value = emailInput,
                    onValueChange = { emailInput = it },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Color.White,
                        unfocusedBorderColor = Color.White.copy(alpha = 0.6f),
                        cursorColor = Color.White,
                        focusedContainerColor = Color.Transparent,
                        unfocusedContainerColor = Color.Transparent,
                        focusedLabelColor = Color.White,
                        unfocusedLabelColor = Color.White.copy(alpha = 0.7f)
                    )
                )

                // DOB field
                Text(
                    text = "Date of Birth:",
                    fontSize = 16.sp,
                    color = Color.White,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                OutlinedTextField(
                    value = dob,
                    onValueChange = { },
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showDatePicker = true },
                    singleLine = true,
                    readOnly = true,
                    placeholder = { Text("YYYY-MM-DD", color = Color.White.copy(alpha = 0.6f)) },
                    trailingIcon = {
                        IconButton(onClick = { showDatePicker = true }) {
                            Icon(
                                imageVector = Icons.Filled.DateRange,
                                contentDescription = "Select date",
                                tint = Color.White
                )
            }
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Color.White,
                        unfocusedBorderColor = Color.White.copy(alpha = 0.6f),
                        cursorColor = Color.White,
                        focusedLabelColor = Color.White,
                        unfocusedLabelColor = Color.White.copy(alpha = 0.8f),
                        focusedContainerColor = Color.Transparent,
                        unfocusedContainerColor = Color.Transparent
                    )
                )

                // Gender section
                Text(
                    text = "Gender:",
                    fontSize = 16.sp,
                    color = Color.White,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .selectableGroup(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    val chipColors = FilterChipDefaults.filterChipColors(
                        containerColor = Color.Transparent,
                        selectedContainerColor = Color.White.copy(alpha = 0.2f),
                        labelColor = Color.White,
                        selectedLabelColor = Color.White
                    )
                    listOf(
                        "Male",
                        "Female",
                        "Prefer-not-to-say"
                    ).forEach { option ->
                    FilterChip(
                            onClick = { gender = option },
                            label = { Text(option) },
                            selected = gender == option,
                        modifier = Modifier.selectable(
                                selected = gender == option,
                                onClick = { gender = option },
                            role = Role.RadioButton
                            ),
                            colors = chipColors,
                            border = FilterChipDefaults.filterChipBorder(
                                enabled = true,
                                selected = gender == option,
                                borderColor = Color.White.copy(alpha = 0.6f),
                                selectedBorderColor = Color.White,
                                selectedBorderWidth = 1.dp,
                                borderWidth = 1.dp
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.weight(1f))

                // Continue button
            Button(
                onClick = {
                    viewModel.updateProfile(
                        originalEmail = user.email,
                        name = nameInput,
                        dob = dob,
                        gender = gender,
                        updatedEmail = emailInput
                    )
                },
                modifier = Modifier
                    .fillMaxWidth()
                        .height(52.dp)
                        .border(
                            width = 1.dp,
                            color = Color.White.copy(alpha = if (dob.isNotBlank() && gender.isNotBlank()) 1f else 0.5f),
                            shape = RoundedCornerShape(30.dp)
                        ),
                    enabled = nameInput.isNotBlank() &&
                        emailInput.isNotBlank() &&
                        dob.isNotBlank() &&
                        gender.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.White.copy(alpha = 0.15f),
                        contentColor = Color.White,
                        disabledContainerColor = Color.White.copy(alpha = 0.08f),
                        disabledContentColor = Color.White.copy(alpha = 0.4f)
                    ),
                    shape = RoundedCornerShape(30.dp)
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

    if (showDatePicker) {
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        datePickerState.selectedDateMillis?.let { millis ->
                            dob = dateFormatter.format(Date(millis))
                        }
                        showDatePicker = false
                    }
                ) {
                    Text("OK")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) {
                    Text("Cancel")
                }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }
}