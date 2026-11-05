package et.bulbula.directory

import kotlinx.coroutines.runBlocking
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** Levels, distances, and what the app makes of the site's replies to reviews and new places. */
class ProgressTest {
    @Test fun levels() {
        assertEquals(1, levelFor(0).number)
        assertEquals(1, levelFor(39).number)
        assertEquals(2, levelFor(40).number)
        assertEquals(100, levelFor(40).to)
        assertEquals(7, levelFor(5000).number)
        assertNull(levelFor(5000).to)
    }

    @Test fun distance() {
        val place = Place(id = 1, slug = "x", name = "X", category = Category("c", "C"), mapsUrl = "", lat = 8.9585, lng = 38.7920)
        // 0.0035° of latitude is about 389 m.
        val m = distanceTo(8.955 to 38.792, place)!!
        assertTrue("$m", m in 380.0..400.0)
        assertNull(distanceTo(8.955 to 38.792, place.copy(lat = null)))
    }

    @Test fun replies() = runBlocking {
        val server = MockWebServer().apply { start() }
        val site = server.url("").toString().trimEnd('/')
        server.enqueue(MockResponse().setBody("""{"ok":true}"""))
        server.enqueue(MockResponse().setBody("""{"ok":false,"error":"links"}"""))
        server.enqueue(MockResponse().setResponseCode(500))
        assertNull(send("/m/review", JSONObject().put("rating", 5), site))
        assertEquals("/m/review", server.takeRequest().path)
        assertEquals("links", send("/m/review", JSONObject(), site))
        assertEquals("failed", send("/m/place", JSONObject(), site))
        server.shutdown()
        assertEquals("offline", send("/m/place", JSONObject(), site))
    }
}
