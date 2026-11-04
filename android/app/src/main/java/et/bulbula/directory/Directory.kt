package et.bulbula.directory

import android.app.Application
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.util.concurrent.TimeUnit

/** The whole directory, as served by the site at /{locale}/directory.json (app/(frontend)/[locale]/directory.json). */
@Serializable
data class Directory(
    val categories: List<Category>,
    /** Service key → label in this language, e.g. "dineIn" → "Dine-in". */
    val services: Map<String, String> = emptyMap(),
    /** Already in the website's order: featured, owner-run, confirmed, with a phone, then by name. */
    val listings: List<Place>,
    /** The latest releases (admin → Site settings); absent until one is set. */
    val app: Releases? = null,
)

@Serializable
data class Releases(val android: Release? = null)

/** An APK release: shared outside a store, so the app offers the update itself. */
@Serializable
data class Release(val versionCode: Int, val versionName: String = "", val url: String)

@Serializable
data class Category(
    val slug: String,
    val name: String,
    /** A Lucide icon name from the site ("coffee", "landmark", …); see [categoryIcon]. */
    val icon: String = "",
    /** "business" or "community". */
    val group: String = "business",
)

@Serializable
data class Place(
    val id: Int,
    val slug: String,
    val name: String,
    val category: Category,
    val description: String? = null,
    /** True when [description] was written by us from the category, not by the place. */
    val generated: Boolean = false,
    val landmark: String? = null,
    val address: String? = null,
    val lat: Double? = null,
    val lng: Double? = null,
    val phone: String? = null,
    val phone2: String? = null,
    val website: String? = null,
    val mapsUrl: String,
    /** Readable hours in this language, e.g. "Mon–Sat 08:30–19:00 · Sun 10:00–16:00". */
    val hours: String? = null,
    /** The same hours as OSM opening_hours, for "open now" ([Hours]). */
    val hoursSpec: String? = null,
    val services: List<String> = emptyList(),
    val google: Rating? = null,
    val menu: List<MenuSection> = emptyList(),
)

@Serializable
data class Rating(val rating: Double, val count: Int)

@Serializable
data class MenuSection(val title: String, val items: List<MenuItem>)

@Serializable
data class MenuItem(val name: String, val price: Double? = null)

/** The app's one HTTP client and JSON reader. */
val http: OkHttpClient = OkHttpClient.Builder().connectTimeout(10, TimeUnit.SECONDS).readTimeout(20, TimeUnit.SECONDS).build()
val json = Json { ignoreUnknownKeys = true }

/** Reads the directory from the site and keeps the last copy on disk, so the app opens offline. */
class DirectoryStore(private val dir: File, private val siteUrl: String = BuildConfig.SITE_URL) {

    private fun file(locale: String) = File(dir, "directory-$locale.json")

    fun cached(locale: String): Directory? =
        file(locale).takeIf { it.exists() }?.let { runCatching { json.decodeFromString<Directory>(it.readText()) }.getOrNull() }

    suspend fun fetch(locale: String): Directory = withContext(Dispatchers.IO) {
        http.newCall(Request.Builder().url("$siteUrl/$locale/directory.json").build()).execute().use { res ->
            check(res.isSuccessful) { "HTTP ${res.code}" }
            val text = res.body!!.string()
            json.decodeFromString<Directory>(text).also { file(locale).writeText(text) }
        }
    }
}

data class DirectoryState(val directory: Directory? = null, val refreshing: Boolean = false, val failed: Boolean = false)

class DirectoryViewModel(app: Application) : AndroidViewModel(app) {
    private val store = DirectoryStore(app.filesDir)
    private var locale: String? = null

    var state by mutableStateOf(DirectoryState())
        private set

    /** Shows the saved copy in this language ("en" or "am") at once, then refreshes it. */
    fun use(locale: String) {
        if (locale == this.locale) return
        this.locale = locale
        state = DirectoryState(directory = store.cached(locale))
        refresh()
    }

    fun refresh() {
        val locale = locale ?: return
        if (state.refreshing) return
        state = state.copy(refreshing = true)
        viewModelScope.launch {
            val result = runCatching { store.fetch(locale) }
            if (locale != this@DirectoryViewModel.locale) return@launch // language changed meanwhile
            state = result.fold({ state.copy(directory = it, failed = false) }, { state.copy(failed = true) }).copy(refreshing = false)
        }
    }
}
