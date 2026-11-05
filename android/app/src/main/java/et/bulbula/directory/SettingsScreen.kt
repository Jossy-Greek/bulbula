package et.bulbula.directory

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.net.toUri

/** Appearance and language, and the two places on the website the app doesn't do itself. */
@Composable
fun SettingsScreen(
    appearance: Appearance,
    onAppearance: (Appearance) -> Unit,
    language: Language,
    onLanguage: (Language) -> Unit,
    /** The signed-in admin's email, or null. */
    admin: String?,
    toReview: Int,
    onSignIn: () -> Unit,
    onReview: () -> Unit,
    onAnalytics: () -> Unit,
    onSignOut: () -> Unit,
    onBack: () -> Unit,
) {
    val context = LocalContext.current
    val colors = MaterialTheme.colorScheme
    val locale = if (LocalConfiguration.current.locales[0].language == "am") "am" else "en"
    val open = { path: String -> context.startActivity(Intent(Intent.ACTION_VIEW, "${BuildConfig.SITE_URL}/$locale$path".toUri())) }

    Column(Modifier.fillMaxSize().background(colors.background).statusBarsPadding().verticalScroll(rememberScrollState()).navigationBarsPadding().padding(bottom = 32.dp)) {
        IconButton(onClick = onBack, modifier = Modifier.padding(4.dp)) { Icon(painterResource(R.drawable.ic_back), contentDescription = stringResource(R.string.back)) }
        Text(stringResource(R.string.settings), style = MaterialTheme.typography.headlineLarge, modifier = Modifier.padding(start = 20.dp, end = 20.dp, bottom = 20.dp))

        Column(Modifier.padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Card {
                Choice(R.drawable.ic_theme, stringResource(R.string.appearance)) {
                    PillSwitch(
                        listOf(Appearance.System to stringResource(R.string.system), Appearance.Light to stringResource(R.string.light), Appearance.Dark to stringResource(R.string.dark)),
                        appearance,
                        onAppearance,
                    )
                }
                Choice(R.drawable.ic_languages, stringResource(R.string.language), last = true) {
                    PillSwitch(
                        listOf(Language.System to stringResource(R.string.system), Language.English to stringResource(R.string.english), Language.Amharic to stringResource(R.string.amharic)),
                        language,
                        onLanguage,
                    )
                }
            }
            Card {
                CardRow(icon = R.drawable.ic_add, iconTint = colors.primary, onClick = { open("/add") }, trailing = { Chevron() }) {
                    Text(stringResource(R.string.add_business), style = MaterialTheme.typography.bodyLarge)
                }
                CardRow(icon = R.drawable.ic_web, iconTint = colors.primary, last = true, onClick = { open("") }, trailing = { Chevron() }) {
                    Text(stringResource(R.string.website), style = MaterialTheme.typography.bodyLarge)
                }
            }
            // For the site's existing admin accounts; everyone else only sees "Sign in".
            Card {
                if (admin == null) {
                    CardRow(icon = R.drawable.ic_sign_in, iconTint = colors.primary, last = true, onClick = onSignIn, trailing = { Chevron() }) {
                        Text(stringResource(R.string.sign_in), style = MaterialTheme.typography.bodyLarge)
                    }
                } else {
                    CardRow(icon = R.drawable.ic_review, iconTint = colors.primary, onClick = onReview, trailing = {
                        if (toReview > 0) Text("$toReview", style = MaterialTheme.typography.labelLarge, color = colors.onSurfaceVariant, modifier = Modifier.padding(end = 6.dp))
                        Chevron()
                    }) {
                        Text(stringResource(R.string.review), style = MaterialTheme.typography.bodyLarge)
                    }
                    CardRow(icon = R.drawable.ic_analytics, iconTint = colors.primary, onClick = onAnalytics, trailing = { Chevron() }) {
                        Text(stringResource(R.string.analytics), style = MaterialTheme.typography.bodyLarge)
                    }
                    CardRow(icon = R.drawable.ic_sign_out, last = true, onClick = onSignOut) {
                        Text(stringResource(R.string.sign_out), style = MaterialTheme.typography.bodyLarge)
                        Muted(admin, small = true)
                    }
                }
            }
            Text(
                "${stringResource(R.string.app_name)} ${BuildConfig.VERSION_NAME}",
                style = MaterialTheme.typography.labelMedium,
                color = colors.onSurfaceVariant,
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            )
        }
    }
}

/** A setting: icon and name, the choices under it. */
@Composable
private fun Choice(icon: Int, title: String, last: Boolean = false, choices: @Composable () -> Unit) {
    CardRow(last = last) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(painterResource(icon), contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
            Spacer(Modifier.size(14.dp))
            Text(title, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium)
        }
        Spacer(Modifier.height(12.dp))
        choices()
        Spacer(Modifier.height(4.dp))
    }
}

@Composable
private fun Chevron() = Icon(painterResource(R.drawable.ic_chevron_right), contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(18.dp))
