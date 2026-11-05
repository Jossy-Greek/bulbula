package et.bulbula.directory

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import kotlinx.coroutines.launch

private enum class Finding { Ask, Looking, Failed, Found }

/** The places with a pin, closest first, with walking time. Asks for location when needed. */
@Composable
fun NearbyScreen(
    directory: Directory?,
    now: Pair<Int, Int>,
    here: Pair<Double, Double>?,
    onHere: (Pair<Double, Double>) -> Unit,
    onOpen: (Place) -> Unit,
) {
    val context = LocalContext.current
    val colors = MaterialTheme.colorScheme
    val scope = rememberCoroutineScope()
    fun granted() = listOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
        .any { ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED }
    var finding by remember { mutableStateOf(if (here != null) Finding.Found else if (granted()) Finding.Looking else Finding.Ask) }
    var openOnly by rememberSaveable { mutableStateOf(false) }

    fun locate() {
        finding = Finding.Looking
        scope.launch {
            val fix = roughLocation(context)
            if (fix != null) { onHere(fix); finding = Finding.Found } else finding = Finding.Failed
        }
    }
    val ask = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { result ->
        if (result.values.any { it }) locate() else finding = Finding.Ask
    }
    LaunchedEffect(Unit) { if (finding == Finding.Looking) locate() }

    val places = remember(directory, here, openOnly, now) {
        if (here == null) emptyList()
        else directory?.listings.orEmpty()
            .mapNotNull { p -> distanceTo(here, p)?.let { p to it } }
            .filter { !openOnly || isOpen(it.first, now) }
            .sortedBy { it.second }
    }

    Column(Modifier.fillMaxSize().background(colors.background).statusBarsPadding()) {
        Row(Modifier.fillMaxWidth().padding(start = 20.dp, end = 16.dp, top = 12.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(stringResource(R.string.tab_nearby), style = MaterialTheme.typography.headlineLarge)
                Muted(stringResource(R.string.closest_first), small = true)
            }
            if (finding == Finding.Found) {
                Text(
                    stringResource(R.string.open_now),
                    fontWeight = FontWeight.Bold,
                    color = if (openOnly) Color.White else openColor,
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(if (openOnly) openColor else openColor.copy(alpha = 0.12f))
                        .clickable { openOnly = !openOnly }
                        .padding(horizontal = 14.dp, vertical = 8.dp),
                )
            }
        }
        when (finding) {
            Finding.Ask -> Empty(stringResource(R.string.where_are_you), stringResource(R.string.location_note)) {
                ChunkyButton(stringResource(R.string.allow_location), {
                    ask.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION))
                }, Modifier.fillMaxWidth(), icon = R.drawable.ic_locate)
            }
            Finding.Looking -> Empty(stringResource(R.string.finding_you), null) {}
            Finding.Failed -> Empty(stringResource(R.string.no_location), stringResource(R.string.no_location_body)) {
                ChunkyButton(stringResource(R.string.retry), ::locate, Modifier.fillMaxWidth(), icon = R.drawable.ic_locate)
            }
            Finding.Found -> LazyColumn(
                Modifier.fillMaxSize(),
                contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 14.dp, bottom = tabBarSpace()),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                if (places.isEmpty()) item { Muted(stringResource(R.string.none), Modifier.padding(8.dp)) }
                itemsIndexed(places, key = { _, p -> p.first.slug }) { i, (place, metres) ->
                    NearbyRow(place, metres, i, now, Modifier.enter(i)) { onOpen(place) }
                }
            }
        }
    }
}

@Composable
private fun Empty(title: String, body: String?, action: @Composable () -> Unit) {
    Column(Modifier.fillMaxSize().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        Radar()
        Spacer(Modifier.height(12.dp))
        Text(title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold, textAlign = TextAlign.Center)
        if (body != null) {
            Spacer(Modifier.height(8.dp))
            Text(body, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)
        }
        Spacer(Modifier.height(22.dp))
        action()
        Spacer(Modifier.height(tabBarSpace()))
    }
}

/** One place: rank, icon, name and status, then distance and walking time on the right. */
@Composable
private fun NearbyRow(place: Place, metres: Double, rank: Int, now: Pair<Int, Int>, modifier: Modifier, onClick: () -> Unit) {
    val colors = MaterialTheme.colorScheme
    val interaction = remember { MutableInteractionSource() }
    val status = openLine(place.hoursSpec, now, short = true)
    val top = rank < 3
    Row(
        modifier
            .pressScale(interaction, 0.97f)
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(colors.surface)
            .border(if (top) 2.dp else 1.dp, if (top) Marigold.copy(alpha = 0.6f) else colors.outlineVariant, RoundedCornerShape(20.dp))
            .clickable(interaction, indication = null, onClick = onClick)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box {
            IconTile(place.category, size = 48.dp)
            if (top) {
                Box(Modifier.align(Alignment.TopStart).size(20.dp).background(Marigold, CircleShape), contentAlignment = Alignment.Center) {
                    Text("${rank + 1}", fontSize = 11.sp, fontWeight = FontWeight.Black, color = Color(0xFF3A2600))
                }
            }
        }
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text(place.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (status != null) {
                    Box(Modifier.size(6.dp).background(status.color, CircleShape))
                    Spacer(Modifier.width(5.dp))
                    Text(status.label, style = MaterialTheme.typography.bodyMedium, color = status.color, fontWeight = FontWeight.Medium, maxLines = 1)
                    Muted(" · ", small = true)
                }
                Muted(place.category.name, small = true)
            }
        }
        Spacer(Modifier.width(8.dp))
        Column(horizontalAlignment = Alignment.End) {
            Text(distanceLabel(metres), fontWeight = FontWeight.ExtraBold, color = colors.primary, fontSize = 16.sp)
            Muted(walkLabel(metres), small = true)
        }
    }
}
