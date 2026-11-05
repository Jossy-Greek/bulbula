package et.bulbula.directory

import android.content.Intent
import androidx.annotation.DrawableRes
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringArrayResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.net.toUri
import java.text.NumberFormat
import java.util.Locale

/** One place: what it is, whether it's open, and the ways to reach it. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun PlaceScreen(place: Place, serviceLabels: Map<String, String>, now: Pair<Int, Int>, onBack: () -> Unit, onEdit: (() -> Unit)? = null) {
    val context = LocalContext.current
    val colors = MaterialTheme.colorScheme
    val locale = if (LocalConfiguration.current.locales[0].language == "am") "am" else "en"
    val open = { uri: String -> context.startActivity(Intent(Intent.ACTION_VIEW, uri.toUri())) }
    // Each way of reaching the place is counted for the admin's analytics (Track.kt).
    val progress = LocalProgress.current
    val dial = { phone: String ->
        Track.action(locale, "call", place.slug)
        progress.reached(place.slug)
        context.startActivity(Intent(Intent.ACTION_DIAL, telUri(phone).toUri()))
    }
    val share = {
        Track.action(locale, "share", place.slug)
        val text = "${place.name}\n${BuildConfig.SITE_URL}/$locale/b/${place.slug}"
        context.startActivity(Intent.createChooser(Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text), null))
    }
    val status = openLine(place.hoursSpec, now, short = false)
    val always = Hours.parse(place.hoursSpec)?.let { Hours.status(it, now) } == Hours.Status.Always
    val location = listOfNotNull(place.landmark, place.address).distinct().joinToString(", ").takeIf { it.isNotEmpty() }

    Column(Modifier.fillMaxSize().background(colors.background).verticalScroll(rememberScrollState()).statusBarsPadding().navigationBarsPadding().padding(bottom = 32.dp)) {
        Row(Modifier.fillMaxWidth().padding(horizontal = 4.dp, vertical = 4.dp)) {
            IconButton(onClick = onBack) { Icon(painterResource(R.drawable.ic_back), contentDescription = stringResource(R.string.back)) }
            Spacer(Modifier.weight(1f))
            if (onEdit != null) IconButton(onClick = onEdit) { Icon(painterResource(R.drawable.ic_edit), contentDescription = stringResource(R.string.edit), modifier = Modifier.size(20.dp)) }
            IconButton(onClick = share) { Icon(painterResource(R.drawable.ic_share), contentDescription = stringResource(R.string.share), modifier = Modifier.size(20.dp)) }
        }

        Column(Modifier.padding(horizontal = 20.dp)) {
            IconTile(place.category, size = 56.dp)
            Spacer(Modifier.height(14.dp))
            Text(place.name, style = MaterialTheme.typography.headlineMedium)
            Spacer(Modifier.height(4.dp))
            Muted(place.category.name)
            if (status != null) {
                Spacer(Modifier.height(12.dp))
                StatusPill(status)
            }
        }

        Spacer(Modifier.height(24.dp))
        Row(Modifier.fillMaxWidth().padding(horizontal = 20.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            place.phone?.let { Action(R.drawable.ic_call, stringResource(R.string.call), primary = true, Modifier.weight(1f)) { dial(it) } }
            Action(R.drawable.ic_directions, stringResource(R.string.directions), primary = place.phone == null, Modifier.weight(1f)) { Track.action(locale, "directions", place.slug); progress.reached(place.slug); open(directionsUri(place)) }
            place.website?.let { Action(R.drawable.ic_web, stringResource(R.string.website), primary = false, Modifier.weight(1f)) { Track.action(locale, "website", place.slug); open(webUrl(it)) } }
        }

        Column(Modifier.padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Spacer(Modifier.height(8.dp))
            if (!place.generated && !place.description.isNullOrBlank()) {
                Card { Text(place.description, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.padding(16.dp)) }
            }

            // Facts without labels: the icon says what each one is.
            val facts = buildList {
                if (place.hours != null && !always) add(FactRow(R.drawable.ic_clock, place.hours))
                if (location != null) add(FactRow(R.drawable.ic_map_pin, location))
                listOfNotNull(place.phone, place.phone2).forEach { phone -> add(FactRow(R.drawable.ic_call, phone, link = true) { dial(phone) }) }
                place.google?.let { g -> add(FactRow(R.drawable.ic_star, "${g.rating}  (${g.count})", star = true) { Track.action(locale, "maps", place.slug); open(place.mapsUrl) }) }
            }
            if (facts.isNotEmpty()) {
                Card {
                    facts.forEachIndexed { i, f ->
                        CardRow(icon = f.icon, iconTint = if (f.star) colors.secondary else colors.onSurfaceVariant, last = i == facts.lastIndex, onClick = f.onClick) {
                            Text(f.text, style = MaterialTheme.typography.bodyLarge, color = if (f.link) colors.primary else colors.onSurface)
                        }
                    }
                }
            }

            val services = place.services.mapNotNull { serviceLabels[it] }
            if (services.isNotEmpty()) {
                FlowRow(Modifier.padding(horizontal = 4.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    services.forEach {
                        Text(
                            it,
                            style = MaterialTheme.typography.labelLarge,
                            color = colors.onSurface,
                            modifier = Modifier.clip(CircleShape).background(colors.surface).padding(horizontal = 12.dp, vertical = 7.dp),
                        )
                    }
                }
            }

            if (place.menu.isNotEmpty()) Menu(place.menu)
            RateCard(place)
        }
    }
}

/** One line in the facts card. */
private class FactRow(@DrawableRes val icon: Int, val text: String, val link: Boolean = false, val star: Boolean = false, val onClick: (() -> Unit)? = null)

