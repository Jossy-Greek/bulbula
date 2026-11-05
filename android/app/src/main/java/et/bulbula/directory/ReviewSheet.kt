package et.bulbula.directory

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.spring
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringArrayResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private val StarGold = Color(0xFFF5B301)

/** "Been here? Rate it": five stars on the place screen that open the review sheet. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RateCard(place: Place, modifier: Modifier = Modifier) {
    val colors = MaterialTheme.colorScheme
    var rating by rememberSaveable(place.slug) { mutableIntStateOf(0) }
    var open by rememberSaveable { mutableStateOf(false) }
    var sent by rememberSaveable(place.slug) { mutableStateOf(false) }

    Column(
        modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(colors.surface)
            .border(2.dp, if (sent) openColor.copy(alpha = 0.4f) else StarGold.copy(alpha = 0.35f), RoundedCornerShape(22.dp))
            .padding(16.dp),
    ) {
        AnimatedContent(sent, transitionSpec = { (fadeIn() + scaleIn(initialScale = 0.9f)) togetherWith fadeOut() }, label = "rate") { done ->
            if (done) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(36.dp).background(openColor, CircleShape), contentAlignment = Alignment.Center) {
                        Icon(painterResource(R.drawable.ic_check), contentDescription = null, tint = Color.White, modifier = Modifier.size(20.dp))
                    }
                    Spacer(Modifier.width(12.dp))
                    Text(stringResource(R.string.review_thanks), style = MaterialTheme.typography.bodyLarge)
                }
            } else {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(stringResource(R.string.been_here), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold)
                            Muted(stringResource(R.string.rate_it), small = true)
                        }
                        Text(
                            stringResource(R.string.xp_plus, 30),
                            fontWeight = FontWeight.ExtraBold,
                            color = MarigoldDeep,
                            modifier = Modifier.clip(CircleShape).background(Marigold.copy(alpha = 0.18f)).padding(horizontal = 10.dp, vertical = 5.dp),
                        )
                    }
                    Spacer(Modifier.height(12.dp))
                    Stars(rating, size = 40.dp) { rating = it; open = true }
                }
            }
        }
    }

    if (open) {
        val sheet = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        val scope = rememberCoroutineScope()
        ModalBottomSheet(onDismissRequest = { open = false }, sheetState = sheet, containerColor = colors.background) {
            ReviewForm(place, rating, onRating = { rating = it }) {
                sent = true
                scope.launch { sheet.hide() }.invokeOnCompletion { open = false }
            }
        }
    }
}

/** Five stars; picking one fills them in turn, each with a little bounce. */
@Composable
fun Stars(rating: Int, size: Dp, onRate: (Int) -> Unit) {
    val haptic = LocalHapticFeedback.current
    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        for (i in 1..5) {
            val on = i <= rating
            val bounce = remember { Animatable(1f) }
            LaunchedEffect(on) {
                if (on) {
                    delay((i - 1) * 45L)
                    bounce.snapTo(0.6f)
                    bounce.animateTo(1f, spring(dampingRatio = 0.3f, stiffness = 520f))
                }
            }
            val tint by animateColorAsState(if (on) StarGold else MaterialTheme.colorScheme.outlineVariant, label = "star")
            Box(
                Modifier
                    .size(size + 8.dp)
                    .clip(CircleShape)
                    .clickable(remember { MutableInteractionSource() }, indication = null) {
                        haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        onRate(i)
                    },
                contentAlignment = Alignment.Center,
            ) {
                Icon(painterResource(if (on) R.drawable.ic_star_filled else R.drawable.ic_star), contentDescription = "$i", tint = tint, modifier = Modifier.size(size).scale(bounce.value))
            }
        }
    }
}

@Composable
private fun ReviewForm(place: Place, rating: Int, onRating: (Int) -> Unit, onSent: () -> Unit) {
    val progress = LocalProgress.current
    val colors = MaterialTheme.colorScheme
    val locale = if (LocalConfiguration.current.locales[0].language == "am") "am" else "en"
    val words = stringArrayResource(R.array.star_words)
    val scope = rememberCoroutineScope()
    // The site ignores forms sent back within 3 seconds of opening (a bot check).
    val drawn = remember { System.currentTimeMillis() }
    var name by rememberSaveable { mutableStateOf(progress.name) }
    var text by rememberSaveable { mutableStateOf("") }
    var sending by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    fun submit() {
        sending = true
        error = null
        scope.launch {
            val wait = 3_200 - (System.currentTimeMillis() - drawn)
            if (wait > 0) delay(wait)
            val result = sendReview(place.slug, rating, name.trim(), text.trim(), locale, drawn)
            sending = false
            if (result == null) {
                if (progress.name.isBlank()) progress.rename(name)
                progress.reviewed()
                onSent()
            } else {
                error = result
            }
        }
    }

    Column(Modifier.fillMaxWidth().navigationBarsPadding().imePadding().padding(horizontal = 20.dp).padding(bottom = 16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Text(place.name, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
        Spacer(Modifier.height(14.dp))
        Stars(rating, size = 46.dp, onRate = onRating)
        Spacer(Modifier.height(6.dp))
        AnimatedContent(rating, transitionSpec = { (slideInVertically { it / 2 } + fadeIn()) togetherWith fadeOut() }, label = "word") { r ->
            Text(if (r in 1..5) words[r - 1] else " ", fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = StarGold)
        }
        Spacer(Modifier.height(14.dp))
        val fieldColors = OutlinedTextFieldDefaults.colors(focusedBorderColor = colors.primary, unfocusedBorderColor = colors.outlineVariant, focusedContainerColor = colors.surface, unfocusedContainerColor = colors.surface)
        OutlinedTextField(
            name, { name = it.take(60) },
            label = { Text(stringResource(R.string.your_first_name)) },
            singleLine = true,
            keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Words),
            shape = RoundedCornerShape(14.dp), colors = fieldColors, modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(10.dp))
        OutlinedTextField(
            text, { text = it.take(1000) },
            label = { Text(stringResource(R.string.review_text)) },
            placeholder = { Text(stringResource(R.string.review_hint)) },
            minLines = 3,
            keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences),
            shape = RoundedCornerShape(14.dp), colors = fieldColors, modifier = Modifier.fillMaxWidth(),
        )
        AnimatedVisibility(error != null, enter = expandVertically() + fadeIn(), exit = shrinkVertically() + fadeOut()) {
            Text(stringResource(errorText(error)), color = closedColor, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 10.dp))
        }
        Spacer(Modifier.height(16.dp))
        ChunkyButton(
            stringResource(if (sending) R.string.sending else R.string.send_review),
            ::submit,
            Modifier.fillMaxWidth(),
            enabled = rating in 1..5 && name.isNotBlank() && !sending,
        )
        Spacer(Modifier.height(8.dp))
        Muted(stringResource(R.string.review_moderated), small = false)
    }
}
