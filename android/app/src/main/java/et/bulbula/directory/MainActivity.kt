package et.bulbula.directory

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalConfiguration
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.delay

class MainActivity : ComponentActivity() {
    private val settings by lazy { Settings(this) }

    /** A website link (/en/b/<slug>) the app was opened with. */
    private var link by mutableStateOf<String?>(null)
    private var appearance by mutableStateOf(Appearance.System)

    override fun attachBaseContext(base: Context) {
        super.attachBaseContext(Settings(base).wrap(base))
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        appearance = settings.appearance
        if (savedInstanceState == null) link = slugOf(intent)
        setContent {
            val dark = when (appearance) {
                Appearance.System -> isSystemInDarkTheme()
                Appearance.Light -> false
                Appearance.Dark -> true
            }
            // Status and navigation bar icons follow the app's appearance, not only the phone's.
            LaunchedEffect(dark) {
                // The 3-button bar gets a see-through page colour so its buttons never sit on text; gesture navigation stays clear.
                val status = if (dark) SystemBarStyle.dark(Color.TRANSPARENT) else SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT)
                val navigation = if (dark) SystemBarStyle.dark(0xE60B1A1E.toInt()) else SystemBarStyle.light(0xE6F7F5EF.toInt(), 0xE60B1A1E.toInt())
                enableEdgeToEdge(statusBarStyle = status, navigationBarStyle = navigation)
            }
            BulbulaTheme(dark) {
                Surface(color = MaterialTheme.colorScheme.background) {
                    App(
                        link = link,
                        onLinkOpened = { link = null },
                        appearance = appearance,
                        onAppearance = { appearance = it; settings.appearance = it },
                        language = settings.language,
                        onLanguage = { settings.setLanguage(this, it) },
                    )
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        link = slugOf(intent)
    }

    private fun slugOf(intent: Intent?): String? =
        intent?.data?.pathSegments?.let { s -> s.getOrNull(s.indexOf("b") + 1)?.takeIf { s.contains("b") } }
}

/** The directory, with a place or the settings on top of it. */
@Composable
fun App(
    link: String?,
    onLinkOpened: () -> Unit,
    appearance: Appearance,
    onAppearance: (Appearance) -> Unit,
    language: Language,
    onLanguage: (Language) -> Unit,
    vm: DirectoryViewModel = viewModel(),
) {
    var slug by rememberSaveable { mutableStateOf<String?>(null) }
    var showSettings by rememberSaveable { mutableStateOf(false) }
    var query by rememberSaveable { mutableStateOf("") }
    var category by rememberSaveable { mutableStateOf<String?>(null) }
    val listState = rememberLazyListState()
    val chipState = rememberLazyListState()
    // The data's language is the screen's language.
    val locale = if (LocalConfiguration.current.locales[0].language == "am") "am" else "en"
    LaunchedEffect(locale) { vm.use(locale) }
    // "Open now" follows the clock.
    val now by produceState(Hours.addisNow()) {
        while (true) {
            delay(60_000 - System.currentTimeMillis() % 60_000)
            value = Hours.addisNow()
        }
    }
    if (link != null) {
        slug = link
        showSettings = false
        onLinkOpened()
    }
    val directory = vm.state.directory
    BackHandler(enabled = slug != null || showSettings) {
        slug = null
        showSettings = false
    }

    val screen = when {
        showSettings -> "settings"
        slug != null -> "place:$slug"
        else -> "list"
    }
    AnimatedContent(
        targetState = screen,
        transitionSpec = {
            // Screens slide in from the right and back out to it, like a stack.
            if (targetState != "list") {
                (slideInHorizontally { it / 4 } + fadeIn()) togetherWith fadeOut()
            } else {
                fadeIn() togetherWith (slideOutHorizontally { it / 4 } + fadeOut())
            }
        },
        label = "screen",
    ) { current ->
        val place = current.removePrefix("place:").takeIf { current.startsWith("place:") }?.let { s -> directory?.listings?.firstOrNull { it.slug == s } }
        when {
            current == "settings" -> SettingsScreen(appearance, onAppearance, language, onLanguage, onBack = { showSettings = false })
            place != null -> PlaceScreen(place, directory?.services.orEmpty(), now, onBack = { slug = null })
            else -> DirectoryScreen(
                state = vm.state,
                now = now,
                query = query,
                onQuery = { query = it },
                category = category,
                onCategory = { category = it },
                listState = listState,
                chipState = chipState,
                onRefresh = vm::refresh,
                onOpen = { slug = it.slug },
                onSettings = { showSettings = true },
            )
        }
    }
}