/** An action tile, icon over its word; the actions share the row, the first one filled. */
@Composable
private fun Action(@DrawableRes icon: Int, label: String, primary: Boolean, modifier: Modifier, onClick: () -> Unit) {
    val colors = MaterialTheme.colorScheme
    Column(
        modifier
            .clip(RoundedCornerShape(16.dp))
            .background(if (primary) colors.primary else colors.surface)
            .clickable(onClick = onClick)
            .padding(vertical = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(painterResource(icon), contentDescription = null, tint = if (primary) colors.onPrimary else colors.primary, modifier = Modifier.size(22.dp))
        Spacer(Modifier.height(6.dp))
        Text(label, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.SemiBold, color = if (primary) colors.onPrimary else colors.primary, maxLines = 1)
    }
}

@Composable
private fun Menu(menu: List<MenuSection>) {
    val number = NumberFormat.getNumberInstance(Locale.ENGLISH)
    Card {
        Text(stringResource(R.string.menu), style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(start = 16.dp, end = 16.dp, top = 16.dp))
        menu.forEach { section ->
            Text(section.title, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(start = 16.dp, end = 16.dp, top = 14.dp, bottom = 2.dp))
            section.items.forEach { item ->
                Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)) {
                    Text(item.name, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
                    item.price?.let { Text(stringResource(R.string.birr, number.format(it)), style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium) }
                }
            }
        }
        Spacer(Modifier.height(10.dp))
    }
}

/** "Open now · until 19:00", or null when the hours aren't known. [short] drops the detail, for lists. */
class OpenLine(val label: String, val detail: String?, val color: Color)

@Composable
fun openLine(spec: String?, now: Pair<Int, Int>, short: Boolean): OpenLine? {
    val week = Hours.parse(spec) ?: return null
    val days = stringArrayResource(R.array.days)
    return when (val s = Hours.status(week, now)) {
        Hours.Status.Always -> OpenLine(stringResource(R.string.open_24), null, openColor)
        is Hours.Status.Open -> OpenLine(stringResource(R.string.open_now), stringResource(R.string.until, Hours.clock(s.closesAt)).takeUnless { short }, openColor)
        is Hours.Status.Closed -> OpenLine(
            stringResource(R.string.closed),
            when {
                short -> null
                s.today -> stringResource(R.string.opens_today, Hours.clock(s.opensAt))
                else -> stringResource(R.string.opens_day, days[s.opensDay], Hours.clock(s.opensAt))
            },
            closedColor,
        )
        Hours.Status.ClosedAllWeek -> OpenLine(stringResource(R.string.closed), null, closedColor)
    }
}

/** Ethiopian numbers dial with +251 (the website's telHref). */
fun telUri(phone: String): String {
    val digits = phone.filter { it.isDigit() || it == '+' }
    return when {
        digits.startsWith("+") -> "tel:$digits"
        digits.startsWith("0") -> "tel:+251${digits.drop(1)}"
        else -> "tel:$digits"
    }
}

/** The phone's maps app at the pin, or the place's Google Maps link when there's no pin. */
fun directionsUri(place: Place): String =
    if (place.lat != null && place.lng != null) "geo:0,0?q=${place.lat},${place.lng}(${android.net.Uri.encode(place.name)})" else place.mapsUrl

fun webUrl(url: String): String = if (url.startsWith("http://", true) || url.startsWith("https://", true)) url else "https://$url"
