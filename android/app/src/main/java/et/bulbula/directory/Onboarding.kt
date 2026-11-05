package et.bulbula.directory

import android.Manifest
import kotlinx.coroutines.launch
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.platform.LocalContext
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.DrawableRes
import androidx.annotation.StringRes
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
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
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

private class Choice(val why: Why, @DrawableRes val icon: Int, @StringRes val label: Int, @StringRes val hint: Int, @StringRes val reply: Int)

private val CHOICES = listOf(
    Choice(Why.Neighbour, R.drawable.ic_home, R.string.why_neighbour, R.string.why_neighbour_hint, R.string.why_neighbour_reply),
    Choice(Why.Newcomer, R.drawable.ic_map_pin, R.string.why_newcomer, R.string.why_newcomer_hint, R.string.why_newcomer_reply),
    Choice(Why.Owner, R.drawable.ic_store, R.string.why_owner, R.string.why_owner_hint, R.string.why_owner_reply),
    Choice(Why.Explorer, R.drawable.ic_compass, R.string.why_explorer, R.string.why_explorer_hint, R.string.why_explorer_reply),
)

/**
 * The first run: hello, why you're here, your name, location, sign in with Google or carry
 * on as a guest, then a small party.
 * [onDone] says whether to go straight to "Add a place" (business owners).
 */
@Composable
fun Onboarding(progress: Progress, onDone: (addPlace: Boolean) -> Unit) {
    var step by rememberSaveable { mutableIntStateOf(0) }
    var why by rememberSaveable { mutableStateOf(progress.why) }
    var name by rememberSaveable { mutableStateOf(progress.name) }
    val colors = MaterialTheme.colorScheme
    val locate = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { step = 4 }
    BackHandler(enabled = step in 1..4) { step -= 1 }
    // A new phone: sign in with Google to bring back saved progress instead of starting over.
    val cloud = remember { Cloud() }
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var signingIn by remember { mutableStateOf(false) }
    var signInError by remember { mutableStateOf<Int?>(null) }
    signInError?.let { message ->
        val text = stringResource(message)
        LaunchedEffect(message) {
            Toast.makeText(context, text, Toast.LENGTH_LONG).show()
            signInError = null
        }
    }
    val welcome = stringResource(R.string.welcome_back)
    fun signInExisting() {
        signingIn = true
        scope.launch {
            when (val outcome = signIn(context, cloud, progress, onlyExisting = true)) {
                is GoogleOutcome.Saved -> {
                    progress.useSaved(outcome)
                    Toast.makeText(context, welcome, Toast.LENGTH_SHORT).show()
                }
                is GoogleOutcome.Failed -> signInError = googleError(outcome.error)
                else -> Unit
            }
            signingIn = false
        }
    }

    fun finish(addPlace: Boolean) {
        progress.welcome(name, why)
        onDone(addPlace)
    }

    Box(Modifier.fillMaxSize().background(colors.background)) {
        Blobs()
        Column(Modifier.fillMaxSize().statusBarsPadding().navigationBarsPadding().imePadding()) {
            // Back and the progress bar, Duolingo-style, for the questions.
            AnimatedVisibility(visible = step in 1..4) {
                Row(Modifier.fillMaxWidth().padding(start = 4.dp, end = 24.dp, top = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = { step -= 1 }) { Icon(painterResource(R.drawable.ic_back), contentDescription = stringResource(R.string.back), tint = colors.onSurfaceVariant) }
                    XpBar(step / 5f, Modifier.weight(1f), color = colors.primary, height = 16.dp)
                }
            }
            AnimatedContent(
                targetState = step,
                transitionSpec = {
                    val forward = targetState > initialState
                    (slideInHorizontally(spring(0.85f, 380f)) { if (forward) it else -it / 3 } + fadeIn(tween(220))) togetherWith
                        (slideOutHorizontally(tween(260)) { if (forward) -it / 3 else it } + fadeOut(tween(180)))
                },
                modifier = Modifier.weight(1f),
                label = "onboarding",
            ) { s ->
                when (s) {
                    0 -> Welcome(onStart = { step = 1 }, onSignIn = ::signInExisting, signingIn = signingIn)
                    1 -> WhyStep(why, onWhy = { why = it }, onNext = { step = 2 })
                    2 -> NameStep(name, onName = { name = it }, onNext = { step = 3 })
                    3 -> LocationStep(
                        onAllow = { locate.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)) },
                        onSkip = { step = 4 },
                    )
                    4 -> AccountStep(cloud, onNext = { step = 5 })
                    else -> Ready(name, why, onGo = { finish(false) }, onAdd = { finish(true) })
                }
            }
        }
    }
}

