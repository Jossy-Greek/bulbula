package et.bulbula.directory

import android.os.Build
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import org.json.JSONObject
import java.io.IOException

/**
 * Usage counts for the admin's analytics, as the website's lib/track.ts sends them: the same
 * events to the same /e endpoint, tagged platform=android. No ids and nothing stored on the
 * phone; the server counts a visitor once a day from the address and the user agent below.
 * Fire and forget: analytics never slows or breaks the app.
 */
object Track {
    /** Off while an admin is signed in, as the website skips admins' browsers. */
    @Volatile var enabled = true

    // App version, Android version and model, so phones sharing one address still count apart.
    private val userAgent = "Bulbula-Android/${BuildConfig.VERSION_NAME} (Android ${Build.VERSION.RELEASE}; ${Build.MODEL})"
    private val json = "text/plain".toMediaType()

    fun view(locale: String, slug: String? = null) =
        send(locale, slug, JSONObject().put("type", "pageview"))

    /** call · directions · maps · website · share */
    fun action(locale: String, action: String, slug: String) =
        send(locale, slug, JSONObject().put("type", "action").put("action", action))

    fun search(locale: String, query: String, results: Int) =
        send(locale, null, JSONObject().put("type", "search").put("query", query).put("results", results))

    fun filter(locale: String, category: String) =
        send(locale, null, JSONObject().put("type", "filter").put("query", category))

    private fun send(locale: String, slug: String?, event: JSONObject) {
        if (!enabled) return
        // Paths as the website's, so the report's "pages" line up across platforms.
        event.put("platform", "android").put("locale", locale).put("path", if (slug != null) "/$locale/b/$slug" else "/$locale")
        if (slug != null) event.put("slug", slug)
        val request = Request.Builder()
            .url("${BuildConfig.SITE_URL}/e")
            .header("User-Agent", userAgent)
            .post(event.toString().toRequestBody(json))
            .build()
        runCatching {
            http.newCall(request).enqueue(object : Callback {
                override fun onFailure(call: Call, e: IOException) = Unit // offline: the count is simply lost
                override fun onResponse(call: Call, response: Response) = response.close()
            })
        }
    }
}
