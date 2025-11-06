package com.cpen321.roomsync.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

// RoomSync brand colors
val RoomSyncGreen = Color(0xFF4CAF50)
val RoomSyncGreenDark = Color(0xFF388E3C)

private val DarkColorScheme = darkColorScheme(
    primary = RoomSyncGreen,
    secondary = RoomSyncGreenDark,
    tertiary = RoomSyncGreen
)

private val LightColorScheme = lightColorScheme(
    primary = RoomSyncGreen,
    secondary = RoomSyncGreenDark,
    tertiary = RoomSyncGreen,
    background = Color(0xFFFFFBFE),
    surface = Color(0xFFFFFBFE),
    onPrimary = Color.White,
    onSecondary = Color.White,
    onTertiary = Color.White,
    onBackground = Color(0xFF1C1B1F),
    onSurface = Color(0xFF1C1B1F)
)

@Composable
fun RoomSyncFrontendTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    // Dynamic color is available on Android 12+
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }

        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography(),
        shapes = Shapes(),
        content = content
    )
}

//data class Spacing(
//    val none: Dp = 0.dp,
//    val extraSmall: Dp = 4.dp,
//    val small: Dp = 8.dp,
//    val medium: Dp = 16.dp,
//    val large: Dp = 24.dp,
//    val extraLarge: Dp = 32.dp,
//    val extraLarge2: Dp = 48.dp,
//    val extraLarge3: Dp = 64.dp,
//    val extraLarge4: Dp = 96.dp,
//    val extraLarge5: Dp = 120.dp,
//)
//
//val LocalSpacing = staticCompositionLocalOf { Spacing() }
