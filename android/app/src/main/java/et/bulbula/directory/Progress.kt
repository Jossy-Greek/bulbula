package et.bulbula.directory

import android.content.Context
import androidx.annotation.DrawableRes
import androidx.annotation.StringRes
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.core.content.edit
import org.json.JSONArray
import org.json.JSONObject
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.ZoneId

/** Why someone opened the app, from the welcome screens. */
enum class Why { Neighbour, Newcomer, Owner, Explorer }

/** A level: [from] XP up to (not including) [to]; the last level has no [to]. */
class Level(val number: Int, val from: Int, val to: Int?, @StringRes val title: Int)

private val LEVELS = listOf(
    0 to R.string.level_1,
    40 to R.string.level_2,
    100 to R.string.level_3,
    200 to R.string.level_4,
    350 to R.string.level_5,
    600 to R.string.level_6,
    1000 to R.string.level_7,
)

fun levelFor(xp: Int): Level {
    val i = LEVELS.indexOfLast { xp >= it.first }.coerceAtLeast(0)
    return Level(i + 1, LEVELS[i].first, LEVELS.getOrNull(i + 1)?.first, LEVELS[i].second)
}

enum class Badge(@DrawableRes val icon: Int, val color: Long, @StringRes val title: Int, @StringRes val description: Int) {
    Hello(R.drawable.ic_hand_heart, 0xFF1F7A85, R.string.badge_hello, R.string.badge_hello_d),
    Curious(R.drawable.ic_search, 0xFF3D8BD9, R.string.badge_curious, R.string.badge_curious_d),
    Explorer(R.drawable.ic_compass, 0xFF7B5CD6, R.string.badge_explorer, R.string.badge_explorer_d),
    Connector(R.drawable.ic_call, 0xFF1F9D57, R.string.badge_connector, R.string.badge_connector_d),
    OnFire(R.drawable.ic_flame, 0xFFF0642D, R.string.badge_on_fire, R.string.badge_on_fire_d),
    Week(R.drawable.ic_zap, 0xFFE0A100, R.string.badge_week, R.string.badge_week_d),
    Critic(R.drawable.ic_star, 0xFFE8456B, R.string.badge_critic, R.string.badge_critic_d),
    Builder(R.drawable.ic_store, 0xFF9A5B13, R.string.badge_builder, R.string.badge_builder_d),
}

/** Points for a published review or place, from the site (app/m/player). */
class Approval(val id: String, val kind: String, val xp: Int, val place: String?)

/** Points just earned, shown by [Celebrations]; [levelUp] and [badges] get their own moment. */
class Reward(val xp: Int, @StringRes val reason: Int, val big: Boolean, val levelUp: Level?, val badges: List<Badge>) {
    val id = next++

    private companion object { var next = 0 }
}

/** Different places to open in a week for the weekly goal. */
const val WEEKLY_GOAL = 3

/** Points for each thing, as Profile lists them. */
object Xp {
    const val ADDED = 50
    const val REVIEW = 30
    const val GOAL = 20
    const val WEEKLY = 5
    const val REACHED = 3
    const val NEW_PLACE = 2
}

/**
 * The player's progress, kept on this phone, and saved to the site too when they sign in
 * with Google (Profile, or the welcome screen on a new phone). Points reward
 * using Bulbula (opening places, calling them, coming back) and adding to it (reviews and new
 * places, which an admin still checks before they show).
 *
 * The streak and the goal count weeks, not days: people open a directory when they need a
 * place, not every day, and missing a day shouldn't feel like losing something.
 */
class Progress(context: Context) {
    private val prefs = context.applicationContext.getSharedPreferences("progress", Context.MODE_PRIVATE)
    /** This week's Monday in Addis Ababa, e.g. "2026-11-02": the key for streak and goal. */
    private fun thisWeek() = LocalDate.now(ZoneId.of("Africa/Addis_Ababa")).with(DayOfWeek.MONDAY).toString()

