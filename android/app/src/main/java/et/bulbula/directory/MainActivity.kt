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
import androidx.compose.runtime.SideEffect
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

/**
 * The screens as a stack: "list" at the bottom, then "place:<slug>", "settings", "signin",
 * "review" or "edit:<id>" on top. Back pops one.
 */
@Composable
fun App(
    link: String?,
    onLinkOpened: () -> Unit,
    appearance: Appearance,
    onAppearance: (Appearance) -> Unit,
    language: Language,
    onLanguage: (Language) -> Unit,
    vm: DirectoryViewModel = viewModel(),
    admin: AdminViewModel = viewModel(),
) {
    var stack by rememberSaveable { mutableStateOf(listOf("list")) }
    fun push(screen: String) { stack = stack + screen }
    fun pop() { if (stack.size > 1) stack = stack.dropLast(1) }
    var query by rememberSaveable { mutableStateOf("") }
    var category by rememberSaveable { mutableStateOf<String?>(null) }
    val listState = rememberLazyListState()
    val chipState = rememberLazyListState()
    // The data's language is the screen's language.
    val locale = if (LocalConfiguration.current.locales[0].language == "am") "am" else "en"
    LaunchedEffect(locale) { vm.use(locale) }
    LaunchedEffect(admin.state.session != null) { admin.reload() }
    // "Open now" follows the clock.
    val now by produceState(Hours.addisNow()) {
        while (true) {
            delay(60_000 - System.currentTimeMillis() % 60_000)
            value = Hours.addisNow()
        }
    }
    if (link != null) {
        stack = listOf("list", "place:$link")
        onLinkOpened()
    }
    val directory = vm.state.directory
    val signedIn = admin.state.session
    // Analytics (Track.kt): admins aren't counted; one view per screen change, as the website counts pages.
    SideEffect { Track.enabled = signedIn == null }
    val screen = stack.last()
    LaunchedEffect(screen, locale) {
        when (screen.substringBefore(':')) {
            "list" -> Track.view(locale)
            "place" -> Track.view(locale, screen.substringAfter(':'))
        }
    }
    // A search counts once typing pauses, with how many places it found.
    LaunchedEffect(query, category) {
        val q = query.trim()
        if (q.length < 2) return@LaunchedEffect
        delay(1_500)
        Track.search(locale, q.lowercase(), directory?.listings.orEmpty().matching(q, category).size)
    }
    // Pending places and reviews: what's waiting on an admin (unconfirmed places are ongoing work, not a badge).
    val toReview = if (signedIn != null) admin.state.pending.size + admin.state.reviews.size else null
    BackHandler(enabled = stack.size > 1) { pop() }

    AnimatedContent(
        targetState = stack.last(),
        transitionSpec = {
            // Going deeper slides in from the right; going back fades.
            if (stack.lastOrNull() == targetState && stack.size > 1) {
                (slideInHorizontally { it / 4 } + fadeIn()) togetherWith fadeOut()
            } else {
                fadeIn() togetherWith (slideOutHorizontally { it / 4 } + fadeOut())
            }
        },
        label = "screen",
    ) { current ->
        val arg = current.substringAfter(':', "")
        when (current.substringBefore(':')) {
            "settings" -> SettingsScreen(
                appearance, onAppearance, language, onLanguage,
                admin = signedIn?.email,
                toReview = toReview ?: 0,
                onSignIn = { push("signin") },
                onReview = { push("review") },
                onAnalytics = { push("analytics") },
                onSignOut = admin::signOut,
                onBack = ::pop,
            )
            "signin" -> SignInScreen(admin.lastEmail, onSignIn = { e, pw -> admin.signIn(e, pw).also { if (it) { pop(); push("review") } } }, onBack = ::pop)
            "review" -> if (signedIn == null) LaunchedEffect(Unit) { pop() } else ReviewScreen(admin.state, admin::reload, onOpen = { push("edit:${it.id}") }, onModerate = admin::moderate, onBack = ::pop)
            "analytics" -> if (signedIn == null) LaunchedEffect(Unit) { pop() } else AnalyticsScreen(admin, onBack = ::pop)
            "edit" -> {
                val id = arg.toInt()
                val known = (admin.state.pending + admin.state.unconfirmed).firstOrNull { it.id == id }
                EditScreen(id, known, admin, onDone = { pop(); vm.refresh() })
            }
            "place" -> {
                val place = directory?.listings?.firstOrNull { it.slug == arg }
                if (place == null) LaunchedEffect(Unit) { pop() } else {
                    PlaceScreen(place, directory.services, now, onBack = ::pop, onEdit = if (signedIn != null) ({ push("edit:${place.id}") }) else null)
                }
            }
            else -> DirectoryScreen(
                state = vm.state,
                now = now,
                query = query,
                onQuery = { query = it },
                category = category,
                onCategory = { category = it; if (it != null) Track.filter(locale, it) },
                listState = listState,
                chipState = chipState,
                onRefresh = { vm.refresh(); admin.reload() },
                onOpen = { push("place:${it.slug}") },
                onSettings = { push("settings") },
                toReview = toReview,
                onReview = { push("review") },
            )
        }
    }
}