/** Two soft colours drifting behind the welcome screens. */
@Composable
private fun Blobs() {
    val t = rememberInfiniteTransition(label = "blobs")
    val drift by t.animateFloat(0f, 1f, infiniteRepeatable(tween(7000, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "drift")
    Canvas(Modifier.fillMaxSize().blur(60.dp)) {
        drawCircle(Teal.copy(alpha = 0.16f), radius = size.width * 0.55f, center = Offset(size.width * (0.95f - drift * 0.15f), size.height * (0.12f + drift * 0.06f)))
        drawCircle(Marigold.copy(alpha = 0.16f), radius = size.width * 0.5f, center = Offset(size.width * (0.05f + drift * 0.12f), size.height * (0.85f - drift * 0.05f)))
    }
}

@Composable
private fun StepBody(bottom: @Composable () -> Unit, content: @Composable () -> Unit) {
    Column(Modifier.fillMaxSize().padding(horizontal = 24.dp)) {
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState())) { content() }
        Box(Modifier.padding(vertical = 16.dp)) { bottom() }
    }
}

@Composable
private fun Welcome(onStart: () -> Unit, onSignIn: () -> Unit, signingIn: Boolean) {
    val hello = remember { Animatable(0f) }
    LaunchedEffect(Unit) {
        delay(350)
        hello.animateTo(1f, spring(dampingRatio = 0.4f, stiffness = 300f))
    }
    StepBody(bottom = {
        Column {
            ChunkyButton(stringResource(R.string.get_started), onStart, Modifier.fillMaxWidth())
            TextButton(onClick = onSignIn, enabled = !signingIn, modifier = Modifier.fillMaxWidth().padding(top = 4.dp)) {
                Text(stringResource(R.string.have_code), fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }) {
        Spacer(Modifier.height(56.dp))
        Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
            // "Selam!" pops out of Bulbie.
            Text(
                stringResource(R.string.selam),
                fontWeight = FontWeight.ExtraBold,
                fontSize = 22.sp,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier
                    .graphicsLayer { scaleX = hello.value; scaleY = hello.value; translationY = (1 - hello.value) * 40f }
                    .border(2.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(18.dp))
                    .clip(RoundedCornerShape(18.dp))
                    .background(MaterialTheme.colorScheme.surface)
                    .padding(horizontal = 18.dp, vertical = 10.dp),
            )
            Spacer(Modifier.height(4.dp))
            Bulbie(size = 190.dp)
            Spacer(Modifier.height(20.dp))
            Text(stringResource(R.string.welcome_title), style = MaterialTheme.typography.headlineLarge, textAlign = TextAlign.Center)
            Spacer(Modifier.height(10.dp))
            Text(
                stringResource(R.string.welcome_body),
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 8.dp),
            )
        }
    }
}

@Composable
private fun WhyStep(why: Why?, onWhy: (Why) -> Unit, onNext: () -> Unit) {
    val chosen = CHOICES.firstOrNull { it.why == why }
    StepBody(bottom = { ChunkyButton(stringResource(R.string.continue_), onNext, Modifier.fillMaxWidth(), enabled = why != null) }) {
        Spacer(Modifier.height(20.dp))
        BulbieSays(stringResource(chosen?.reply ?: R.string.why_question), happy = chosen != null)
        Spacer(Modifier.height(22.dp))
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            CHOICES.forEachIndexed { i, c -> Option(c, selected = c.why == why, modifier = Modifier.enter(i)) { onWhy(c.why) } }
        }
    }
}

/** A chunky answer card; the chosen one turns teal and gets a tick. */
@Composable
private fun Option(choice: Choice, selected: Boolean, modifier: Modifier = Modifier, onClick: () -> Unit) {
    val colors = MaterialTheme.colorScheme
    val interaction = remember { MutableInteractionSource() }
    // Opaque fill: the darker edge sits behind the card and must not show through it.
    val border by animateColorAsState(if (selected) colors.primary else colors.outlineVariant, label = "border")
    val fill by animateColorAsState(if (selected) androidx.compose.ui.graphics.lerp(colors.surface, colors.primary, 0.14f) else colors.surface, label = "fill")
    Box(modifier.pressScale(interaction, 0.97f)) {
        Box(Modifier.matchParentSize().offset(y = 3.dp).background(border, RoundedCornerShape(18.dp)))
        Row(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .background(fill)
                .border(2.dp, border, RoundedCornerShape(18.dp))
                .clickable(interaction, indication = null, onClick = onClick)
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(Modifier.size(46.dp).background(colors.primary.copy(alpha = if (selected) 0.2f else 0.1f), RoundedCornerShape(14.dp)), contentAlignment = Alignment.Center) {
                Icon(painterResource(choice.icon), contentDescription = null, tint = colors.primary, modifier = Modifier.size(24.dp))
            }
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f)) {
                Text(stringResource(choice.label), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Text(stringResource(choice.hint), style = MaterialTheme.typography.bodyMedium, color = colors.onSurfaceVariant)
            }
            AnimatedVisibility(visible = selected, enter = scaleIn(spring(0.4f, 600f)) + fadeIn(), exit = scaleOut() + fadeOut()) {
                Box(Modifier.size(26.dp).background(colors.primary, CircleShape), contentAlignment = Alignment.Center) {
                    Icon(painterResource(R.drawable.ic_check), contentDescription = null, tint = colors.onPrimary, modifier = Modifier.size(16.dp))
                }
            }
        }
    }
}

