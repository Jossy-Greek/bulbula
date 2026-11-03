package et.bulbula.directory

import android.app.Application
import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.core.content.edit
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

/**
 * The admin side: the site's existing Payload accounts sign in through Payload's REST API
 * (/api/users/login) and edit listings with their token. Payload's access rules decide what
 * an account may do; the app only offers the actions.
 */
@Serializable
data class AdminPlace(
    val id: Int,
    val name: String,
    val slug: String? = null,
    /** At depth=1 the full category; null when the request didn't populate it. */
    val category: Category? = null,
    val status: String,
    val unconfirmed: Boolean = false,
    val phone: String? = null,
    val phone2: String? = null,
    /** OSM opening hours ("Mo-Sa 08:00-18:00"); the app's [Hours] reads the same format. */
    val hours: String? = null,
    val landmark: String? = null,
    val lat: Double? = null,
    val lng: Double? = null,
    val submitter: Submitter? = null,
    /** The listing this submission claims: an id, or the listing itself at depth=1. */
    val claims: JsonElement? = null,
) {
    val pending get() = status == "pending"

    /** As the web dashboard: owner and manager submissions publish as claimed; tips and leads don't. */
    val byOwner get() = !submitter?.name.isNullOrBlank() && submitter?.relationship != "customer"

    val claimsId: Int?
        get() = when (val c = claims) {
            is JsonPrimitive -> c.intOrNull
            is JsonObject -> c["id"]?.jsonPrimitive?.intOrNull
            else -> null
        }
}

@Serializable
data class Submitter(val name: String? = null, val phone: String? = null, val relationship: String? = null)

@Serializable
private data class LoginResponse(val token: String, val exp: Long, val user: LoginUser)

@Serializable
private data class LoginUser(val email: String, val name: String? = null)

@Serializable
private data class RefreshResponse(val refreshedToken: String, val exp: Long)

@Serializable
private data class Page(val docs: List<AdminPlace>)

/** A visitor's review waiting for approval (the site's Reviews collection). */
@Serializable
data class PendingReview(val id: Int, val rating: Int, val author: String, val text: String? = null, val business: ReviewedPlace? = null)

@Serializable
data class ReviewedPlace(val name: String)

@Serializable
private data class ReviewPage(val docs: List<PendingReview>)

/** The site's analytics report (lib/analytics.ts Report), the parts the app shows. */
@Serializable
data class Report(
    val range: Int,
    val kpis: Kpis,
    val live: Int = 0,
    val days: List<Day> = emptyList(),
    val businesses: List<BusinessRow> = emptyList(),
    val searches: List<Count> = emptyList(),
    val emptySearches: List<Count> = emptyList(),
    val sources: List<Count> = emptyList(),
)

@Serializable
data class Kpis(val visitors: Kpi, val pageviews: Kpi, val leads: Kpi, val searches: Kpi)

/** This period and the one before it. */
@Serializable
data class Kpi(val value: Int, val previous: Int)

@Serializable
data class Day(val date: String, val visitors: Int, val pageviews: Int)

@Serializable
data class BusinessRow(val slug: String, val name: String, val views: Int, val calls: Int, val directions: Int, val maps: Int = 0, val other: Int = 0) {
    /** Calls, directions, maps and website or social clicks: people the place got. */
    val leads get() = calls + directions + maps + other
}

@Serializable
data class Count(val key: String, val count: Int)

/** Who is signed in. [exp] is Payload's token expiry, in seconds. */
data class Session(val email: String, val token: String, val exp: Long) {
    val expired get() = exp * 1000 <= System.currentTimeMillis()
}

class Unauthorized : Exception()

class AdminApi(private val siteUrl: String = BuildConfig.SITE_URL) {
    private val type = "application/json".toMediaType()

    private fun call(path: String, token: String? = null, method: String = "GET", body: JsonObject? = null): String {
        val req = Request.Builder().url("$siteUrl$path")
            .apply { if (token != null) header("Authorization", "JWT $token") }
            .method(method, body?.toString()?.toRequestBody(type) ?: if (method == "POST") "{}".toRequestBody(type) else null)
            .build()
        http.newCall(req).execute().use { res ->
            if (res.code == 401 || res.code == 403) throw Unauthorized()
            check(res.isSuccessful) { "HTTP ${res.code}" }
            return res.body!!.string()
        }
    }

    suspend fun signIn(email: String, password: String): Session = withContext(Dispatchers.IO) {
        val r = json.decodeFromString<LoginResponse>(call("/api/users/login", method = "POST", body = buildJsonObject { put("email", email); put("password", password) }))
        Session(r.user.email, r.token, r.exp)
    }

    suspend fun refresh(session: Session): Session = withContext(Dispatchers.IO) {
        val r = json.decodeFromString<RefreshResponse>(call("/api/users/refresh-token", session.token, method = "POST"))
        session.copy(token = r.refreshedToken, exp = r.exp)
    }

    /** Pending submissions and leads, then published places still "not yet confirmed". */
    suspend fun queue(session: Session): Pair<List<AdminPlace>, List<AdminPlace>> = withContext(Dispatchers.IO) {
        fun list(where: String) = json.decodeFromString<Page>(call("/api/businesses?$where&depth=1&locale=en&limit=1000&sort=name", session.token)).docs
        list("where[status][equals]=pending") to list("where[status][equals]=published&where[unconfirmed][equals]=true")
    }

    suspend fun reviews(session: Session): List<PendingReview> = withContext(Dispatchers.IO) {
        json.decodeFromString<ReviewPage>(call("/api/reviews?where[status][equals]=pending&depth=1&locale=en&limit=200&sort=-createdAt", session.token)).docs
    }

