package et.bulbula.directory

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.sp

// The website's colours (app/(frontend)/globals.css), with a dark counterpart.
private val Light = lightColorScheme(
    primary = Color(0xFF17646D), // teal-text
    onPrimary = Color.White,
    background = Color(0xFFF7F5EF), // page
    onBackground = Color(0xFF10242A), // ink
    surface = Color(0xFFF7F5EF),
    onSurface = Color(0xFF10242A),
    surfaceVariant = Color(0xFFE7F1F0), // tint
    onSurfaceVariant = Color(0xFF4B5F63), // muted
    outlineVariant = Color(0xFFDCE5E4), // border
)

private val Dark = darkColorScheme(
    primary = Color(0xFF7CC4CC),
    onPrimary = Color(0xFF0B1A1E),
    background = Color(0xFF0B1A1E),
    onBackground = Color(0xFFEEF3F2),
    surface = Color(0xFF0B1A1E),
    onSurface = Color(0xFFEEF3F2),
    surfaceVariant = Color(0xFF16313A),
    onSurfaceVariant = Color(0xFF9FB2B5),
    outlineVariant = Color(0xFF1F3A40),
)

/** Open / closed, as on the website's badge. */
val openColor: Color @Composable @ReadOnlyComposable get() = if (isSystemInDarkTheme()) Color(0xFF4CC38A) else Color(0xFF17703D)
val closedColor: Color @Composable @ReadOnlyComposable get() = if (isSystemInDarkTheme()) Color(0xFFFF8A75) else Color(0xFFA3321F)

// Material's default text with its extra letter-spacing removed: reads tighter, like the website.
private val Type = Typography().run {
    copy(
        headlineLarge = headlineLarge.copy(letterSpacing = (-0.5).sp),
        headlineMedium = headlineMedium.copy(letterSpacing = (-0.25).sp),
        bodyLarge = bodyLarge.copy(letterSpacing = 0.sp),
        bodyMedium = bodyMedium.copy(letterSpacing = 0.sp),
        labelLarge = labelLarge.copy(letterSpacing = 0.sp),
    )
}

@Composable
fun BulbulaTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = if (isSystemInDarkTheme()) Dark else Light, typography = Type, content = content)
}