@Composable
private fun NameStep(name: String, onName: (String) -> Unit, onNext: () -> Unit) {
    val colors = MaterialTheme.colorScheme
    StepBody(bottom = { ChunkyButton(stringResource(if (name.isBlank()) R.string.skip else R.string.continue_), onNext, Modifier.fillMaxWidth()) }) {
        Spacer(Modifier.height(20.dp))
        BulbieSays(if (name.isBlank()) stringResource(R.string.name_question) else stringResource(R.string.name_reply, name.trim()), happy = name.isNotBlank())
        Spacer(Modifier.height(28.dp))
        OutlinedTextField(
            value = name,
            onValueChange = { onName(it.take(40)) },
            placeholder = { Text(stringResource(R.string.your_first_name)) },
            singleLine = true,
            textStyle = MaterialTheme.typography.titleLarge,
            keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Words, imeAction = ImeAction.Done),
            keyboardActions = KeyboardActions(onDone = { onNext() }),
            shape = RoundedCornerShape(18.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = colors.surface,
                unfocusedContainerColor = colors.surface,
                focusedBorderColor = colors.primary,
                unfocusedBorderColor = colors.outlineVariant,
            ),
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(10.dp))
        Text(stringResource(R.string.name_note), style = MaterialTheme.typography.bodyMedium, color = colors.onSurfaceVariant)
    }
}