    /** "published" or "rejected", as the web dashboard's review buttons. */
    suspend fun moderate(session: Session, id: Int, status: String) = withContext(Dispatchers.IO) {
        call("/api/reviews/$id", session.token, method = "PATCH", body = buildJsonObject { put("status", status) })
    }

    /** [range]: 7, 30 or 90 days, as on /admin/analytics. */
    suspend fun report(session: Session, range: Int): Report = withContext(Dispatchers.IO) {
        json.decodeFromString<Report>(call("/api/analytics-events/report?range=$range", session.token))
    }

    suspend fun place(session: Session, id: Int): AdminPlace = withContext(Dispatchers.IO) {
        json.decodeFromString<AdminPlace>(call("/api/businesses/$id?depth=1&locale=en", session.token))
    }

    /** Text fields are written in English, the site's default; Amharic pages fall back to it. */
    suspend fun update(session: Session, id: Int, fields: JsonObject) = withContext(Dispatchers.IO) {
        call("/api/businesses/$id?locale=en", session.token, method = "PATCH", body = fields)
    }
}

data class AdminState(
    val session: Session? = null,
    val pending: List<AdminPlace> = emptyList(),
    val unconfirmed: List<AdminPlace> = emptyList(),
    val reviews: List<PendingReview> = emptyList(),
    val loading: Boolean = false,
    val failed: Boolean = false,
)

class AdminViewModel(app: Application) : AndroidViewModel(app) {
    private val prefs = app.getSharedPreferences("admin", Context.MODE_PRIVATE)
    private val api = AdminApi()

    var state by mutableStateOf(AdminState(session = load()?.takeUnless { it.expired }))
        private set

    /** The last email used, to fill the sign-in form. */
    val lastEmail: String get() = prefs.getString("email", "").orEmpty()

    private fun load(): Session? {
        val token = prefs.getString("token", null) ?: return null
        return Session(prefs.getString("email", "").orEmpty(), token, prefs.getLong("exp", 0))
    }

    private fun save(s: Session?) {
        prefs.edit {
            if (s == null) remove("token").remove("exp") else putString("email", s.email).putString("token", s.token).putLong("exp", s.exp)
        }
        state = if (s == null) AdminState() else state.copy(session = s)
    }

    suspend fun signIn(email: String, password: String): Boolean =
        runCatching { api.signIn(email.trim(), password) }.onSuccess { save(it); reload() }.isSuccess

    fun signOut() = save(null)

    /** Refreshes the token while it's still valid (Payload's last two hours by default), then the queue. */
    fun reload() {
        var s = state.session ?: return
        if (s.expired) return signOut()
        state = state.copy(loading = true)
        viewModelScope.launch {
            try {
                if (s.exp * 1000 - System.currentTimeMillis() < 60 * 60 * 1000) s = api.refresh(s).also { save(it) }
                val (p, u) = api.queue(s)
                val r = api.reviews(s)
                state = state.copy(pending = p, unconfirmed = u, reviews = r, loading = false, failed = false)
            } catch (_: Unauthorized) {
                signOut()
            } catch (_: Exception) {
                state = state.copy(loading = false, failed = true)
            }
        }
    }

    suspend fun place(id: Int): AdminPlace? = guard { api.place(it, id) }

    suspend fun report(range: Int): Report? = guard { api.report(it, range) }

    /** Publishes or rejects a visitor's review; it leaves the list at once. */
    suspend fun moderate(review: PendingReview, publish: Boolean): Boolean =
        (guard { api.moderate(it, review.id, if (publish) "published" else "rejected"); true } == true).also { ok ->
            if (ok) state = state.copy(reviews = state.reviews.filterNot { it.id == review.id })
        }

    /** Saves [fields]; for a pending place [decision] true publishes it (retiring the listing it claims), false rejects it. */
    suspend fun save(place: AdminPlace, fields: JsonObject, decision: Boolean? = null): Boolean = guard { s ->
        val body = buildJsonObject {
            fields.forEach { (k, v) -> put(k, v) }
            when (decision) {
                true -> {
                    put("status", "published")
                    if (place.pending) put("claimed", place.byOwner)
                }
                false -> put("status", "rejected")
                null -> {}
            }
        }
        api.update(s, place.id, body)
        if (decision == true) place.claimsId?.let { api.update(s, it, buildJsonObject { put("status", "rejected") }) }
        true
    }.also { if (it == true) reload() } == true

    private suspend fun <T> guard(block: suspend (Session) -> T): T? {
        val s = state.session?.takeUnless { it.expired } ?: return null.also { signOut() }
        return try {
            block(s)
        } catch (_: Unauthorized) {
            signOut()
            null
        } catch (_: Exception) {
            null
        }
    }
}

/** A place as JSON fields for [AdminViewModel.save]; blank text clears the field. */
fun placeFields(phone: String, phone2: String, hours: String, landmark: String, pin: Pair<Double, Double>?, confirm: Boolean): JsonObject = buildJsonObject {
    fun text(key: String, v: String) = put(key, v.trim().ifEmpty { null })
    text("phone", phone)
    text("phone2", phone2)
    text("hours", hours)
    text("landmark", landmark)
    if (pin != null) {
        put("lat", pin.first)
        put("lng", pin.second)
    }
    if (confirm) put("unconfirmed", false)
}

private fun kotlinx.serialization.json.JsonObjectBuilder.put(key: String, value: String?) =
    put(key, value?.let { JsonPrimitive(it) } ?: kotlinx.serialization.json.JsonNull)
