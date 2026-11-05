package et.bulbula.directory

import android.content.Intent
import androidx.annotation.DrawableRes
import androidx.annotation.StringRes
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.net.toUri
import kotlin.math.asin
import kotlin.math.ceil
import kotlin.math.cos
import kotlin.math.pow
import kotlin.math.roundToInt
import kotlin.math.sin
import kotlin.math.sqrt

enum class Tab(@DrawableRes val icon: Int, @StringRes val label: Int) {
    Home(R.drawable.ic_home, R.string.tab_home),
    Search(R.drawable.ic_search, R.string.search),
    Nearby(R.drawable.ic_locate, R.string.tab_nearby),
    Profile(R.drawable.ic_user, R.string.tab_profile),
}

/** Room the floating bottom bar takes, for the bottom padding of the tabs' lists. */
@Composable
fun tabBarSpace(): Dp = 104.dp + WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()

/** Metres between where you are and a place (haversine). */
fun distanceTo(here: Pair<Double, Double>, place: Place): Double? {
    val lat = place.lat ?: return null
    val lng = place.lng ?: return null
    val r = 6_371_000.0
    val dLat = Math.toRadians(lat - here.first)
    val dLng = Math.toRadians(lng - here.second)
    val a = sin(dLat / 2).pow(2) + cos(Math.toRadians(here.first)) * cos(Math.toRadians(lat)) * sin(dLng / 2).pow(2)
    return 2 * r * asin(sqrt(a))
}

@Composable
fun distanceLabel(metres: Double): String =
    if (metres < 1000) stringResource(R.string.metres, ((metres / 10).roundToInt() * 10).coerceAtLeast(10))
    else stringResource(R.string.kilometres, "%.1f".format(java.util.Locale.ENGLISH, metres / 1000))

@Composable
fun walkLabel(metres: Double): String = stringResource(R.string.walk_min, ceil(metres / 80).toInt().coerceAtLeast(1))

/** A fresh fix, or the phone's last known one (fine for sorting by distance, not for pinning a place). */
@android.annotation.SuppressLint("MissingPermission")
suspend fun roughLocation(context: android.content.Context): Pair<Double, Double>? =
    currentLocation(context) ?: runCatching {
        val lm = context.getSystemService(android.location.LocationManager::class.java)
        lm?.getProviders(true).orEmpty().mapNotNull { lm?.getLastKnownLocation(it) }.maxByOrNull { it.time }?.let { it.latitude to it.longitude }
    }.getOrNull()

fun isOpen(place: Place, now: Pair<Int, Int>): Boolean =
    Hours.parse(place.hoursSpec)?.let { Hours.status(it, now) }.let { it is Hours.Status.Open || it == Hours.Status.Always }

/**
 * The floating bar: Home, Search, a raised "+" (add a place), Nearby, Profile. The chosen tab's
 * icon sits in a teal pill and bounces when picked.
 */