    var onboarded by mutableStateOf(prefs.getBoolean("onboarded", false)); private set
    var name by mutableStateOf(prefs.getString("name", "").orEmpty()); private set
    var why by mutableStateOf(prefs.getString("why", null)?.let { runCatching { Why.valueOf(it) }.getOrNull() }); private set
    var xp by mutableIntStateOf(prefs.getInt("xp", 0)); private set
    var streak by mutableIntStateOf(prefs.getInt("streak", 0)); private set
    var opened by mutableStateOf(prefs.getStringSet("opened", null).orEmpty().toSet()); private set
    var acted by mutableStateOf(prefs.getStringSet("acted", null).orEmpty().toSet()); private set
    var reviews by mutableIntStateOf(prefs.getInt("reviews", 0)); private set
    var added by mutableIntStateOf(prefs.getInt("added", 0)); private set
    var badges by mutableStateOf(prefs.getStringSet("badges", null).orEmpty().mapNotNull { runCatching { Badge.valueOf(it) }.getOrNull() }.toSet()); private set
    private var week = prefs.getString("week", null)
    /** Different places opened this week, for the weekly goal. */
    var weekOpened by mutableStateOf(if (week == thisWeek()) prefs.getStringSet("weekOpened", null).orEmpty().toSet() else emptySet()); private set
    private var lastWeek = prefs.getString("lastWeek", null)
    private var goalWeek by mutableStateOf(prefs.getString("goalWeek", null))
    val goalDone get() = goalWeek == thisWeek()
    val level get() = levelFor(xp)

    /** When signed in: the key the site gave this player, sent with every sync (never shown). */
    var cloudCode by mutableStateOf(prefs.getString("cloudCode", null)); private set
    val cloud get() = cloudCode != null
    /**
     * The Google account the backup is linked to: its email when signed in on this phone,
     * "" when linked elsewhere (known from a sync), null when not linked.
     */
    var google by mutableStateOf(prefs.getString("google", null)); private set
    /** Approval points already added, and the ones the site still needs to hear about. */
    private var applied = prefs.getStringSet("applied", null).orEmpty().toSet()
    var toAck = prefs.getStringSet("toAck", null).orEmpty().toSet(); private set

    /** Waiting to be shown, oldest first. */
    val rewards = mutableStateListOf<Reward>()

    private fun save() = prefs.edit {
        putBoolean("onboarded", onboarded)
        putString("name", name)
        putString("why", why?.name)
        putInt("xp", xp)
        putInt("streak", streak)
        putStringSet("opened", opened)
        putStringSet("acted", acted)
        putInt("reviews", reviews)
        putInt("added", added)
        putStringSet("badges", badges.map { it.name }.toSet())
        putString("week", week)
        putStringSet("weekOpened", weekOpened)
        putString("lastWeek", lastWeek)
        putString("goalWeek", goalWeek)
        putString("cloudCode", cloudCode)
        putString("google", google)
        putStringSet("applied", applied)
        putStringSet("toAck", toAck)
    }

    /** Everything that is saved to the account, as the site stores it. */
    fun export(): JSONObject = JSONObject()
        .put("version", 1)
        .put("name", name)
        .put("why", why?.name)
        .put("xp", xp)
        .put("streak", streak)
        .put("opened", JSONArray(opened.toList()))
        .put("acted", JSONArray(acted.toList()))
        .put("reviews", reviews)
        .put("added", added)
        .put("badges", JSONArray(badges.map { it.name }))
        .put("week", week)
        .put("weekOpened", JSONArray(weekOpened.toList()))
        .put("lastWeek", lastWeek)
        .put("goalWeek", goalWeek)
        .put("applied", JSONArray(applied.toList()))

    private fun JSONObject.strings(key: String): Set<String> =
        optJSONArray(key)?.let { a -> (0 until a.length()).mapNotNull { a.optString(it).takeIf(String::isNotEmpty) }.toSet() }.orEmpty()

    private fun JSONObject.text(key: String): String? = if (isNull(key)) null else optString(key).takeIf { it.isNotEmpty() }

    /** Signing in to an account with saved progress: it replaces what's here, and saving continues with [code]. */
    fun restore(code: String, name: String, saved: JSONObject?) {
        val p = saved ?: JSONObject()
        this.name = (p.text("name") ?: name).take(40)
        why = p.text("why")?.let { runCatching { Why.valueOf(it) }.getOrNull() }
        xp = p.optInt("xp", 0)
        streak = p.optInt("streak", 0)
        opened = p.strings("opened")
        acted = p.strings("acted")
        reviews = p.optInt("reviews", 0)
        added = p.optInt("added", 0)
        badges = p.strings("badges").mapNotNull { runCatching { Badge.valueOf(it) }.getOrNull() }.toSet() + Badge.Hello
        week = p.text("week")
        weekOpened = if (week == thisWeek()) p.strings("weekOpened") else emptySet()
        lastWeek = p.text("lastWeek")
        goalWeek = p.text("goalWeek")
        applied = p.strings("applied")
        toAck = emptySet()
        onboarded = true
        cloudCode = code
        prefs.edit { putBoolean("welcomed", true) }
        save()
    }

