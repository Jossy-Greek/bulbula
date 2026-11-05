package et.bulbula.directory

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

/** What the site answered: the reply, or an error ("unknown", "limit", "failed", "offline"). */
class Answer(val reply: JSONObject?, val error: String?)

/**
 * Progress saved to the site (app/m/player) for players signed in with Google. The site
 * gives each player a key the app keeps and sends with every sync; it stores only a hash.
 */
class Cloud(private val siteUrl: String = BuildConfig.SITE_URL) {

    private suspend fun call(body: JSONObject): Answer = withContext(Dispatchers.IO) {
        runCatching {
            val request = Request.Builder().url("$siteUrl/m/player").post(body.toString().toRequestBody("application/json".toMediaType())).build()
            http.newCall(request).execute().use { res ->
                val reply = runCatching { JSONObject(res.body!!.string()) }.getOrNull()
                when {
                    reply?.optBoolean("ok") == true -> Answer(reply, null)
                    else -> Answer(null, reply?.optString("error")?.takeIf { it.isNotEmpty() } ?: "failed")
                }
            }
        }.getOrElse { Answer(null, "offline") }
    }

    /** Saves progress and collects points for published reviews and places. */
    suspend fun sync(code: String, name: String, progress: JSONObject, ack: Set<String>) =
        call(JSONObject().put("action", "sync").put("code", code).put("name", name).put("progress", progress).put("ack", org.json.JSONArray(ack.toList())))

    /**
     * Google sign-in: the reply's "existing" says the account already has a backup ("code",
     * "name", "progress"); otherwise it's now linked to [code] or a new backup ("code").
     * With [restoreOnly], no new backup is made (error "none").
     */
    suspend fun google(idToken: String, name: String, progress: JSONObject, code: String?, restoreOnly: Boolean = false) =
        call(
            JSONObject().put("action", "google").put("idToken", idToken).put("name", name).put("progress", progress)
                .put("code", code).put("restoreOnly", restoreOnly),
        )

    suspend fun delete(code: String) = call(JSONObject().put("action", "delete").put("code", code))
}

/** The points in a sync reply. */
fun approvals(reply: JSONObject?): List<Approval> {
    val list = reply?.optJSONArray("awards") ?: return emptyList()
    return (0 until list.length()).mapNotNull { i ->
        val a = list.optJSONObject(i) ?: return@mapNotNull null
        val id = a.optString("id").takeIf { it.isNotEmpty() } ?: return@mapNotNull null
        Approval(id, a.optString("kind", "review"), a.optInt("xp", 0), a.optString("place").takeIf { it.isNotEmpty() })
    }
}

/** One sync: send progress and the acknowledged points, add any new ones. Turns backup off if the code is gone. */
suspend fun Progress.syncWith(cloud: Cloud) {
    val code = cloudCode ?: return
    val sentAck = toAck
    val answer = cloud.sync(code, name, export(), sentAck)
    when {
        answer.reply != null -> {
            if (answer.reply.optBoolean("google")) linkedGoogle("")
            acked(sentAck)
            approved(approvals(answer.reply))
        }
        answer.error == "unknown" -> signOut()
    }
}
