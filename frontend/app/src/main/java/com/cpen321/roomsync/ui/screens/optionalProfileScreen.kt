package com.cpen321.roomsync.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest

@Composable
fun OptionalProfileScreen(
    onComplete: () -> Unit = {}
) {
    var username by remember { mutableStateOf("") }
    var bio by remember { mutableStateOf("") }
    var selectedImageUri by remember { mutableStateOf<Uri?>(null) }
    
    // Living Preferences
    var morningNight by remember { mutableStateOf("") }
    var drinking by remember { mutableStateOf("") }
    var partying by remember { mutableStateOf("") }
    var noise by remember { mutableStateOf("") }
    var profession by remember { mutableStateOf("") }
    
    val context = LocalContext.current
    
    // Image picker launcher
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        selectedImageUri = uri
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Title
            Text(
                text = "Optional Profile",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            // Profile Picture
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "Profile Picture:",
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(bottom = 12.dp)
                )
                
                Box(
                    modifier = Modifier
                        .size(120.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.surfaceVariant)
                        .border(
                            width = 2.dp,
                            color = MaterialTheme.colorScheme.outline,
                            shape = CircleShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    if (selectedImageUri != null) {
                        AsyncImage(
                            model = ImageRequest.Builder(context)
                                .data(selectedImageUri)
                                .crossfade(true)
                                .build(),
                            contentDescription = "Profile Picture",
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(CircleShape),
                            contentScale = ContentScale.Crop
                        )
                    } else {
                        IconButton(
                            onClick = { imagePickerLauncher.launch("image/*") }
                        ) {
                            Icon(
                                Icons.Default.Add,
                                contentDescription = "Add Profile Picture",
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
                
                // Image selection buttons
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.padding(top = 12.dp)
                ) {
                    OutlinedButton(
                        onClick = { imagePickerLauncher.launch("image/*") },
                        modifier = Modifier.height(40.dp)
                    ) {
                        Icon(
                            Icons.Default.Add,
                            contentDescription = "Gallery",
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Gallery", fontSize = 12.sp)
                    }
                    
                    if (selectedImageUri != null) {
                        OutlinedButton(
                            onClick = { selectedImageUri = null },
                            modifier = Modifier.height(40.dp)
                        ) {
                            Text("Remove", fontSize = 12.sp)
                        }
                    }
                }
            }

            // Username field
            Column {
                Text(
                    text = "Username:",
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                OutlinedTextField(
                    value = username,
                    onValueChange = { username = it },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    placeholder = { Text("Choose a username") }
                )
            }

            // Bio field
            Column {
                Text(
                    text = "Bio:",
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                OutlinedTextField(
                    value = bio,
                    onValueChange = { bio = it },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(100.dp),
                    maxLines = 4,
                    placeholder = { Text("Tell us about yourself...") }
                )
            }

            // Living Preferences Section
            Text(
                text = "Living Preferences:",
                fontSize = 18.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(top = 8.dp, bottom = 12.dp)
            )

            // Morning/Night
            Column {
                Text(
                    text = "Morning/Night:",
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .selectableGroup(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    FilterChip(
                        onClick = { morningNight = "Morning" },
                        label = { Text("Morning") },
                        selected = morningNight == "Morning"
                    )
                    FilterChip(
                        onClick = { morningNight = "Night" },
                        label = { Text("Night") },
                        selected = morningNight == "Night"
                    )
                }
            }

            // Drinking
            Column {
                Text(
                    text = "Drinking:",
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .selectableGroup(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    FilterChip(
                        onClick = { drinking = "None" },
                        label = { Text("None") },
                        selected = drinking == "None"
                    )
                    FilterChip(
                        onClick = { drinking = "Occasional" },
                        label = { Text("Occasional") },
                        selected = drinking == "Occasional"
                    )
                    FilterChip(
                        onClick = { drinking = "Regular" },
                        label = { Text("Regular") },
                        selected = drinking == "Regular"
                    )
                }
            }

            // Partying
            Column {
                Text(
                    text = "Partying:",
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .selectableGroup(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    FilterChip(
                        onClick = { partying = "None" },
                        label = { Text("None") },
                        selected = partying == "None"
                    )
                    FilterChip(
                        onClick = { partying = "Occasional" },
                        label = { Text("Occasional") },
                        selected = partying == "Occasional"
                    )
                    FilterChip(
                        onClick = { partying = "Regular" },
                        label = { Text("Regular") },
                        selected = partying == "Regular"
                    )
                }
            }

            // Noise
            Column {
                Text(
                    text = "Noise:",
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .selectableGroup(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    FilterChip(
                        onClick = { noise = "Quiet" },
                        label = { Text("Quiet") },
                        selected = noise == "Quiet"
                    )
                    FilterChip(
                        onClick = { noise = "Moderate" },
                        label = { Text("Moderate") },
                        selected = noise == "Moderate"
                    )
                    FilterChip(
                        onClick = { noise = "Loud" },
                        label = { Text("Loud") },
                        selected = noise == "Loud"
                    )
                }
            }

            // Profession
            Column {
                Text(
                    text = "Profession:",
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .selectableGroup(),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // First row
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FilterChip(
                            onClick = { profession = "Student" },
                            label = { Text("Student") },
                            selected = profession == "Student",
                            modifier = Modifier.weight(1f)
                        )
                        FilterChip(
                            onClick = { profession = "Worker" },
                            label = { Text("Worker") },
                            selected = profession == "Worker",
                            modifier = Modifier.weight(1f)
                        )
                        FilterChip(
                            onClick = { profession = "Professional" },
                            label = { Text("Professional") },
                            selected = profession == "Professional",
                            modifier = Modifier.weight(1f)
                        )
                    }
                    
                    // Second row
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FilterChip(
                            onClick = { profession = "Entrepreneur" },
                            label = { Text("Entrepreneur") },
                            selected = profession == "Entrepreneur",
                            modifier = Modifier.weight(1f)
                        )
                        FilterChip(
                            onClick = { profession = "Freelancer" },
                            label = { Text("Freelancer") },
                            selected = profession == "Freelancer",
                            modifier = Modifier.weight(1f)
                        )
                        FilterChip(
                            onClick = { profession = "Artist" },
                            label = { Text("Artist") },
                            selected = profession == "Artist",
                            modifier = Modifier.weight(1f)
                        )
                    }
                    
                    // Third row
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FilterChip(
                            onClick = { profession = "Healthcare" },
                            label = { Text("Healthcare") },
                            selected = profession == "Healthcare",
                            modifier = Modifier.weight(1f)
                        )
                        FilterChip(
                            onClick = { profession = "Tech" },
                            label = { Text("Tech") },
                            selected = profession == "Tech",
                            modifier = Modifier.weight(1f)
                        )
                        FilterChip(
                            onClick = { profession = "Other" },
                            label = { Text("Other") },
                            selected = profession == "Other",
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            // Complete button
            Button(
                onClick = {
                    // Save the bio to TaskViewModel
                    com.cpen321.roomsync.ui.viewmodels.TaskViewModel.saveUserBio(bio)
                    onComplete()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
            ) {
                Text(
                    text = "Complete",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}