    fun signedIn(code: String, email: String) {
        cloudCode = code
        google = email
        save()
    }

    /** Linked to Google: [email] on this phone, or "" when only the site says it's linked. */
    fun linkedGoogle(email: String) {
        if (email.isEmpty() && google != null) return
        google = email
        save()
    }

    /** Signed out (or the site no longer knows this player): progress stays on the phone. */
    fun signOut() {
        cloudCode = null
        google = null
        toAck = emptySet()
        save()
    }

    /**
     * Points for reviews and places an admin has published, from a sync. Each counts once;
     * all of them go back to the site in [toAck] so it stops sending them.
     */
    fun approved(awards: List<Approval>) {
        for (a in awards) {
            toAck = toAck + a.id
            if (a.id in applied) continue
            applied = (applied + a.id).toList().takeLast(500).toSet()
            if (a.kind == "place") {
                added += 1
                award(a.xp, R.string.xp_place_approved, big = true)
            } else {
                reviews += 1
                award(a.xp, R.string.xp_review_approved, big = true)
            }
        }
        save()
    }

    /** The site has heard about these. */
    fun acked(ids: Set<String>) {
        toAck = toAck - ids
        save()
    }

    private fun earned(badge: Badge) = when (badge) {
        Badge.Hello -> onboarded
        Badge.Curious -> opened.size >= 5
        Badge.Explorer -> opened.size >= 20
        Badge.Connector -> acted.size >= 5
        Badge.OnFire -> streak >= 3
        Badge.Week -> streak >= 8
        Badge.Critic -> reviews >= 1
        Badge.Builder -> added >= 1
    }

    private fun award(points: Int, @StringRes reason: Int, big: Boolean = false, show: Boolean = true) {
        val before = levelFor(xp)
        xp += points
        val after = levelFor(xp)
        val new = Badge.entries.filter { it !in badges && earned(it) }
        badges = badges + new
        save()
        if (show) rewards += Reward(points, reason, big, after.takeIf { it.number > before.number }, new)
    }

    /** The end of the welcome screens. The welcome screen shows its own +10, so no toast. */
    fun welcome(name: String, why: Why?) {
        this.name = name.trim().take(40)
        this.why = why
        val first = !prefs.getBoolean("welcomed", false)
        onboarded = true
        if (lastWeek == null) { lastWeek = thisWeek(); streak = 1 }
        prefs.edit { putBoolean("welcomed", true) }
        if (first) award(10, R.string.xp_welcome, show = false) else save()
    }

    /** Shows the welcome screens again (from Profile); points and badges stay. */
    fun replayWelcome() {
        onboarded = false
        save()
    }

    fun rename(name: String) {
        this.name = name.trim().take(40)
        save()
    }

    /** The first time each week: keeps the streak going (or starts it again) and gives the weekly points. */
    fun appOpened() {
        val week = thisWeek()
        if (lastWeek == week) return
        val previous = LocalDate.parse(week).minusWeeks(1).toString()
        streak = if (lastWeek == previous) streak + 1 else 1
        lastWeek = week
        award(Xp.WEEKLY, R.string.xp_weekly)
    }

    fun placeOpened(slug: String) {
        val now = thisWeek()
        if (week != now) { week = now; weekOpened = emptySet() }
        weekOpened = weekOpened + slug
        if (slug !in opened) {
            opened = opened + slug
            award(Xp.NEW_PLACE, R.string.xp_new_place)
        } else {
            save()
        }
        if (weekOpened.size >= WEEKLY_GOAL && goalWeek != now) {
            goalWeek = now
            award(Xp.GOAL, R.string.xp_goal, big = true)
        }
    }

    /** Called or asked for directions: the first time for each place. */
    fun reached(slug: String) {
        if (slug in acted) return
        acted = acted + slug
        award(Xp.REACHED, R.string.xp_reached)
    }

    /**
     * A review was sent. Not signed in, the points come now; signed in, they come
     * when an admin publishes it ([approved]), so they can be trusted. Returns whether they came now.
     */
    fun reviewed(): Boolean {
        if (cloud) return false
        reviews += 1
        award(Xp.REVIEW, R.string.xp_review, big = true)
        return true
    }

    /** A place was sent; see [reviewed]. */
    fun addedPlace(): Boolean {
        if (cloud) return false
        added += 1
        award(Xp.ADDED, R.string.xp_added, big = true)
        return true
    }

    fun shown(reward: Reward) {
        rewards.removeAll { it.id == reward.id }
    }
}

val LocalProgress = staticCompositionLocalOf<Progress> { error("No Progress") }
