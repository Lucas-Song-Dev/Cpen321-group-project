package com.cpen321.roomsync.ui.screens

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.cpen321.roomsync.data.models.User
import com.cpen321.roomsync.ui.theme.GlassColors
import com.cpen321.roomsync.ui.theme.GlassGradients
import com.cpen321.roomsync.ui.viewmodels.OptionalProfileViewModel
import com.cpen321.roomsync.ui.viewmodels.OptionalProfileState
import java.io.ByteArrayOutputStream
import java.io.InputStream
import android.util.Base64

/**
 * Converts an image URI to a base64 data URI string
 */
fun convertUriToBase64(context: Context, uri: Uri): String? {
    return try {
        val inputStream: InputStream? = context.contentResolver.openInputStream(uri)
        inputStream?.use { stream ->
            // Decode the image
            val bitmap = BitmapFactory.decodeStream(stream)
            
            // Compress to JPEG (you can change to PNG if needed)
            val outputStream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.JPEG, 80, outputStream) // 80% quality
            
            // Convert to base64
            val base64String = Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP)
            
            // Return as data URI
            "data:image/jpeg;base64,$base64String"
        }
    } catch (e: Exception) {
        e.printStackTrace()
        null
    }
}

@Composable
fun OptionalProfileScreen(
    user: User,
    viewModel: OptionalProfileViewModel,
    onComplete: () -> Unit = {}
) {
    var bio by remember { mutableStateOf(user.bio ?: "") }
    var selectedImageUri by remember { mutableStateOf<Uri?>(null) }
    var hasNewImageSelected by remember { mutableStateOf(false) }
    var imageRemoved by remember { mutableStateOf(false) }

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
        hasNewImageSelected = uri != null
        imageRemoved = false
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

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(brush = GlassGradients.MainBackground)
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
                color = Color.White,
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
                    color = Color.White,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                Box(
                    modifier = Modifier
                        .size(120.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.1f))
                        .border(
                            width = 2.dp,
                            color = Color.White.copy(alpha = 0.8f),
                            shape = CircleShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    // Get the most up-to-date user from success state if available
                    val currentState = optionalProfileState // Store in local variable for smart cast
                    val currentUser = when (currentState) {
                        is OptionalProfileState.Success -> currentState.user
                        else -> user
                    }
                    
                    // Handle both local URIs and base64 data URIs from database
                    val imageToShow: Any? = selectedImageUri ?: currentUser.profilePicture?.let { profilePic ->
                        // If it's a data URI (base64), use it directly
                        // Otherwise, try to parse it as a URI
                        if (profilePic.startsWith("data:")) {
                            profilePic
                        } else {
                            try {
                                Uri.parse(profilePic)
                            } catch (e: Exception) {
                                null
                            }
                        }
                    }
                    if (imageToShow != null) {
                        AsyncImage(
                            model = ImageRequest.Builder(context)
                                .data(imageToShow)
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
                                tint = Color.White
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
                        modifier = Modifier.height(40.dp),
                        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.7f)),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = Color.White,
                            containerColor = Color.Transparent
                        )
                    ) {
                        Icon(
                            Icons.Default.Add,
                            contentDescription = "Gallery",
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                            Text("Gallery", fontSize = 12.sp, color = Color.White)
                    }

                    if (selectedImageUri != null || user.profilePicture != null) {
                        OutlinedButton(
                            onClick = { 
                                selectedImageUri = null
                                hasNewImageSelected = true
                                imageRemoved = true
                            },
                            modifier = Modifier.height(40.dp)
                        ) {
                            Text("Remove", fontSize = 12.sp, color = Color.White)
                        }
                    }
                }
            }

            // Bio field
            Column {
                Text(
                    text = "Bio:",
                    fontSize = 16.sp,
                    color = Color.White,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                OutlinedTextField(
                    value = bio,
                    onValueChange = { if (it.length <= 500) bio = it },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(100.dp),
                    maxLines = 4,
                    placeholder = { Text("Tell us about yourself...", color = Color.White.copy(alpha = 0.6f)) },
                    supportingText = { Text("${bio.length}/500", color = Color.White.copy(alpha = 0.6f)) },
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
            }

            Text(
                text = "Living Preferences:",
                fontSize = 18.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color.White,
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
                        // Convert image to base64 if a new image is selected
                        val currentImageUri = selectedImageUri // Store in local variable for smart cast
                        val profilePictureBase64 = when {
                            imageRemoved -> "" // Send empty string to explicitly remove picture
                            hasNewImageSelected && currentImageUri != null -> {
                                convertUriToBase64(context, currentImageUri) ?: null
                            }
                            else -> null // Don't send profilePicture if no new image was selected
                        }
                        
                        viewModel.updateOptionalProfile(
                            email = user.email,
                            bio = bio.takeIf { it.isNotBlank() },
                            profilePicture = profilePictureBase64,
                            schedule = morningNight,
                            drinking = drinking,
                            partying = partying,
                            noise = noise,
                            profession = profession
                        )
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp)
                        .border(
                            width = 1.dp,
                            color = Color.White,
                            shape = RoundedCornerShape(30.dp)
                        ),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.Transparent,
                        contentColor = Color.White
                    ),
                    shape = RoundedCornerShape(30.dp)
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
                        .height(54.dp),
                    shape = RoundedCornerShape(30.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = Color.Transparent,
                        contentColor = Color.White
                    ),
                    border = BorderStroke(1.dp, Color.White)
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
            color = Color.White,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        Row(
            modifier = Modifier.fillMaxWidth().selectableGroup(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            PreferenceChip("Morning", morningNight == "Morning") { onChange("Morning") }
            PreferenceChip("Night", morningNight == "Night") { onChange("Night") }
            PreferenceChip("Flexible", morningNight == "Flexible") { onChange("Flexible") }
        }
    }
}

