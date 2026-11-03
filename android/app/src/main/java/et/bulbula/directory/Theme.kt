package et.bulbula.directory

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// The website's colours (app/(frontend)/globals.css), with a dark counterpart.
// background = the page, surface = cards on it, surfaceVariant = icon tiles and fields.
private val Light = lightColorScheme(
    primary = Color(0xFF1F7A85), // teal
    onPrimary = Color.White,
    secondary = Color(0xFF8A5300), // amber-text, for community places
    background = Color(0xFFF7F5EF), // page
    onBackground = Color(0xFF10242A), // ink
    surface = Color(0xFFFFFFFF), // raised
    onSurface = Color(0xFF10242A),
    surfaceVariant = Color(0xFFE7F1F0), // tint
    onSurfaceVariant = Color(0xFF4B5F63), // muted
    outlineVariant = Color(0xFFE6ECEB),
)

private val Dark = darkColorScheme(
    primary = Color(0xFF6CC3CC),
    onPrimary = Color(0xFF062126),
    secondary = Color(0xFFF2B134), // marigold
    background = Color(0xFF0B1A1E),
    onBackground = Color(0xFFEEF3F2),
    surface = Color(0xFF13262C),
    onSurface = Color(0xFFEEF3F2),
    surfaceVariant = Color(0xFF1C363D),
    onSurfaceVariant = Color(0xFF9FB2B5),
    outlineVariant = Color(0xFF1F3A40),
)

/** Open / closed, as on the website's badge. */
private class Status(val open: Color, val closed: Color)
private val LocalStatus = staticCompositionLocalOf { Status(Color(0xFF17703D), Color(0xFFA3321F)) }
val openColor: Color @Composable @ReadOnlyComposable get() = LocalStatus.current.open
val closedColor: Color @Composable @ReadOnlyComposable get() = LocalStatus.current.closed

// Material's type with the extra letter-spacing removed and firmer headings: reads like the website.
private val Type = Typography().run {
    copy(
        headlineLarge = headlineLarge.copy(fontSize = 34.sp, fontWeight = FontWeight.Bold, letterSpacing = (-0.6).sp),
        headlineMedium = headlineMedium.copy(fontWeight = FontWeight.Bold, letterSpacing = (-0.4).sp),
        titleMedium = titleMedium.copy(fontWeight = FontWeight.SemiBold, letterSpacing = 0.sp),
        bodyLarge = bodyLarge.copy(letterSpacing = 0.sp),
        bodyMedium = bodyMedium.copy(letterSpacing = 0.sp),
        labelLarge = labelLarge.copy(letterSpacing = 0.sp),
        labelMedium = labelMedium.copy(letterSpacing = 0.sp),
    )
}

@Composable
fun BulbulaTheme(dark: Boolean, content: @Composable () -> Unit) {
    val status = if (dark) Status(Color(0xFF4CC38A), Color(0xFFFF8A75)) else Status(Color(0xFF17703D), Color(0xFFA3321F))
    CompositionLocalProvider(LocalStatus provides status) {
        MaterialTheme(colorScheme = if (dark) Dark else Light, typography = Type, content = content)
    }
}