@Composable
fun BottomBar(tab: Tab, onTab: (Tab) -> Unit, onAdd: () -> Unit, modifier: Modifier = Modifier) {
    val colors = MaterialTheme.colorScheme
    Box(modifier.fillMaxWidth().navigationBarsPadding().padding(start = 14.dp, end = 14.dp, bottom = 10.dp)) {
        Row(
            Modifier
                .padding(top = 22.dp)
                .fillMaxWidth()
                .height(70.dp)
                .shadow(18.dp, RoundedCornerShape(26.dp), ambientColor = Teal.copy(alpha = 0.5f), spotColor = Teal.copy(alpha = 0.5f))
                .clip(RoundedCornerShape(26.dp))
                .background(colors.surface)
                .border(1.dp, colors.outlineVariant, RoundedCornerShape(26.dp))
                .padding(horizontal = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            NavItem(Tab.Home, tab, onTab)
            NavItem(Tab.Search, tab, onTab)
            Spacer(Modifier.width(76.dp))
            NavItem(Tab.Nearby, tab, onTab)
            NavItem(Tab.Profile, tab, onTab)
        }
        AddButton(onAdd, Modifier.align(Alignment.TopCenter))
    }
}

@Composable
private fun androidx.compose.foundation.layout.RowScope.NavItem(item: Tab, selected: Tab, onTab: (Tab) -> Unit) {
    val colors = MaterialTheme.colorScheme
    val on = item == selected
    val haptic = LocalHapticFeedback.current
    val pill by animateColorAsState(if (on) colors.primary.copy(alpha = 0.14f) else Color.Transparent, label = "pill")
    val tint by animateColorAsState(if (on) colors.primary else colors.onSurfaceVariant, label = "tint")
    val width by animateDpAsState(if (on) 54.dp else 36.dp, spring(0.55f, 500f), label = "width")
    val bounce = remember { Animatable(1f) }
    LaunchedEffect(on) {
        if (on) {
            bounce.snapTo(0.7f)
            bounce.animateTo(1f, spring(dampingRatio = 0.32f, stiffness = 500f))
        }
    }
    Column(
        Modifier
            .weight(1f)
            .clip(RoundedCornerShape(18.dp))
            .clickable(remember { MutableInteractionSource() }, indication = null) {
                if (!on) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                onTab(item)
            }
            .padding(vertical = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(Modifier.width(width).height(32.dp).background(pill, CircleShape), contentAlignment = Alignment.Center) {
            Icon(painterResource(item.icon), contentDescription = null, tint = tint, modifier = Modifier.size(22.dp).scale(bounce.value))
        }
        Spacer(Modifier.height(3.dp))
        Text(stringResource(item.label), fontSize = 11.sp, fontWeight = if (on) FontWeight.ExtraBold else FontWeight.Medium, color = tint, maxLines = 1)
    }
}

/** The raised marigold "+", with a soft ring breathing around it. */
@Composable
private fun AddButton(onAdd: () -> Unit, modifier: Modifier) {
    val interaction = remember { MutableInteractionSource() }
    val down by interaction.collectIsPressedAsState()
    val push by animateDpAsState(if (down) 4.dp else 0.dp, spring(stiffness = 1500f), label = "push")
    val turn by animateDpAsState(if (down) 90.dp else 0.dp, spring(0.5f, 400f), label = "turn")
    val t = rememberInfiniteTransition(label = "halo")
    val halo by t.animateFloat(0f, 1f, infiniteRepeatable(tween(1800, easing = FastOutSlowInEasing), RepeatMode.Restart), label = "halo")
    val haptic = LocalHapticFeedback.current
    Box(modifier.size(70.dp), contentAlignment = Alignment.TopCenter) {
        Box(Modifier.size(64.dp).scale(1f + halo * 0.35f).background(Marigold.copy(alpha = (1f - halo) * 0.35f), CircleShape))
        Box(Modifier.size(64.dp).offset(y = 5.dp).background(MarigoldDeep, CircleShape))
        Box(
            Modifier
                .size(64.dp)
                .offset { androidx.compose.ui.unit.IntOffset(0, push.roundToPx()) }
                .clip(CircleShape)
                .background(Marigold)
                .clickable(interaction, indication = null) {
                    haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                    onAdd()
                },
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                painterResource(R.drawable.ic_plus),
                contentDescription = stringResource(R.string.add_place),
                tint = Color(0xFF3A2600),
                modifier = Modifier.size(30.dp).rotate(turn.value),
            )
        }
    }
}

/**
 * Home: hello and your streak, this week's goal, what's open (closest first when we know where you
 * are), the categories, and an invitation to add a place.
 */
@Composable
fun HomeScreen(
    state: DirectoryState,
    now: Pair<Int, Int>,
    here: Pair<Double, Double>?,
    onOpen: (Place) -> Unit,
    onCategory: (String) -> Unit,
    onSeeAll: () -> Unit,
    onAdd: () -> Unit,
    onRefresh: () -> Unit,
) {
    val progress = LocalProgress.current
    val colors = MaterialTheme.colorScheme
    val directory = state.directory
    val context = LocalContext.current
    var updateClosed by rememberSaveable { mutableStateOf(false) }
    val update = directory?.app?.android?.takeIf { it.versionCode > BuildConfig.VERSION_CODE && !updateClosed }
    val openNow = remember(directory, now, here) {
        val open = directory?.listings.orEmpty().filter { isOpen(it, now) }
        (if (here != null) open.sortedBy { distanceTo(here, it) ?: Double.MAX_VALUE } else open).take(12)
    }
    val level = progress.level

    Column(Modifier.fillMaxSize().background(colors.background).statusBarsPadding()) {
        PullToRefreshBox(isRefreshing = state.refreshing && directory != null, onRefresh = onRefresh, modifier = Modifier.fillMaxSize()) {
            LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = tabBarSpace())) {
                item {
                    Row(Modifier.fillMaxWidth().padding(start = 12.dp, end = 16.dp, top = 8.dp).enter(0), verticalAlignment = Alignment.CenterVertically) {
                        Bulbie(size = 58.dp)
                        Spacer(Modifier.width(6.dp))
                        Column(Modifier.weight(1f)) {
                            Text(
                                if (progress.name.isBlank()) stringResource(R.string.selam) else stringResource(R.string.hello_name, progress.name),
                                style = MaterialTheme.typography.headlineSmall,
                                fontWeight = FontWeight.ExtraBold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                            Text(stringResource(R.string.level_n_title, level.number, stringResource(level.title)), style = MaterialTheme.typography.bodyMedium, color = colors.onSurfaceVariant, maxLines = 1)
                        }
                        StatChip(R.drawable.ic_flame, progress.streak, Color(0xFFF0642D), pulse = progress.streak > 1)
                        Spacer(Modifier.width(6.dp))
                        StatChip(R.drawable.ic_zap, progress.xp, MarigoldDeep)
                    }
                }
                if (update != null) {
                    item {
                        Box(Modifier.padding(top = 8.dp)) {
                            UpdateBanner(update, onUpdate = { runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, update.url.toUri())) } }, onClose = { updateClosed = true })
                        }
                    }
                }
                item { DailyGoal(progress, Modifier.padding(horizontal = 16.dp, vertical = 14.dp).enter(1)) }

                when {
                    directory == null && state.failed -> item { Muted(stringResource(R.string.offline), Modifier.padding(20.dp)) }
                    directory == null -> item { Box(Modifier.fillMaxWidth().padding(top = 60.dp), Alignment.Center) { CircularProgressIndicator() } }
                    else -> {
                        if (openNow.isNotEmpty()) {
                            item { SectionTitle(stringResource(if (here != null) R.string.open_near_you else R.string.open_now), stringResource(R.string.see_all), onSeeAll, Modifier.enter(2)) }
                            item {
                                // Back to the start when the order changes (e.g. your location arrives).
                                val row = rememberLazyListState()
                                LaunchedEffect(here) { row.scrollToItem(0) }
                                LazyRow(state = row, contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.enter(3)) {
                                    items(openNow, key = { it.slug }) { place -> PlaceCard(place, now, here) { onOpen(place) } }
                                }
                            }
                        }
                        item { SectionTitle(stringResource(R.string.explore), null, null, Modifier.enter(4)) }
                        val rows = directory.categories.chunked(3)
                        rows.forEachIndexed { i, row ->
                            item(key = "cat-$i") {
                                Row(Modifier.padding(horizontal = 16.dp, vertical = 5.dp).enter(5 + i), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                    row.forEach { c ->
                                        val count = directory.listings.count { it.category.slug == c.slug }
                                        CategoryTile(c, count, Modifier.weight(1f)) { onCategory(c.slug) }
                                    }
                                    repeat(3 - row.size) { Spacer(Modifier.weight(1f)) }
                                }
                            }
                        }
                        item { AddInvite(progress.why == Why.Owner, onAdd, Modifier.padding(16.dp).enter(6 + rows.size)) }
                    }
                }
            }
        }
    }
}

