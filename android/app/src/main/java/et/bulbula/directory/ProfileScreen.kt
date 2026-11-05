package et.bulbula.directory

import androidx.annotation.DrawableRes
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateIntAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** Your level, XP, streak, what you've done and your badges; then settings. */
@Composable
fun ProfileScreen(onSettings: () -> Unit) {
    val progress = LocalProgress.current
    val colors = MaterialTheme.colorScheme
    val level = progress.level
    val toNext = level.to?.let { it - progress.xp }
    val fraction = level.to?.let { (progress.xp - level.from).toFloat() / (it - level.from) } ?: 1f
    var renaming by remember { mutableStateOf(false) }
    var picked by remember { mutableStateOf<Badge?>(null) }
    val xpShown by animateIntAsState(progress.xp, tween(1100, easing = FastOutSlowInEasing), label = "xp")

    Column(Modifier.fillMaxSize().background(colors.background).verticalScroll(rememberScrollState()).statusBarsPadding().padding(bottom = tabBarSpace())) {
        // Avatar with the level ring around it.
        Column(Modifier.fillMaxWidth().padding(top = 24.dp).enter(0), horizontalAlignment = Alignment.CenterHorizontally) {
            Box(Modifier.size(132.dp), contentAlignment = Alignment.Center) {
                LevelRing(fraction)
                Box(
                    Modifier.size(104.dp).clip(CircleShape).background(colors.primary.copy(alpha = 0.14f)).clickable { renaming = true },
                    contentAlignment = Alignment.Center,
                ) {
                    if (progress.name.isBlank()) Bulbie(size = 84.dp)
                    else Text(progress.name.take(1).uppercase(), fontSize = 46.sp, fontWeight = FontWeight.Black, color = colors.primary)
                }
                Box(Modifier.align(Alignment.BottomCenter).offset(y = 8.dp)) { LevelCoin(level.number, 40.dp) }
            }
            Spacer(Modifier.height(14.dp))
            Text(
                progress.name.ifBlank { stringResource(R.string.add_your_name) },
                style = MaterialTheme.typography.headlineMedium,
                color = if (progress.name.isBlank()) colors.primary else colors.onSurface,
                modifier = Modifier.clip(RoundedCornerShape(10.dp)).clickable { renaming = true }.padding(horizontal = 8.dp),
            )
            Text(stringResource(level.title), style = MaterialTheme.typography.titleMedium, color = MarigoldDeep, fontWeight = FontWeight.ExtraBold)
        }

        // XP towards the next level.
        Column(Modifier.padding(horizontal = 16.dp, vertical = 20.dp).enter(1).fillMaxWidth().clip(RoundedCornerShape(22.dp)).background(colors.surface).padding(18.dp)) {
            Row(verticalAlignment = Alignment.Bottom) {
                Text(stringResource(R.string.xp_total, xpShown), fontSize = 26.sp, fontWeight = FontWeight.Black, color = MarigoldDeep, modifier = Modifier.weight(1f))
                Muted(if (toNext != null) stringResource(R.string.xp_to_level, toNext, level.number + 1) else stringResource(R.string.top_level), small = true)
            }
            Spacer(Modifier.height(10.dp))
            XpBar(fraction, Modifier.fillMaxWidth(), height = 16.dp)
        }

        // What you've done.
        Row(Modifier.padding(horizontal = 16.dp).enter(2), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Stat(R.drawable.ic_flame, Color(0xFFF0642D), progress.streak, stringResource(R.string.stat_streak), Modifier.weight(1f))
            Stat(R.drawable.ic_map_pin, colors.primary, progress.opened.size, stringResource(R.string.stat_explored), Modifier.weight(1f))
        }
        Spacer(Modifier.height(10.dp))
        Row(Modifier.padding(horizontal = 16.dp).enter(3), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Stat(R.drawable.ic_star, Color(0xFFE8456B), progress.reviews, stringResource(R.string.stat_reviews), Modifier.weight(1f))
            Stat(R.drawable.ic_store, Color(0xFF9A5B13), progress.added, stringResource(R.string.stat_added), Modifier.weight(1f))
        }

        // Badges: tap one to see how to earn it.
        Row(Modifier.padding(start = 20.dp, end = 20.dp, top = 26.dp, bottom = 12.dp).enter(4), verticalAlignment = Alignment.CenterVertically) {
            Text(stringResource(R.string.badges), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold, modifier = Modifier.weight(1f))
            Muted("${progress.badges.size} / ${Badge.entries.size}", small = true)
        }
        Column(Modifier.padding(horizontal = 16.dp).enter(5).fillMaxWidth().clip(RoundedCornerShape(22.dp)).background(colors.surface).padding(vertical = 16.dp, horizontal = 8.dp)) {
            Badge.entries.chunked(4).forEach { row ->
                Row(Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
                    row.forEach { b ->
                        val earned = b in progress.badges
                        val interaction = remember { MutableInteractionSource() }
                        Column(
                            Modifier.weight(1f).pressScale(interaction, 0.9f).clickable(interaction, indication = null) { picked = if (picked == b) null else b },
                            horizontalAlignment = Alignment.CenterHorizontally,
                        ) {
                            BadgeCoin(b, earned, size = 56.dp)
                            Spacer(Modifier.height(6.dp))
                            Text(
                                stringResource(b.title),
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = if (picked == b) FontWeight.ExtraBold else FontWeight.SemiBold,
                                color = if (earned) colors.onSurface else colors.onSurfaceVariant,
                                textAlign = TextAlign.Center,
                                maxLines = 1,
                            )
                        }
                    }
                }
            }
            AnimatedContent(
                targetState = picked,
                transitionSpec = { (fadeIn() + slideInVertically { it / 3 }) togetherWith fadeOut() },
                label = "badge",
            ) { b ->
                if (b != null) {
                    Text(
                        stringResource(b.description),
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center,
                        color = colors.onSurfaceVariant,
                        modifier = Modifier.fillMaxWidth().padding(start = 12.dp, end = 12.dp, top = 8.dp),
                    )
                }
            }
        }

        // How points are earned.
        Text(stringResource(R.string.how_to_earn), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold, modifier = Modifier.padding(start = 20.dp, top = 26.dp, bottom = 12.dp))
        Card(Modifier.padding(horizontal = 16.dp)) {
            val ways = listOf(
                R.string.xp_added to Xp.ADDED,
                R.string.xp_review to Xp.REVIEW,
                R.string.xp_goal to Xp.GOAL,
                R.string.xp_weekly to Xp.WEEKLY,
                R.string.xp_reached to Xp.REACHED,
                R.string.xp_new_place to Xp.NEW_PLACE,
            )
            ways.forEachIndexed { i, (label, xp) ->
                CardRow(last = i == ways.lastIndex, trailing = {
                    Text(stringResource(R.string.xp_plus, xp), fontWeight = FontWeight.ExtraBold, color = MarigoldDeep)
                }) { Text(stringResource(label), style = MaterialTheme.typography.bodyLarge) }
            }
        }
        Muted(stringResource(R.string.points_note), Modifier.padding(horizontal = 20.dp, vertical = 10.dp), small = false)

        Card(Modifier.padding(start = 16.dp, end = 16.dp, top = 10.dp)) {
            CardRow(icon = R.drawable.ic_settings, onClick = onSettings, trailing = { Icon(painterResource(R.drawable.ic_chevron_right), contentDescription = null, tint = colors.onSurfaceVariant) }) {
                Text(stringResource(R.string.settings), style = MaterialTheme.typography.bodyLarge)
            }
            CardRow(icon = R.drawable.ic_sparkles, last = true, onClick = progress::replayWelcome) {
                Text(stringResource(R.string.replay_welcome), style = MaterialTheme.typography.bodyLarge)
            }
        }
    }

    if (renaming) {
        var name by remember { mutableStateOf(progress.name) }
        AlertDialog(
            onDismissRequest = { renaming = false },
            title = { Text(stringResource(R.string.your_first_name)) },
            text = { OutlinedTextField(name, { name = it.take(40) }, singleLine = true, shape = RoundedCornerShape(14.dp)) },
            confirmButton = { TextButton(onClick = { progress.rename(name); renaming = false }) { Text(stringResource(R.string.save)) } },
            dismissButton = { TextButton(onClick = { renaming = false }) { Text(stringResource(R.string.cancel)) } },
        )
    }
}

