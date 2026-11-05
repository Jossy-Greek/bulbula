package et.bulbula.directory

import androidx.activity.compose.BackHandler
import androidx.annotation.DrawableRes
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.animateIntAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.keyframes
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random

// The fun colours: teal and marigold from the brand, the rest only for confetti and badges.
val Teal = Color(0xFF1F7A85)
val TealDeep = Color(0xFF145860)
val Marigold = Color(0xFFF2B134)
val MarigoldDeep = Color(0xFFC98A12)
private val Ink = Color(0xFF10242A)
private val ConfettiColors = listOf(Teal, Marigold, Color(0xFFFF6B57), Color(0xFF4CC38A), Color(0xFF5AA9E6), Color(0xFFF28AB2), Color(0xFF9B7BEA))

/**
 * Bulbie, the app's guide: a map pin with a face. Bobs gently, blinks every few seconds, and
 * jumps when [happy].
 */
@Composable
fun Bulbie(modifier: Modifier = Modifier, size: Dp = 120.dp, happy: Boolean = false) {
    val t = rememberInfiniteTransition(label = "bulbie")
    val bob by t.animateFloat(
        0f, 1f,
        infiniteRepeatable(tween(if (happy) 420 else 1500, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "bob",
    )
    val blink by t.animateFloat(
        1f, 1f,
        infiniteRepeatable(keyframes {
            durationMillis = 3800
            1f at 0
            1f at 3400
            0.08f at 3500
            1f at 3600
        }),
        label = "blink",
    )
    val lift = if (happy) 0.16f else 0.05f
    Canvas(modifier.size(size)) {
        val w = this.size.width
        val h = this.size.height
        val dy = -bob * h * lift
        // The shadow stays on the ground and shrinks as Bulbie rises.
        val shadowW = w * (0.42f - bob * lift)
        drawOval(Ink.copy(alpha = 0.10f), topLeft = Offset((w - shadowW) / 2, h * 0.9f), size = Size(shadowW, h * 0.06f))

        val cx = w / 2
        val r = w * 0.33f
        val cy = h * 0.4f + dy
        val tip = h * 0.84f + dy
        val pin = Path().apply {
            moveTo(cx, tip)
            cubicTo(cx - r * 0.3f, tip - h * 0.1f, cx - r, cy + r * 0.62f, cx - r, cy)
            arcTo(Rect(cx - r, cy - r, cx + r, cy + r), 180f, 180f, false)
            cubicTo(cx + r, cy + r * 0.62f, cx + r * 0.3f, tip - h * 0.1f, cx, tip)
            close()
        }
        // A darker underside, then the body: the same "chunky" depth as the buttons.
        translate(top = h * 0.025f) { drawPath(pin, TealDeep) }
        drawPath(pin, Teal)
        drawCircle(Color.White.copy(alpha = 0.22f), radius = r * 0.13f, center = Offset(cx - r * 0.52f, cy - r * 0.55f))

        // Eyes: white with a dark pupil looking slightly up.
        val eyeY = cy - r * 0.08f
        val gap = r * 0.36f
        val ew = r * 0.3f
        val eh = r * 0.38f * blink
        for (side in listOf(-1f, 1f)) {
            val ex = cx + side * gap
            drawOval(Color.White, topLeft = Offset(ex - ew / 2, eyeY - eh / 2), size = Size(ew, eh))
            val pw = ew * 0.56f
            val ph = eh * 0.6f
            drawOval(Ink, topLeft = Offset(ex - pw / 2 + side * ew * 0.06f, eyeY - ph / 2 - eh * 0.06f), size = Size(pw, ph))
            if (blink > 0.5f) drawCircle(Color.White, radius = pw * 0.18f, center = Offset(ex - pw * 0.12f + side * ew * 0.06f, eyeY - ph * 0.25f))
        }
        // Cheeks and smile.
        for (side in listOf(-1f, 1f)) drawCircle(Marigold.copy(alpha = 0.7f), radius = r * 0.1f, center = Offset(cx + side * r * 0.66f, cy + r * 0.24f))
        val mouthW = r * (if (happy) 0.6f else 0.46f)
        drawArc(
            Color.White,
            startAngle = 15f, sweepAngle = 150f, useCenter = happy,
            topLeft = Offset(cx - mouthW / 2, cy + r * 0.02f),
            size = Size(mouthW, r * (if (happy) 0.5f else 0.36f)),
            style = if (happy) Fill else Stroke(width = r * 0.09f, cap = StrokeCap.Round),
        )
    }
}

/** Bulbie with a speech bubble beside it, as Duolingo's characters talk. */
@Composable
fun BulbieSays(text: String, modifier: Modifier = Modifier, size: Dp = 84.dp, happy: Boolean = false) {
    val colors = MaterialTheme.colorScheme
    Row(modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Bulbie(size = size, happy = happy)
        Spacer(Modifier.width(6.dp))
        AnimatedContent(
            targetState = text,
            transitionSpec = { (fadeIn(tween(220)) + scaleIn(spring(0.55f, 500f), initialScale = 0.85f)) togetherWith fadeOut(tween(90)) },
            label = "bubble",
        ) { said ->
            Text(
                said,
                style = MaterialTheme.typography.titleMedium,
                color = colors.onSurface,
                modifier = Modifier
                    .border(2.dp, colors.outlineVariant, RoundedCornerShape(18.dp))
                    .clip(RoundedCornerShape(18.dp))
                    .background(colors.surface)
                    .padding(horizontal = 16.dp, vertical = 12.dp),
            )
        }
    }
}

/** Shrinks a little while pressed and springs back: makes anything feel tappable. */
fun Modifier.pressScale(interaction: MutableInteractionSource, pressed: Float = 0.95f): Modifier = composed {
    val down by interaction.collectIsPressedAsState()
    val s by animateFloatAsState(if (down) pressed else 1f, spring(dampingRatio = 0.42f, stiffness = 650f), label = "press")
    graphicsLayer { scaleX = s; scaleY = s }
}

/**
 * The big friendly button: a face on top of a darker edge, pushed down when pressed.
 * [outlined] is the quieter one (surface face, grey edge).
 */
@Composable
fun ChunkyButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    color: Color = Teal,
    contentColor: Color = Color.White,
    outlined: Boolean = false,
    enabled: Boolean = true,
    @DrawableRes icon: Int? = null,
) {
    val colors = MaterialTheme.colorScheme
    val interaction = remember { MutableInteractionSource() }
    val down by interaction.collectIsPressedAsState()
    val depth = 5.dp
    val press by animateDpAsState(if (down && enabled) depth else 0.dp, spring(stiffness = Spring.StiffnessHigh), label = "push")
    val face = when {
        !enabled -> colors.surfaceVariant
        outlined -> colors.surface
        else -> color
    }
    val edge = when {
        !enabled -> colors.outlineVariant
        outlined -> colors.outlineVariant
        else -> lerp(color, Color.Black, 0.25f)
    }
    val ink = when {
        !enabled -> colors.onSurfaceVariant
        outlined -> colors.primary
        else -> contentColor
    }
    val haptic = LocalHapticFeedback.current
    val density = LocalDensity.current
    Box(modifier.height(54.dp + depth)) {
        Box(Modifier.fillMaxWidth().height(54.dp).offset(y = depth).clip(RoundedCornerShape(16.dp)).background(edge))
        Row(
            Modifier
                .fillMaxWidth()
                .height(54.dp)
                .offset { IntOffset(0, with(density) { press.roundToPx() }) }
                .clip(RoundedCornerShape(16.dp))
                .background(face)
                .then(if (outlined) Modifier.border(2.dp, edge, RoundedCornerShape(16.dp)) else Modifier)
                .clickable(interaction, indication = null, enabled = enabled) {
                    haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                    onClick()
                }
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (icon != null) {
                Icon(painterResource(icon), contentDescription = null, tint = ink, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(8.dp))
            }
            Text(text, color = ink, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, letterSpacing = 0.3.sp, maxLines = 1)
        }
    }
}

/** A thick rounded bar with a shine on top, that springs to its new value. */
@Composable
fun XpBar(fraction: Float, modifier: Modifier = Modifier, color: Color = Marigold, track: Color = MaterialTheme.colorScheme.surfaceVariant, height: Dp = 14.dp) {
    val f by animateFloatAsState(fraction.coerceIn(0f, 1f), spring(dampingRatio = 0.75f, stiffness = 90f), label = "bar")
    Box(modifier.height(height).clip(CircleShape).background(track)) {
        if (f > 0.001f) {
            Box(Modifier.fillMaxHeight().fillMaxWidth(f.coerceAtLeast(0.06f)).clip(CircleShape).background(color)) {
                Box(
                    Modifier
                        .align(Alignment.TopCenter)
                        .padding(start = height * 0.6f, end = height * 0.6f, top = height * 0.22f)
                        .fillMaxWidth()
                        .height(height * 0.22f)
                        .background(Color.White.copy(alpha = 0.4f), CircleShape),
                )
            }
        }
    }
}

/** A small flame or bolt with a number: the streak and the XP, in headers. */
@Composable
fun StatChip(@DrawableRes icon: Int, value: Int, tint: Color, modifier: Modifier = Modifier, pulse: Boolean = false) {
    val shown by animateIntAsState(value, tween(900), label = "count")
    val t = rememberInfiniteTransition(label = "chip")
    val beat by t.animateFloat(1f, if (pulse) 1.18f else 1f, infiniteRepeatable(tween(650, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "beat")
    Row(
        modifier.clip(CircleShape).background(tint.copy(alpha = 0.14f)).padding(start = 8.dp, end = 11.dp, top = 6.dp, bottom = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(painterResource(icon), contentDescription = null, tint = tint, modifier = Modifier.size(17.dp).scale(beat))
        Spacer(Modifier.width(4.dp))
        Text("$shown", color = tint, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp)
    }
}

private class Piece(
    var x: Float, var y: Float, var vx: Float, var vy: Float,
    var angle: Float, val spin: Float, val w: Float, val h: Float, val color: Color, val round: Boolean,
)

/** A burst of confetti from both bottom corners whenever [burst] changes (null shows nothing). */
@Composable
fun Confetti(burst: Int?, modifier: Modifier = Modifier) {
    if (burst == null) return
    BoxWithConstraints(modifier.fillMaxSize()) {
        val width = constraints.maxWidth.toFloat()
        val height = constraints.maxHeight.toFloat()
        val density = LocalDensity.current.density
        val pieces = remember(burst) {
            List(150) { i ->
                val left = i % 2 == 0
                val angle = (if (left) -62f else -118f) + Random.nextFloat() * 34f - 17f
                val speed = (1500f + Random.nextFloat() * 1300f) * density / 2.6f
                val rad = angle * PI.toFloat() / 180f
                Piece(
                    x = if (left) 0f else width, y = height * 0.82f,
                    vx = cos(rad) * speed, vy = sin(rad) * speed,
                    angle = Random.nextFloat() * 360f, spin = Random.nextFloat() * 720f - 360f,
                    w = (6f + Random.nextFloat() * 6f) * density, h = (10f + Random.nextFloat() * 8f) * density,
                    color = ConfettiColors.random(), round = Random.nextInt(5) == 0,
                )
            }
        }
        var frame by remember(burst) { mutableLongStateOf(0L) }
        var alpha by remember(burst) { mutableFloatStateOf(1f) }
        LaunchedEffect(burst) {
            val start = androidx.compose.runtime.withFrameNanos { it }
            var last = start
            while (true) {
                val now = androidx.compose.runtime.withFrameNanos { it }
                val dt = ((now - last) / 1e9f).coerceAtMost(0.05f)
                last = now
                pieces.forEach { p ->
                    p.vy += 1500f * density / 2.6f * dt
                    p.vx *= 0.985f
                    p.vy *= 0.992f
                    p.x += p.vx * dt
                    p.y += p.vy * dt
                    p.angle += p.spin * dt
                }
                val elapsed = (now - start) / 1e9f
                alpha = (1f - (elapsed - 2.2f) / 0.9f).coerceIn(0f, 1f)
                frame = now
                if (elapsed > 3.2f) break
            }
        }
        Canvas(Modifier.fillMaxSize()) {
            if (frame == 0L || alpha <= 0f) return@Canvas
            pieces.forEach { p ->
                rotate(p.angle, Offset(p.x, p.y)) {
                    if (p.round) drawCircle(p.color.copy(alpha = alpha), p.w / 2, Offset(p.x, p.y))
                    else drawRect(p.color.copy(alpha = alpha), Offset(p.x - p.w / 2, p.y - p.h / 2), Size(p.w, p.h))
                }
            }
        }
    }
}

/** Slowly turning rays behind a badge or level in a celebration. */
@Composable
fun SunRays(color: Color, modifier: Modifier = Modifier) {
    val t = rememberInfiniteTransition(label = "rays")
    val turn by t.animateFloat(0f, 360f, infiniteRepeatable(tween(14_000, easing = LinearEasing)), label = "turn")
    Canvas(modifier.rotate(turn)) {
        val c = center
        val r = size.minDimension / 2
        val rays = 12
        repeat(rays) { i ->
            val a0 = (i * 360f / rays) * PI.toFloat() / 180f
            val a1 = a0 + (360f / rays / 2) * PI.toFloat() / 180f
            val path = Path().apply {
                moveTo(c.x, c.y)
                lineTo(c.x + cos(a0) * r, c.y + sin(a0) * r)
                lineTo(c.x + cos(a1) * r, c.y + sin(a1) * r)
                close()
            }
            drawPath(path, color.copy(alpha = 0.16f))
        }
    }
}

/** A badge's coin: coloured when earned, grey with a lock when not. */
@Composable
fun BadgeCoin(badge: Badge, earned: Boolean, size: Dp = 64.dp) {
    val colors = MaterialTheme.colorScheme
    val color = Color(badge.color)
    Box(Modifier.size(size + 4.dp)) {
        Box(Modifier.size(size).offset(y = 4.dp).background(if (earned) lerp(color, Color.Black, 0.25f) else colors.outlineVariant, CircleShape))
        Box(Modifier.size(size).background(if (earned) color else colors.surfaceVariant, CircleShape), contentAlignment = Alignment.Center) {
            Icon(
                painterResource(if (earned) badge.icon else R.drawable.ic_lock),
                contentDescription = null,
                tint = if (earned) Color.White else colors.onSurfaceVariant.copy(alpha = 0.6f),
                modifier = Modifier.size(size * 0.44f),
            )
        }
    }
}

/**
 * Shows [Progress.rewards] one at a time: a "+XP" toast for each, confetti for the big ones,
 * and a full moment for a new level or badge (tap to continue).
 */
@Composable
fun Celebrations(progress: Progress) {
    val reward = progress.rewards.firstOrNull()
    val haptic = LocalHapticFeedback.current
    var burst by remember { mutableStateOf<Int?>(null) }
    val moment = reward?.takeIf { it.levelUp != null || it.badges.isNotEmpty() }

    LaunchedEffect(reward?.id) {
        val r = reward ?: return@LaunchedEffect
        if (r.big || r.levelUp != null || r.badges.isNotEmpty()) {
            burst = r.id
            haptic.performHapticFeedback(HapticFeedbackType.LongPress)
        }
        if (r.levelUp == null && r.badges.isEmpty()) {
            delay(if (r.big) 2400 else 1700)
            progress.shown(r)
        }
    }

    Box(Modifier.fillMaxSize()) {
        // The toast, at the top.
        AnimatedContent(
            targetState = reward?.takeIf { moment == null },
            transitionSpec = {
                (slideInVertically(spring(0.6f, 420f)) { -it * 2 } + fadeIn()) togetherWith (slideOutVertically(tween(220)) { -it * 2 } + fadeOut(tween(220)))
            },
            contentKey = { it?.id },
            modifier = Modifier.align(Alignment.TopCenter).statusBarsPadding().padding(top = 10.dp),
            label = "toast",
        ) { r -> if (r != null) XpToast(r) }

        AnimatedVisibility(
            visible = moment != null,
            enter = fadeIn(tween(180)),
            exit = fadeOut(tween(180)),
        ) {
            val shown = remember(moment?.id) { moment }
            if (shown != null) Moment(shown) { progress.shown(shown) }
        }
        Confetti(burst)
    }
}

@Composable
private fun XpToast(reward: Reward) {
    val colors = MaterialTheme.colorScheme
    val count by animateIntAsState(reward.xp, tween(600), label = "xp")
    var started by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { started = true }
    Row(
        Modifier
            .shadow(14.dp, CircleShape, ambientColor = Teal, spotColor = Teal)
            .clip(CircleShape)
            .background(colors.surface)
            .padding(start = 6.dp, end = 18.dp, top = 6.dp, bottom = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(Modifier.size(34.dp).background(Marigold, CircleShape), contentAlignment = Alignment.Center) {
            Icon(painterResource(R.drawable.ic_zap), contentDescription = null, tint = Color.White, modifier = Modifier.size(19.dp))
        }
        Spacer(Modifier.width(10.dp))
        Text(stringResource(R.string.xp_plus, if (started) count else 0), fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = MarigoldDeep)
        Spacer(Modifier.width(8.dp))
        Text(stringResource(reward.reason), style = MaterialTheme.typography.bodyMedium, color = colors.onSurfaceVariant, maxLines = 1)
    }
}

/** Level up or new badge: a card over a dim screen with the coin popping in. */
@Composable
private fun Moment(reward: Reward, onDone: () -> Unit) {
    val colors = MaterialTheme.colorScheme
    BackHandler(onBack = onDone)
    val pop = remember { Animatable(0f) }
    val scope = androidx.compose.runtime.rememberCoroutineScope()
    LaunchedEffect(Unit) {
        delay(120)
        scope.launch { pop.animateTo(1f, spring(dampingRatio = 0.38f, stiffness = 260f)) }
    }
    val level = reward.levelUp
    val badge = reward.badges.firstOrNull()
    Box(
        Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.55f)).clickable(remember { MutableInteractionSource() }, indication = null) {},
        contentAlignment = Alignment.Center,
    ) {
        Column(
            Modifier.padding(28.dp).widthIn(max = 380.dp).fillMaxWidth().clip(RoundedCornerShape(28.dp)).background(colors.surface).padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Box(Modifier.size(170.dp), contentAlignment = Alignment.Center) {
                SunRays(if (level != null) Marigold else Color(badge!!.color), Modifier.fillMaxSize())
                Box(Modifier.scale(pop.value)) {
                    if (level != null) LevelCoin(level.number, 104.dp) else BadgeCoin(badge!!, earned = true, size = 100.dp)
                }
            }
            Spacer(Modifier.height(8.dp))
            Text(
                stringResource(if (level != null) R.string.level_up else R.string.new_badge),
                style = MaterialTheme.typography.labelLarge,
                color = MarigoldDeep,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = 1.2.sp,
            )
            Spacer(Modifier.height(6.dp))
            Text(
                if (level != null) stringResource(R.string.level_n_title, level.number, stringResource(level.title)) else stringResource(badge!!.title),
                style = MaterialTheme.typography.headlineMedium,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(6.dp))
            val more = reward.badges.drop(if (level != null) 0 else 1)
            Text(
                when {
                    level == null -> stringResource(badge!!.description)
                    more.isNotEmpty() -> stringResource(R.string.and_badge, stringResource(more.first().title))
                    else -> stringResource(R.string.level_up_body)
                },
                style = MaterialTheme.typography.bodyLarge,
                color = colors.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(14.dp))
            Row(
                Modifier.clip(CircleShape).background(Marigold.copy(alpha = 0.18f)).padding(start = 6.dp, end = 14.dp, top = 5.dp, bottom = 5.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(Modifier.size(26.dp).background(Marigold, CircleShape), contentAlignment = Alignment.Center) {
                    Icon(painterResource(R.drawable.ic_zap), contentDescription = null, tint = Color.White, modifier = Modifier.size(15.dp))
                }
                Spacer(Modifier.width(8.dp))
                Text(stringResource(R.string.xp_plus, reward.xp), fontWeight = FontWeight.ExtraBold, color = MarigoldDeep)
                Text("  ·  " + stringResource(reward.reason), style = MaterialTheme.typography.bodyMedium, color = colors.onSurfaceVariant, maxLines = 1)
            }
            Spacer(Modifier.height(20.dp))
            ChunkyButton(stringResource(R.string.continue_), onDone, Modifier.fillMaxWidth())
        }
    }
}

/** The level number on a marigold coin. */
@Composable
fun LevelCoin(number: Int, size: Dp = 64.dp) {
    Box(Modifier.size(size + 5.dp)) {
        Box(Modifier.size(size).offset(y = 5.dp).background(MarigoldDeep, CircleShape))
        Box(Modifier.size(size).background(Marigold, CircleShape).border(3.dp, Color.White.copy(alpha = 0.5f), CircleShape), contentAlignment = Alignment.Center) {
            Text("$number", color = Color.White, fontWeight = FontWeight.Black, fontSize = (size.value * 0.42f).sp)
        }
    }
}

/** Fades and slides a block up a little after [index] × 55 ms: lists arrive instead of appearing. */
fun Modifier.enter(index: Int): Modifier = composed {
    val a = remember { Animatable(0f) }
    LaunchedEffect(Unit) {
        delay(index.coerceAtMost(10) * 55L)
        a.animateTo(1f, spring(dampingRatio = 0.8f, stiffness = 300f))
    }
    graphicsLayer {
        alpha = a.value.coerceIn(0f, 1f)
        translationY = (1f - a.value) * 28.dp.toPx()
    }
}
