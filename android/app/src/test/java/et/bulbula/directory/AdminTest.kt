package et.bulbula.directory

import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/** The admin side against a fake Payload: the same paths, headers and bodies the site's REST API takes. */
class AdminTest {
    private val server = MockWebServer().apply { start() }
    private val api = AdminApi(server.url("").toString().trimEnd('/'))
    private val session = Session("a@b.test", "tok", Long.MAX_VALUE / 1000)

    @After fun stop() = server.shutdown()

    @Test fun `signs in through Payload's login`() = runBlocking {
        server.enqueue(MockResponse().setBody("""{"token":"t1","exp":2000000000,"user":{"email":"a@b.test","role":"admin"}}"""))
        val s = api.signIn("a@b.test", "pw")
        assertEquals("t1", s.token)
        val req = server.takeRequest()
        assertEquals("/api/users/login", req.path)
        assertTrue(req.body.readUtf8().contains("\"password\":\"pw\""))
    }

    @Test(expected = Unauthorized::class)
    fun `wrong password is Unauthorized`(): Unit = runBlocking {
        server.enqueue(MockResponse().setResponseCode(401))
        api.signIn("a@b.test", "nope")
    }

    @Test fun `edits are PATCHes in English with the token`() = runBlocking {
        server.enqueue(MockResponse().setBody("{}"))
        api.update(session, 7, placeFields("0911 000 000", "", "Mo-Sa 08:00-18:00", "", pin = 8.95 to 38.78, confirm = true))
        val req = server.takeRequest()
        assertEquals("PATCH", req.method)
        assertEquals("/api/businesses/7?locale=en", req.path)
        assertEquals("JWT tok", req.getHeader("Authorization"))
        val body = json.parseToJsonElement(req.body.readUtf8()) as kotlinx.serialization.json.JsonObject
        assertEquals(JsonNull, body["phone2"]) // blank clears
        assertEquals("false", body["unconfirmed"]!!.jsonPrimitive.content)
        assertEquals("8.95", body["lat"]!!.jsonPrimitive.content)
    }

    @Test fun `queue reads pending and unconfirmed`() = runBlocking {
        val doc = """{"id":1,"name":"Selam Juice","status":"pending","category":{"slug":"cafes","name":"Cafés","icon":"coffee","group":"business"},"submitter":{"name":"Selam","relationship":"owner"},"claims":{"id":9}}"""
        server.enqueue(MockResponse().setBody("""{"docs":[$doc]}"""))
        server.enqueue(MockResponse().setBody("""{"docs":[]}"""))
        val (pending, unconfirmed) = api.queue(session)
        assertEquals(1, pending.size)
        assertTrue(unconfirmed.isEmpty())
        assertTrue(pending[0].byOwner)
        assertEquals(9, pending[0].claimsId)
        assertTrue(server.takeRequest().path!!.contains("where[status][equals]=pending"))
    }

    @Test fun `customers' tips and leads don't publish as claimed`() {
        val tip = AdminPlace(1, "X", status = "pending", submitter = Submitter("Abebe", relationship = "customer"))
        val lead = AdminPlace(2, "Y", status = "pending")
        assertFalse(tip.byOwner)
        assertFalse(lead.byOwner)
    }

    @Test fun `reads the site's analytics report`() = runBlocking {
        // The shape of lib/analytics.ts Report, including fields the app doesn't show.
        server.enqueue(MockResponse().setBody("""{"range":7,"kpis":{"visitors":{"value":120,"previous":100},"pageviews":{"value":300,"previous":0},"leads":{"value":9,"previous":12},"searches":{"value":40,"previous":40}},"live":2,"days":[{"date":"2026-11-01","visitors":20,"pageviews":50}],"businesses":[{"slug":"lomi","name":"Lomi","views":30,"calls":3,"directions":2,"maps":1,"other":0}],"pages":[],"sources":[{"key":"google","count":9}],"devices":[],"locales":[],"searches":[{"key":"bank","count":4}],"emptySearches":[],"filters":[],"actions":[],"total":420}"""))
        val r = api.report(session, 7)
        assertEquals(120, r.kpis.visitors.value)
        assertEquals(6, r.businesses.single().leads)
        assertEquals("/api/analytics-events/report?range=7", server.takeRequest().path)
    }

    @Test fun `reviews are read pending and moderated with PATCH`() = runBlocking {
        server.enqueue(MockResponse().setBody("""{"docs":[{"id":5,"rating":4,"author":"Hana","text":"Good coffee","business":{"id":1,"name":"Lomi"}}]}"""))
        server.enqueue(MockResponse().setBody("{}"))
        assertEquals("Lomi", api.reviews(session).single().business?.name)
        api.moderate(session, 5, "published")
        assertTrue(server.takeRequest().path!!.startsWith("/api/reviews?where[status][equals]=pending"))
        val patch = server.takeRequest()
        assertEquals("PATCH", patch.method)
        assertEquals("/api/reviews/5", patch.path)
        assertTrue(patch.body.readUtf8().contains("\"status\":\"published\""))
    }
}
