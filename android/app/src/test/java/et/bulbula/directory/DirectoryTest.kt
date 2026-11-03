package et.bulbula.directory

import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/** directory-sample.json is a trimmed copy of the site's /en/directory.json: if the site's shape changes, this fails first. */
class DirectoryTest {
    private val directory = Json { ignoreUnknownKeys = true }
        .decodeFromString<Directory>(javaClass.getResource("/directory-sample.json")!!.readText())

    @Test fun `site json decodes`() {
        assertEquals(3, directory.listings.size)
        assertTrue(directory.services.containsKey("toilet"))
        assertTrue(directory.listings.all { it.mapsUrl.startsWith("https://") })
    }

    @Test fun `search matches names, categories and landmarks`() {
        assertEquals("Prodent Speciality Dental Clinic", directory.listings.matching("prodent", null).single().name)
        assertTrue(directory.listings.matching("bulbula mariam", null).any { it.name.startsWith("Prodent") })
        assertTrue(directory.listings.matching("", "clinics").all { it.category.slug == "clinics" })
    }

    @Test fun `phones dial with the country code`() {
        assertEquals("tel:+251956464748", telUri("0956 464 748"))
        assertEquals("tel:+251935017555", telUri("+251 93 501 7555"))
    }
}
