package et.bulbula.directory

import et.bulbula.directory.Hours.Status
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class HoursTest {
    private val monday = 0
    private val sunday = 6
    private fun at(day: Int, h: Int, m: Int = 0) = day to h * 60 + m

    @Test fun `24-7 is always open`() =
        assertEquals(Status.Always, Hours.status(Hours.parse("24/7")!!, at(monday, 3)))

    @Test fun `open inside a range`() =
        assertEquals(Status.Open(19 * 60), Hours.status(Hours.parse("Mo-Sa 08:30-19:00; Su 10:00-16:00")!!, at(monday, 12)))

    @Test fun `closed before opening today`() =
        assertEquals(Status.Closed(monday, 8 * 60 + 30, today = true), Hours.status(Hours.parse("Mo-Sa 08:30-19:00")!!, at(monday, 7)))

    @Test fun `closed day points to the next opening`() =
        assertEquals(Status.Closed(monday, 8 * 60, today = false), Hours.status(Hours.parse("Mo-Sa 08:00-18:00; Su off")!!, at(sunday, 12)))

    @Test fun `range past midnight stays open after midnight`() =
        assertEquals(Status.Open(2 * 60), Hours.status(Hours.parse("Mo-Su 18:00-02:00")!!, at(monday, 1)))

    @Test fun `later rule replaces earlier days`() =
        assertEquals(Status.Closed(sunday, 10 * 60, today = true), Hours.status(Hours.parse("Mo-Su 08:00-20:00; Su 10:00-16:00")!!, at(sunday, 9)))

    @Test fun `free text is unknown`() = assertNull(Hours.parse("Mon–Sat 8am till late"))

    @Test fun `clock wraps past midnight`() = assertEquals("02:00", Hours.clock(26 * 60))
}