/** The ring around the avatar, sweeping to the level's progress. */
@Composable
private fun LevelRing(fraction: Float) {
    val sweep = remember { Animatable(0f) }
    LaunchedEffect(fraction) { sweep.animateTo(fraction.coerceIn(0f, 1f), tween(1200, easing = FastOutSlowInEasing)) }
    val track = MaterialTheme.colorScheme.surfaceVariant
    Canvas(Modifier.size(132.dp)) {
        val stroke = 9.dp.toPx()
        val inset = stroke / 2
        val arcSize = Size(size.width - stroke, size.height - stroke)
        drawArc(track, 0f, 360f, false, Offset(inset, inset), arcSize, style = Stroke(stroke))
        drawArc(Marigold, -90f, 360f * sweep.value, false, Offset(inset, inset), arcSize, style = Stroke(stroke, cap = StrokeCap.Round))
    }
}

@Composable
private fun Stat(@DrawableRes icon: Int, tint: Color, value: Int, label: String, modifier: Modifier) {
    val shown by animateIntAsState(value, tween(900), label = "stat")
    Row(
        modifier.clip(RoundedCornerShape(20.dp)).background(MaterialTheme.colorScheme.surface).border(1.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(20.dp)).padding(14.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(Modifier.size(40.dp).background(tint.copy(alpha = 0.14f), CircleShape), contentAlignment = Alignment.Center) {
            Icon(painterResource(icon), contentDescription = null, tint = tint, modifier = Modifier.size(21.dp))
        }
        Spacer(Modifier.width(10.dp))
        Column {
            Text("$shown", fontSize = 22.sp, fontWeight = FontWeight.Black)
            Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
        }
    }
}
