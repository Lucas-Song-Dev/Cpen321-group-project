package com.cpen321.roomsync.ui.screens

import android.net.Uri
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import java.io.ByteArrayOutputStream
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
import androidx.compose.material.icons.filled.Edit
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
import kotlinx.coroutines.launch
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import com.cpen321.roomsync.data.models.User
import com.cpen321.roomsync.ui.viewmodels.OptionalProfileViewModel
import com.cpen321.roomsync.ui.viewmodels.OptionalProfileState
import com.cpen321.roomsync.ui.theme.GlassColors
import com.cpen321.roomsync.ui.theme.GlassGradients
import com.cpen321.roomsync.ui.theme.glassCard
import androidx.compose.ui.graphics.Color as ComposeColor

// Helper function to convert image URI to base64 string
suspend fun convertImageUriToBase64(context: android.content.Context, uri: Uri): String? {
    return try {
        val inputStream = context.contentResolver.openInputStream(uri)
        val bitmap = BitmapFactory.decodeStream(inputStream)
        inputStream?.close()
        
        if (bitmap != null) {
            // Resize bitmap to reduce size (max 800x800)
            val maxSize = 800
            val width = bitmap.width
            val height = bitmap.height
            val bitmapScaled = if (width > maxSize || height > maxSize) {
                val scale = maxSize.toFloat() / maxOf(width, height)
                Bitmap.createScaledBitmap(bitmap, (width * scale).toInt(), (height * scale).toInt(), true)
            } else {
                bitmap
            }
            
            val outputStream = ByteArrayOutputStream()
            bitmapScaled.compress(Bitmap.CompressFormat.JPEG, 80, outputStream)
            val byteArray = outputStream.toByteArray()
            val base64 = Base64.encodeToString(byteArray, Base64.NO_WRAP)
            "data:image/jpeg;base64,$base64"
        } else {
            null
        }
    } catch (e: Exception) {
        e.printStackTrace()
        null
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    user: User,
    viewModel: OptionalProfileViewModel,
    onBack: () -> Unit = {}
) {
    var bio by remember { mutableStateOf(user.bio ?: "") }
    var isEditingBio by remember { mutableStateOf(false) }
    // Initialize selectedImageUri from user.profilePicture if it's a content:// URI
    // Base64 images are handled directly by AsyncImage, so we don't need to store them in selectedImageUri
    var selectedImageUri by remember { 
        mutableStateOf<Uri?>(
            user.profilePicture?.let { pictureUri ->
                // Only store content:// URIs in selectedImageUri
                // Base64 and HTTP URLs are handled directly from user.profilePicture
                if (pictureUri.startsWith("content://")) {
                    try {
                        Uri.parse(pictureUri)
                    } catch (e: Exception) {
                        null
                    }
                } else null
            }
        )
    }

    //Living Preferences
    var morningNight by remember { mutableStateOf(user.livingPreferences?.schedule) }
    var drinking by remember { mutableStateOf(user.livingPreferences?.drinking) }
    var partying by remember { mutableStateOf(user.livingPreferences?.partying) }
    var noise by remember { mutableStateOf(user.livingPreferences?.noise) }
    var profession by remember { mutableStateOf(user.livingPreferences?.profession) }

    val context = LocalContext.current
    val optionalProfileState by viewModel.optionalProfileState.collectAsState()
    var isConvertingImage by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()

    // Sync local state when user parameter changes (e.g., when navigating back to screen)
    LaunchedEffect(user) {
        bio = user.bio ?: ""
        morningNight = user.livingPreferences?.schedule
        drinking = user.livingPreferences?.drinking
        partying = user.livingPreferences?.partying
        noise = user.livingPreferences?.noise
        profession = user.livingPreferences?.profession
        
        // Restore selectedImageUri from saved profile picture if it's a content:// URI
        // Base64 and HTTP URLs don't need to be in selectedImageUri - they work directly from user.profilePicture
        user.profilePicture?.let { pictureUri ->
            if (pictureUri.startsWith("content://") && selectedImageUri == null) {
                try {
                    selectedImageUri = Uri.parse(pictureUri)
                } catch (e: Exception) {
                    // Failed to parse, keep current state
                }
            } else if (pictureUri.startsWith("http://") || 
                      pictureUri.startsWith("https://") || 
                      pictureUri.startsWith("data:image")) {
                // If it's a valid URL or base64, clear selectedImageUri so we use the saved picture directly
                selectedImageUri = null
            }
        }
    }

    // Image picker launcher
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        selectedImageUri = uri
    }

    // Update local state when profile is successfully saved
    LaunchedEffect(optionalProfileState) {
        val state = optionalProfileState
        if (state is OptionalProfileState.Success) {
            val updatedUser = state.user
            // Update local state with saved values to keep UI in sync
            bio = updatedUser.bio ?: ""
            morningNight = updatedUser.livingPreferences?.schedule
            drinking = updatedUser.livingPreferences?.drinking
            partying = updatedUser.livingPreferences?.partying
            noise = updatedUser.livingPreferences?.noise
            profession = updatedUser.livingPreferences?.profession
            // Clear selectedImageUri if the saved profile picture is a valid URL or base64 data URI
            // This ensures we use the persisted image from the database
            if (updatedUser.profilePicture?.startsWith("http://") == true || 
                updatedUser.profilePicture?.startsWith("https://") == true ||
                updatedUser.profilePicture?.startsWith("data:image") == true) {
                selectedImageUri = null
            }
            // Otherwise, keep selectedImageUri so the image continues to display (for content:// URIs)
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
                // Get the most up-to-date user from success state if available
                val currentState = optionalProfileState // Store in local variable for smart cast
                val currentUser = when (currentState) {
                    is OptionalProfileState.Success -> currentState.user
                    else -> user
                }
                
                // Display selected image if available (always show it, even if content:// URI)
                // If no selected image, use saved profile picture (only if it's a valid HTTP/HTTPS URL or base64)
                // content:// URIs from saved profile pictures are invalid after app restart, so filter them out
                val savedPicture = currentUser.profilePicture?.takeIf { 
                    // Use saved picture if it's a valid HTTP/HTTPS URL or base64 data URI
                    // Base64 data URIs persist across app restarts
                    it.startsWith("http://") || 
                    it.startsWith("https://") || 
                    it.startsWith("data:image")
                }
                // Always prioritize selectedImageUri (works during current session)
                // Fall back to savedPicture only if no selectedImageUri
                val imageToDisplay = selectedImageUri ?: savedPicture
                
                if (imageToDisplay != null) {
                    AsyncImage(
                        model = ImageRequest.Builder(context)
                            .data(imageToDisplay)
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
                        color = ComposeColor.White
                    )
                }
            }

            Button(
                onClick = { imagePickerLauncher.launch("image/*") },
                modifier = Modifier
                    .fillMaxWidth()
                    .border(
                        width = 1.dp,
                        color = ComposeColor.White,
                        shape = RoundedCornerShape(8.dp)
                    ),
                colors = ButtonDefaults.buttonColors(
                    containerColor = ComposeColor.Transparent,
                    contentColor = ComposeColor.White
                )
            ) {
                Icon(Icons.Default.Add, contentDescription = null, tint = ComposeColor.White)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Change Profile Picture", color = ComposeColor.White)
            }

            Divider()

            // Basic Info (Read-only)
            Text(
                text = "Basic Information",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = ComposeColor.White,
                modifier = Modifier.fillMaxWidth()
            )

            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(
                        width = 1.dp,
                        color = ComposeColor.White,
                        shape = RoundedCornerShape(12.dp)
                    ),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                colors = CardDefaults.cardColors(
                    containerColor = ComposeColor.Transparent
                )
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
                        color = ComposeColor.White.copy(alpha = 0.7f),
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }

            Divider()

            // Bio Section
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "About Me",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = ComposeColor.White
                )
                IconButton(onClick = { isEditingBio = !isEditingBio }) {
                    Icon(
                        Icons.Default.Edit,
                        contentDescription = if (isEditingBio) "Done" else "Edit Bio",
                        tint = ComposeColor.White
                    )
                }
            }

            if (isEditingBio) {
                OutlinedTextField(
                    value = bio,
                    onValueChange = {
                        if (it.length <= 500) bio = it
                    },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Bio", color = ComposeColor.White) },
                    placeholder = { Text("Tell others about yourself...", color = ComposeColor.White.copy(alpha = 0.6f)) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = ComposeColor.White,
                        unfocusedTextColor = ComposeColor.White,
                        focusedLabelColor = ComposeColor.White,
                        unfocusedLabelColor = ComposeColor.White.copy(alpha = 0.7f),
                        focusedBorderColor = ComposeColor.White,
                        unfocusedBorderColor = ComposeColor.White.copy(alpha = 0.7f),
                        cursorColor = ComposeColor.White
                    ),
                    minLines = 3,
                    maxLines = 5,
                    supportingText = {
                        Text(
                            text = "${bio.length}/500",
                            modifier = Modifier.fillMaxWidth(),
                            textAlign = androidx.compose.ui.text.style.TextAlign.End,
                            color = ComposeColor.White.copy(alpha = 0.7f)
                        )
                    }
                )
            } else {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(
                            width = 1.dp,
                            color = ComposeColor.White,
                            shape = RoundedCornerShape(12.dp)
                        ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = ComposeColor.Transparent
                    )
                ) {
                    Text(
                        text = bio.ifEmpty { "No bio added yet" },
                        modifier = Modifier.padding(16.dp),
                        fontSize = 14.sp,
                        color = if (bio.isEmpty()) ComposeColor.White.copy(alpha = 0.6f) else ComposeColor.White
                    )
                }
            }

            Divider()

            // Living Preferences Section
            Text(
                text = "Living Preferences",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = ComposeColor.White,
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
                    coroutineScope.launch {
                        isConvertingImage = true
                        var profilePictureToSend: String? = null
                        
                        // If there's a new selected image, convert it to base64 for persistence
                        if (selectedImageUri != null) {
                            profilePictureToSend = withContext(Dispatchers.IO) {
                                convertImageUriToBase64(context, selectedImageUri!!)
                            }
                        } else {
                            // Use existing profile picture if it's a valid URL or base64
                            profilePictureToSend = user.profilePicture?.takeIf {
                                it.startsWith("http://") || 
                                it.startsWith("https://") || 
                                it.startsWith("data:image")
                            }
                        }
                        
                        isConvertingImage = false
                        
                        viewModel.updateOptionalProfile(
                            email = user.email,
                            bio = bio,
                            profilePicture = profilePictureToSend,
                            schedule = morningNight,
                            drinking = drinking,
                            partying = partying,
                            noise = noise,
                            profession = profession
                        )
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .border(
                        width = 1.dp,
                        color = ComposeColor.White,
                        shape = RoundedCornerShape(8.dp)
                    ),
                enabled = optionalProfileState !is OptionalProfileState.Loading && !isConvertingImage,
                colors = ButtonDefaults.buttonColors(
                    containerColor = ComposeColor.Transparent,
                    contentColor = ComposeColor.White,
                    disabledContainerColor = ComposeColor.Transparent.copy(alpha = 0.5f),
                    disabledContentColor = ComposeColor.White.copy(alpha = 0.5f)
                )
            ) {
                if (optionalProfileState is OptionalProfileState.Loading || isConvertingImage) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = ComposeColor.White
                    )
                } else {
                    Text("Save Changes", fontSize = 16.sp, color = ComposeColor.White)
                }
            }

            // Show success/error messages
            when (optionalProfileState) {
                is OptionalProfileState.Success -> {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(
                                width = 1.dp,
                                color = ComposeColor.White,
                                shape = RoundedCornerShape(12.dp)
                            ),
                        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = ComposeColor.Transparent
                        )
                    ) {
                        Text(
                            text = "✓ Profile updated successfully!",
                            modifier = Modifier.padding(16.dp),
                            color = ComposeColor.White
                        )
                    }
                }
                is OptionalProfileState.Error -> {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(
                                width = 1.dp,
                                color = ComposeColor(0xFFFF6B6B),
                                shape = RoundedCornerShape(12.dp)
                            ),
                        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = ComposeColor.Transparent
                        )
                    ) {
                        Text(
                            text = "✗ ${(optionalProfileState as OptionalProfileState.Error).message}",
                            modifier = Modifier.padding(16.dp),
                            color = ComposeColor(0xFFFF6B6B)
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
            color = ComposeColor.White.copy(alpha = 0.7f)
        )
        Text(
            text = value,
            fontSize = 14.sp,
            color = ComposeColor.White
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
            color = ComposeColor.White.copy(alpha = 0.7f),
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
                    label = { Text(option, color = ComposeColor.White) },
                    modifier = Modifier.weight(1f),
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = ComposeColor.White.copy(alpha = 0.3f),
                        containerColor = ComposeColor.Transparent,
                        labelColor = ComposeColor.White,
                        selectedLabelColor = ComposeColor.White
                    )
                )
            }
        }
    }
}