@Composable
private fun LocationStep(onAllow: () -> Unit, onSkip: () -> Unit) {
    StepBody(bottom = {
        Column {
            ChunkyButton(stringResource(R.string.allow_location), onAllow, Modifier.fillMaxWidth(), icon = R.drawable.ic_locate)
            TextButton(onClick = onSkip, modifier = Modifier.fillMaxWidth().padding(top = 4.dp)) {
                Text(stringResource(R.string.not_now), fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }) {
        Spacer(Modifier.height(20.dp))
        BulbieSays(stringResource(R.string.location_question))
        Spacer(Modifier.height(36.dp))
        Box(Modifier.fillMaxWidth().height(220.dp), contentAlignment = Alignment.Center) { Radar() }
        Text(
            stringResource(R.string.location_note),
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

/** A pin with rings going out from it. */
@Composable
fun Radar(modifier: Modifier = Modifier) {
    val t = rememberInfiniteTransition(label = "radar")
    val wave by t.animateFloat(0f, 1f, infiniteRepeatable(tween(2200, easing = LinearEasing)), label = "wave")
    Box(modifier.size(220.dp), contentAlignment = Alignment.Center) {
        Canvas(Modifier.fillMaxSize()) {
            repeat(3) { i ->
                val p = (wave + i / 3f) % 1f
                drawCircle(Teal.copy(alpha = (1f - p) * 0.35f), radius = size.minDimension / 2 * p, style = Stroke(width = 3.dp.toPx()))
            }
            drawCircle(Teal.copy(alpha = 0.10f), radius = size.minDimension * 0.2f)
        }
        Bulbie(size = 96.dp)
    }
}

/**
 * Sign in with Google to keep progress on any phone, or carry on as a guest (everything
 * stays on this phone; Profile can sign in later). An account that already has progress
 * is offered back, and taking it skips the rest of the welcome.
 */
@Composable
private fun AccountStep(cloud: Cloud, onNext: () -> Unit) {
    val progress = LocalProgress.current
    val colors = MaterialTheme.colorScheme
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var found by remember { mutableStateOf<GoogleOutcome.Saved?>(null) }
    val welcome = stringResource(R.string.welcome_back)
    // Already signed in (e.g. "Show the welcome again"): nothing to ask.
    LaunchedEffect(Unit) { if (progress.cloud) onNext() }

    found?.let { saved ->
        SavedProgressDialog(saved, onUse = {
            found = null
            progress.useSaved(saved)
            Toast.makeText(context, welcome, Toast.LENGTH_SHORT).show()
        }, onCancel = { found = null })
    }

    StepBody(bottom = {
        Column {
            GoogleButton(enabled = !busy, onClick = {
                busy = true
                error = null
                scope.launch {
                    when (val outcome = signIn(context, cloud, progress, onlyExisting = false)) {
                        is GoogleOutcome.SignedIn -> {
                            progress.signedIn(outcome.key, outcome.email)
                            onNext()
                        }
                        is GoogleOutcome.Saved -> found = outcome
                        is GoogleOutcome.Failed -> error = outcome.error
                        GoogleOutcome.Cancelled -> Unit
                    }
                    busy = false
                }
            })
            Spacer(Modifier.height(10.dp))
            ChunkyButton(stringResource(R.string.continue_guest), onNext, Modifier.fillMaxWidth(), outlined = true, enabled = !busy)
        }
    }) {
        Spacer(Modifier.height(20.dp))
        BulbieSays(stringResource(R.string.account_question))
        Spacer(Modifier.height(22.dp))
        // What signing in gives, as plain facts: the two buttons below are the only choices.
        Card {
            CardRow(icon = R.drawable.ic_check, iconTint = openColor) { Text(stringResource(R.string.account_google_hint), style = MaterialTheme.typography.bodyLarge) }
            CardRow(icon = R.drawable.ic_check, iconTint = openColor) { Text(stringResource(R.string.account_points), style = MaterialTheme.typography.bodyLarge) }
            CardRow(icon = R.drawable.ic_shield, iconTint = colors.primary, last = true) { Text(stringResource(R.string.account_private), style = MaterialTheme.typography.bodyLarge) }
        }
        Spacer(Modifier.height(16.dp))
        Text(
            error?.let { stringResource(googleError(it)) } ?: stringResource(R.string.account_later),
            style = MaterialTheme.typography.bodyMedium,
            color = if (error != null) closedColor else MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun Ready(name: String, why: Why?, onGo: () -> Unit, onAdd: () -> Unit) {
    var burst by remember { mutableStateOf<Int?>(null) }
    val pop = remember { Animatable(0f) }
    LaunchedEffect(Unit) {
        delay(200)
        burst = 1
        pop.animateTo(1f, spring(dampingRatio = 0.4f, stiffness = 260f))
    }
    val colors = MaterialTheme.colorScheme
    Box(Modifier.fillMaxSize()) {
        StepBody(bottom = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                if (why == Why.Owner) ChunkyButton(stringResource(R.string.add_my_business), onAdd, Modifier.fillMaxWidth(), color = Marigold, contentColor = Color(0xFF3A2600), icon = R.drawable.ic_store)
                ChunkyButton(stringResource(R.string.start_exploring), onGo, Modifier.fillMaxWidth(), outlined = why == Why.Owner)
            }
        }) {
            Spacer(Modifier.height(40.dp))
            Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                Bulbie(size = 150.dp, happy = true)
                Spacer(Modifier.height(18.dp))
                Text(
                    if (name.isBlank()) stringResource(R.string.ready_title) else stringResource(R.string.ready_title_name, name.trim()),
                    style = MaterialTheme.typography.headlineLarge,
                    textAlign = TextAlign.Center,
                )
                Spacer(Modifier.height(8.dp))
                Text(stringResource(R.string.ready_body), style = MaterialTheme.typography.bodyLarge, color = colors.onSurfaceVariant, textAlign = TextAlign.Center)
                Spacer(Modifier.height(28.dp))
                // What you got: 10 XP and the first badge.
                Row(Modifier.scale(pop.value), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    Prize {
                        Box(Modifier.size(52.dp).background(Marigold, CircleShape), contentAlignment = Alignment.Center) {
                            Icon(painterResource(R.drawable.ic_zap), contentDescription = null, tint = Color.White, modifier = Modifier.size(26.dp))
                        }
                        Text(stringResource(R.string.xp_plus, 10), fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = MarigoldDeep)
                    }
                    Prize {
                        BadgeCoin(Badge.Hello, earned = true, size = 52.dp)
                        Text(stringResource(Badge.Hello.title), fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = MaterialTheme.colorScheme.primary)
                    }
                }
            }
        }
        Confetti(burst)
    }
}

@Composable
private fun Prize(content: @Composable () -> Unit) {
    Column(
        Modifier.width(140.dp).clip(RoundedCornerShape(20.dp)).background(MaterialTheme.colorScheme.surface).border(2.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(20.dp)).padding(vertical = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) { content() }
}