@Composable
private fun SectionTitle(title: String, action: String?, onAction: (() -> Unit)?, modifier: Modifier = Modifier) {
    Row(modifier.fillMaxWidth().padding(start = 20.dp, end = 8.dp, top = 16.dp, bottom = 8.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold, modifier = Modifier.weight(1f))
        if (action != null && onAction != null) {
            Text(
                action,
                color = MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.clip(CircleShape).clickable(onClick = onAction).padding(horizontal = 12.dp, vertical = 6.dp),
            )
        }
    }
}

/** This week's goal on a teal card: open three different places. Turns marigold when done. */
@Composable
private fun DailyGoal(progress: Progress, modifier: Modifier = Modifier) {
    val done = progress.goalDone
    val count = progress.weekOpened.size.coerceAtMost(WEEKLY_GOAL)
    val start by animateColorAsState(if (done) Marigold else Teal, tween(600), label = "goal")
    val end by animateColorAsState(if (done) MarigoldDeep else TealDeep, tween(600), label = "goal2")
    val ink = if (done) Color(0xFF3A2600) else Color.White
    Row(
        modifier
            .fillMaxWidth()
            .shadow(10.dp, RoundedCornerShape(24.dp), ambientColor = start, spotColor = start)
            .clip(RoundedCornerShape(24.dp))
            .background(Brush.linearGradient(listOf(start, end)))
            .padding(18.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f)) {
            Text(stringResource(R.string.weekly_goal).uppercase(), color = ink.copy(alpha = 0.75f), fontWeight = FontWeight.ExtraBold, fontSize = 12.sp, letterSpacing = 1.2.sp)
            Spacer(Modifier.height(4.dp))
            AnimatedContent(done, transitionSpec = { (fadeIn() + scaleIn(initialScale = 0.9f)) togetherWith fadeOut() }, label = "goal-title") { d ->
                Text(
                    if (d) stringResource(R.string.goal_done) else stringResource(R.string.goal_title, WEEKLY_GOAL),
                    color = ink,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.ExtraBold,
                )
            }
            Spacer(Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                XpBar(count / WEEKLY_GOAL.toFloat(), Modifier.weight(1f), color = if (done) Color.White else Marigold, track = ink.copy(alpha = 0.2f), height = 12.dp)
                Spacer(Modifier.width(10.dp))
                Text("$count / $WEEKLY_GOAL", color = ink, fontWeight = FontWeight.ExtraBold)
            }
        }
        Spacer(Modifier.width(14.dp))
        val t = rememberInfiniteTransition(label = "trophy")
        val wobble by t.animateFloat(-8f, 8f, infiniteRepeatable(tween(900, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "wobble")
        Box(Modifier.size(58.dp).background(ink.copy(alpha = 0.15f), CircleShape), contentAlignment = Alignment.Center) {
            Icon(
                painterResource(if (done) R.drawable.ic_award else R.drawable.ic_flame),
                contentDescription = null,
                tint = ink,
                modifier = Modifier.size(30.dp).rotate(if (done) wobble else 0f),
            )
        }
    }
}

/** A place as a small card in a row: icon, name, open, and how far. */
@Composable
fun PlaceCard(place: Place, now: Pair<Int, Int>, here: Pair<Double, Double>?, onClick: () -> Unit) {
    val colors = MaterialTheme.colorScheme
    val interaction = remember { MutableInteractionSource() }
    val status = openLine(place.hoursSpec, now, short = true)
    val metres = here?.let { distanceTo(it, place) }
    Column(
        Modifier
            .width(168.dp)
            .pressScale(interaction)
            .clip(RoundedCornerShape(22.dp))
            .background(colors.surface)
            .border(1.dp, colors.outlineVariant, RoundedCornerShape(22.dp))
            .clickable(interaction, indication = null, onClick = onClick)
            .padding(14.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconTile(place.category, size = 44.dp)
            Spacer(Modifier.weight(1f))
            if (metres != null) {
                Text(distanceLabel(metres), style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = colors.primary)
            }
        }
        Spacer(Modifier.height(12.dp))
        Text(place.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, maxLines = 2, minLines = 2, overflow = TextOverflow.Ellipsis)
        Spacer(Modifier.height(6.dp))
        if (status != null) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(7.dp).background(status.color, CircleShape))
                Spacer(Modifier.width(5.dp))
                Text(status.label, style = MaterialTheme.typography.bodyMedium, color = status.color, fontWeight = FontWeight.SemiBold, maxLines = 1)
            }
        } else {
            Muted(place.category.name, small = true)
        }
    }
}

