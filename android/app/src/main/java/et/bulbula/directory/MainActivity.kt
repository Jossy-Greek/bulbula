package et.bulbula.directory

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.delay

class MainActivity : ComponentActivity() {
    /** A website link (/en/b/<slug>) the app was opened with. */
    private var link by mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        if (savedInstanceState == null) link = slugOf(intent)
        setContent {
            BulbulaTheme {
                Surface(color = MaterialTheme.colorScheme.background) {
                    App(link, onLinkOpened = { link = null })
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

/** Two screens: the directory, and a place on top of it. */
@Composable
fun App(link: String?, onLinkOpened: () -> Unit, vm: DirectoryViewModel = viewModel()) {
    var slug by rememberSaveable { mutableStateOf<String?>(null) }
    var query by rememberSaveable { mutableStateOf("") }
    var category by rememberSaveable { mutableStateOf<String?>(null) }
    val listState = rememberLazyListState()
    val chipState = rememberLazyListState()
    // "Open now" follows the clock.
    val now by produceState(Hours.addisNow()) {
        while (true) {
            delay(60_000 - System.currentTimeMillis() % 60_000)
            value = Hours.addisNow()
        }
    }
    if (link != null) {
        slug = link
        onLinkOpened()
    }
    val directory = vm.state.directory
    BackHandler(enabled = slug != null) { slug = null }

    AnimatedContent(targetState = slug, transitionSpec = { fadeIn() togetherWith fadeOut() }, label = "screen") { current ->
        val place = current?.let { s -> directory?.listings?.firstOrNull { it.slug == s } }
        if (place != null) {
            PlaceScreen(place, directory?.services.orEmpty(), now, onBack = { slug = null })
        } else {
            DirectoryScreen(
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
            )
        }
    }
}
