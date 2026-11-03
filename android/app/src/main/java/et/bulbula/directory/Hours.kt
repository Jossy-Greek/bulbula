package et.bulbula.directory

import java.time.ZoneId
import java.time.ZonedDateTime

/**
 * "Open now" for OpenStreetMap-style opening hours, in Addis Ababa time.
 * A port of the website's lib/hours.ts; keep the two in step.
 *
 * Understands "24/7" and rules separated by ";", each "<days> <ranges>" or "<days> off",
 * e.g. "Mo-Fr 08:00-18:00; Sa 08:00-12:00,14:00-17:00; Su off". Anything else is unknown (null).
 */
object Hours {
    /** Minutes from midnight; [end] may pass 1440 for ranges that run past midnight. */
    data class Range(val start: Int, val end: Int)

    /** Seven days, index 0 = Monday. */
    typealias Week = List<List<Range>>

    sealed interface Status {
        data object Always : Status
        data class Open(val closesAt: Int) : Status
        data class Closed(val opensDay: Int, val opensAt: Int, val today: Boolean) : Status
        data object ClosedAllWeek : Status
    }

    private val DAYS = listOf("Mo", "Tu", "We", "Th", "Fr", "Sa", "Su")
    private val RULE = Regex("""^((?:(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?,?)+)?\s*(.*)$""")
    private val RANGE = Regex("""^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$""")

    fun parse(spec: String?): Week? {
        val s = spec?.trim().orEmpty()
        if (s.isEmpty()) return null
        if (s == "24/7") return List(7) { listOf(Range(0, 1440)) }
        val week = MutableList(7) { emptyList<Range>() }
        for (rule in s.split(";").map { it.trim() }.filter { it.isNotEmpty() }) {
            val m = RULE.matchEntire(rule) ?: return null
            val days = m.groupValues[1].takeIf { it.isNotEmpty() }?.let { expandDays(it) ?: return null } ?: (0..6).toList()
            val body = m.groupValues[2].trim()
            val ranges = if (body == "off" || body == "closed") {
                emptyList()
            } else {
                body.split(",").map { part ->
                    val r = RANGE.matchEntire(part.trim()) ?: return null
                    val a = r.groupValues[1].toInt() * 60 + r.groupValues[2].toInt()
                    var b = r.groupValues[3].toInt() * 60 + r.groupValues[4].toInt()
                    if (b <= a) b += 1440
                    Range(a, b)
                }.sortedBy { it.start }
            }
            for (d in days) week[d] = ranges
        }
        return week
    }

    private fun expandDays(list: String): List<Int>? {
        val out = linkedSetOf<Int>()
        for (part in list.split(",").filter { it.isNotEmpty() }) {
            val ends = part.split("-")
            val i = DAYS.indexOf(ends[0])
            val j = if (ends.size > 1) DAYS.indexOf(ends[1]) else i
            if (i < 0 || j < 0) return null
            var k = i
            while (true) {
                out += k
                if (k == j) break
                k = (k + 1) % 7
            }
        }
        return out.toList()
    }

    /** Day of week (0 = Monday) and minutes since midnight, in Addis Ababa. */
    fun addisNow(now: ZonedDateTime = ZonedDateTime.now(ZoneId.of("Africa/Addis_Ababa"))): Pair<Int, Int> =
        (now.dayOfWeek.value - 1) to (now.hour * 60 + now.minute)

    fun status(week: Week, now: Pair<Int, Int> = addisNow()): Status {
        if (week.all { it.size == 1 && it[0].start == 0 && it[0].end >= 1440 }) return Status.Always
        val (day, minutes) = now
        // A range from yesterday that runs past midnight.
        for (r in week[(day + 6) % 7]) if (r.end > 1440 && minutes < r.end - 1440) return Status.Open(r.end - 1440)
        for (r in week[day]) if (minutes >= r.start && minutes < r.end) return Status.Open(r.end)
        for (k in 0 until 7) {
            val d = (day + k) % 7
            val next = week[d].firstOrNull { k > 0 || it.start > minutes }
            if (next != null) return Status.Closed(d, next.start, today = k == 0)
        }
        return Status.ClosedAllWeek
    }

    fun clock(minutes: Int): String {
        val m = ((minutes % 1440) + 1440) % 1440
        return "%02d:%02d".format(m / 60, m % 60)
    }
}