@Composable
private fun CategoryTile(category: Category, count: Int, modifier: Modifier, onClick: () -> Unit) {
    val colors = MaterialTheme.colorScheme
    val interaction = remember { MutableInteractionSource() }
    Column(
        modifier
            .pressScale(interaction, 0.93f)
            .clip(RoundedCornerShape(20.dp))
            .background(colors.surface)
            .border(1.dp, colors.outlineVariant, RoundedCornerShape(20.dp))
            .clickable(interaction, indication = null, onClick = onClick)
            .padding(vertical = 14.dp, horizontal = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        IconTile(category, size = 46.dp)
        Spacer(Modifier.height(8.dp))
        Text(category.name, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text("$count", style = MaterialTheme.typography.labelMedium, color = colors.onSurfaceVariant)
    }
}

/** "Know a place that's missing?" — or, for owners, "Put your business on Bulbula". */
@Composable
private fun AddInvite(owner: Boolean, onAdd: () -> Unit, modifier: Modifier = Modifier) {
    val colors = MaterialTheme.colorScheme
    Column(
        modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(lerp(colors.surface, Marigold, 0.16f))
            .border(2.dp, Marigold.copy(alpha = 0.5f), RoundedCornerShape(24.dp))
            .padding(18.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(stringResource(if (owner) R.string.invite_owner_title else R.string.invite_title), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
                Spacer(Modifier.height(4.dp))
                Text(stringResource(R.string.invite_body), style = MaterialTheme.typography.bodyMedium, color = colors.onSurfaceVariant)
            }
            Spacer(Modifier.width(8.dp))
            Bulbie(size = 70.dp)
        }
        Spacer(Modifier.height(14.dp))
        ChunkyButton(stringResource(R.string.add_place_xp, 50), onAdd, Modifier.fillMaxWidth(), color = Marigold, contentColor = Color(0xFF3A2600), icon = R.drawable.ic_add)
    }
}
