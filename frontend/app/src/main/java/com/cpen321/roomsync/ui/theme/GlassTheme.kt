package com.cpen321.roomsync.ui.theme

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

// Glass UI Color Palette
object GlassColors {
    // Primary gradient colors - Modern blue/purple theme
    val GradientStart = Color(0xFF667eea)
    val GradientMiddle = Color(0xFF764ba2)
    val GradientEnd = Color(0xFFf093fb)
    
    // Alternative gradient - Teal/Blue
    val GradientAltStart = Color(0xFF00b4db)
    val GradientAltEnd = Color(0xFF0083b0)
    
    // Glass surface colors (semi-transparent)
    val GlassSurface = Color(0x40FFFFFF) // 25% opacity white
    val GlassSurfaceDark = Color(0x30000000) // 19% opacity black
    val GlassHighlight = Color(0x60FFFFFF) // 38% opacity white
    
    // Border colors
    val GlassBorder = Color(0x40FFFFFF) // 25% opacity white
    val GlassBorderDark = Color(0x30FFFFFF) // 19% opacity white
    
    // Accent colors
    val AccentPurple = Color(0xFF8B5CF6)
    val AccentBlue = Color(0xFF3B82F6)
    val AccentPink = Color(0xFFEC4899)
    val AccentTeal = Color(0xFF14B8A6)
    
    // Alert / error color
    val AlertRed = Color(0xFFFF3B58)
}

// Gradient definitions
object GlassGradients {
    val MainBackground = Brush.verticalGradient(
        colors = listOf(
            GlassColors.GradientStart,
            GlassColors.GradientMiddle,
            GlassColors.GradientEnd
        )
    )
    
    val CardGradient = Brush.linearGradient(
        colors = listOf(
            Color(0x50FFFFFF),
            Color(0x30FFFFFF)
        )
    )
    
    val AccentGradient = Brush.horizontalGradient(
        colors = listOf(
            GlassColors.AccentPurple,
            GlassColors.AccentBlue
        )
    )
    
    val TealBlueGradient = Brush.horizontalGradient(
        colors = listOf(
            GlassColors.GradientAltStart,
            GlassColors.GradientAltEnd
        )
    )
}

// Modifier extensions for glass effects
fun Modifier.glassEffect() = this
    .background(
        brush = GlassGradients.CardGradient,
        shape = RoundedCornerShape(20.dp)
    )
    .border(
        width = 1.dp,
        color = GlassColors.GlassBorder,
        shape = RoundedCornerShape(20.dp)
    )

fun Modifier.glassCard() = this
    .background(
        color = GlassColors.GlassSurface,
        shape = RoundedCornerShape(24.dp)
    )
    .border(
        width = 1.5.dp,
        color = GlassColors.GlassBorder,
        shape = RoundedCornerShape(24.dp)
    )

fun Modifier.glassButton() = this
    .background(
        brush = GlassGradients.AccentGradient,
        shape = RoundedCornerShape(16.dp)
    )
    .border(
        width = 1.dp,
        color = Color(0x60FFFFFF),
        shape = RoundedCornerShape(16.dp)
    )

fun Modifier.glassSurface() = this
    .background(
        color = Color(0x30FFFFFF),
        shape = RoundedCornerShape(16.dp)
    )
    .border(
        width = 1.dp,
        color = Color(0x40FFFFFF),
        shape = RoundedCornerShape(16.dp)
    )




