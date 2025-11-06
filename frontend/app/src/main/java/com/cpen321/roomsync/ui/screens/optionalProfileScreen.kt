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
import com.cpen321.roomsync.data.models.User
import com.cpen321.roomsync.ui.viewmodels.OptionalProfileViewModel
import com.cpen321.roomsync.ui.viewmodels.OptionalProfileState


@Composable
fun OptionalProfileScreen(
    user: User,
    viewModel: OptionalProfileViewModel,
    onComplete: () -> Unit = {}
) {
    var bio by remember { mutableStateOf("") }
    var selectedImageUri by remember { mutableStateOf<Uri?>(null) }

    //Living Preferences - lowercase to match backend
    var morningNight by remember { mutableStateOf<String?>(null) }
    var drinking by remember { mutableStateOf<String?>(null) }
    var partying by remember { mutableStateOf<String?>(null) }
    var noise by remember { mutableStateOf<String?>(null) }
    var profession by remember { mutableStateOf<String?>(null) }

    val context = LocalContext.current
    val optionalProfileState by viewModel.optionalProfileState.collectAsState()

    // Image picker launcher
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        selectedImageUri = uri
    }

    // Navigate when profile update is successful
    LaunchedEffect(optionalProfileState) {
        if (optionalProfileState is OptionalProfileState.Success) {
            onComplete()
        }
    }

    // Show loading dialog
    if (optionalProfileState is OptionalProfileState.Loading) {
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

    // Show error dialog
    if (optionalProfileState is OptionalProfileState.Error) {
        AlertDialog(
            onDismissRequest = {
                viewModel.resetState()
            },
            title = { Text("Error") },
            text = { Text((optionalProfileState as OptionalProfileState.Error).message) },
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

                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.padding(top = 12.dp)
                ) {
                    OutlinedButton(
                        onClick = { imagePickerLauncher.launch("image/*") },
                        modifier = Modifier.height(48.dp)
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
                            modifier = Modifier.height(48.dp)
                        ) {
                            Text("Remove", fontSize = 12.sp)
                        }
                    }
                }
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
                    onValueChange = { if (it.length <= 500) bio = it },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(100.dp),
                    maxLines = 4,
                    placeholder = { Text("Tell us about yourself...") },
                    supportingText = { Text("${bio.length}/500") }
                )
            }

            Text(
                text = "Living Preferences:",
                fontSize = 18.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(top = 8.dp, bottom = 12.dp)
            )
            
            OptionalProfileScreenPart2(morningNight, { morningNight = it }, drinking, { drinking = it }, partying, { partying = it })
            OptionalProfileScreenPart3(noise, { noise = it }, profession, { profession = it })

            Spacer(modifier = Modifier.weight(1f))

            // Action buttons
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Button(
                    onClick = {
                        viewModel.updateOptionalProfile(
                            email = user.email,
                            bio = bio.takeIf { it.isNotBlank() },
                            profilePicture = selectedImageUri?.toString(),
                            schedule = morningNight,
                            drinking = drinking,
                            partying = partying,
                            noise = noise,
                            profession = profession
                        )
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                ) {
                    Text(
                        text = "Save & Continue",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium
                    )
                }

                OutlinedButton(
                    onClick = onComplete,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                ) {
                    Text(
                        text = "Skip for Now",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }
    }
}

@Composable
private fun OptionalProfileScreenPart2(
    morningNight: String?,
    onMorningNightChange: (String?) -> Unit,
    drinking: String?,
    onDrinkingChange: (String?) -> Unit,
    partying: String?,
    onPartyingChange: (String?) -> Unit
) {
    OptionalProfileScreenPart2Schedule(morningNight, onMorningNightChange)
    OptionalProfileScreenPart2Drinking(drinking, onDrinkingChange)
    OptionalProfileScreenPart2Partying(partying, onPartyingChange)
}

@Composable
private fun OptionalProfileScreenPart2Schedule(morningNight: String?, onChange: (String?) -> Unit) {
    Column {
        Text(
            text = "Schedule:",
            fontSize = 16.sp,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        Row(
            modifier = Modifier.fillMaxWidth().selectableGroup(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            FilterChip(onClick = { onChange("Morning") }, label = { Text("Morning") }, selected = morningNight == "Morning")
            FilterChip(onClick = { onChange("Night") }, label = { Text("Night") }, selected = morningNight == "Night")
            FilterChip(onClick = { onChange("Flexible") }, label = { Text("Flexible") }, selected = morningNight == "Flexible")
        }
    }
}

@Composable
private fun OptionalProfileScreenPart2Drinking(drinking: String?, onChange: (String?) -> Unit) {
    Column {
        Text(
            text = "Drinking:",
            fontSize = 16.sp,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        Row(
            modifier = Modifier.fillMaxWidth().selectableGroup(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            FilterChip(onClick = { onChange("None") }, label = { Text("None") }, selected = drinking == "None")
            FilterChip(onClick = { onChange("Occasional") }, label = { Text("Occasional") }, selected = drinking == "Occasional")
            FilterChip(onClick = { onChange("Regular") }, label = { Text("Regular") }, selected = drinking == "Regular")
        }
    }
}

@Composable
private fun OptionalProfileScreenPart2Partying(partying: String?, onChange: (String?) -> Unit) {
    Column {
        Text(
            text = "Partying:",
            fontSize = 16.sp,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        Row(
            modifier = Modifier.fillMaxWidth().selectableGroup(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            FilterChip(onClick = { onChange("None") }, label = { Text("None") }, selected = partying == "None")
            FilterChip(onClick = { onChange("Occasional") }, label = { Text("Occasional") }, selected = partying == "Occasional")
            FilterChip(onClick = { onChange("Regular") }, label = { Text("Regular") }, selected = partying == "Regular")
        }
    }
}

@Composable
private fun OptionalProfileScreenPart3(
    noise: String?,
    onNoiseChange: (String?) -> Unit,
    profession: String?,
    onProfessionChange: (String?) -> Unit
) {
    Column {
        Text(
            text = "Noise Preference:",
            fontSize = 16.sp,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        Row(
            modifier = Modifier.fillMaxWidth().selectableGroup(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            FilterChip(onClick = { onNoiseChange("Quiet") }, label = { Text("Quiet") }, selected = noise == "Quiet")
            FilterChip(onClick = { onNoiseChange("Moderate") }, label = { Text("Moderate") }, selected = noise == "Moderate")
            FilterChip(onClick = { onNoiseChange("Loud") }, label = { Text("Loud") }, selected = noise == "Loud")
        }
    }
    
    Column {
        Text(
            text = "Profession:",
            fontSize = 16.sp,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        Row(
            modifier = Modifier.fillMaxWidth().selectableGroup(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            FilterChip(onClick = { onProfessionChange("Student") }, label = { Text("Student") }, selected = profession == "Student")
            FilterChip(onClick = { onProfessionChange("Worker") }, label = { Text("Worker") }, selected = profession == "Worker")
            FilterChip(onClick = { onProfessionChange("Unemployed") }, label = { Text("Unemployed") }, selected = profession == "Unemployed")
        }
    }
}