@Composable
private fun OptionalProfileScreenPart2Drinking(drinking: String?, onChange: (String?) -> Unit) {
    Column {
        Text(
            text = "Drinking:",
            fontSize = 16.sp,
            color = Color.White,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        Row(
            modifier = Modifier.fillMaxWidth().selectableGroup(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            PreferenceChip("None", drinking == "None") { onChange("None") }
            PreferenceChip("Occasional", drinking == "Occasional") { onChange("Occasional") }
            PreferenceChip("Regular", drinking == "Regular") { onChange("Regular") }
        }
    }
}

@Composable
private fun OptionalProfileScreenPart2Partying(partying: String?, onChange: (String?) -> Unit) {
    Column {
        Text(
            text = "Partying:",
            fontSize = 16.sp,
            color = Color.White,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        Row(
            modifier = Modifier.fillMaxWidth().selectableGroup(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            PreferenceChip("None", partying == "None") { onChange("None") }
            PreferenceChip("Occasional", partying == "Occasional") { onChange("Occasional") }
            PreferenceChip("Regular", partying == "Regular") { onChange("Regular") }
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
            color = Color.White,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        Row(
            modifier = Modifier.fillMaxWidth().selectableGroup(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            PreferenceChip("Quiet", noise == "Quiet") { onNoiseChange("Quiet") }
            PreferenceChip("Moderate", noise == "Moderate") { onNoiseChange("Moderate") }
            PreferenceChip("Loud", noise == "Loud") { onNoiseChange("Loud") }
        }
    }
    
    Column {
        Text(
            text = "Profession:",
            fontSize = 16.sp,
            color = Color.White,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        Row(
            modifier = Modifier.fillMaxWidth().selectableGroup(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            PreferenceChip("Student", profession == "Student") { onProfessionChange("Student") }
            PreferenceChip("Worker", profession == "Worker") { onProfessionChange("Worker") }
            PreferenceChip("Unemployed", profession == "Unemployed") { onProfessionChange("Unemployed") }
        }
    }
}

@Composable
private fun PreferenceChip(
    label: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    val borderColor = if (selected) Color.White else Color.White.copy(alpha = 0.6f)
    FilterChip(
        onClick = onClick,
        label = { Text(label, color = Color.White) },
        selected = selected,
        shape = RoundedCornerShape(12.dp),
        colors = FilterChipDefaults.filterChipColors(
            containerColor = Color.Transparent,
            selectedContainerColor = Color.White.copy(alpha = 0.15f),
            labelColor = Color.White,
            selectedLabelColor = Color.White
        ),
        border = FilterChipDefaults.filterChipBorder(
            enabled = true,
            selected = selected,
            borderColor = borderColor,
            selectedBorderColor = Color.White,
            borderWidth = 1.dp,
            selectedBorderWidth = 1.dp
        )
    )
}