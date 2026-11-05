package et.bulbula.directory

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

/**
 * What the site said about a review or a new place: null when sent, otherwise the website's
 * error code ("rating", "name", "links", "already", "required", "contact", "consent",
 * "failed"), or "offline" when the site couldn't be reached.
 */
suspend fun send(path: String, body: JSONObject, siteUrl: String = BuildConfig.SITE_URL): String? = withContext(Dispatchers.IO) {
    runCatching {
        val request = Request.Builder().url("$siteUrl$path").post(body.toString().toRequestBody("application/json".toMediaType())).build()
        http.newCall(request).execute().use { res ->
            if (!res.isSuccessful) return@use "failed"
            val reply = JSONObject(res.body!!.string())
            if (reply.optBoolean("ok")) null else reply.optString("error", "failed")
        }
    }.getOrElse { "offline" }
}

/** A review from the place screen (app/m/review on the site). [drawn] is when the form opened. */
suspend fun sendReview(slug: String, rating: Int, author: String, text: String, locale: String, drawn: Long): String? =
    send("/m/review", JSONObject().put("slug", slug).put("rating", rating).put("author", author).put("text", text).put("locale", locale).put("t", drawn))

/** A new place (app/m/place on the site); it waits for an admin like the website's form. */
class NewPlace(
    val name: String,
    val category: String,
    val phone: String,
    val landmark: String,
    val hours: String,
    val description: String,
    val yourName: String,
    val yourPhone: String,
    val relationship: String,
)

suspend fun sendPlace(p: NewPlace): String? =
    send(
        "/m/place",
        JSONObject()
            .put("nameEn", p.name).put("category", p.category).put("phone", p.phone).put("landmark", p.landmark)
            .put("hours", p.hours).put("descriptionEn", p.description).put("yourName", p.yourName).put("yourPhone", p.yourPhone)
            .put("relationship", p.relationship).put("consent", true),
    )
