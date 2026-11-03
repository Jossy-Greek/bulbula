package et.bulbula.directory

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
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
fun PlaceScreen(place: Place, serviceLabels: Map<String, String>, now: Pair<Int, Int>, onBack: () -> Unit) {
    val context = LocalContext.current
    val open = { uri: String -> context.startActivity(Intent(Intent.ACTION_VIEW, uri.toUri())) }
    val dial = { phone: String -> context.startActivity(Intent(Intent.ACTION_DIAL, telUri(phone).toUri())) }
    val status = openLine(place.hoursSpec, now, short = false)

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).statusBarsPadding().navigationBarsPadding().padding(bottom = 32.dp)) {
        IconButton(onClick = onBack, modifier = Modifier.padding(start = 4.dp, top = 4.dp)) {
            Icon(painterResource(R.drawable.ic_back), contentDescription = stringResource(R.string.back))
        }
        Column(Modifier.padding(horizontal = 20.dp)) {
            Text(place.name, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.SemiBold)
            Spacer(Modifier.height(4.dp))
            Muted(place.category.name)
            if (status != null) {
                Spacer(Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("●", color = status.color, style = MaterialTheme.typography.labelSmall)
                    Spacer(Modifier.size(6.dp))
                    Text(status.label, color = status.color, fontWeight = FontWeight.Medium)
                    if (status.detail != null) Muted(" · ${status.detail}")
                }
            }

            Spacer(Modifier.height(20.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                place.phone?.let { Action(R.drawable.ic_call, stringResource(R.string.call), Modifier.weight(1f)) { dial(it) } }
                Action(R.drawable.ic_directions, stringResource(R.string.directions), Modifier.weight(1f)) { open(directionsUri(place)) }
                place.website?.let { Action(R.drawable.ic_web, stringResource(R.string.website), Modifier.weight(1f)) { open(webUrl(it)) } }
            }

            if (!place.generated && !place.description.isNullOrBlank()) {
                Spacer(Modifier.height(20.dp))
                Text(place.description, style = MaterialTheme.typography.bodyLarge)
            }

            // Facts without labels: each reads on its own.
            Spacer(Modifier.height(12.dp))
            listOfNotNull(
                place.hours?.let { Fact(it) },
                listOfNotNull(place.landmark, place.address).distinct().joinToString(", ").takeIf { it.isNotEmpty() }?.let { Fact(it) },
                place.phone?.let { Fact(it) { dial(it) } },
                place.phone2?.let { Fact(it) { dial(it) } },
                place.google?.let { Fact("★ ${it.rating} (${it.count})") { open(place.mapsUrl) } },
            ).forEach { fact ->
                Text(
                    fact.text,
                    style = MaterialTheme.typography.bodyLarge,
                    color = if (fact.onClick != null) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onBackground,
                    modifier = Modifier.fillMaxWidth().then(fact.onClick?.let { Modifier.clickable(onClick = it) } ?: Modifier).padding(vertical = 12.dp),
                )
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            }

            val services = place.services.mapNotNull { serviceLabels[it] }
            if (services.isNotEmpty()) {
                Spacer(Modifier.height(20.dp))
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    services.forEach {
                        Text(
                            it,
                            style = MaterialTheme.typography.labelLarge,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.background(MaterialTheme.colorScheme.surfaceVariant, CircleShape).padding(horizontal = 12.dp, vertical = 6.dp),
                        )
                    }
                }
            }

            if (place.menu.isNotEmpty()) Menu(place.menu)
        }
    }
}

private class Fact(val text: String, val onClick: (() -> Unit)? = null)

@Composable
private fun Action(icon: Int, label: String, modifier: Modifier, onClick: () -> Unit) {
    Column(
        modifier.background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(14.dp)).clickable(onClick = onClick).padding(vertical = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(painterResource(icon), contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(22.dp))
        Spacer(Modifier.height(4.dp))
        Text(label, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
    }
}

@Composable
private fun Menu(menu: List<MenuSection>) {
    val number = NumberFormat.getNumberInstance(Locale.ENGLISH)
    Spacer(Modifier.height(28.dp))
    Text(stringResource(R.string.menu), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.SemiBold)
    menu.forEach { section ->
        Spacer(Modifier.height(16.dp))
        Text(section.title, style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        section.items.forEach { item ->
            Row(Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
                Text(item.name, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
                item.price?.let { Text(stringResource(R.string.birr, number.format(it)), style = MaterialTheme.typography.bodyLarge) }
            }
        }
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
