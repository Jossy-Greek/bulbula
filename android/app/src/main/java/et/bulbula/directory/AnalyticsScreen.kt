package et.bulbula.directory

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import java.text.NumberFormat
import java.util.Locale
import kotlin.math.roundToInt

/** The site's analytics (the same report as /admin/analytics), sized for a phone. */
@Composable
fun AnalyticsScreen(vm: AdminViewModel, onBack: () -> Unit) {
    var range by rememberSaveable { mutableIntStateOf(30) }
    var report by remember { mutableStateOf<Report?>(null) }
    var failed by remember { mutableStateOf(false) }
    LaunchedEffect(range) {
        failed = false
        val r = vm.report(range)
        if (r == null) failed = true else report = r
    }
    val r = report?.takeIf { it.range == range }
    val number = NumberFormat.getIntegerInstance(Locale.ENGLISH)

    Column(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).statusBarsPadding().verticalScroll(rememberScrollState()).navigationBarsPadding().padding(bottom = 32.dp)) {
        ScreenTitle(stringResource(R.string.analytics), onBack) {
            r?.let { Live(it.live) }
        }
        Column(Modifier.padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            PillSwitch(listOf(7, 30, 90).map { it to pluralStringResource(R.plurals.range_days, it, it) }, range) { range = it }
            when {
                r == null && failed -> Muted(stringResource(R.string.offline), Modifier.padding(horizontal = 4.dp))
                r == null -> Box(Modifier.fillMaxWidth().padding(top = 80.dp), Alignment.Center) { CircularProgressIndicator() }
                else -> {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Stat(stringResource(R.string.visitors), r.kpis.visitors, number, Modifier.weight(1f))
                        Stat(stringResource(R.string.page_views), r.kpis.pageviews, number, Modifier.weight(1f))
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Stat(stringResource(R.string.leads), r.kpis.leads, number, Modifier.weight(1f))
                        Stat(stringResource(R.string.searches), r.kpis.searches, number, Modifier.weight(1f))
                    }
                    if (r.days.any { it.visitors > 0 }) Card { Bars(r.days.map { it.visitors }, Modifier.padding(16.dp)) }
                    Top(stringResource(R.string.top_places), r.businesses.filter { it.leads > 0 || it.views > 0 }.take(10).map { it.name to (it.leads.takeIf { n -> n > 0 } ?: it.views) }, number)
                    Top(stringResource(R.string.searches), r.searches.take(10).map { "“${it.key}”" to it.count }, number)
                    Top(stringResource(R.string.no_results), r.emptySearches.take(10).map { "“${it.key}”" to it.count }, number)
                }
            }
        }
    }
}

/** "● 3 now": visitors in the last 30 minutes. */
@Composable
private fun Live(count: Int) {
    Row(Modifier.padding(end = 16.dp, top = 12.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(7.dp).background(if (count > 0) openColor else MaterialTheme.colorScheme.onSurfaceVariant, CircleShape))
        Spacer(Modifier.width(6.dp))
        Text(stringResource(R.string.live_now, count), style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

/** A number, its name, and the change from the period before. */
@Composable
private fun Stat(label: String, kpi: Kpi, number: NumberFormat, modifier: Modifier) {
    Card(modifier) {
        Column(Modifier.padding(16.dp)) {
            Text(number.format(kpi.value), style = MaterialTheme.typography.headlineMedium)
            Spacer(Modifier.height(2.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Muted(label, Modifier.weight(1f, fill = false), small = true)
                change(kpi)?.let { (text, up) ->
                    Spacer(Modifier.width(6.dp))
                    Text(text, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold, color = if (up) openColor else closedColor)
                }
            }
        }
    }
}

/** "+12%" / "−5%", or null when there's nothing to compare with. */
private fun change(k: Kpi): Pair<String, Boolean>? {
    if (k.previous == 0) return null
    val pct = ((k.value - k.previous) * 100.0 / k.previous).roundToInt()
    if (pct == 0) return null
    return (if (pct > 0) "+$pct%" else "−${-pct}%") to (pct > 0)
}

/** Visitors per day, oldest left. */
@Composable
private fun Bars(values: List<Int>, modifier: Modifier) {
    val color = MaterialTheme.colorScheme.primary
    val max = (values.maxOrNull() ?: 0).coerceAtLeast(1)
    Canvas(modifier.fillMaxWidth().height(96.dp)) {
        val gap = 2.dp.toPx()
        val w = (size.width - gap * (values.size - 1)) / values.size
        values.forEachIndexed { i, v ->
            val h = (size.height * v / max).coerceAtLeast(if (v > 0) 3.dp.toPx() else 1.dp.toPx())
            drawRoundRect(
                color = if (v > 0) color else color.copy(alpha = 0.15f),
                topLeft = Offset(i * (w + gap), size.height - h),
                size = Size(w, h),
                cornerRadius = CornerRadius(w / 3, w / 3),
            )
        }
    }
}

/** A titled list of names with counts; nothing when there are none. */
@Composable
private fun Top(title: String, rows: List<Pair<String, Int>>, number: NumberFormat) {
    if (rows.isEmpty()) return
    Card {
        Text(title, style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 4.dp))
        rows.forEachIndexed { i, (name, count) ->
            CardRow(last = i == rows.lastIndex, trailing = { Text(number.format(count), style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold) }) {
                Text(name, style = MaterialTheme.typography.bodyLarge, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}
