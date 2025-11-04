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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.cpen321.roomsync.data.models.User
import com.cpen321.roomsync.ui.viewmodels.OptionalProfileViewModel
import com.cpen321.roomsync.ui.viewmodels.OptionalProfileState
import com.cpen321.roomsync.ui.theme.GlassColors
import com.cpen321.roomsync.ui.theme.GlassGradients
import com.cpen321.roomsync.ui.theme.glassCard
import androidx.compose.ui.graphics.Color as ComposeColor

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    user: User,
    viewModel: OptionalProfileViewModel,
    onBack: () -> Unit = {}
) {
    var bio by remember { mutableStateOf(user.bio ?: "") }
    var selectedImageUri by remember { mutableStateOf<Uri?>(null) }

    //Living Preferences
    var morningNight by remember { mutableStateOf(user.livingPreferences?.schedule) }
    var drinking by remember { mutableStateOf(user.livingPreferences?.drinking) }
    var partying by remember { mutableStateOf(user.livingPreferences?.partying) }
    var noise by remember { mutableStateOf(user.livingPreferences?.noise) }
    var profession by remember { mutableStateOf(user.livingPreferences?.profession) }

    val context = LocalContext.current
    val optionalProfileState by viewModel.optionalProfileState.collectAsState()

    // Image picker launcher
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        selectedImageUri = uri
    }

    // Show success message and navigate back
    LaunchedEffect(optionalProfileState) {
        if (optionalProfileState is OptionalProfileState.Success) {
            // Profile updated successfully, will stay on page
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(brush = GlassGradients.MainBackground)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Glass top bar
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        color = ComposeColor(0x30FFFFFF),
                        shape = RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp)
                    )
                    .border(
                        width = 1.dp,
                        color = ComposeColor(0x40FFFFFF),
                        shape = RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp)
                    )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(start = 16.dp, end = 16.dp, top = 40.dp, bottom = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onBack) {
                        Icon(
                            Icons.Default.ArrowBack,
                            contentDescription = "Back",
                            tint = ComposeColor.White
                        )
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    Text(
                        text = "My Profile",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = ComposeColor.White
                    )
                }
            }
            
            val paddingValues = PaddingValues(0.dp)
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(16.dp)
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Profile Picture Section
                Text(
                    text = "Profile Picture",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = ComposeColor.White,
                    modifier = Modifier.fillMaxWidth()
                )

                Box(
                    modifier = Modifier
                        .size(120.dp)
                        .clip(CircleShape)
                        .background(ComposeColor(0x40FFFFFF))
                        .border(3.dp, ComposeColor.White, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                if (selectedImageUri != null || user.profilePicture != null) {
                    AsyncImage(
                        model = ImageRequest.Builder(context)
                            .data(selectedImageUri ?: user.profilePicture)
                            .crossfade(true)
                            .build(),
                        contentDescription = "Profile Picture",
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Text(
                        text = user.name.take(1).uppercase(),
                        fontSize = 48.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Button(
                onClick = { imagePickerLauncher.launch("image/*") },
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.Add, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Change Profile Picture")
            }

            Divider()

            // Basic Info (Read-only)
            Text(
                text = "Basic Information",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedCard(
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    InfoRow(label = "Name", value = user.name)
                    Spacer(modifier = Modifier.height(8.dp))
                    InfoRow(label = "Email", value = user.email)
                    Spacer(modifier = Modifier.height(8.dp))
                    InfoRow(label = "Date of Birth", value = user.dob?.toString() ?: "Not set")
                    Spacer(modifier = Modifier.height(8.dp))
                    InfoRow(label = "Gender", value = user.gender ?: "Not set")
                    Spacer(modifier = Modifier.height(8.dp))
                    InfoRow(label = "Group", value = user.groupName ?: "No group")
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Note: Name, email, date of birth, and gender cannot be changed",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }

            Divider()

            // Bio Section
            Text(
                text = "About Me",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = bio,
                onValueChange = {
                    if (it.length <= 500) bio = it
                },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Bio") },
                placeholder = { Text("Tell others about yourself...") },
                minLines = 3,
                maxLines = 5,
                supportingText = {
                    Text(
                        text = "${bio.length}/500",
                        modifier = Modifier.fillMaxWidth(),
                        textAlign = androidx.compose.ui.text.style.TextAlign.End
                    )
                }
            )

            Divider()

            // Living Preferences Section
            Text(
                text = "Living Preferences",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.fillMaxWidth()
            )

            // Schedule Preference
            PreferenceSelector(
                label = "Daily Schedule",
                options = listOf("Morning", "Night", "Flexible"),
                selectedOption = morningNight,
                onOptionSelected = { morningNight = it }
            )

            // Drinking Preference
            PreferenceSelector(
                label = "Drinking",
                options = listOf("None", "Occasional", "Regular"),
                selectedOption = drinking,
                onOptionSelected = { drinking = it }
            )

            // Partying Preference
            PreferenceSelector(
                label = "Partying",
                options = listOf("None", "Occasional", "Regular"),
                selectedOption = partying,
                onOptionSelected = { partying = it }
            )

            // Noise Level Preference
            PreferenceSelector(
                label = "Noise Level",
                options = listOf("Quiet", "Moderate", "Loud"),
                selectedOption = noise,
                onOptionSelected = { noise = it }
            )

            // Profession
            PreferenceSelector(
                label = "Profession",
                options = listOf("Student", "Worker", "Unemployed"),
                selectedOption = profession,
                onOptionSelected = { profession = it }
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Save Button
            Button(
                onClick = {
                    viewModel.updateOptionalProfile(
                        email = user.email,
                        bio = bio,
                        profilePicture = selectedImageUri?.toString() ?: user.profilePicture,
                        schedule = morningNight,
                        drinking = drinking,
                        partying = partying,
                        noise = noise,
                        profession = profession
                    )
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                enabled = optionalProfileState !is OptionalProfileState.Loading
            ) {
                if (optionalProfileState is OptionalProfileState.Loading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text("Save Changes", fontSize = 16.sp)
                }
            }

            // Show success/error messages
            when (optionalProfileState) {
                is OptionalProfileState.Success -> {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer
                        )
                    ) {
                        Text(
                            text = "✓ Profile updated successfully!",
                            modifier = Modifier.padding(16.dp),
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                }
                is OptionalProfileState.Error -> {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer
                        )
                    ) {
                        Text(
                            text = "✗ ${(optionalProfileState as OptionalProfileState.Error).message}",
                            modifier = Modifier.padding(16.dp),
                            color = MaterialTheme.colorScheme.onErrorContainer
                        )
                    }
                }
                else -> {}
            }

            Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}

@Composable
fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}

@Composable
fun PreferenceSelector(
    label: String,
    options: List<String>,
    selectedOption: String?,
    onOptionSelected: (String?) -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = label,
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .selectableGroup(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            options.forEach { option ->
                FilterChip(
                    selected = selectedOption == option,
                    onClick = {
                        onOptionSelected(if (selectedOption == option) null else option)
                    },
                    label = { Text(option) },
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

