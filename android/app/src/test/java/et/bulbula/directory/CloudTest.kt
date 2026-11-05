package et.bulbula.directory

import kotlinx.coroutines.runBlocking
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** Saving progress for signed-in players, against a fake site: what is sent, and what replies become. */
class CloudTest {
    @Test fun calls() = runBlocking {
        val server = MockWebServer().apply { start() }
        val cloud = Cloud(server.url("").toString().trimEnd('/'))
        server.enqueue(MockResponse().setBody("""{"ok":true,"existing":true,"code":"BUL-CCCCC-DDDDD","name":"Abebe","progress":{"xp":131}}"""))
        server.enqueue(MockResponse().setResponseCode(404).setBody("""{"ok":false,"error":"unknown"}"""))
        server.enqueue(MockResponse().setBody("""{"ok":true,"awards":[{"id":"review-7","kind":"review","xp":30,"place":"Aberus Bakery"},{"id":"place-9","kind":"place","xp":50}]}"""))

        val google = cloud.google("id-token", "A", JSONObject().put("xp", 5), code = null, restoreOnly = true)
        assertEquals(true, google.reply?.optBoolean("existing"))
        assertEquals(131, google.reply?.optJSONObject("progress")?.optInt("xp"))
        val asked = JSONObject(server.takeRequest().body.readUtf8())
        assertEquals("google", asked.getString("action"))
        assertEquals("id-token", asked.getString("idToken"))
        assertEquals(true, asked.getBoolean("restoreOnly"))
        assertEquals(5, asked.getJSONObject("progress").getInt("xp"))

        val gone = cloud.sync("BUL-XXXXX-XXXXX", "A", JSONObject(), emptySet())
        assertNull(gone.reply)
        assertEquals("unknown", gone.error)
        server.takeRequest()

        val synced = cloud.sync("BUL-AAAAA-BBBBB", "Abebe", JSONObject(), setOf("review-1"))
        val awards = approvals(synced.reply)
        assertEquals(listOf("review-7", "place-9"), awards.map { it.id })
        assertEquals("Aberus Bakery", awards[0].place)
        assertNull(awards[1].place)
        assertEquals(50, awards[1].xp)
        assertTrue(server.takeRequest().body.readUtf8().contains("\"ack\":[\"review-1\"]"))

        server.shutdown()
        assertEquals("offline", cloud.delete("BUL-AAAAA-BBBBB").error)
    }
}
